import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useProspector } from "@/features/prospector/store";
import { EmptyState, PageHeader, ScorePill, SourceNotice } from "@/features/prospector/ui";
import { LEAD_STATUSES, type LeadStatus } from "@/types";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/pipeline")({
  head: () => ({
    meta: [
      { title: "Pipeline de vendas | Prospector B2B" },
      {
        name: "description",
        content: "Kanban do funil: arraste leads entre novo, contatado, interessado, negociação e fechado.",
      },
      { property: "og:title", content: "Pipeline de vendas | Prospector B2B" },
      { property: "og:description", content: "Kanban do funil de prospecção, do primeiro contato ao fechamento." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Pipeline,
});

function Pipeline() {
  const { leads, setStatus, openLead } = useProspector();
  const [stage, setStage] = useState<LeadStatus>("novo");

  if (leads.length === 0) {
    return (
      <div className="space-y-6">
        <PageHeader title="Pipeline" subtitle="Acompanhe cada lead do primeiro contato até o fechamento." />
        <EmptyState
          title="Pipeline vazio"
          description="Salve leads na prospecção para começar a mover no funil."
          action={
            <Button asChild size="sm">
              <Link to="/prospeccao">Buscar empresas</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const stageItems = leads.filter((l) => l.status === stage);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pipeline"
        subtitle="No computador arraste os cartões; no celular escolha o estágio e mova com um toque."
      />

      {/* Mobile: chips de estágio + lista vertical. */}
      <div className="space-y-3 md:hidden">
        <div className="-mx-3 flex gap-2 overflow-x-auto px-3 pb-1">
          {LEAD_STATUSES.map((s) => {
            const count = leads.filter((l) => l.status === s.value).length;
            const active = stage === s.value;
            return (
              <button
                key={s.value}
                type="button"
                onClick={() => setStage(s.value as LeadStatus)}
                className={cn(
                  "shrink-0 rounded-full border px-3 py-2 text-xs font-medium",
                  active
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border text-muted-foreground",
                )}
              >
                {s.label} ({count})
              </button>
            );
          })}
        </div>

        {stageItems.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
            Nenhum lead neste estágio.
          </p>
        ) : (
          <div className="space-y-2">
            {stageItems.map((l) => (
              <Card key={l.id} className="gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <p className="min-w-0 text-sm font-semibold text-foreground">{l.name}</p>
                  <ScorePill score={l.score} />
                </div>
                <p className="truncate text-xs text-muted-foreground">
                  {l.category}
                  {l.city ? ` · ${l.city}` : ""}
                </p>
                {!l.website ? <p className="text-xs font-medium text-danger">Sem site informado</p> : null}
                <div className="flex items-center gap-2 pt-1">
                  <Select value={l.status} onValueChange={(v) => setStatus(l.id, v as LeadStatus)}>
                    <SelectTrigger className="h-10 flex-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {LEAD_STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="h-10" onClick={() => openLead(l.id)}>
                    Abrir
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Desktop: kanban horizontal com drag and drop (comportamento original). */}
      <div className="-mx-4 hidden overflow-x-auto px-4 pb-2 md:block">
        <div className="flex min-w-max gap-4">
          {LEAD_STATUSES.map((column) => {
            const items = leads.filter((l) => l.status === column.value);
            return (
              <div
                key={column.value}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  const id = e.dataTransfer.getData("text/plain");
                  if (id) setStatus(id, column.value as LeadStatus);
                }}
                className="w-72 shrink-0 rounded-lg border border-border bg-muted/30 p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-foreground">{column.label}</h2>
                  <span className="rounded-md bg-background px-2 py-0.5 text-xs text-muted-foreground">
                    {items.length}
                  </span>
                </div>
                <div className="space-y-2">
                  {items.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border px-3 py-6 text-center text-xs text-muted-foreground">
                      Solte um lead aqui
                    </p>
                  ) : (
                    items.map((l) => (
                      <Card
                        key={l.id}
                        draggable
                        onDragStart={(e) => e.dataTransfer.setData("text/plain", l.id)}
                        onClick={() => openLead(l.id)}
                        className="cursor-grab gap-2 p-3 transition-shadow hover:shadow-md active:cursor-grabbing"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <p className="min-w-0 truncate text-sm font-medium text-foreground">{l.name}</p>
                          <ScorePill score={l.score} />
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {l.category}
                          {l.city ? ` · ${l.city}` : ""}
                        </p>
                        {!l.website ? <p className="text-xs font-medium text-danger">Sem site informado</p> : null}
                      </Card>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <SourceNotice />
    </div>
  );
}
