import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { scoreBusiness } from "@/features/prospector/scoring";
import type { Business, SearchOutcome } from "@/types";

/**
 * Fonte de dados: Google Maps Platform — Places API (New).
 * Endpoints usados (todos oficiais e documentados, via gateway de conectores):
 *  - POST places/v1/places:searchText  (Text Search)
 *  - GET  places/v1/places/{placeId}   (Place Details, somente sob demanda)
 *  - GET  places/v1/{photoName}/media  (Place Photos, somente sob demanda)
 * Todas essas APIs são cobradas pelo Google conforme o uso da conta configurada.
 */

export type SearchErrorCode =
  | "vazio"
  | "amplo"
  | "timeout"
  | "rate-limit"
  | "rede"
  | "local"
  | "config"
  | "permissao";

export type SearchResult =
  | { ok: true; outcome: SearchOutcome }
  | { ok: false; code: SearchErrorCode; message: string; detail?: string };

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";
const REQUEST_TIMEOUT_MS = 30_000;
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6h — evita consultas repetidas e custo desnecessário
const MIN_INTERVAL_MS = 400;
const MAX_PAGE_SIZE = 20;

const SEARCH_FIELD_MASK = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.addressComponents",
  "places.location",
  "places.rating",
  "places.userRatingCount",
  "places.nationalPhoneNumber",
  "places.websiteUri",
  "places.primaryTypeDisplayName",
  "places.googleMapsUri",
  "places.photos",
  "nextPageToken",
].join(",");

const DETAILS_FIELD_MASK = [
  "id",
  "displayName",
  "regularOpeningHours.weekdayDescriptions",
  "nationalPhoneNumber",
  "websiteUri",
  "photos",
].join(",");

class SearchError extends Error {
  constructor(
    public code: SearchErrorCode,
    message: string,
    public detail?: string,
  ) {
    super(message);
  }
}

type CacheEntry = { at: number; value: SearchOutcome };
const searchCache = new Map<string, CacheEntry>();
let lastRequestAt = 0;
let queue: Promise<unknown> = Promise.resolve();

/** Serializa as chamadas externas: nunca dispara consultas em paralelo/loop. */
function withRateLimit<T>(task: () => Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const wait = MIN_INTERVAL_MS - (Date.now() - lastRequestAt);
    if (wait > 0) await new Promise((r) => setTimeout(r, wait));
    lastRequestAt = Date.now();
    return task();
  });
  queue = run.catch(() => undefined);
  return run;
}

function credentials() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !mapsKey) {
    throw new SearchError(
      "config",
      "Google Maps não está configurado neste projeto.",
      "LOVABLE_API_KEY ou GOOGLE_MAPS_API_KEY ausente",
    );
  }
  return { lovableKey, mapsKey };
}

async function callPlaces(
  path: string,
  init: { method: "GET" | "POST"; fieldMask: string; body?: unknown },
): Promise<unknown> {
  const { lovableKey, mapsKey } = credentials();
  const startedAt = Date.now();

  let response: Response;
  try {
    response = await withRateLimit(() =>
      fetch(`${GATEWAY_URL}/${path}`, {
        method: init.method,
        headers: {
          Authorization: `Bearer ${lovableKey}`,
          "X-Connection-Api-Key": mapsKey,
          "Content-Type": "application/json",
          "X-Goog-FieldMask": init.fieldMask,
        },
        ...(init.body ? { body: JSON.stringify(init.body) } : {}),
        signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
      }),
    );
  } catch (error) {
    const name = (error as Error)?.name;
    if (name === "TimeoutError" || name === "AbortError") {
      throw new SearchError("timeout", "A pesquisa demorou mais que o esperado.");
    }
    throw new SearchError("rede", "Não foi possível consultar o Google Maps.", (error as Error)?.message);
  }

  const text = await response.text();
  console.log("[SEARCH] google places", path, response.status, `${Date.now() - startedAt}ms`);

  if (!response.ok) {
    const detail = text.slice(0, 500);
    if (response.status === 429) {
      throw new SearchError("rate-limit", "Limite de consultas atingido.", detail);
    }
    if (response.status === 401 || response.status === 403) {
      throw new SearchError(
        "permissao",
        "É necessário configurar o Google Cloud para utilizar esta integração.",
        detail,
      );
    }
    if (response.status === 400) {
      throw new SearchError("amplo", "O Google Maps não aceitou esta pesquisa.", detail);
    }
    throw new SearchError("rede", "Não foi possível consultar o Google Maps.", detail);
  }

  try {
    return JSON.parse(text) as unknown;
  } catch {
    throw new SearchError("rede", "Não foi possível consultar o Google Maps.", "resposta não é JSON válido");
  }
}

