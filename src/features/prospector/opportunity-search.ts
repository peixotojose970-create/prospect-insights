import type { Business, SearchCriteria, ProspectCountry } from "@/types";
import { establishmentKeys, isEstablishmentContacted } from "./establishment-identity";
import { isOwnWebsite } from "./website";

export type OpportunityFilters = { onlyNoSite: boolean; onlyPhone: boolean; highPotential: boolean; minScore: number };

export function opportunityMatches(b: Business, filters: OpportunityFilters) {
  return (!filters.onlyNoSite || !isOwnWebsite(b.website))
    && (!filters.onlyPhone || !!b.phone?.trim())
    && b.score >= Math.max(filters.minScore, filters.highPotential ? 80 : 0);
}

export function newOpportunities(businesses: Business[], saved: Business[], contacted: Set<string>) {
  const known = new Set(saved.flatMap(establishmentKeys));
  const seen = new Set<string>();
  return businesses.filter((b) => {
    const keys = establishmentKeys(b);
    if (isEstablishmentContacted(b, contacted) || keys.some((key) => known.has(key) || seen.has(key))) return false;
    keys.forEach((key) => seen.add(key));
    return true;
  });
}

export function quickSearchCriteria(category: string, country: ProspectCountry, city: string, state: string, neighborhood: string): SearchCriteria {
  const location = [neighborhood.trim(), city.trim()].filter(Boolean).join(", ");
  return { category, country, city: location, state, ...(country === "BR" ? { locations: [location] } : {}) };
}