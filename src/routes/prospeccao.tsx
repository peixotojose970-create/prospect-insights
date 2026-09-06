import { lazy, Suspense, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2, Map as MapIcon, Search, SlidersHorizontal, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
          "Busque empresas reais por categoria e cidade usando dados oficiais do Google Maps e encontre negócios sem site informado.",
      },
      { property: "og:title", content: "Prospecção de empresas locais | Prospector" },
      {
        property: "og:description",
        content: "Busque empresas por categoria e cidade com dados oficiais do Google Maps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Prospeccao,
});

const errorHints: Record<string, string> = {
  vazio: "Não encontramos empresas para essa pesquisa. Tente outra categoria ou cidade.",
  amplo: "Informe uma categoria e uma cidade brasileira para pesquisar.",
  timeout: "A pesquisa demorou mais que o esperado. Tente novamente.",
  "rate-limit": "Limite de consultas atingido. Aguarde alguns instantes e tente novamente.",
  rede: "Não foi possível realizar a busca. Verifique sua conexão.",
  local: "Não encontramos essa cidade. Confira o nome e o estado.",
  config: "Google Maps não está configurado.",
  permissao: "É necessário configurar o Google Cloud (APIs e billing) para utilizar esta integração.",
};

type FilterProps = {
  idPrefix: string;
  category: string;
  setCategory: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  state: string;
  setState: (v: string) => void;
  onlyNoSite: boolean;
  setOnlyNoSite: (v: boolean) => void;
  onlyPhone: boolean;
  setOnlyPhone: (v: boolean) => void;
  minScore: number;
  setMinScore: (v: number) => void;
};

/** Campos de refinamento — reutilizados no painel desktop e no bottom sheet mobile. */
function FilterFields(p: FilterProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select value={p.category} onValueChange={p.setCategory}>
            <SelectTrigger className="h-11">
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
          <Label htmlFor={`${p.idPrefix}-cidade`}>Cidade</Label>
          <Input
            id={`${p.idPrefix}-cidade`}
            className="h-11"
            value={p.city}
            onChange={(e) => p.setCity(e.target.value)}
            placeholder="Ex.: Campinas"
            list="cidades-sugeridas"
          />
        </div>
        <div className="space-y-2">
          <Label>Estado</Label>
          <Select value={p.state} onValueChange={p.setState}>
            <SelectTrigger className="h-11">
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

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
        <label className="flex min-h-11 items-center gap-3 text-sm text-foreground">
          <Checkbox checked={p.onlyNoSite} onCheckedChange={(v) => p.setOnlyNoSite(v === true)} />
          Somente sem site informado
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm text-foreground">
          <Checkbox checked={p.onlyPhone} onCheckedChange={(v) => p.setOnlyPhone(v === true)} />
          Somente com telefone
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm text-foreground">
          Score mínimo
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            max={100}
            value={p.minScore}
            onChange={(e) => p.setMinScore(Number(e.target.value) || 0)}
            className="h-11 w-24"
          />
        </label>
      </div>
    </div>
  );
}

