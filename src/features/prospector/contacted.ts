import type { Business } from "@/types";

/**
 * Registro permanente de empresas já abordadas. Só cresce: nada é apagado,
 * mesmo que o lead seja removido ou mude de status depois.
 */
const KEY = "prospector:contacted:v1";

function norm(v: string | null | undefined) {
  return (v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

export function domainOf(url: string | null | undefined) {
  if (!url) return "";
  try {
    const host = new URL(/^https?:/i.test(url) ? url : `https://${url}`).hostname.replace(/^www\./, "").toLowerCase();
    // Redes sociais não identificam a empresa pelo domínio.
    if (/(facebook|instagram|linktr|wa\.me|whatsapp|bio\.link|google|tiktok|youtube)/.test(host)) return "";
    return host;
  } catch {
    return "";
  }
}

/** Identificadores confiáveis: ID da fonte, telefone, domínio e nome + endereço. */
export function fingerprints(b: Pick<Business, "id" | "name" | "phone" | "website" | "address"> & { placeId?: string | null; externalId?: string | null }) {
  const out: string[] = [];
  const place = b.placeId || b.externalId || b.id;
  if (place) out.push(`id:${place}`);
  const phone = (b.phone ?? "").replace(/\D/g, "");
  if (phone.length >= 8) out.push(`tel:${phone.slice(-10)}`);
  const d = domainOf(b.website);
  if (d) out.push(`site:${d}`);
  const n = norm(b.name);
  const a = norm(b.address);
  if (n && a) out.push(`na:${n}|${a}`);
  return out;
}

let cache: Set<string> | null = null;
export function readContacted(): Set<string> {
  if (typeof window === "undefined") return new Set();
  if (cache) return cache;
  try {
    const arr = JSON.parse(window.localStorage.getItem(KEY) ?? "[]");
    cache = new Set(Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : []);
  } catch {
    cache = new Set();
  }
  return cache;
}

export function registerContacted(businesses: Parameters<typeof fingerprints>[0][]) {
  const set = readContacted();
  let changed = false;
  for (const b of businesses) for (const f of fingerprints(b)) if (!set.has(f)) (set.add(f), (changed = true));
  if (changed) window.localStorage.setItem(KEY, JSON.stringify([...set]));
}

export function isContacted(b: Parameters<typeof fingerprints>[0], set = readContacted()) {
  return fingerprints(b).some((f) => set.has(f));
}
