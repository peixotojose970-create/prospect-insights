import { COUNTRY_CONFIG } from "@/data/countries";
import { segmentsForCountry } from "@/data/segments";
import type { ProspectCountry } from "@/types";

const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
/** Synonyms only within the selected subcategory: never broaden plumbers into electricians. */
export function internationalTerms(country: ProspectCountry, category: string, name = ""): string[] {
  if (name.trim()) return [name.trim()];
  const equivalents: Record<string, Record<string, string[]>> = {
    PT: { barbearia: ["barbeiro", "salão de barbeiro"] },
    ES: { barberia: ["barbero", "peluquería masculina"] },
    FR: { barbier: ["salon de coiffure homme"] },
    IT: { barbiere: ["barberia", "parrucchiere uomo"] },
    US: { "barber shop": ["barbershop"] },
  };
  const segment = segmentsForCountry(country).find((s) => normalize(s.us) === normalize(category));
  const aliases = equivalents[country]?.[normalize(category)] ?? (segment?.usExtra ?? []);
  return [...new Set([category.trim(), ...aliases])].filter(Boolean).slice(0, 3);
}
export function internationalQuery(country: ProspectCountry, term: string, area: string, region: string) {
  const config = COUNTRY_CONFIG[country];
  return { textQuery: `${term} ${config.prep} ${[area, region, config.localName].filter(Boolean).join(", ")}`, languageCode: config.locale, regionCode: country, pageSize: 20 };
}
export function belongsToCountry(components: { shortText?: string; types?: string[] }[], country: ProspectCountry) {
  return components.some((component) => component.types?.includes("country") && component.shortText?.toUpperCase() === country);
}