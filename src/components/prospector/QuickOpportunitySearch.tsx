import { useState } from "react";
import { Loader2, Search } from "lucide-react";
import { InternationalAccess } from "./InternationalAccess";
import { COUNTRY_CONFIG } from "@/data/countries";
import { CategoryPicker } from "./CategoryPicker";
import { GeoCombobox } from "./GeoCombobox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { citiesOf, regionsOf, regionOfCity } from "@/data/geo";
import { BRAZILIAN_STATES } from "@/data/brazil";
import { useProspector } from "@/features/prospector/store";
import { quickSearchCriteria, type OpportunityFilters } from "@/features/prospector/opportunity-search";
import type { ProspectCountry } from "@/types";

const countries: { value: ProspectCountry; label: string }[] = [
  { value: "BR", label: "Brasil" }, { value: "US", label: "Estados Unidos" }, { value: "PT", label: "Portugal" },
  { value: "ES", label: "Espanha" }, { value: "FR", label: "França" }, { value: "IT", label: "Itália" },
];

export function QuickOpportunitySearch({ filters, onFiltersChange }: { filters: OpportunityFilters; onFiltersChange: (filters: OpportunityFilters) => void }) {
  const { runSearch, search, loadingMore } = useProspector();
  const [country, setCountry] = useState<ProspectCountry>("BR");
  const [categories, setCategories] = useState<string[]>([]);
  const [state, setState] = useState("SP");
  const [city, setCity] = useState("");
  const [neighborhood, setNeighborhood] = useState("");
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState("");
  const busy = running || search.status === "loading" || loadingMore;
  const valid = categories.length > 0 && !!city.trim() && (country !== "BR" && country !== "US" || !!state);
  const reset = () => {
    setCategories([]); setCity(""); setNeighborhood(""); setState(country === "BR" ? "SP" : country === "US" ? "FL" : "");
    onFiltersChange({ onlyNoSite: true, onlyPhone: false, highPotential: false, minScore: 0 });
  };
  const start = async () => {
    if (!valid || busy) return;
    setOpen(false); setRunning(true);
    try {
      // Each selected term is sent unchanged as its own existing search; results append with store deduplication.
      for (let index = 0; index < categories.length; index++) {
        const category = categories[index];
        if (!category) continue;
        setProgress(`Categoria ${index + 1} de ${categories.length}`);
        await runSearch(quickSearchCriteria(category, country, city, state, neighborhood), index > 0);
      }
    } finally { setRunning(false); setProgress(""); }
  };
  const fields = <div className="min-w-0 space-y-5">
    <div className="space-y-2"><Label>País</Label><Select disabled={busy} value={country} onValueChange={(value) => {
      const next = countries.find((c) => c.value === value);
      if (!next) return;
      setCountry(next.value); setCategories([]); setCity(""); setNeighborhood(""); setState(value === "BR" ? "SP" : value === "US" ? "FL" : "");
    }}><SelectTrigger className="h-11"><SelectValue /></SelectTrigger><SelectContent>{countries.map((c) => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent></Select></div>
    <div className="space-y-2"><Label>Categorias</Label><CategoryPicker country={country} selected={categories} onChange={setCategories} multiple disabled={busy} /></div>
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="min-w-0 space-y-2"><Label htmlFor="quick-state">{COUNTRY_CONFIG[country].divisions[0]}</Label>
        <GeoCombobox id="quick-state" value={state} placeholder="Escolha" searchPlaceholder="Pesquisar estado ou região..." allowCustom={country !== "BR" && country !== "US"} clearable={country !== "BR" && country !== "US"}
          options={regionsOf(country).map((region) => ({ value: region, label: country === "BR" ? `${BRAZILIAN_STATES[region as keyof typeof BRAZILIAN_STATES]?.name ?? region} (${region})` : region }))}
          onSelect={(option) => { setState(option?.value ?? ""); setCity(""); setNeighborhood(""); }} />
      </div>
      <div className="min-w-0 space-y-2"><Label htmlFor="quick-city">Cidade</Label><GeoCombobox id="quick-city" value={city} placeholder="Escolha a cidade" searchPlaceholder="Pesquisar cidade..." clearable allowCustom
        options={citiesOf(country, state || undefined).map((c) => ({ value: c.city, label: c.city, hint: c.region }))}
        onSelect={(option) => { setCity(option?.value ?? ""); setNeighborhood(""); const region = option && regionOfCity(country, option.value); if (region) setState(region); }} />
      </div>
    </div>
    <div className="space-y-2"><Label htmlFor="quick-neighborhood">Bairro ou região da cidade (opcional)</Label><Input id="quick-neighborhood" className="h-11" value={neighborhood} onChange={(event) => setNeighborhood(event.target.value)} disabled={!city || busy} placeholder="Ex.: Centro" /></div>
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {([{ key: "onlyNoSite", label: "Sem site identificado" }, { key: "onlyPhone", label: "Com telefone" }, { key: "highPotential", label: "Maior potencial (80+)" }] as const).map((filter) => <label key={filter.key} className="flex min-h-11 items-center gap-3 text-sm"><Checkbox checked={filters[filter.key]} onCheckedChange={(value) => onFiltersChange({ ...filters, [filter.key]: value === true })} />{filter.label}</label>)}
      <label className="flex min-h-11 items-center justify-between gap-3 text-sm">Pontuação mínima<Input aria-label="Pontuação mínima" type="number" min={0} max={100} inputMode="numeric" value={filters.minScore} onChange={(event) => onFiltersChange({ ...filters, minScore: Math.max(0, Math.min(100, Number(event.target.value) || 0)) })} className="h-11 w-20" /></label>
    </div>
  </div>;
  const actions = <><Button variant="outline" className="h-12 flex-1" onClick={reset} disabled={busy}>Limpar</Button><Button className="h-12 flex-1" onClick={() => void start()} disabled={!valid || busy}>{busy ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}Aplicar e buscar</Button></>;

  return <section className="space-y-4 border-y border-border py-5">
    {country !== "BR" ? <InternationalAccess /> : null}
    <div className="flex items-center justify-between gap-3"><h2 className="text-base font-semibold">Modo rápido</h2><span className="text-xs text-muted-foreground">{categories.length} selecionada(s)</span></div>
    <Button variant="outline" onClick={() => setOpen(true)} className="h-12 w-full md:hidden">Categorias e filtros</Button>
    <div className="hidden md:block">{!open ? fields : null}<div className="mt-5 flex max-w-md gap-2">{actions}</div></div>
    <Sheet open={open} onOpenChange={setOpen}><SheetContent side="bottom" className="flex h-[92dvh] max-h-[92dvh] flex-col gap-0 rounded-t-2xl p-0">
      <SheetHeader className="shrink-0 border-b border-border p-4 pr-14"><SheetTitle>Categorias e filtros</SheetTitle></SheetHeader>
      <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden overscroll-contain p-4">{open ? fields : null}</div>
      <div className="flex shrink-0 gap-2 border-t border-border bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">{actions}</div>
    </SheetContent></Sheet>
    {busy ? <p role="status" className="text-sm text-muted-foreground">{progress || "Buscando empresas…"}</p> : null}
    {search.error ? <p role="alert" className="text-sm text-destructive">{search.error.message}</p> : null}
  </section>;
}