import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Copy, Flame, MessageCircle, Phone, Star, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { buildMessages } from "@/features/prospector/generators";
import { useProspector } from "@/features/prospector/store";
import {
  copyText,
  DemoNotice,
  EmptyState,
  PageHeader,
  ScoreBar,
  SiteBadge,
  StatusBadge,
  priorityOf,
} from "@/features/prospector/ui";
import { cn } from "@/lib/utils";
import type { Lead } from "@/types";

export const Route = createFileRoute("/oportunidades")({
  head: () => ({
    meta: [
      { title: "Oportunidades quentes — Prospector" },
      {
        name: "description",
        content: "Empresas com maior potencial comercial, ordenadas por Lead Score.",
      },
      { property: "og:title", content: "Oportunidades quentes — Prospector" },
      {
        property: "og:description",
        content: "Empresas que apresentam maior potencial para abordagem comercial.",
      },
    ],
  }),
  component: Oportunidades,
});

const quickFilters = [
  { key: "score", label: "Score alto", icon: Flame },
  { key: "sem-site", label: "Sem site", icon: Globe },
  { key: "telefone", label: "Com telefone", icon: Phone },
  { key: "whatsapp", label: "WhatsApp", icon: MessageCircle },
  { key: "nota", label: "Nota alta", icon: Star },
] as const;

function Oportunidades() {
  const { leads, registerContact } = useProspector();
  const [active, setActive] = useState<string[]>([]);
  const [approach, setApproach] = useState<Lead | null>(null);

  const filtered = useMemo(
    () =>
      leads
        .filter((l) => {
          if (active.includes("score") && l.score < 80) return false;
          if (active.includes("sem-site") && l.website) return false;
          if (active.includes("telefone") && !l.phone) return false;
          if (active.includes("whatsapp") && !l.whatsapp) return false;
          if (active.includes("nota") && l.rating < 4.5) return false;
          return true;
        })
        .sort((a, b) => b.score - a.score),
    [leads, active],
  );

  const groups = [
    { key: "alta", title: "Alta prioridade", items: filtered.filter((l) => l.score >= 80) },
    { key: "media", title: "Média prioridade", items: filtered.filter((l) => l.score >= 65 && l.score < 80) },
    { key: "baixa", title: "Baixa prioridade", items: filtered.filter((l) => l.score < 65) },
  ];

  return (
    <>
      <PageHeader
        title="Oportunidades quentes"
        subtitle="Empresas que apresentam maior potencial para abordagem."
      />

      <div className="flex flex-wrap gap-2">
        {quickFilters.map((f) => {
          const on = active.includes(f.key);
          return (
            <button
              key={f.key}
              type="button"
              aria-pressed={on}
              onClick={() => setActive((prev) => (on ? prev.filter((k) => k !== f.key) : [...prev, f.key]))}
              className={cn(
                "inline-flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors",
                on
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              <f.icon className="size-3.5" aria-hidden />
              {f.label}
            </button>
          );
        })}
      </div>
      <DemoNotice />

      {filtered.length === 0 ? (
        <EmptyState
          title="Nenhuma oportunidade"
          description="Não encontramos empresas com esses filtros."
        />
      ) : (
        groups.map((g) =>
          g.items.length ? (
            <section key={g.key} className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">
                {g.title} <span className="text-muted-foreground">({g.items.length})</span>
              </h2>
              <div className="grid gap-3 lg:grid-cols-2">
                {g.items.map((lead) => (
                  <Card key={lead.id} className="gap-3 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold text-foreground">{lead.name}</h3>
                        <p className="truncate text-xs text-muted-foreground">
                          {lead.category} · {lead.city} - {lead.state}
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-lg font-semibold tabular-nums text-foreground">{lead.score}</p>
                        <p className="text-[10px] text-muted-foreground">{priorityOf(lead.score).label}</p>
                      </div>
                    </div>
                    <ScoreBar score={lead.score} />
                    <ul className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {lead.scoreFactors.slice(0, 3).map((f) => (
                        <li key={f.label}>+{f.points} {f.label}</li>
                      ))}
                    </ul>
                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                      <span>{lead.phone}</span>
                      <SiteBadge lead={lead} />
                      <StatusBadge status={lead.status} />
                    </div>
                    <div>
                      <Button size="sm" onClick={() => setApproach(lead)}>
                        Abordar
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            </section>
          ) : null,
        )
      )}

      <Dialog open={!!approach} onOpenChange={(o) => !o && setApproach(null)}>
        <DialogContent className="sm:max-w-lg">
          {approach ? (
            <>
              <DialogHeader>
                <DialogTitle>Abordar {approach.name}</DialogTitle>
                <DialogDescription>
                  Score {approach.score}/100 · {priorityOf(approach.score).label}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-3">
                <div className="rounded-md border border-border p-3">
                  <p className="text-xs text-muted-foreground">Principal oportunidade</p>
                  <p className="text-sm font-medium text-foreground">
                    {approach.website ? "Site atual com baixa conversão" : "Empresa sem site próprio"}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Mensagem sugerida</p>
                  <p className="mt-1 rounded-md border border-border bg-muted/40 p-3 text-sm leading-relaxed text-foreground">
                    {buildMessages(approach).natural}
                  </p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Telefone: {approach.phone} · WhatsApp: {approach.whatsapp ? "disponível" : "não informado"}
                </p>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={() => copyText(buildMessages(approach).natural, "Mensagem copiada.")}
                  >
                    <Copy className="size-3.5" aria-hidden />
                    Copiar mensagem
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => copyText(approach.phone, "Telefone copiado para abrir no WhatsApp.")}
                  >
                    <MessageCircle className="size-3.5" aria-hidden />
                    Abrir WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      registerContact(approach.id, "whatsapp", "Abordagem enviada");
                      setApproach(null);
                    }}
                  >
                    Registrar contato
                  </Button>
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </>
  );
}
