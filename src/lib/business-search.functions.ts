import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { findCategory, labelFromTags } from "@/features/prospector/osmCategories";
import { scoreBusiness } from "@/features/prospector/scoring";
import type { Business, SearchOutcome } from "@/types";

export type SearchErrorCode = "vazio" | "amplo" | "timeout" | "rate-limit" | "rede" | "local";
export type SearchResult =
  | { ok: true; outcome: SearchOutcome }
  | { ok: false; code: SearchErrorCode; message: string };

/** Endpoint configurável — fácil trocar de servidor Overpass no futuro. */
const DEFAULT_OVERPASS_ENDPOINT = "https://overpass-api.de/api/interpreter";
const NOMINATIM_ENDPOINT = "https://nominatim.openstreetmap.org/search";
const USER_AGENT = "Prospector/0.2 (prospeccao B2B; contato via app Lovable)";

const HARD_LIMIT = 200;
const OVERPASS_TIMEOUT_MS = 30_000;
const CACHE_TTL_MS = 1000 * 60 * 60 * 6; // 6h
const MIN_INTERVAL_MS = 1500; // 1 consulta por vez, com espaçamento

type CacheEntry = { at: number; value: SearchOutcome };

const searchCache = new Map<string, CacheEntry>();
const areaCache = new Map<string, { at: number; areaId: number | null }>();
let lastRequestAt = 0;
let queue: Promise<unknown> = Promise.resolve();

/** Serializa as consultas externas e respeita um intervalo mínimo entre elas. */
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

class SearchError extends Error {
  constructor(
    public code: SearchErrorCode,
    message: string,
  ) {
    super(message);
  }
}

function endpoint() {
  return process.env["OVERPASS_ENDPOINT"] ?? DEFAULT_OVERPASS_ENDPOINT;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/** Busca pontual no Nominatim para descobrir a relação administrativa da cidade. */
async function resolveAreaId(city: string, state: string): Promise<number | null> {
  const key = `${normalize(city)}|${normalize(state)}`;
  const hit = areaCache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS * 8) return hit.areaId;

  const url = new URL(NOMINATIM_ENDPOINT);
  url.searchParams.set("q", `${city}, ${state}, Brasil`);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("countrycodes", "br");
  url.searchParams.set("limit", "1");
  url.searchParams.set("addressdetails", "0");

  const response = await withRateLimit(() =>
    fetch(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "application/json" },
      signal: AbortSignal.timeout(15_000),
    }),
  );

  if (response.status === 429) throw new SearchError("rate-limit", "Servidor de geocodificação ocupado.");
  if (!response.ok) throw new SearchError("rede", `Geocodificação falhou (${response.status}).`);

  const data = (await response.json()) as Array<{ osm_type?: string; osm_id?: number }>;
  const first = data[0];
  let areaId: number | null = null;
  if (first?.osm_id && first.osm_type === "relation") areaId = 3_600_000_000 + first.osm_id;
  else if (first?.osm_id && first.osm_type === "way") areaId = 2_400_000_000 + first.osm_id;

  areaCache.set(key, { at: Date.now(), areaId });
  return areaId;
}

function buildQuery(tags: string[], areaId: number, limit: number) {
  const body = tags
    .flatMap((tag) => {
      const [key, value] = tag.split("=");
      const filter = `["${key}"="${value}"]["name"]`;
      return [`node${filter}(area.a);`, `way${filter}(area.a);`];
    })
    .join("\n  ");

  return `[out:json][timeout:25];
area(${areaId})->.a;
(
  ${body}
);
out center tags ${limit};`;
}

type OverpassElement = {
  type: "node" | "way" | "relation";
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
};

function instagramFrom(tags: Record<string, string>) {
  const raw = tags["contact:instagram"] ?? tags["instagram"];
  if (!raw) return null;
  const handle = raw.replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/\/+$/, "");
  return handle ? (handle.startsWith("@") ? handle : `@${handle}`) : null;
}

