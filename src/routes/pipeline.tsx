import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { useProspector } from "@/features/prospector/store";
import { DemoNotice, EmptyState, PageHeader, ScorePill, SiteBadge } from "@/features/prospector/ui";
import { cn } from "@/lib/utils";
import { LEAD_STATUSES, type LeadStatus } from "@/types";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline — Prospector" },
      {
        name: "description",
        content: "Kanban comercial: arraste leads entre os estágios da negociação.",
      },
      { property: "og:title", content: "Pipeline — Prospector" },
      {
        property: "og:description",
        content: "Acompanhe cada lead do primeiro contato ao fechamento.",
      },
    ],
  }),
  component: Pipeline,
});

function Pipeline() {
  const { leads, setStatus, openLead, followUps } = useProspector();
  const [dragging, setDragging] = useState<string | null>(null);
  const [over, setOver] = useState<LeadStatus | null>(null);
  const saved = leads.filter((l) => l.saved);

  return (
    <>
      <PageHeader title="Pipeline" subtitle="Arraste os leads entre os estágios para atualizar o status." />
      <DemoNotice />

      {saved.length === 0 ? (
        <EmptyState title="Pipeline vazio" description="Salve leads na Prospecção para vê-los aqui." />
      ) : (
        <div className="-mx-4 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6">
          <div className="flex min-w-max gap-3">
            {LEAD_STATUSES.map((col) => {
              const items = saved.filter((l) => l.status === col.value);
              return (
                <section
                  key={col.value}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setOver(col.value);
                  }}
                  onDragLeave={() => setOver((prev) => (prev === col.value ? null : prev))}
                  onDrop={() => {
                    if (dragging) setStatus(dragging, col.value);
                    setDragging(null);
                    setOver(null);
                  }}
                  className={cn(
                    "w-64 shrink-0 rounded-lg border bg-muted/30 p-2 transition-colors",
                    over === col.value ? "border-primary bg-primary/5" : "border-border",
                  )}
                >
                  <header className="flex items-center justify-between px-1 pb-2">
                    <h2 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      {col.label}
                    </h2>
                    <span className="text-xs tabular-nums text-muted-foreground">{items.length}</span>
                  </header>
                  <div className="space-y-2">
                    {items.map((lead) => {
                      const fu = followUps.find((f) => f.leadId === lead.id && !f.done);
                      return (
                        <Card
                          key={lead.id}
                          draggable
                          onDragStart={() => setDragging(lead.id)}
                          onDragEnd={() => setDragging(null)}
                          onClick={() => openLead(lead.id)}
                          className={cn(
                            "cursor-grab gap-2 p-3 active:cursor-grabbing",
                            dragging === lead.id && "opacity-50",
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <p className="min-w-0 truncate text-sm font-medium text-foreground">{lead.name}</p>
                            <ScorePill score={lead.score} />
                          </div>
                          <p className="text-xs text-muted-foreground">★ {lead.rating.toFixed(1)}</p>
                          <SiteBadge lead={lead} />
                          <p className="text-xs text-muted-foreground">
                            Próximo contato: {fu ? fu.label : "não agendado"}
                          </p>
                        </Card>
                      );
                    })}
                    {items.length === 0 ? (
                      <p className="px-1 py-6 text-center text-xs text-muted-foreground">Nenhum lead</p>
                    ) : null}
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
