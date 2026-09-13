import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { scoreBusiness } from "@/features/prospector/scoring";
import type { Business, SearchOutcome } from "@/types";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_PAGE_SIZE = 20;
const FIELD_MASK = [
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

type AddressComponent = { longText?: string; shortText?: string; types?: string[] };
type PlacePhoto = { name?: string; authorAttributions?: { displayName?: string }[] };
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
};

export type USSearchResult =
  | { ok: true; outcome: SearchOutcome }
  | { ok: false; code: "vazio" | "config" | "permissao" | "rede" | "timeout" | "rate-limit"; message: string; detail?: string };

function component(components: AddressComponent[], type: string, short = false) {
  const found = components.find((c) => c.types?.includes(type));
  return found ? (short ? found.shortText : found.longText) ?? null : null;
}

function credentials() {
  const lovableKey = process.env["LOVABLE_API_KEY"];
  const mapsKey = process.env["GOOGLE_MAPS_API_KEY"];
  if (!lovableKey || !mapsKey) throw new Error("LOVABLE_API_KEY ou GOOGLE_MAPS_API_KEY ausente");
  return { lovableKey, mapsKey };
}

async function callPlaces(body: unknown): Promise<{ places?: PlaceResult[]; nextPageToken?: string }> {
  const { lovableKey, mapsKey } = credentials();
  const response = await fetch(`${GATEWAY_URL}/places/v1/places:searchText`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": mapsKey,
      "Content-Type": "application/json",
      "X-Goog-FieldMask": FIELD_MASK,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });
  const text = await response.text();
  if (!response.ok) {
    const detail = text.slice(0, 500);
    if (response.status === 429) throw Object.assign(new Error("Limite de consultas atingido."), { code: "rate-limit", detail });
    if (response.status === 401 || response.status === 403) throw Object.assign(new Error("É necessário configurar o Google Cloud."), { code: "permissao", detail });
    throw Object.assign(new Error("Não foi possível consultar o Google Maps."), { code: "rede", detail });
  }
  return JSON.parse(text) as { places?: PlaceResult[]; nextPageToken?: string };
}

function toBusiness(place: PlaceResult): Business | null {
  const components = place.addressComponents ?? [];
  const placeId = place.id;
  const name = place.displayName?.text;
  const lat = place.location?.latitude;
  const lon = place.location?.longitude;
  const country = component(components, "country", true)?.toUpperCase();
  if (!placeId || !name || lat === undefined || lon === undefined || (country && country !== "US")) return null;

  const base = {
    id: placeId,
    externalId: placeId,
    placeId,
    source: "Google Maps",
    sourceUrl: place.googleMapsUri ?? null,
    mapsUrl: place.googleMapsUri ?? null,
    name,
    category: place.primaryTypeDisplayName?.text ?? "Not informed",
    street: component(components, "route"),
    houseNumber: component(components, "street_number"),
    neighborhood: component(components, "sublocality_level_1") ?? component(components, "sublocality"),
    city: component(components, "locality") ?? component(components, "administrative_area_level_2"),
    state: component(components, "administrative_area_level_1", true),
    postalCode: component(components, "postal_code"),
    address: place.formattedAddress ?? null,
    phone: place.nationalPhoneNumber ?? null,
    website: place.websiteUri ?? null,
    instagram: /instagram\\.com/i.test(place.websiteUri ?? "") ? place.websiteUri ?? null : null,
    openingHours: null,
    latitude: lat,
    longitude: lon,
    rating: typeof place.rating === "number" ? place.rating : null,
    reviews: typeof place.userRatingCount === "number" ? place.userRatingCount : null,
    photoRefs: (place.photos ?? []).map((p) => p.name).filter((v): v is string => !!v).slice(0, 6),
    photoAttributions: Array.from(new Set((place.photos ?? []).flatMap((p) => p.authorAttributions ?? []).map((a) => a.displayName).filter((v): v is string => !!v))).slice(0, 6),
  };
  const { score, factors } = scoreBusiness(base);
  return { ...base, score, scoreFactors: factors };
}

const schema = z.object({
  category: z.string().trim().min(1).max(80),
  city: z.string().trim().min(1).max(120),
  state: z.string().trim().max(30),
  limit: z.number().int().min(5).max(MAX_PAGE_SIZE).optional(),
  pageToken: z.string().trim().max(2000).optional(),
});

export const searchUSBusinesses = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => schema.parse(data))
  .handler(async ({ data }): Promise<USSearchResult> => {
    try {
      const areaLabel = [data.city, data.state].filter(Boolean).join(", ");
      const textQuery = `${data.category} in ${areaLabel}, United States`;
      const payload = await callPlaces({
        textQuery,
        languageCode: "en-US",
        regionCode: "US",
        pageSize: data.limit ?? MAX_PAGE_SIZE,
        ...(data.pageToken ? { pageToken: data.pageToken } : {}),
      });
      const businesses = (payload.places ?? []).map(toBusiness).filter((b): b is Business => b !== null);
      if (!businesses.length && !data.pageToken) return { ok: false, code: "vazio", message: "No businesses were found for this search in the United States." };
      return {
        ok: true,
        outcome: {
          businesses,
          total: businesses.length,
          truncated: !!payload.nextPageToken,
          cached: false,
          areaLabel,
          nextPageToken: payload.nextPageToken ?? null,
        },
      };
    } catch (error) {
      const e = error as Error & { code?: USSearchResult extends { ok: false; code: infer C } ? C : never; detail?: string };
      const code = e.name === "TimeoutError" || e.name === "AbortError" ? "timeout" : e.code ?? "rede";
      return { ok: false, code: code as "timeout" | "rate-limit" | "permissao" | "rede", message: e.message || "Não foi possível consultar o Google Maps.", ...(e.detail ? { detail: e.detail } : {}) };
    }
  });
