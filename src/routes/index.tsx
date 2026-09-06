import { createFileRoute } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useProspector } from "@/features/prospector/store";
import { EmptyState, PageHeader, StatusBadge, DemoNotice } from "@/features/prospector/ui";
import { LEAD_STATUSES } from "@/types";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão geral — Prospector" },
      {
        name: "description",
        content:
          "Painel de prospecção B2B: leads encontrados, oportunidades, pipeline e follow-ups do dia.",
      },
      { property: "og:title", content: "Visão geral — Prospector" },
      {
        property: "og:description",
        content: "Acompanhe leads, oportunidades e follow-ups da sua prospecção comercial.",
      },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { leads, followUps, activities, openLead, completeFollowUp } = useProspector();

  const saved = leads.filter((l) => l.saved);
  const cards = [
    { label: "Leads encontrados", value: leads.length },
    { label: "Oportunidades", value: leads.filter((l) => l.score >= 65).length },
    { label: "Sem site", value: leads.filter((l) => !l.website).length },
    { label: "Contatados", value: saved.filter((l) => l.status !== "novo").length },
    { label: "Responderam", value: saved.filter((l) => ["respondeu", "interessado", "negociacao", "fechado"].includes(l.status)).length },
    { label: "Interessados", value: saved.filter((l) => l.status === "interessado").length },
    { label: "Fechados", value: saved.filter((l) => l.status === "fechado").length },
  ];

  const pipeline = LEAD_STATUSES.filter((s) => s.value !== "perdido").map((s) => ({
    ...s,
    count: leads.filter((l) => l.saved && l.status === s.value).length,
  }));
  const maxPipeline = Math.max(1, ...pipeline.map((p) => p.count));
  const todays = followUps.filter((f) => !f.done && (f.when === "hoje" || f.when === "atrasado"));

  return (
    <>
      <PageHeader title="Visão geral" subtitle="Veja suas oportunidades e acompanhe sua prospecção." />

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        {cards.map((c) => (
          <Card key={c.label} className="gap-1 p-4">
            <p className="text-xs text-muted-foreground">{c.label}</p>
            <p className="text-2xl font-semibold tabular-nums text-foreground">{c.value}</p>
          </Card>
        ))}
      </section>
      <DemoNotice />

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold text-foreground">Pipeline resumido</h2>
          <ul className="mt-4 space-y-3">
            {pipeline.map((p) => (
              <li key={p.value} className="grid grid-cols-[7rem_minmax(0,1fr)_2rem] items-center gap-3">
                <span className="truncate text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  {p.label}
                </span>
                <span className="h-2 rounded-full bg-muted">
                  <span
                    className="block h-full rounded-full bg-primary transition-all"
                    style={{ width: `${(p.count / maxPipeline) * 100}%` }}
                  />
                </span>
                <span className="text-right text-xs tabular-nums text-foreground">{p.count}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card className="p-5">
          <h2 className="text-sm font-semibold text-foreground">Follow-ups de hoje</h2>
          <div className="mt-4 space-y-3">
            {todays.length === 0 ? (
              <EmptyState title="Nada para hoje" description="Você não possui follow-ups para hoje." />
            ) : (
              todays.map((f) => {
                const lead = leads.find((l) => l.id === f.leadId);
                if (!lead) return null;
                return (
                  <div key={f.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">{lead.name}</p>
                      <p className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="font-mono">{f.time}</span>
                        <StatusBadge status={lead.status} />
                      </p>
                    </div>
                    <div className="flex shrink-0 gap-1">
                      <Button size="sm" variant="outline" onClick={() => openLead(lead.id)}>
                        Abrir
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => completeFollowUp(f.id)}>
                        Concluir
                      </Button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </Card>
      </div>

      <Card className="p-5">
        <h2 className="text-sm font-semibold text-foreground">Atividade recente</h2>
        <ol className="mt-4 space-y-3">
          {activities.map((a) => (
            <li key={a.id} className="flex items-center gap-3 text-sm">
              <span className="size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <span className="min-w-0 flex-1 truncate text-foreground">
                {a.label} — <span className="text-muted-foreground">{a.lead}</span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{a.at}</span>
            </li>
          ))}
        </ol>
      </Card>
    </>
  );
}
