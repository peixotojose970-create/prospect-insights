import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Flame, RefreshCw, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { LeadCard } from "@/components/prospector/LeadCard";
import { CreateSiteDialog } from "@/components/prospector/CreateSiteDialog";
import { CATEGORIES, CITIES, STATES } from "@/data/mockData";
import { useProspector } from "@/features/prospector/store";
import { DemoNotice, EmptyState, PageHeader } from "@/features/prospector/ui";
import type { Lead } from "@/types";

export const Route = createFileRoute("/prospeccao")({
  head: () => ({
    meta: [
      { title: "Prospecção — Prospector" },
      {
        name: "description",
        content: "Busque empresas por cidade e categoria e identifique oportunidades comerciais.",
      },
      { property: "og:title", content: "Prospecção — Prospector" },
      {
        property: "og:description",
        content: "Encontre empresas e identifique oportunidades comerciais com filtros avançados.",
      },
    ],
  }),
  component: Prospeccao,
});

const ALL = "todos";

function Prospeccao() {
  const { leads } = useProspector();
  const [query, setQuery] = useState("Clínicas Curitiba");
  const [applied, setApplied] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [city, setCity] = useState(ALL);
  const [state, setState] = useState(ALL);
  const [category, setCategory] = useState(ALL);
  const [minRating, setMinRating] = useState(ALL);
  const [minReviews, setMinReviews] = useState(ALL);
  const [minScore, setMinScore] = useState(ALL);
  const [onlyNoSite, setOnlyNoSite] = useState(false);
  const [onlyPhone, setOnlyPhone] = useState(false);
  const [onlyWhats, setOnlyWhats] = useState(false);
  const [siteLead, setSiteLead] = useState<Lead | null>(null);

  const results = useMemo(() => {
    const terms = applied
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .split(/\s+/)
      .filter(Boolean);
    const norm = (s: string) =>
      s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    return leads
      .filter((l) => {
        const haystack = norm(`${l.name} ${l.category} ${l.city} ${l.state}`);
        if (terms.length && !terms.every((t) => haystack.includes(t.replace(/s$/, "")))) return false;
        if (city !== ALL && l.city !== city) return false;
        if (state !== ALL && l.state !== state) return false;
        if (category !== ALL && l.category !== category) return false;
        if (minRating !== ALL && l.rating < Number(minRating)) return false;
        if (minReviews !== ALL && l.reviews < Number(minReviews)) return false;
        if (minScore !== ALL && l.score < Number(minScore)) return false;
        if (onlyNoSite && l.website) return false;
        if (onlyPhone && !l.phone) return false;
        if (onlyWhats && !l.whatsapp) return false;
        return true;
      })
      .sort((a, b) => b.score - a.score);
  }, [leads, applied, city, state, category, minRating, minReviews, minScore, onlyNoSite, onlyPhone, onlyWhats]);

  function search() {
    setLoading(true);
    setError(false);
    setTimeout(() => {
      setApplied(query);
      setLoading(false);
    }, 700);
  }

  return (
    <>
      <PageHeader
        title="Prospecção"
        subtitle="Encontre empresas e identifique oportunidades comerciais."
        actions={
          <Button variant="outline" size="sm" onClick={() => setError(!error)}>
            <RefreshCw className="size-3.5" aria-hidden />
            Simular erro
          </Button>
        }
      />

      <Card className="gap-4 p-4">
        <form
          className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_auto]"
          onSubmit={(e) => {
            e.preventDefault();
            search();
          }}
        >
          <div className="min-w-0">
            <Label htmlFor="busca" className="sr-only">
              Buscar empresas
            </Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="busca"
                data-global-search
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ex.: Clínicas Curitiba"
                className="pl-9"
              />
            </div>
          </div>
          <Button type="submit" className="sm:w-32">
            Buscar
          </Button>
        </form>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <FilterSelect label="Cidade" value={city} onChange={setCity} options={CITIES} />
          <FilterSelect label="Estado" value={state} onChange={setState} options={STATES} />
          <FilterSelect label="Categoria" value={category} onChange={setCategory} options={CATEGORIES} />
          <FilterSelect label="Nota mínima" value={minRating} onChange={setMinRating} options={["4.0", "4.5", "4.7"]} />
          <FilterSelect label="Avaliações" value={minReviews} onChange={setMinReviews} options={["50", "100", "200"]} />
          <FilterSelect label="Score mínimo" value={minScore} onChange={setMinScore} options={["60", "70", "80", "90"]} />
        </div>

        <div className="flex flex-wrap items-center gap-4 border-t border-border pt-3">
          <button
            type="button"
            onClick={() => setOnlyNoSite(!onlyNoSite)}
            aria-pressed={onlyNoSite}
            className={`inline-flex items-center gap-2 rounded-md border px-3 py-2 text-sm font-semibold transition-colors ${
              onlyNoSite
                ? "border-danger bg-danger/10 text-danger"
                : "border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            <Flame className="size-4" aria-hidden />
            Somente empresas sem site
          </button>
          <ToggleField id="f-tel" label="Com telefone" checked={onlyPhone} onChange={setOnlyPhone} />
          <ToggleField id="f-whats" label="Com WhatsApp" checked={onlyWhats} onChange={setOnlyWhats} />
        </div>
      </Card>

      {error ? (
        <EmptyState
          title="Não foi possível carregar os resultados."
          description="Ocorreu uma falha ao consultar a base de demonstração."
          action={
            <Button size="sm" onClick={() => setError(false)}>
              Tentar novamente
            </Button>
          }
        />
      ) : loading ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Procurando empresas...</p>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full rounded-xl" />
            ))}
          </div>
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-sm font-semibold text-foreground">
              {results.length} {results.length === 1 ? "oportunidade encontrada" : "oportunidades encontradas"}
            </h2>
            <DemoNotice />
          </div>
          {results.length === 0 ? (
            <EmptyState
              title="Nenhum resultado"
              description="Não encontramos empresas com esses filtros. Ajuste a busca e tente novamente."
            />
          ) : (
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {results.map((lead) => (
                <LeadCard key={lead.id} lead={lead} onCreateSite={setSiteLead} />
              ))}
            </div>
          )}
        </>
      )}

      <CreateSiteDialog lead={siteLead} onOpenChange={(o) => !o && setSiteLead(null)} />
    </>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  const id = `filtro-${label.toLowerCase().replace(/\s/g, "-")}`;
  return (
    <div className="min-w-0">
      <Label htmlFor={id} className="text-xs text-muted-foreground">
        {label}
      </Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id={id} className="mt-1 w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value={ALL}>Todos</SelectItem>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ToggleField({
  id,
  label,
  checked,
  onChange,
}: {
  id: string;
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      <Switch id={id} checked={checked} onCheckedChange={onChange} />
      <Label htmlFor={id} className="text-sm text-muted-foreground">
        {label}
      </Label>
    </div>
  );
}
