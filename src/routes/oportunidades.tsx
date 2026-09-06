import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Globe, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CreateSiteDialog } from "@/components/prospector/CreateSiteDialog";
import { LeadCard } from "@/components/prospector/LeadCard";
import { useProspector } from "@/features/prospector/store";
import { EmptyState, PageHeader, SourceNotice } from "@/features/prospector/ui";
import { normalizePhone } from "@/features/prospector/format";
import { cn } from "@/lib/utils";
import type { Business } from "@/types";

export const Route = createFileRoute("/oportunidades")({
  head: () => ({
    meta: [
      { title: "Oportunidades sem site | Prospector B2B" },
      {
        name: "description",
        content:
          "Ranking das melhores oportunidades: empresas sem site informado, com telefone e alto potencial de fechar um projeto.",
      },
      { property: "og:title", content: "Oportunidades sem site | Prospector B2B" },
      {
        property: "og:description",
        content: "Ranking de empresas sem site informado e com contato disponível.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Oportunidades,
});

const filters = [
  { key: "sem-site", label: "Sem site", icon: Globe },
  { key: "telefone", label: "Com telefone", icon: Phone },
  { key: "whatsapp", label: "WhatsApp provável", icon: MessageCircle },
  { key: "quente", label: "Score alto (80+)", icon: Flame },
  { key: "bem-avaliada", label: "Bem avaliada (4.5+)", icon: Star },
] as const;

type FilterKey = (typeof filters)[number]["key"];

function Oportunidades() {
  const { leads, search } = useProspector();
  const [active, setActive] = useState<FilterKey[]>(["sem-site"]);
  const [siteFor, setSiteFor] = useState<Business | null>(null);

  const pool = useMemo<Business[]>(() => {
    const map = new Map<string, Business>();
    for (const b of [...leads, ...search.results]) if (!map.has(b.id)) map.set(b.id, b);
    return [...map.values()];
  }, [leads, search.results]);

  const items = useMemo(
    () =>
      pool
        .filter((b) => {
          if (active.includes("sem-site") && b.website) return false;
          if (active.includes("telefone") && !b.phone) return false;
          if (active.includes("whatsapp") && !normalizePhone(b.phone)) return false;
          if (active.includes("quente") && b.score < 80) return false;
          if (active.includes("bem-avaliada") && (b.rating === null || b.rating < 4.5)) return false;
          return true;
        })
        .sort((a, b) => b.score - a.score),
    [pool, active],
  );

  const toggle = (key: FilterKey) =>
    setActive((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Oportunidades"
        subtitle="Empresas com maior chance de fechar: pontuadas pelos dados disponíveis na fonte."
      />

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => toggle(f.key)}
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              active.includes(f.key)
                ? "border-primary bg-primary/10 text-primary"
                : "border-border text-muted-foreground hover:text-foreground",
            )}
          >
            <f.icon className="size-3.5" aria-hidden />
            {f.label}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nada por aqui ainda"
          description="Faça uma busca na prospecção ou ajuste os filtros para ver oportunidades."
          action={
            <Button asChild size="sm">
              <Link to="/prospeccao">Buscar empresas</Link>
            </Button>
          }
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {items.map((b) => (
            <LeadCard key={b.id} business={b} onCreateSite={setSiteFor} />
          ))}
        </div>
      )}

      <SourceNotice />
      <CreateSiteDialog business={siteFor} onOpenChange={(open) => !open && setSiteFor(null)} />
    </div>
  );
}
