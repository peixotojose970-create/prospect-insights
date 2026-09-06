import { createFileRoute, Link } from "@tanstack/react-router";
import { Bell, Flame, Globe, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { InstallAppCard } from "@/components/prospector/InstallApp";
import { useProspector } from "@/features/prospector/store";
import { EmptyState, PageHeader, ScorePill, SourceNotice, StatusBadge } from "@/features/prospector/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Painel do prospector | Prospector B2B" },
      {
        name: "description",
        content:
          "Acompanhe leads salvos, oportunidades sem site, follow-ups do dia e atividade recente da sua prospecção B2B.",
      },
      { property: "og:title", content: "Painel do prospector | Prospector B2B" },
      {
        property: "og:description",
        content: "Leads salvos, oportunidades sem site e follow-ups do dia em um só painel.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { leads, followUps, activities, openLead } = useProspector();
  const noSite = leads.filter((l) => !l.website);
  const pending = followUps.filter((f) => !f.done);
  const hot = leads.filter((l) => l.score >= 80);

  const stats = [
    { label: "Leads salvos", value: leads.length, icon: Users, to: "/leads" },
    { label: "Sem site informado", value: noSite.length, icon: Globe, to: "/oportunidades" },
    { label: "Alta prioridade", value: hot.length, icon: Flame, to: "/oportunidades" },
    { label: "Follow-ups pendentes", value: pending.length, icon: Bell, to: "/follow-ups" },
  ] as const;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Painel"
        subtitle="Sua carteira de prospecção construída a partir de dados abertos de empresas."
        actions={
          <Button asChild>
            <Link to="/prospeccao">Buscar empresas</Link>
          </Button>
        }
      />

      <InstallAppCard />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="gap-1 p-4">
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <s.icon className="size-4 text-muted-foreground" aria-hidden />
            </div>
            <p className="text-3xl font-bold tabular-nums text-foreground">{s.value}</p>
            <Link to={s.to} className="text-xs text-primary underline underline-offset-2">
              Ver detalhes
            </Link>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="gap-3 p-4">
          <h2 className="text-sm font-semibold text-foreground">Leads recentes</h2>
          {leads.length === 0 ? (
            <EmptyState
              title="Nenhum lead salvo"
              description="Faça uma busca e salve as empresas que fazem sentido para você."
              action={
                <Button asChild size="sm">
                  <Link to="/prospeccao">Ir para prospecção</Link>
                </Button>
              }
            />
          ) : (
            <ul className="divide-y divide-border">
              {leads.slice(0, 6).map((lead) => (
                <li key={lead.id} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{lead.name}</p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <StatusBadge status={lead.status} />
                      <ScorePill score={lead.score} />
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => openLead(lead.id)}>
                    Abrir
                  </Button>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="gap-3 p-4">
          <h2 className="text-sm font-semibold text-foreground">Atividade recente</h2>
          {activities.length === 0 ? (
            <p className="text-sm text-muted-foreground">Suas ações aparecem aqui.</p>
          ) : (
            <ol className="space-y-3 border-l border-border pl-4">
              {activities.slice(0, 8).map((a) => (
                <li key={a.id} className="relative text-sm">
                  <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-primary" aria-hidden />
                  <p className="text-foreground">
                    {a.label} — <span className="text-muted-foreground">{a.lead}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{a.at}</p>
                </li>
              ))}
            </ol>
          )}
        </Card>
      </div>

      <SourceNotice />
    </div>
  );
}
