import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckSquare, Loader2, Mail, Map as MapIcon, Search, SlidersHorizontal, Zap } from "lucide-react";
import { toast } from "sonner";
import { UsageMeter } from "@/components/prospector/UsageMeter";
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
import { SelectionBar, selectionLabel } from "@/components/prospector/SelectionBar";

import { CATEGORY_LABELS } from "@/features/prospector/osmCategories";
import { useProspector } from "@/features/prospector/store";
import { EmptyState, PageHeader, SourceNotice } from "@/features/prospector/ui";
import { BRAZILIAN_STATES, STATES } from "@/data/brazil";
import { segmentByTerm, segmentsForCountry } from "@/data/segments";
import { US_CATEGORY_LABELS, US_CITY_SUGGESTIONS, US_STATES } from "@/data/usa";
import { citiesOf, regionOfCity, regionsOf } from "@/data/geo";
import { GeoCombobox } from "@/components/prospector/GeoCombobox";

function regionLabel(country: string, region: string) {
  return country === "BR" && region in BRAZILIAN_STATES ? `${BRAZILIAN_STATES[region as keyof typeof BRAZILIAN_STATES].name} (${region})` : region;
}
import { ClientOnly } from "@tanstack/react-router";
import type { Business } from "@/types";

// Leaflet só funciona no navegador: carregado depois da hidratação.
const MAP_PREF_KEY = "prospector:map-minimized:v1";
const ResultsMap = lazy(() => import("@/components/prospector/ResultsMap"));

