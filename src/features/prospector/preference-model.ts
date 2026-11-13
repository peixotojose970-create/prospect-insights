import { COUNTRY_CONFIG, isProspectCountry, type MessageLang } from "@/data/countries";
import type { ProspectCountry } from "@/types";
export type CountryPreference = { style: string; language: MessageLang | "auto" };
export type ProspectingPreferences = { country: ProspectCountry; countries: Partial<Record<ProspectCountry, CountryPreference>> };
export const DEFAULT_PREFERENCES: ProspectingPreferences = { country: "BR", countries: {} };
export function countryPreference(state: ProspectingPreferences, country: ProspectCountry): CountryPreference {
  return state.countries[country] ?? { style: "curta", language: COUNTRY_CONFIG[country].messageLang };
}
export function updateCountryPreference(state: ProspectingPreferences, country: ProspectCountry, patch: Partial<CountryPreference>): ProspectingPreferences {
  return { ...state, countries: { ...state.countries, [country]: { ...countryPreference(state, country), ...patch } } };
}
export function parsePreferences(value: unknown): ProspectingPreferences {
  if (!value || typeof value !== "object") return DEFAULT_PREFERENCES;
  const input = value as Record<string, unknown>;
  const countries: ProspectingPreferences["countries"] = {};
  if (input["countries"] && typeof input["countries"] === "object") for (const [code, value] of Object.entries(input["countries"])) {
    if (!isProspectCountry(code) || !value || typeof value !== "object") continue;
    const item = value as Record<string, unknown>;
    if (typeof item["style"] === "string" && item["style"].length <= 200 && typeof item["language"] === "string" && ["auto", "pt", "pt-PT", "es", "fr", "it", "en"].includes(item["language"])) countries[code] = { style: item["style"], language: item["language"] as CountryPreference["language"] };
  }
  return { country: typeof input["country"] === "string" && isProspectCountry(input["country"]) ? input["country"] : "BR", countries };
}