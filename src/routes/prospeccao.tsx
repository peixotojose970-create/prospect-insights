import { lazy, Suspense, useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { CreateSiteDialog } from "@/components/prospector/CreateSiteDialog";
import { LeadCard } from "@/components/prospector/LeadCard";

import { CATEGORY_LABELS } from "@/features/prospector/osmCategories";
import { parseQuery } from "@/features/prospector/queryParse";
import { useProspector } from "@/features/prospector/store";
import { EmptyState, PageHeader, SourceNotice } from "@/features/prospector/ui";
import { CITY_SUGGESTIONS, STATES } from "@/data/brazil";
import { ClientOnly } from "@tanstack/react-router";
import type { Business } from "@/types";

// Leaflet só funciona no navegador: carregado depois da hidratação.
const ResultsMap = lazy(() => import("@/components/prospector/ResultsMap"));

export const Route = createFileRoute("/prospeccao")({
  head: () => ({
    meta: [
      { title: "Prospecção de empresas locais | Prospector" },
      {
        name: "description",
        content:
          "Busque empresas reais por categoria e cidade usando dados abertos do OpenStreetMap e encontre negócios sem site informado.",
      },
      { property: "og:title", content: "Prospecção de empresas locais | Prospector" },
      {
        property: "og:description",
        content: "Busque empresas por categoria e cidade com dados abertos do OpenStreetMap.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Prospeccao,
});

const errorHints: Record<string, string> = {
  vazio: "Nenhuma empresa encontrada nessa cidade para essa categoria. Tente outra categoria ou uma cidade maior.",
  amplo: "A busca ficou ampla demais. Informe cidade e categoria mais específicas.",
  timeout: "A fonte de dados demorou para responder. Tente novamente em alguns segundos.",
  "rate-limit": "Muitas buscas em sequência. Aguarde alguns segundos antes de buscar de novo.",
  rede: "Não foi possível falar com a fonte de dados agora.",
  local: "Não encontramos essa cidade. Confira o nome e o estado.",
};

function Prospeccao() {
  const { search, runSearch, savedSearches, removeSavedSearch, openLead } = useProspector();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(CATEGORY_LABELS[0] ?? "Restaurante");
  const [city, setCity] = useState("");
  const [state, setState] = useState("SP");
  const [onlyNoSite, setOnlyNoSite] = useState(true);
  const [onlyPhone, setOnlyPhone] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [siteFor, setSiteFor] = useState<Business | null>(null);

  const results = useMemo(() => {
    return search.results
      .filter((b) => (onlyNoSite ? !b.website : true))
      .filter((b) => (onlyPhone ? !!b.phone : true))
      .filter((b) => b.score >= minScore)
      .sort((a, b) => b.score - a.score);
  }, [search.results, onlyNoSite, onlyPhone, minScore]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = query.trim() ? parseQuery(query) : { category: "", city: "", state: "" };
    const finalCategory = parsed.category || category;
    const finalCity = parsed.city || city;
    const finalState = parsed.state || state;
    if (!finalCity.trim()) return;
    setCategory(finalCategory);
    setCity(finalCity);
    setState(finalState);
    void runSearch({ category: finalCategory, city: finalCity, state: finalState });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Prospecção"
        subtitle="Empresas reais de dados abertos do OpenStreetMap, filtradas pelo potencial de fechar um site."
      />

      <Card className="gap-4 p-4">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="busca">Busca rápida</Label>
            <div className="flex gap-2">
              <Input
                id="busca"
                data-global-search
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex.: pizzaria em Campinas SP"
              />
              <Button type="submit" disabled={search.status === "loading"}>
                {search.status === "loading" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Search className="size-4" aria-hidden />
                )}
                Buscar
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">Atalho: Ctrl+K foca este campo.</p>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_LABELS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Ex.: Campinas"
                list="cidades-sugeridas"
              />
              <datalist id="cidades-sugeridas">
                {CITY_SUGGESTIONS.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <Select value={state} onValueChange={setState}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STATES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-5">
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={onlyNoSite} onCheckedChange={(v) => setOnlyNoSite(v === true)} />
              Somente sem site informado
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              <Checkbox checked={onlyPhone} onCheckedChange={(v) => setOnlyPhone(v === true)} />
              Somente com telefone
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground">
              Score mínimo
              <Input
                type="number"
                min={0}
                max={100}
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value) || 0)}
                className="w-20"
              />
            </label>
          </div>
        </form>
      </Card>

      {savedSearches.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {savedSearches.map((s) => (
            <span
              key={s.id}
              className="inline-flex items-center gap-2 rounded-full border border-border px-3 py-1 text-xs text-muted-foreground"
            >
              <button
                type="button"
                className="hover:text-foreground"
                onClick={() => {
                  setCategory(s.category);
                  setCity(s.city);
                  setState(s.state);
                  void runSearch({ category: s.category, city: s.city, state: s.state });
                }}
              >
                {s.query} ({s.results})
              </button>
              <button type="button" aria-label="Remover busca" onClick={() => removeSavedSearch(s.id)}>
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      {search.status === "loading" ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-52 w-full rounded-lg" />
          ))}
        </div>
      ) : null}

      {search.status === "error" && search.error ? (
        <EmptyState
          title="Não foi possível concluir a busca"
          description={`${errorHints[search.error.code] ?? search.error.message}${
            import.meta.env.DEV && search.error.detail ? ` (detalhe técnico: ${search.error.detail})` : ""
          }`}
          action={
            search.criteria ? (
              <Button variant="outline" onClick={() => void runSearch(search.criteria!)}>
                Tentar novamente
              </Button>
            ) : null
          }
        />
      ) : null}

      {search.status === "idle" ? (
        <EmptyState
          title="Comece uma busca"
          description="Escolha uma categoria e uma cidade para listar empresas reais e ver quais não têm site informado."
        />
      ) : null}

      {search.status === "success" ? (
        results.length === 0 ? (
          <EmptyState
            title="Nenhum resultado com esses filtros"
            description="A busca retornou empresas, mas os filtros atuais removeram todas. Reduza o score mínimo ou desmarque os filtros."
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm text-muted-foreground">
                {results.length} de {search.outcome?.total ?? results.length} empresas encontradas em{" "}
                {search.outcome?.areaLabel ?? "área buscada"}
                {search.outcome?.truncated ? " (lista limitada)" : ""}
                {search.outcome?.cached ? " · resultado em cache" : ""}
              </p>
            </div>

            <ClientOnly fallback={<Skeleton className="h-72 w-full rounded-lg" />}>
              <Suspense fallback={<Skeleton className="h-72 w-full rounded-lg" />}>
                <ResultsMap businesses={results} onSelect={(b: Business) => openLead(b.id)} />
              </Suspense>
            </ClientOnly>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {results.map((b) => (
                <LeadCard key={b.id} business={b} onCreateSite={setSiteFor} />
              ))}
            </div>
          </>
        )
      ) : null}

      <SourceNotice />
      <CreateSiteDialog business={siteFor} onOpenChange={(open) => !open && setSiteFor(null)} />
    </div>
  );
}
