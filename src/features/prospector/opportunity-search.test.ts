import { describe, expect, it } from "vitest";
import type { Business } from "@/types";
import { newOpportunities, opportunityMatches, quickSearchCriteria } from "./opportunity-search";
import { categoryGroups } from "@/data/category-catalog";

const company = (patch: Partial<Business> = {}): Business => ({
  id: "real-1", externalId: "real-1", placeId: "real-1", name: "Empresa", source: "Google Maps", sourceUrl: null, mapsUrl: null,
  category: "eletricista", street: null, houseNumber: null, neighborhood: null, city: "São Paulo", state: "SP", postalCode: null,
  address: "Rua Um, 10", phone: "11999990000", website: null, instagram: null, openingHours: null,
  latitude: 0, longitude: 0, rating: 4.5, reviews: 12, photoRefs: [], photoAttributions: [], score: 80, scoreFactors: [], ...patch,
});
const filters = { onlyNoSite: false, onlyPhone: false, highPotential: false, minScore: 0 };

describe("regras do Modo rápido", () => {
  it("sem site inclui rede social e exclui domínio próprio", () => {
    expect(opportunityMatches(company({ website: "https://instagram.com/empresa" }), { ...filters, onlyNoSite: true })).toBe(true);
    expect(opportunityMatches(company({ website: "https://empresa.com.br" }), { ...filters, onlyNoSite: true })).toBe(false);
  });
  it("com telefone exclui contato vazio", () => expect(opportunityMatches(company({ phone: null }), { ...filters, onlyPhone: true })).toBe(false));
  it("maior potencial começa exatamente em 80", () => {
    expect(opportunityMatches(company({ score: 79 }), { ...filters, highPotential: true })).toBe(false);
    expect(opportunityMatches(company({ score: 80 }), { ...filters, highPotential: true })).toBe(true);
  });
  it("pontuação mínima escolhida é aplicada", () => expect(opportunityMatches(company({ score: 84 }), { ...filters, minScore: 85 })).toBe(false));
  it("empresa salva não aparece como nova oportunidade", () => expect(newOpportunities([company()], [company()], new Set())).toHaveLength(0));
  it("empresa abordada não aparece como nova oportunidade", () => expect(newOpportunities([company()], [], new Set(["id:real-1"]))).toHaveLength(0));
  it("categorias com a mesma empresa não duplicam oportunidades", () => expect(newOpportunities([company(), company({ id: "duplicate" })], [], new Set())).toHaveLength(1));
  it("categoria e bairro seguem intactos para a busca existente", () => expect(quickSearchCriteria("eletricista", "BR", "São Paulo", "SP", "Pinheiros")).toEqual({ category: "eletricista", country: "BR", city: "Pinheiros, São Paulo", state: "SP", locations: ["Pinheiros, São Paulo"] }));
  it("mantém país e termos locais nos seis países", () => {
    for (const country of ["BR", "US", "PT", "ES", "FR", "IT"] as const) {
      const groups = categoryGroups(country);
      const terms = groups.flatMap((group) => group.options.map((option) => option.term));
      expect(terms.length).toBeGreaterThan(0);
      expect(new Set(terms).size).toBe(terms.length);
    }
    expect(categoryGroups("FR").flatMap((group) => group.options.map((option) => option.term))).toContain("électricien");
  });
});