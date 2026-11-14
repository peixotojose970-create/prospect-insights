import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { scoreBusiness } from "@/features/prospector/scoring";
import { classifyWebsite } from "@/features/prospector/website";
import { attachEmails } from "@/lib/us-email-lookup.server";
import type { Business, SearchOutcome } from "@/types";
import { COUNTRY_CONFIG } from "@/data/countries";
import { belongsToCountry, internationalQuery, internationalTerms } from "@/features/prospector/international-search";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { googlePermissionMessage } from "./google-errors";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";
const REQUEST_TIMEOUT_MS = 30_000;
const MAX_PAGE_SIZE = 20;
const FIELD_MASK = ["places.id","places.displayName","places.formattedAddress","places.addressComponents","places.location","places.rating","places.userRatingCount","places.internationalPhoneNumber","places.websiteUri","places.primaryTypeDisplayName","places.googleMapsUri","places.photos","nextPageToken"].join(",");
type AddressComponent = { longText?: string; shortText?: string; types?: string[] };
type PlacePhoto = { name?: string; authorAttributions?: { displayName?: string }[] };
type PlaceResult = { id?: string; displayName?: { text?: string }; primaryTypeDisplayName?: { text?: string }; formattedAddress?: string; addressComponents?: AddressComponent[]; location?: { latitude?: number; longitude?: number }; rating?: number; userRatingCount?: number; internationalPhoneNumber?: string; websiteUri?: string; googleMapsUri?: string; photos?: PlacePhoto[] };
type ErrorCode = "vazio" | "config" | "permissao" | "rede" | "timeout" | "rate-limit" | "limite" | "local" | "amplo";
export type USSearchResult = { ok: true; outcome: SearchOutcome } | { ok: false; code: ErrorCode; message: string; detail?: string };
function component(components: AddressComponent[], type: string, short = false) { const found = components.find((c) => c.types?.includes(type)); return found ? (short ? found.shortText : found.longText) ?? null : null; }
function credentials() { const lovableKey = process.env["LOVABLE_API_KEY"]; const mapsKey = process.env["GOOGLE_MAPS_API_KEY"]; if (!lovableKey || !mapsKey) throw Object.assign(new Error("Google Maps não está configurado."), { code: "config" as ErrorCode }); return { lovableKey, mapsKey }; }
async function callGoogle(path: string, body?: unknown) {
  const { lovableKey, mapsKey } = credentials();
  const { chargePlacesCall, UsageBlockedError } = await import("./places-usage.server");
  try { await chargePlacesCall(); } catch (error) { if (error instanceof UsageBlockedError) throw Object.assign(new Error(error.message), { code: "limite" }); throw error; }
  const response = await fetch(`${GATEWAY_URL}/${path}`, { method: body ? "POST" : "GET", headers: { Authorization: `Bearer ${lovableKey}`, "X-Connection-Api-Key": mapsKey, "Content-Type": "application/json", ...(body ? { "X-Goog-FieldMask": FIELD_MASK } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}), signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS) });
  const text = await response.text();
  if (!response.ok) {
    console.error("[INTERNATIONAL SEARCH]", response.status, text);
    const code: ErrorCode = response.status === 429 ? "rate-limit" : response.status === 401 || response.status === 403 ? "permissao" : response.status === 400 ? "amplo" : "rede";
    let message = "Não foi possível consultar o Google Maps.";
    if (response.status === 403) {
      message = googlePermissionMessage(response.status, text);
    } else if (code === "rate-limit") message = "Limite de consultas do Google Maps atingido. Aguarde antes de tentar novamente.";
    throw Object.assign(new Error(message), { code, detail: `HTTP ${response.status}: ${text.slice(0, 500)}` });
  }
  return JSON.parse(text) as unknown;
}
const COUNTRIES = { US: COUNTRY_CONFIG.US, PT: COUNTRY_CONFIG.PT, ES: COUNTRY_CONFIG.ES, FR: COUNTRY_CONFIG.FR, IT: COUNTRY_CONFIG.IT };
type IntlCountry = keyof typeof COUNTRIES;
function toBusiness(place: PlaceResult, expected: IntlCountry): Business | null {
  const components = place.addressComponents ?? []; const placeId = place.id; const name = place.displayName?.text; const lat = place.location?.latitude; const lon = place.location?.longitude; const country = component(components, "country", true)?.toUpperCase();
  if (!placeId || !name || lat === undefined || lon === undefined || !belongsToCountry(components, expected)) return null;
  const base = { id: placeId, externalId: placeId, placeId, source: "Google Maps", sourceUrl: place.googleMapsUri ?? null, mapsUrl: place.googleMapsUri ?? null, name, category: place.primaryTypeDisplayName?.text ?? "Not informed", street: component(components, "route"), houseNumber: component(components, "street_number"), neighborhood: component(components, "sublocality_level_1") ?? component(components, "sublocality"), city: component(components, "locality") ?? component(components, "administrative_area_level_2"), state: component(components, "administrative_area_level_1", true), postalCode: component(components, "postal_code"), address: place.formattedAddress ?? null, phone: place.internationalPhoneNumber ?? null, website: classifyWebsite(place.websiteUri).website, socialUrl: classifyWebsite(place.websiteUri).socialUrl, instagram: classifyWebsite(place.websiteUri).instagram, country: expected, email: null, openingHours: null, latitude: lat, longitude: lon, rating: typeof place.rating === "number" ? place.rating : null, reviews: typeof place.userRatingCount === "number" ? place.userRatingCount : null, photoRefs: (place.photos ?? []).map((p) => p.name).filter((v): v is string => !!v).slice(0, 6), photoAttributions: Array.from(new Set((place.photos ?? []).flatMap((p) => p.authorAttributions ?? []).map((a) => a.displayName).filter((v): v is string => !!v))).slice(0, 6) };
  const { score, factors } = scoreBusiness(base); return { ...base, score, scoreFactors: factors };
}
const schema = z.object({ country: z.enum(["US", "PT", "ES", "FR", "IT"]).default("US"), category: z.string().trim().min(1).max(80), city: z.string().trim().max(120), state: z.string().trim().max(150), locations: z.array(z.string().trim().min(1).max(150)).max(30).optional(), term: z.string().trim().max(120).optional(), limit: z.number().int().min(5).max(MAX_PAGE_SIZE).optional(), pageToken: z.string().trim().max(5000).optional(), discoveryOffset: z.number().int().min(0).max(30).optional() });
const cursorSchema = z.object({ query: z.number().int().min(0).max(8), page: z.number().int().min(0).max(2), token: z.string().max(2000).optional(), fingerprint: z.string().max(1500) });
export const searchUSBusinesses = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data: unknown) => schema.parse(data)).handler(async ({ data }): Promise<USSearchResult> => {
  try {
    const { enforceOperationLimit } = await import("./operation-limit.server");
    await enforceOperationLimit("search");
    const cfg = COUNTRIES[data.country];
    const planned = [...new Set((data.locations?.length ? data.locations : [data.city || data.state]).map((v) => v.trim()).filter(Boolean))];
    if (!planned.length) throw Object.assign(new Error("Informe uma cidade, distrito, província ou região para pesquisar."), { code: "local" });
    const offset = data.discoveryOffset ?? 0;
    const areas = planned.slice(offset, offset + 3);
    if (!areas.length) return { ok: false, code: "vazio", message: "Todas as localidades selecionadas já foram consultadas." };
    const terms = internationalTerms(data.country, data.category, data.term);
    const queries = areas.flatMap((area) => terms.map((term) => ({ area, term })));
    const fingerprint = JSON.stringify([data.country, data.category, data.term ?? "", data.state, areas, data.limit ?? 20]);
    const cursor = data.pageToken ? cursorSchema.parse(JSON.parse(data.pageToken)) : { query: 0, page: 0, fingerprint, token: undefined };
    if (cursor.fingerprint !== fingerprint) throw Object.assign(new Error("A localização mudou. Inicie uma nova busca."), { code: "local" });
    const businesses = new Map<string, Business>();
    const notes: string[] = [];
    const areaBounds = new Map<string, { low: { latitude: number; longitude: number }; high: { latitude: number; longitude: number } }>();
    const searched = new Set<string>();
    let requests = 0, rawResults = 0, duplicatesRemoved = 0, queryIndex = cursor.query, page = cursor.page, token = cursor.token;
    let failure: Error & { code?: ErrorCode; detail?: string } | null = null;
    while (queryIndex < queries.length && requests < 9) {
      const query = queries[queryIndex];
      if (!query) break;
      try {
        let bounds = areaBounds.get(query.area);
        if (!bounds) {
          requests++;
          const geo = await callGoogle(`maps/api/geocode/json?address=${encodeURIComponent([query.area, data.state, cfg.localName].filter(Boolean).join(", "))}&components=country:${data.country}&language=${cfg.locale}`) as { status?: string; error_message?: string; results?: { address_components?: { short_name?: string; types?: string[] }[]; geometry?: { bounds?: { southwest: { lat: number; lng: number }; northeast: { lat: number; lng: number } }; viewport?: { southwest: { lat: number; lng: number }; northeast: { lat: number; lng: number } } } }[] };
          if (geo.status !== "OK") throw Object.assign(new Error(geo.status === "ZERO_RESULTS" ? "Localidade não identificada no país selecionado." : `Google Maps: ${geo.status ?? "resposta inválida"} ${geo.error_message ?? ""}`), { code: geo.status === "ZERO_RESULTS" ? "local" : geo.status === "OVER_QUERY_LIMIT" ? "rate-limit" : "permissao" });
          const place = geo.results?.find((r) => r.address_components?.some((c) => c.types?.includes("country") && c.short_name === data.country));
          const rectangle = place?.geometry?.bounds ?? place?.geometry?.viewport;
          if (!rectangle) throw Object.assign(new Error("Localidade não identificada no país selecionado."), { code: "local" });
          bounds = { low: { latitude: rectangle.southwest.lat, longitude: rectangle.southwest.lng }, high: { latitude: rectangle.northeast.lat, longitude: rectangle.northeast.lng } };
          areaBounds.set(query.area, bounds);
        }
        if (requests >= 9) break;
        requests++;
        const payload = await callGoogle("places/v1/places:searchText", { ...internationalQuery(data.country, query.term, query.area, data.state), pageSize: data.limit ?? 20, locationRestriction: { rectangle: bounds }, ...(token ? { pageToken: token } : {}) }) as { places?: PlaceResult[]; nextPageToken?: string };
        if (payload.places !== undefined && !Array.isArray(payload.places)) throw new Error("Resposta inválida do Google Maps.");
        searched.add(query.area);
        rawResults += payload.places?.length ?? 0;
        for (const place of payload.places ?? []) {
          const business = toBusiness(place, data.country);
          if (!business) continue;
          if (businesses.has(business.id)) { duplicatesRemoved++; continue; }
          businesses.set(business.id, business);
        }
        if (payload.nextPageToken && page < 2) { token = payload.nextPageToken; page++; }
        else { queryIndex++; page = 0; token = undefined; }
      } catch (error) {
        failure = error instanceof Error ? error : new Error(String(error));
        notes.push(`Busca parcial em ${query.area}: ${failure.message}`);
        break;
      }
    }
    if (failure && !businesses.size) throw failure;
    const pendingAreas = Math.max(0, planned.length - offset - areas.length);
    const nextPageToken = queryIndex < queries.length ? JSON.stringify({ query: queryIndex, page, token, fingerprint }) : null;
    const mapped = [...businesses.values()];
    // Email crawling remains exclusive to the existing US flow.
    const results = data.country === "US" ? await attachEmails(mapped) : mapped;
    if (!results.length && !nextPageToken && !pendingAreas) return { ok: false, code: "vazio", message: `Nenhuma empresa encontrada nas localidades consultadas em ${cfg.name}.` };
    notes.push("Até 3 páginas de 20 resultados por expressão; até 9 chamadas por lote, incluindo validação geográfica. A cobertura depende da fonte.");
    return { ok: true, outcome: { businesses: results, total: results.length, truncated: !!nextPageToken || pendingAreas > 0 || !!failure, cached: false, areaLabel: areas.join(" · "), nextPageToken, coverage: { queries: terms.length * searched.size, requests, rawResults, duplicatesRemoved, areasSearched: [...searched], pendingAreas, hasMoreAreas: pendingAreas > 0, notes } } };
  } catch (error) {
    const e = error as Error & { code?: ErrorCode; detail?: string }; const code: ErrorCode = e.name === "TimeoutError" || e.name === "AbortError" ? "timeout" : e.code ?? "rede";
    return { ok: false, code, message: e.message || "Não foi possível consultar o Google Maps.", ...(e.detail ? { detail: e.detail } : {}) };
  }
});