function toBusiness(element: OverpassElement, fallbackCity: string, fallbackState: string): Business | null {
  const tags = element.tags ?? {};
  const name = tags["name"];
  const lat = element.lat ?? element.center?.lat;
  const lon = element.lon ?? element.center?.lon;
  if (!name || lat === undefined || lon === undefined) return null;

  const street = tags["addr:street"] ?? null;
  const houseNumber = tags["addr:housenumber"] ?? null;
  const city = tags["addr:city"] ?? (fallbackCity || null);
  const state = tags["addr:state"] ?? (fallbackState || null);
  const address = street ? [street, houseNumber].filter(Boolean).join(", ") : null;
  const externalId = `${element.type}/${element.id}`;

  const base = {
    id: externalId.replace("/", "-"),
    externalId,
    source: "OpenStreetMap",
    sourceUrl: `https://www.openstreetmap.org/${element.type}/${element.id}`,
    name,
    category: labelFromTags(tags),
    street,
    houseNumber,
    neighborhood: tags["addr:suburb"] ?? tags["addr:neighbourhood"] ?? null,
    city,
    state,
    postalCode: tags["addr:postcode"] ?? null,
    address,
    phone: tags["phone"] ?? tags["contact:phone"] ?? tags["contact:mobile"] ?? null,
    website: tags["website"] ?? tags["contact:website"] ?? tags["url"] ?? null,
    instagram: instagramFrom(tags),
    openingHours: tags["opening_hours"] ?? null,
    latitude: lat,
    longitude: lon,
  };

  const { score, factors } = scoreBusiness(base);
  return { ...base, score, scoreFactors: factors };
}

/** Deduplica por externalId e por nome + proximidade geográfica. */
function dedupe(businesses: Business[]) {
  const byExternal = new Map<string, Business>();
  for (const b of businesses) if (!byExternal.has(b.externalId)) byExternal.set(b.externalId, b);

  const out: Business[] = [];
  for (const b of byExternal.values()) {
    const duplicate = out.find(
      (o) =>
        normalize(o.name) === normalize(b.name) &&
        Math.abs(o.latitude - b.latitude) < 0.0012 &&
        Math.abs(o.longitude - b.longitude) < 0.0012,
    );
    if (!duplicate) out.push(b);
    else if (!duplicate.phone && b.phone) out[out.indexOf(duplicate)] = b;
  }
  return out;
}

const inputSchema = z.object({
  category: z.string().trim().max(80),
  city: z.string().trim().max(120),
  state: z.string().trim().max(2),
  limit: z.number().int().min(10).max(HARD_LIMIT).optional(),
});

export const searchBusinesses = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => inputSchema.parse(data))
  .handler(async ({ data }): Promise<SearchResult> => {
    try {
      return { ok: true, outcome: await runSearch(data) };
    } catch (error) {
      if (error instanceof SearchError) {
        console.error("Busca sem resultado utilizável", error.code, error.message);
        return { ok: false, code: error.code, message: error.message };
      }
      console.error("Falha na busca de empresas", error);
      return { ok: false, code: "rede", message: "Não foi possível concluir a pesquisa." };
    }
  });

async function runSearch(data: z.infer<typeof inputSchema>): Promise<SearchOutcome> {
    const limit = data.limit ?? 60;

    // Proteção obrigatória contra consultas massivas.
    if (!data.category || !data.city) {
      throw new SearchError(
        "amplo",
        "Escolha uma categoria e uma localização para realizar uma busca.",
      );
    }

    const category = findCategory(data.category);
    if (!category) {
      throw new SearchError("local", "Categoria não reconhecida. Escolha uma das categorias disponíveis.");
    }

    const cacheKey = `${category.label}|${normalize(data.city)}|${normalize(data.state)}|${limit}`;
    const cached = searchCache.get(cacheKey);
    if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
      return { ...cached.value, cached: true };
    }

    const areaId = await resolveAreaId(data.city, data.state);
    if (!areaId) {
      throw new SearchError("vazio", "Cidade não localizada na fonte. Confira o nome e o estado.");
    }

    const query = buildQuery(category.tags, areaId, limit + 20);
    const response = await fetchOverpass(query);

    const payload = (await response.json()) as { elements?: OverpassElement[] };
    const parsed = (payload.elements ?? [])
      .map((el) => toBusiness(el, data.city, data.state.toUpperCase()))
      .filter((b): b is Business => b !== null);

    const unique = dedupe(parsed).sort((a, b) => b.score - a.score);
    const outcome: SearchOutcome = {
      businesses: unique.slice(0, limit),
      total: unique.length,
      truncated: unique.length > limit,
      cached: false,
      areaLabel: `${data.city} - ${data.state.toUpperCase()}`,
    };

    searchCache.set(cacheKey, { at: Date.now(), value: outcome });
    if (searchCache.size > 80) searchCache.delete(searchCache.keys().next().value as string);
    return outcome;
}