type AddressComponent = { longText?: string; shortText?: string; types?: string[] };
type PlacePhoto = { name?: string; authorAttributions?: { displayName?: string; uri?: string }[] };

type PlaceResult = {
  id?: string;
  displayName?: { text?: string };
  primaryTypeDisplayName?: { text?: string };
  formattedAddress?: string;
  addressComponents?: AddressComponent[];
  location?: { latitude?: number; longitude?: number };
  rating?: number;
  userRatingCount?: number;
  nationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  photos?: PlacePhoto[];
  regularOpeningHours?: { weekdayDescriptions?: string[] };
};

function component(components: AddressComponent[], type: string, short = false) {
  const found = components.find((c) => c.types?.includes(type));
  if (!found) return null;
  return (short ? found.shortText : found.longText) ?? null;
}

function isBrazil(components: AddressComponent[]) {
  return component(components, "country", true)?.toUpperCase() === "BR";
}

/** Converte um Place oficial em Business — nada é inventado. */
function toBusiness(place: PlaceResult): Business | null {
  const placeId = place.id;
  const name = place.displayName?.text;
  const lat = place.location?.latitude;
  const lon = place.location?.longitude;
  const components = place.addressComponents ?? [];
  if (!placeId || !name || lat === undefined || lon === undefined) return null;
  if (components.length > 0 && !isBrazil(components)) return null;

  const street = component(components, "route");
  const houseNumber = component(components, "street_number");

  const base = {
    id: placeId,
    externalId: placeId,
    placeId,
    source: "Google Maps",
    sourceUrl: place.googleMapsUri ?? null,
    mapsUrl: place.googleMapsUri ?? null,
    name,
    category: place.primaryTypeDisplayName?.text ?? "Não informado",
    street,
    houseNumber,
    neighborhood: component(components, "sublocality_level_1") ?? component(components, "sublocality"),
    city: component(components, "administrative_area_level_2") ?? component(components, "locality"),
    state: component(components, "administrative_area_level_1", true),
    postalCode: component(components, "postal_code"),
    address: place.formattedAddress ?? (street ? [street, houseNumber].filter(Boolean).join(", ") : null),
    phone: place.nationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
    // O Google Places não é fonte de Instagram: só quando o próprio site é um perfil.
    instagram: /instagram\.com/i.test(place.websiteUri ?? "") ? (place.websiteUri as string) : null,
    openingHours: place.regularOpeningHours?.weekdayDescriptions?.join(" · ") ?? null,
    latitude: lat,
    longitude: lon,
    rating: typeof place.rating === "number" ? place.rating : null,
    reviews: typeof place.userRatingCount === "number" ? place.userRatingCount : null,
    photoRefs: (place.photos ?? []).map((p) => p.name).filter((n): n is string => !!n).slice(0, 6),
    photoAttributions: Array.from(
      new Set(
        (place.photos ?? [])
          .flatMap((p) => p.authorAttributions ?? [])
          .map((a) => a.displayName)
          .filter((n): n is string => !!n),
      ),
    ).slice(0, 6),
  };

  const { score, factors } = scoreBusiness(base);
  return { ...base, score, scoreFactors: factors };
}

const searchSchema = z.object({
  category: z.string().trim().max(80),
  city: z.string().trim().max(120),
  state: z.string().trim().max(2),
  limit: z.number().int().min(5).max(MAX_PAGE_SIZE).optional(),
  pageToken: z.string().trim().max(2000).optional(),
});

export const searchBusinesses = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => searchSchema.parse(data))
  .handler(async ({ data }): Promise<SearchResult> => {
    try {
      return { ok: true, outcome: await runSearch(data) };
    } catch (error) {
      if (error instanceof SearchError) {
        console.error("[SEARCH] falha", error.code, error.message, error.detail ?? "");
        return {
          ok: false,
          code: error.code,
          message: error.message,
          ...(error.detail ? { detail: error.detail } : {}),
        };
      }
      console.error("[SEARCH] erro inesperado", error);
      return {
        ok: false,
        code: "rede",
        message: "Não foi possível consultar o Google Maps.",
        detail: (error as Error)?.message ?? String(error),
      };
    }
  });

