import type { Business } from "@/types";

export const NAO_INFORMADO = "Não informado";
export const NAO_DISPONIVEL_FONTE = "Não disponível nesta fonte";

export function orNotInformed(value: string | null | undefined) {
  return value && value.trim() ? value : NAO_INFORMADO;
}

/** Retorna somente os dígitos de um telefone brasileiro plausível, ou null. */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const raw = String(phone);
  const first = raw.split(/[;,/]/)[0] ?? raw;
  let digits = first.replace(/\D/g, "");
  if (digits.startsWith("55") && digits.length >= 12) digits = digits.slice(2);
  if (digits.length === 10 || digits.length === 11) return digits;
  return null;
}

export function formatPhone(phone: string | null | undefined) {
  if (!phone) return NAO_INFORMADO;
  const digits = normalizePhone(phone);
  if (!digits) return orNotInformed(String(phone));
  const ddd = digits.slice(0, 2);
  const rest = digits.slice(2);
  const half = rest.length === 9 ? 5 : 4;
  return `(${ddd}) ${rest.slice(0, half)}-${rest.slice(half)}`;
}

export function whatsappLink(phone: string | null | undefined) {
  const digits = normalizePhone(phone);
  return digits ? `https://wa.me/55${digits}` : null;
}

export function whatsappLabel(phone: string | null | undefined) {
  return normalizePhone(phone) ? "WhatsApp provável (não verificado)" : "WhatsApp não verificado";
}

export type SiteState = "encontrado" | "sem-informacao";

export function siteState(business: Business): SiteState {
  return business.website ? "encontrado" : "sem-informacao";
}

export function siteLabel(business: Business) {
  if (business.website) return "Site próprio encontrado";
  if (business.socialUrl) return "Sem site (só rede social/link)";
  return "Sem site informado (a verificar)";
}


export function ratingLabel(business: Business) {
  if (business.rating === null || business.rating === undefined) return "Sem avaliações no Google";
  const num = typeof business.rating === "number" ? business.rating : Number(business.rating);
  if (isNaN(num)) return "Sem avaliações no Google";
  const reviews = typeof business.reviews === "number" && !isNaN(business.reviews) ? ` · ${business.reviews} avaliações` : "";
  return `★ ${num.toFixed(1)}${reviews}`;
}


export function fullAddress(business: Business) {
  const parts = [
    business.address,
    business.neighborhood,
    [business.city, business.state].filter(Boolean).join(" - "),
    business.postalCode,
  ].filter(Boolean);
  return parts.length ? parts.join(" · ") : NAO_INFORMADO;
}