function Prospeccao() {
  const { search, runSearch, loadMore, loadingMore, savedSearches, removeSavedSearch, openLead } = useProspector();

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(CATEGORY_LABELS[0] ?? "Restaurante");
  const [city, setCity] = useState("");
  const [state, setState] = useState("SP");
  const [onlyNoSite, setOnlyNoSite] = useState(false);
  const [onlyPhone, setOnlyPhone] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [siteFor, setSiteFor] = useState<Business | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [showMap, setShowMap] = useState(false);

  const results = useMemo(() => {
    return search.results
      .filter((b) => (onlyNoSite ? !b.website : true))
      .filter((b) => (onlyPhone ? !!b.phone : true))
      .filter((b) => b.score >= minScore)
      .sort((a, b) => b.score - a.score);
  }, [search.results, onlyNoSite, onlyPhone, minScore]);

  const filterProps: FilterProps = {
    idPrefix: "desktop",
    category,
    setCategory,
    city,
    setCity,
    state,
    setState,
    onlyNoSite,
    setOnlyNoSite,
    onlyPhone,
    setOnlyPhone,
    minScore,
    setMinScore,
  };

  const activeFilters = [onlyNoSite, onlyPhone, minScore > 0].filter(Boolean).length;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = query.trim() ? parseQuery(query) : { category: "", city: "", state: "" };
    const finalCategory = parsed.category || category;
    const finalCity = parsed.city || city;
    const finalState = parsed.state || state;
    if (!finalCity.trim()) {
      setFiltersOpen(true);
      return;
    }
    setCategory(finalCategory);
    setCity(finalCity);
    setState(finalState);
    setFiltersOpen(false);
    void runSearch({ category: finalCategory, city: finalCity, state: finalState });
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Prospecção"
        subtitle="Estabelecimentos reais do Google Maps, filtradas pelo potencial de fechar um site."
      />

      <datalist id="cidades-sugeridas">
        {CITY_SUGGESTIONS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <Card className="gap-4 p-4">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="busca">Buscar empresas</Label>
            <Input
              id="busca"
              data-global-search
              enterKeyHint="search"
              className="h-12 text-base"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Ex.: Clínicas Curitiba"
            />
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="h-12 flex-1 md:hidden"
                onClick={() => setFiltersOpen(true)}
              >
                <SlidersHorizontal className="size-4" aria-hidden />
                Filtros{activeFilters > 0 ? ` (${activeFilters})` : ""}
              </Button>
              <Button type="submit" className="h-12 flex-1 md:flex-none" disabled={search.status === "loading"}>
                {search.status === "loading" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Search className="size-4" aria-hidden />
                )}
                Buscar
              </Button>
            </div>
            <p className="hidden text-xs text-muted-foreground md:block">Atalho: Ctrl+K foca este campo.</p>
          </div>

          {/* Desktop: filtros sempre visíveis. Mobile: dentro do bottom sheet. */}
          <div className="hidden md:block">
            <FilterFields {...filterProps} />
          </div>
        </form>
      </Card>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto rounded-t-2xl p-5 md:hidden">
          <SheetHeader className="p-0 pb-4">
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <FilterFields {...filterProps} idPrefix="mobile" />
          <div className="mt-6 flex gap-2 pb-[env(safe-area-inset-bottom)]">
            <Button
              variant="outline"
              className="h-12 flex-1"
              onClick={() => {
                setOnlyNoSite(false);
                setOnlyPhone(false);
                setMinScore(0);
              }}
            >
              Limpar
            </Button>
            <Button
              className="h-12 flex-1"
              onClick={() => {
                setFiltersOpen(false);
                if (city.trim()) void runSearch({ category, city, state });
              }}
            >
              Aplicar
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {savedSearches.length > 0 ? (
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
          {savedSearches.map((s) => (
            <span
              key={s.id}
              className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-2 text-xs text-muted-foreground"
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
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Buscando empresas…
          </p>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ) : null}

      {search.status === "error" && search.error ? (
        <EmptyState
          title="Não foi possível realizar a busca"
          description={`${errorHints[search.error.code] ?? "Tente novamente."}${
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
            title="Não encontramos empresas com esses filtros"
            description="A busca retornou empresas, mas os filtros atuais removeram todas. Reduza o score mínimo ou desmarque os filtros."
            action={
              <Button variant="outline" onClick={() => setFiltersOpen(true)} className="md:hidden">
                Ajustar filtros
              </Button>
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {results.length} resultados
                <span className="font-normal text-muted-foreground">
                  {search.outcome?.areaLabel ? ` em ${search.outcome.areaLabel}` : ""}
                  {search.outcome?.truncated ? " (lista limitada)" : ""}
                  {search.outcome?.cached ? " · cache" : ""}
                </span>
              </p>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" asChild>
                  <Link to="/rapido">
                    <Zap className="size-4" aria-hidden />
                    Modo rápido
                  </Link>
                </Button>
                <Button size="sm" variant="outline" className="md:hidden" onClick={() => setShowMap((v) => !v)}>
                  <MapIcon className="size-4" aria-hidden />
                  {showMap ? "Ocultar mapa" : "Ver mapa"}
                </Button>
              </div>
            </div>

            {/* No celular o mapa só carrega quando pedido, para economizar dados. */}
            <div className={showMap ? "block" : "hidden md:block"}>
              <ClientOnly fallback={<Skeleton className="h-72 w-full rounded-lg" />}>
                <Suspense fallback={<Skeleton className="h-72 w-full rounded-lg" />}>
                  <ResultsMap businesses={results} onSelect={(b: Business) => openLead(b.id)} />
                </Suspense>
              </ClientOnly>
            </div>

            <div className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
              {results.map((b) => (
                <LeadCard key={b.id} business={b} onCreateSite={setSiteFor} />
              ))}
            </div>

            {search.outcome?.nextPageToken ? (
              <div className="flex justify-center">
                <Button variant="outline" className="h-12 w-full sm:w-auto" onClick={() => void loadMore()} disabled={loadingMore}>
                  {loadingMore ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Carregar mais
                </Button>
              </div>
            ) : null}
          </>
        )
      ) : null}

      <SourceNotice />
      <CreateSiteDialog business={siteFor} onOpenChange={(open) => !open && setSiteFor(null)} />
    </div>
  );
}