async function runSearch(data: z.infer<typeof searchSchema>): Promise<SearchOutcome> {
  if (!data.category.trim() || !data.city.trim()) {
    throw new SearchError("amplo", "Escolha uma categoria e uma cidade para realizar uma busca.");
  }

  const areaLabel = [data.city, data.state].filter(Boolean).join(" - ");
  const textQuery = `${data.category} em ${areaLabel}, Brasil`;
  const pageSize = data.limit ?? MAX_PAGE_SIZE;
  const cacheKey = `${textQuery}|${pageSize}|${data.pageToken ?? ""}`.toLowerCase();

  const hit = searchCache.get(cacheKey);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return { ...hit.value, cached: true };
  }

  const payload = (await callPlaces("places/v1/places:searchText", {
    method: "POST",
    fieldMask: SEARCH_FIELD_MASK,
    body: {
      textQuery,
      languageCode: "pt-BR",
      regionCode: "BR",
      pageSize,
      ...(data.pageToken ? { pageToken: data.pageToken } : {}),
    },
  })) as { places?: PlaceResult[]; nextPageToken?: string };

  const places = payload.places ?? [];
  const businesses = places.map(toBusiness).filter((b): b is Business => b !== null);
  console.log("[SEARCH]", textQuery, "resultados", places.length, "parseados", businesses.length);

  if (businesses.length === 0 && !data.pageToken) {
    throw new SearchError(
      "vazio",
      "O Google Maps não retornou estabelecimentos para essa busca no Brasil.",
    );
  }

  const outcome: SearchOutcome = {
    businesses,
    total: businesses.length,
    truncated: !!payload.nextPageToken,
    cached: false,
    areaLabel,
    nextPageToken: payload.nextPageToken ?? null,
  };

  searchCache.set(cacheKey, { at: Date.now(), value: outcome });
  return outcome;
}

/** Place Details sob demanda — só quando o usuário abre o estabelecimento. */
export type PlaceDetailsResult =
  | {
      ok: true;
      details: {
        openingHours: string | null;
        phone: string | null;
        website: string | null;
        photoRefs: string[];
        photoAttributions: string[];
      };
    }
  | { ok: false; code: SearchErrorCode; message: string; detail?: string };

const detailsCache = new Map<string, { at: number; value: PlaceDetailsResult }>();

export const fetchPlaceDetails = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ placeId: z.string().trim().min(3).max(400) }).parse(data))
  .handler(async ({ data }): Promise<PlaceDetailsResult> => {
    const hit = detailsCache.get(data.placeId);
    if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.value;

    try {
      const place = (await callPlaces(`places/v1/places/${encodeURIComponent(data.placeId)}`, {
        method: "GET",
        fieldMask: DETAILS_FIELD_MASK,
      })) as PlaceResult;

      const value: PlaceDetailsResult = {
        ok: true,
        details: {
          openingHours: place.regularOpeningHours?.weekdayDescriptions?.join(" · ") ?? null,
          phone: place.nationalPhoneNumber ?? null,
          website: place.websiteUri ?? null,
          photoRefs: (place.photos ?? []).map((p) => p.name).filter((n): n is string => !!n).slice(0, 6),
          photoAttributions: Array.from(
            new Set(
              (place.photos ?? [])
                .flatMap((p) => p.authorAttributions ?? [])
                .map((a) => a.displayName)
                .filter((n): n is string => !!n),
            ),
          ).slice(0, 6),
        },
      };
      detailsCache.set(data.placeId, { at: Date.now(), value });
      return value;
    } catch (error) {
      if (error instanceof SearchError) {
        return {
          ok: false,
          code: error.code,
          message: error.message,
          ...(error.detail ? { detail: error.detail } : {}),
        };
      }
      return { ok: false, code: "rede", message: "Não foi possível consultar o Google Maps." };
    }
  });

/**
 * Place Photos sob demanda. Retorna apenas a URL temporária fornecida pelo
 * Google (nada é baixado nem armazenado), respeitando os termos de uso.
 */
export type PlacePhotosResult = { urls: string[] };
const photoCache = new Map<string, { at: number; url: string }>();

export const fetchPlacePhotos = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z.object({ photoRefs: z.array(z.string().trim().max(600)).max(4) }).parse(data),
  )
  .handler(async ({ data }): Promise<PlacePhotosResult> => {
    const urls: string[] = [];
    for (const ref of data.photoRefs) {
      const hit = photoCache.get(ref);
      if (hit && Date.now() - hit.at < 1000 * 60 * 50) {
        urls.push(hit.url);
        continue;
      }
      try {
        const payload = (await callPlaces(
          `${ref}/media?maxWidthPx=800&skipHttpRedirect=true`,
          { method: "GET", fieldMask: "*" },
        )) as { photoUri?: string };
        if (payload.photoUri) {
          photoCache.set(ref, { at: Date.now(), url: payload.photoUri });
          urls.push(payload.photoUri);
        }
      } catch (error) {
        console.error("[SEARCH] foto indisponível", (error as Error)?.message);
      }
    }
    return { urls };
  });
