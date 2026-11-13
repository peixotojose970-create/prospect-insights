import { segmentsForCountry } from "./segments";

export type CategoryGroup = { label: string; options: { label: string; term: string }[] };

/** Existing terms only: the full expansion must be checked against the user's source file. */
export function categoryGroups(country: string): CategoryGroup[] {
  const seen = new Set<string>();
  return segmentsForCountry(country).map((segment) => {
    const primary = country === "BR" ? segment.br : segment.us;
    const extra = (country === "BR" ? segment.brExtra : segment.usExtra) ?? [];
    const options = [primary, ...extra].filter((term) => {
      const key = term.trim().toLocaleLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    }).map((term, index) => ({ label: index === 0 && term === primary ? segment.label : term.charAt(0).toUpperCase() + term.slice(1), term }));
    return { label: segment.label, options };
  }).filter((group) => group.options.length > 0);
}

export function normalizeCategory(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase();
}