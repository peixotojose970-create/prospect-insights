import { describe, expect, it, vi } from "vitest";
import { searchSelectedCategories } from "./category-search";
import { categoryGroups } from "@/data/category-catalog";
import { CATEGORY_LABELS } from "./osmCategories";
import { segmentsForCountry } from "@/data/segments";

describe("categorias unificadas da Prospecção", () => {
  it("pesquisa todas as categorias selecionadas sem alterar cidade, bairro, estado ou termo", async () => {
    const run = vi.fn(async () => {});
    await searchSelectedCategories(["eletricista", "encanador", "energia solar"], {
      country: "BR", city: "Pinheiros, São Paulo", state: "SP", locations: ["Pinheiros, São Paulo"], term: "São Jorge",
    }, run);
    expect(run.mock.calls).toEqual([
      [{ category: "eletricista", country: "BR", city: "Pinheiros, São Paulo", state: "SP", locations: ["Pinheiros, São Paulo"], term: "São Jorge" }, false],
      [{ category: "encanador", country: "BR", city: "Pinheiros, São Paulo", state: "SP", locations: ["Pinheiros, São Paulo"], term: "São Jorge" }, true],
      [{ category: "energia solar", country: "BR", city: "Pinheiros, São Paulo", state: "SP", locations: ["Pinheiros, São Paulo"], term: "São Jorge" }, true],
    ]);
  });
  it("preserva as categorias do seletor removido e todas as subcategorias existentes", () => {
    const terms = categoryGroups("BR", true).flatMap((group) => group.options.map((option) => option.term));
    for (const term of CATEGORY_LABELS) expect(terms).toContain(term);
    for (const segment of segmentsForCountry("BR")) {
      for (const term of [segment.br, ...(segment.brExtra ?? [])]) expect(terms).toContain(term);
    }
  });
  it("mantém país e categorias internacionais selecionadas", async () => {
    const run = vi.fn(async () => {});
    await searchSelectedCategories(["électricien", "plombier"], { country: "FR", city: "Lyon", state: "Auvergne-Rhône-Alpes" }, run);
    expect(run.mock.calls).toEqual([
      [{ category: "électricien", country: "FR", city: "Lyon", state: "Auvergne-Rhône-Alpes" }, false],
      [{ category: "plombier", country: "FR", city: "Lyon", state: "Auvergne-Rhône-Alpes" }, true],
    ]);
  });
});