export const Route = createFileRoute("/prospeccao")({
  head: () => ({
    meta: [
      { title: "Prospecção de empresas locais | Prospector" },
      {
        name: "description",
        content:
          "Busque empresas reais por categoria e estado usando dados oficiais do Google Maps e encontre negócios sem site informado.",
      },
      { property: "og:title", content: "Prospecção de empresas locais | Prospector" },
      {
        property: "og:description",
        content: "Busque empresas por categoria e estado com dados oficiais do Google Maps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Prospeccao,
});

const errorHints: Record<string, string> = {
  vazio: "Nenhuma empresa foi encontrada nas áreas consultadas. Tente outro termo, categoria ou estado.",
  amplo: "Informe uma categoria e um estado brasileiro para pesquisar.",
  timeout: "A pesquisa demorou mais que o esperado. Tente novamente.",
  "rate-limit": "Limite de consultas atingido. Aguarde alguns instantes e tente novamente.",
  rede: "Não foi possível realizar a busca. Verifique sua conexão.",
  local: "Escolha um estado brasileiro válido para realizar a busca.",
  config: "Google Maps não está configurado.",
  limite: "Limite mensal de buscas atingido. Aumente o limite em Configurações para continuar.",
  permissao: "É necessário configurar o Google Cloud (APIs e billing) para utilizar esta integração.",
};

type Country = "BR" | "US" | "PT" | "ES" | "FR" | "IT";

const COUNTRY_LABELS: Record<Country, string> = { BR: "Brasil", US: "Estados Unidos", PT: "Portugal", ES: "Espanha", FR: "França", IT: "Itália" };
const COUNTRY_FLAGS: Record<Country, string> = { BR: "🇧🇷", US: "🇺🇸", PT: "🇵🇹", ES: "🇪🇸", FR: "🇫🇷", IT: "🇮🇹" };
const CITY_EXAMPLE: Record<Country, string> = { BR: "Ex.: Pinheiros, São Paulo", US: "Ex.: Miami", PT: "Ex.: Lisboa", ES: "Ex.: Madrid", FR: "Ex.: Lyon", IT: "Ex.: Milano" };
const DEFAULT_STATE: Record<Country, string> = { BR: "SP", US: "FL", PT: "", ES: "", FR: "", IT: "" };
const DEFAULT_CATEGORY: Record<Country, string> = {
  BR: CATEGORY_LABELS[0] ?? "Restaurante",
  US: US_CATEGORY_LABELS[0] ?? "house cleaning",
  PT: segmentsForCountry("PT")[0]!.us,
  ES: segmentsForCountry("ES")[0]!.us,
  FR: segmentsForCountry("FR")[0]!.us,
  IT: segmentsForCountry("IT")[0]!.us,
};

function parseLocations(city: string, expanded: string) {
  // Vírgulas fazem parte de endereços como "Pinheiros, São Paulo"; use ponto e vírgula ou nova linha para separar locais.
  return [...new Set([city, ...expanded.split(/[;\n]/)].map((value) => value.trim()).filter(Boolean))].slice(0, 30);
}

type FilterProps = {
  idPrefix: string;
  country: Country;
  setCountry: (v: Country) => void;
  category: string;
  setCategory: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  locationsText: string;
  setLocationsText: (v: string) => void;
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
  const isUS = p.country !== "BR";
  const isEU = isUS && p.country !== "US";
  const states: readonly string[] = p.country === "US" ? US_STATES : STATES;
  const baseCategories: readonly string[] = isEU ? segmentsForCountry(p.country).map((s) => s.us) : isUS ? US_CATEGORY_LABELS : CATEGORY_LABELS;
  // Termos vindos dos segmentos não estão na lista fixa: incluímos para o seletor
  // sempre refletir a categoria que será realmente pesquisada.
  const categories = baseCategories.includes(p.category) ? baseCategories : [p.category, ...baseCategories];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="space-y-2">
          <Label>País</Label>
          <Select value={p.country} onValueChange={(v) => p.setCountry(v as Country)}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {(Object.keys(COUNTRY_LABELS) as Country[]).map((c) => (
                <SelectItem key={c} value={c}>{COUNTRY_FLAGS[c]} {COUNTRY_LABELS[c]}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>{isUS ? "Tipo de negócio" : "Categoria"}</Label>
          {/* Radix limpa o valor quando o item sai da lista: nunca aceitar vazio,
              senão a categoria/segmento escolhido se perde antes da próxima busca. */}
          <Select value={p.category} onValueChange={(v) => v && p.setCategory(v)}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            className="h-10"
            value={p.category}
            onChange={(e) => p.setCategory(e.target.value)}
            placeholder="Ou digite outro segmento"
            aria-label="Categoria ou segmento personalizado"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">Você pode substituir a sugestão por qualquer categoria, segmento amplo ou termo comercial.</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${p.idPrefix}-cidade`}>{isUS ? "Cidade" : "Cidade, bairro ou região"}</Label>
          <GeoCombobox
            id={`${p.idPrefix}-cidade`}
            value={p.city}
            placeholder={CITY_EXAMPLE[p.country]}
            searchPlaceholder="Pesquisar cidade..."
            allowCustom
            clearable
            options={citiesOf(p.country, p.state || undefined).map((c) => ({ value: c.city, label: c.city, hint: regionLabel(p.country, c.region) }))}
            onSelect={(o) => {
              p.setCity(o?.value ?? "");
              const r = o && (o.hint ? citiesOf(p.country).find((c) => c.city === o.value && regionLabel(p.country, c.region) === o.hint)?.region : regionOfCity(p.country, o.value));
              if (r) p.setState(r);
            }}
          />
          <SwipeChips
            label="Deslize para ver cidades"
            active={p.city}
            options={citiesOf(p.country, p.state || undefined).slice(0, 40).map((c) => ({ value: c.city, label: c.city }))}
            onPick={(v) => {
              p.setCity(v);
              const r = regionOfCity(p.country, v);
              if (r && !p.state) p.setState(r);
            }}
          />
          {!isUS ? <p className="text-[11px] leading-relaxed text-muted-foreground">Preencha para buscar só nesta localidade; deixe vazio para usar as cidades planejadas do estado.</p> : null}
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${p.idPrefix}-regiao`}>{isEU ? "Região (opcional)" : isUS ? "Estado" : "Estado brasileiro"}</Label>
          <GeoCombobox
            id={`${p.idPrefix}-regiao`}
            value={p.state}
            placeholder={({ PT: "Ex.: Norte", ES: "Ex.: Cataluña", FR: "Ex.: Occitanie", IT: "Ex.: Lombardia" } as Record<string, string>)[p.country] ?? "Escolha"}
            searchPlaceholder={isEU ? "Pesquisar região..." : "Pesquisar estado..."}
            clearable={isEU}
            options={(isEU ? regionsOf(p.country) : states).map((s) => ({ value: s, label: regionLabel(p.country, s) }))}
            onSelect={(o) => {
              if (!o && !isEU) return;
              const next = o?.value ?? "";
              p.setState(next);
              if (next && p.city && !citiesOf(p.country, next).some((c) => c.city === p.city) && regionOfCity(p.country, p.city)) p.setCity("");
            }}
          />
          <SwipeChips
            label="Deslize para ver estados"
            active={p.state}
            options={(isEU ? regionsOf(p.country) : states).map((s) => ({ value: s, label: isEU ? regionLabel(p.country, s) : s }))}
            onPick={(next) => {
              p.setState(next);
              if (p.city && !citiesOf(p.country, next).some((c) => c.city === p.city) && regionOfCity(p.country, p.city)) p.setCity("");
            }}
          />
          {!isUS ? <p className="text-[11px] text-muted-foreground">A busca consulta cidades diferentes do estado em lotes progressivos.</p> : null}
        </div>
      </div>

      {!isUS ? (
        <div className="space-y-2 border-t border-border pt-4">
          <Label htmlFor={`${p.idPrefix}-locais`}>Expandir para localidades específicas</Label>
          <Input
            id={`${p.idPrefix}-locais`}
            className="h-11"
            value={p.locationsText}
            onChange={(e) => p.setLocationsText(e.target.value)}
            placeholder="Ex.: Vila Madalena, São Paulo; Osasco; Taboão da Serra"
          />
          <p className="text-[11px] leading-relaxed text-muted-foreground">Separe por ponto e vírgula ou quebra de linha. Somente os locais exibidos aqui serão incluídos; a busca avança em lotes de até 3 localidades.</p>
        </div>
      ) : null}

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
  const {
    search,
    runSearch,
    loadMore,
    loadingMore,
    savedSearches,
    removeSavedSearch,
    openLead,
    selection,
    isSelected,
    selectMany,
    deselectMany,
    emailOf,
  } = useProspector();

  const [query, setQuery] = useState("");
  const [country, setCountryState] = useState<Country>("BR");
  const [category, setCategory] = useState(DEFAULT_CATEGORY.BR);
  const [city, setCity] = useState("");
  const [locationsText, setLocationsText] = useState("");
  const [state, setState] = useState(DEFAULT_STATE.BR);
  const [onlyNoSite, setOnlyNoSite] = useState(false);
  const [onlyPhone, setOnlyPhone] = useState(false);
  const [minScore, setMinScore] = useState(0);
  const [siteFor, setSiteFor] = useState<Business | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  // Preferência do mapa: fica salva neste navegador e só muda quando o usuário clica.
  const [mapMinimized, setMapMinimizedState] = useState(true);
  useEffect(() => {
    const saved = window.localStorage.getItem(MAP_PREF_KEY);
    setMapMinimizedState(saved === null ? window.matchMedia("(max-width: 767px)").matches : saved === "1");
  }, []);
  const toggleMap = () =>
    setMapMinimizedState((v) => {
      window.localStorage.setItem(MAP_PREF_KEY, v ? "0" : "1");
      return !v;
    });
  const [discoveryOffset, setDiscoveryOffset] = useState(0);

  // Trocar o país troca também as listas de cidades/estados e a categoria padrão.
  const setCountry = (next: Country) => {
    if (next === country) return;
    setCountryState(next);
    setCategory(DEFAULT_CATEGORY[next]);
    setState(DEFAULT_STATE[next]);
    setCity("");
    setLocationsText("");
    setQuery("");
  };

  // Fora do Brasil, todos os países usam a busca estruturada por cidade.
  const isUS = country !== "BR";

  const [limit, setLimit] = useState(50);
  const results = useMemo(() => {
    return search.results
      .filter((b) => (onlyNoSite ? !b.website : true))
      .filter((b) => (onlyPhone ? !!b.phone : true))
      .filter((b) => b.score >= minScore)
      .sort((a, b) => Number(!!a.website) - Number(!!b.website) || b.score - a.score);
  }, [search.results, onlyNoSite, onlyPhone, minScore]);
  useEffect(() => setLimit(50), [search.results, onlyNoSite, onlyPhone, minScore]);

  const allVisibleSelected = results.length > 0 && results.every((b) => isSelected(b.id));

  const filterProps: FilterProps = {
    idPrefix: "desktop",
    country,
    setCountry,
    category,
    setCategory,
    city,
    setCity,
    locationsText,
    setLocationsText,
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

  const activeSegment = segmentByTerm(category, isUS, country);
  const selectedLocations = useMemo(() => parseLocations(city, locationsText), [city, locationsText]);
  const buildCriteria = (nextCategory = category) => ({
    category: nextCategory,
    city,
    state,
    ...(!isUS && selectedLocations.length ? { locations: selectedLocations } : {}),
    ...(!isUS && query.trim() ? { term: query.trim() } : {}),
    ...(isUS ? { country } : {}),
  });

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isUS && !city.trim()) {
      setFiltersOpen(true);
      return;
    }
    setDiscoveryOffset(0);
    setFiltersOpen(false);
    void runSearch(buildCriteria());
  };


  return (
    <div className={selection.length > 0 ? "space-y-5 pb-40 lg:pb-28" : "space-y-5"}>
      <PageHeader
        title="Prospecção"
        subtitle="Encontre empresas reais e identifique oportunidades comerciais."
      />
      <UsageMeter estimate={isUS ? "Cada busca gasta 1 chamada por página (até 20 empresas)." : "Esta busca em lote pode gastar até 9 chamadas (3 páginas × até 3 consultas)."} />

      <datalist id="cidades-eua">
        {US_CITY_SUGGESTIONS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <Card className="relative gap-5 overflow-hidden border-border/80 p-4 shadow-sm sm:p-5">
        <div className="absolute inset-x-0 top-0 h-0.5 bg-primary/70" />
        <form onSubmit={submit} className="space-y-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex items-center justify-between gap-3"><Label htmlFor="busca" className="font-semibold">O que você procura?</Label><span className="hidden rounded-full bg-primary/8 px-2.5 py-1 text-[11px] font-semibold text-primary sm:inline-flex">Pesquisa inteligente</span></div>
              <Input
                id="busca"
                data-global-search
                enterKeyHint="search"
                className="h-12 bg-background text-base shadow-sm"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={isUS ? "Use os filtros: tipo, cidade e estado" : "Nome ou termo opcional: Ex.: São Jorge Barbearia"}
              />
            </div>
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
              <Button type="submit" className="h-12 flex-1 px-5 lg:flex-none" disabled={search.status === "loading"}>
                {search.status === "loading" ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Search className="size-4" aria-hidden />
                )}
                Buscar
              </Button>
            </div>
          </div>

          <div className="hidden border-t border-border pt-5 md:block">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground">Refine sua busca</h2>
                <p className="mt-0.5 text-xs text-muted-foreground">Defina a localização e os critérios dos estabelecimentos.</p>
              </div>
              <p className="text-xs text-muted-foreground">Atalho: Ctrl+K foca a pesquisa.</p>
            </div>
            <FilterFields {...filterProps} />
          </div>
        </form>
      </Card>

      <Card className="gap-4 border-border/80 p-4 shadow-sm sm:p-5">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">Categorias → Empresas</h2>
            <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">
              Selecione um segmento para pesquisar empresas com potencial para uma presença digital. Os resultados sem site informado recebem prioridade.
            </p>
          </div>
          {activeSegment ? (
            <span className="shrink-0 rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              Ativo: {activeSegment.label}
            </span>
          ) : null}
        </div>
        <div className="flex max-h-32 flex-wrap gap-2 overflow-y-auto pr-1">
          {segmentsForCountry(country).map((s) => {
            const term = isUS ? s.us : s.br;
            const active = category === term;
            return (
              <Button
                key={s.label}
                type="button"
                size="sm"
                variant={active ? "default" : "outline"}
                className="h-9 rounded-md px-3"
                onClick={() => {
                  setCategory(term);
                  // A busca livre não pode sobrescrever o segmento escolhido.
                  setQuery("");
                  if (isUS && !city.trim()) {
                    setFiltersOpen(true);
                    return;
                  }
                  setDiscoveryOffset(0);
                  // Trocar o segmento sempre remove o nome digitado da busca anterior.
                  const { term: ignoredTerm, ...segmentCriteria } = buildCriteria(term);
                  void runSearch(segmentCriteria);
                }}
              >
                {s.label}
              </Button>
            );
          })}
        </div>
        {activeSegment ? (
          <p className="border-t border-border pt-3 text-xs text-muted-foreground">
            Busca configurada para <span className="font-medium text-foreground">{category}</span>
            {isUS ? (city.trim() ? ` em ${[city, state].filter(Boolean).join(" - ")}` : "") : selectedLocations.length ? ` nas localidades selecionadas: ${selectedLocations.join(" · ")}` : ` nas cidades planejadas de ${BRAZILIAN_STATES[state as keyof typeof BRAZILIAN_STATES].name}`}.
          </p>
        ) : null}
        {isUS && !city.trim() ? (
          <p className="rounded-md bg-muted/70 px-3 py-2 text-xs text-muted-foreground">Informe a cidade nos filtros para pesquisar o segmento.</p>
        ) : null}
      </Card>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="flex max-h-[92dvh] flex-col gap-0 rounded-t-2xl p-0 md:hidden">
          <SheetHeader className="shrink-0 border-b border-border p-4 pr-14 text-left">
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>
          <div className="min-h-0 w-full flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4 [&_.space-y-2]:min-w-0 [&>*]:min-w-0">
            <FilterFields {...filterProps} idPrefix="mobile" />
          </div>
          <div className="flex shrink-0 gap-2 border-t border-border bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
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
                setDiscoveryOffset(0);
                if (!isUS || city.trim()) void runSearch(buildCriteria());
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
                  const savedCountry = s.country ?? "BR";
                  setCountry(savedCountry);
                  setCategory(s.category);
                  setCity(s.city);
                  setLocationsText((s.locations ?? []).filter((location) => location !== s.city).join("; "));
                  setState(s.state);
                  setQuery(s.term ?? "");
                  setDiscoveryOffset(0);
                  void runSearch({
                    category: s.category,
                    city: s.city,
                    state: s.state,
                    ...(s.locations?.length ? { locations: s.locations } : {}),
                    ...(s.term ? { term: s.term } : {}),
                    ...(savedCountry === "US" ? { country: "US" as const } : {}),
                  });
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
          description="Escolha uma categoria e um estado para listar empresas reais em áreas diferentes e ver quais não têm site informado."
        />
      ) : null}

      {search.status === "success" ? (
        results.length === 0 ? (
          <EmptyState
            title={search.outcome?.total === 0 ? "Nenhuma empresa encontrada neste lote" : "Não encontramos empresas com esses filtros"}
            description={
              search.outcome?.total === 0
                ? "Nenhuma empresa correspondente foi encontrada nas áreas já consultadas. A busca não representa o estado inteiro enquanto houver áreas pendentes."
                : "A busca retornou empresas, mas os filtros atuais removeram todas. Reduza o score mínimo ou desmarque os filtros."
            }
            action={
              search.criteria && !isUS && search.outcome?.coverage?.hasMoreAreas ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    const nextOffset = discoveryOffset + 3;
                    setDiscoveryOffset(nextOffset);
                    void runSearch({ ...search.criteria!, discoveryOffset: nextOffset }, true);
                  }}
                  disabled={loadingMore}
                >
                  {loadingMore ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />}
                  Encontrar mais empresas
                </Button>
              ) : (
                <Button variant="outline" onClick={() => setFiltersOpen(true)} className="md:hidden">
                  Ajustar filtros
                </Button>
              )
            }
          />
        ) : (
          <>
            <section className="relative overflow-hidden rounded-xl border border-border/80 bg-card p-4 shadow-sm sm:p-5" aria-label="Resumo da busca">
              <div className="absolute inset-y-0 left-0 w-1 bg-primary" />
              <div className="flex flex-col gap-4 pl-2 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Resultados da busca</p>
                  <p className="mt-1 text-lg font-semibold text-foreground">
                    {results.length} resultados
                    <span className="text-sm font-normal text-muted-foreground">
                      {search.outcome?.areaLabel ? ` em ${search.outcome.areaLabel}` : ""}
                      {search.outcome?.truncated ? " (busca parcial; há áreas pendentes ou uma consulta falhou)" : ""}
                      {search.outcome?.cached ? " · cache" : ""}
                    </span>
                    {selection.length > 0 ? (
                      <span className="ml-2 text-sm font-normal text-primary">· {selectionLabel(selection.length)}</span>
                    ) : null}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Categoria: <span className="font-medium text-foreground">{category}</span>
                    {isUS ? (city.trim() ? <> · Local: <span className="font-medium text-foreground">{[city, state].filter(Boolean).join(" - ")}</span></> : null) : selectedLocations.length ? <> · Locais selecionados: <span className="font-medium text-foreground">{selectedLocations.join(" · ")}</span></> : <> · Estado: <span className="font-medium text-foreground">{BRAZILIAN_STATES[state as keyof typeof BRAZILIAN_STATES].name} ({state})</span></>}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    variant={allVisibleSelected ? "secondary" : "outline"}
                    onClick={() =>
                      allVisibleSelected ? deselectMany(results.map((b) => b.id)) : selectMany(results)
                    }
                  >
                    <CheckSquare className="size-4" aria-hidden />
                    {allVisibleSelected ? "Desmarcar resultados" : "Selecionar resultados"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
                    const withEmail = results.filter((b) => emailOf(b));
                    if (!withEmail.length) { toast.error("Nenhum resultado tem e-mail preenchido."); return; }
                    selectMany(withEmail);
                    toast.success(`${withEmail.length} com e-mail selecionados.`);
                  }}>
                    <Mail className="size-4" aria-hidden />
                    Selecionar todos com e-mail
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link to="/rapido">
                      <Zap className="size-4" aria-hidden />
                      Modo rápido
                    </Link>
                  </Button>
                  <Button size="sm" variant="outline" onClick={toggleMap} aria-pressed={!mapMinimized}>
                    <MapIcon className="size-4" aria-hidden />
                    {mapMinimized ? "Expandir mapa" : "Minimizar mapa"}
                  </Button>
                </div>
              </div>
              {search.outcome?.coverage ? (
                <div className="mt-4 border-t border-border pt-3 text-xs leading-relaxed text-muted-foreground">
                  <p>
                    {search.outcome.coverage.queries} consultas · {search.outcome.coverage.requests} páginas ·{" "}
                    {search.outcome.coverage.rawResults} encontrados · {search.outcome.coverage.duplicatesRemoved} duplicados ·{" "}
                    {search.results.length} únicas · {search.results.filter((b) => !b.website).length} sem site informado ·{" "}
                    {search.results.filter((b) => !!b.website).length} com site · {results.length} exibidas
                  </p>
                  {search.outcome.coverage.areasSearched?.length ? (
                    <p className="mt-2">Localidades consultadas: <span className="font-medium text-foreground">{search.outcome.coverage.areasSearched.join(" · ")}</span>{search.outcome.coverage.pendingAreas ? ` · ${search.outcome.coverage.pendingAreas} pendente(s)` : ""}</p>
                  ) : null}
                  {search.outcome.coverage.notes.length ? <p className="mt-2">{search.outcome.coverage.notes.join(" ")}</p> : null}
                </div>
              ) : null}
            </section>

            {/* Minimizado, o mapa é descarregado de verdade (nada roda em segundo plano). */}
            {mapMinimized ? null : (
            <div>
              <ClientOnly fallback={<Skeleton className="h-72 w-full rounded-lg" />}>
                <Suspense fallback={<Skeleton className="h-72 w-full rounded-lg" />}>
                  <ResultsMap businesses={results} onSelect={(b: Business) => openLead(b.id)} />
                </Suspense>
              </ClientOnly>
            </div>
            )}

            <div className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
              {results.slice(0, limit).map((b) => (
                <LeadCard key={b.id} business={b} onCreateSite={setSiteFor} selectable />
              ))}
            </div>

            <div className="flex flex-wrap justify-center gap-2">
              {results.length > limit ? (
                <Button variant="outline" className="h-12 w-full sm:w-auto" onClick={() => setLimit((n) => n + 50)}>
                  Mostrar mais ({results.length - limit} restantes)
                </Button>
              ) : null}
              {search.outcome?.nextPageToken ? (
                <Button variant="outline" className="h-12 w-full sm:w-auto" onClick={() => void loadMore()} disabled={loadingMore}>
                  {loadingMore ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Carregar mais
                </Button>
              ) : null}
              {search.criteria && !isUS && search.outcome?.coverage?.hasMoreAreas ? (
                <Button variant="outline" className="h-12 w-full sm:w-auto" disabled={loadingMore}
                  onClick={() => {
                    // O servidor consulta três áreas por lote; avançar pelo mesmo
                    // tamanho evita repetir cidades e mantém o progresso correto.
                    const nextOffset = discoveryOffset + 3;
                    setDiscoveryOffset(nextOffset);
                    void runSearch({ ...search.criteria!, discoveryOffset: nextOffset }, true);
                  }}>
                  {loadingMore ? <Loader2 className="size-4 animate-spin" aria-hidden /> : <Search className="size-4" aria-hidden />}
                  Encontrar mais empresas
                </Button>
              ) : null}
            </div>
          </>
        )
      ) : null}

      <SourceNotice country={country} />
      <CreateSiteDialog business={siteFor} onOpenChange={(open) => !open && setSiteFor(null)} />
      <SelectionBar />
    </div>
  );
}

/** Atalhos de local em linha horizontal, deslizáveis com o dedo — só no celular. */
function SwipeChips({ label, options, active, onPick }: { label: string; options: { value: string; label: string }[]; active: string; onPick: (v: string) => void }) {
  if (!options.length) return null;
  return (
    <div className="sm:hidden">
      <p className="sr-only">{label}</p>
      <div
        role="listbox"
        aria-label={label}
        className="-mx-1 flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain px-1 pb-1 [scrollbar-width:none] [touch-action:pan-x] [&::-webkit-scrollbar]:hidden"
      >
        {options.map((o) => {
          const on = o.value === active;
          return (
            <button
              key={o.value}
              type="button"
              role="option"
              aria-selected={on}
              onClick={() => onPick(o.value)}
              className={`h-9 shrink-0 snap-start whitespace-nowrap rounded-full border px-3 text-xs font-medium transition-colors ${on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-muted/40 text-foreground"}`}
            >
              {o.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
