import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, MessageCircle, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPhone, whatsappLink } from "@/features/prospector/format";
import { useProspector } from "@/features/prospector/store";
import { EmptyState, PageHeader, SourceNotice, StatusBadge, copyText } from "@/features/prospector/ui";

export const Route = createFileRoute("/follow-ups")({
  head: () => ({
    meta: [
      { title: "Follow-ups agendados | Prospector B2B" },
      {
        name: "description",
        content: "Veja os retornos agendados por dia, registre contatos e conclua follow-ups sem perder o timing.",
      },
      { property: "og:title", content: "Follow-ups agendados | Prospector B2B" },
      { property: "og:description", content: "Retornos agendados por dia e registro rápido de contatos." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FollowUps,
});

function FollowUps() {
  const { followUps, leads, completeFollowUp, registerContact, openLead } = useProspector();
  const pending = followUps.filter((f) => !f.done).sort((a, b) => a.date.localeCompare(b.date));
  const days = [...new Set(pending.map((f) => f.date))];
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="space-y-6">
      <PageHeader title="Follow-ups" subtitle="Os retornos combinados, organizados por dia." />

      {pending.length === 0 ? (
        <EmptyState
          title="Nenhum follow-up pendente"
          description="Abra um lead salvo e agende um retorno para ele aparecer aqui."
          action={
            <Button asChild size="sm">
              <Link to="/leads">Ver meus leads</Link>
            </Button>
          }
        />
      ) : (
        <div className="space-y-6">
          {days.map((day) => (
            <section key={day} className="space-y-3">
              <h2 className="text-sm font-semibold text-foreground">
                {day === today ? "Hoje" : day.split("-").reverse().join("/")}
                {day < today ? " · atrasado" : ""}
              </h2>
              <div className="space-y-2">
                {pending
                  .filter((f) => f.date === day)
                  .map((f) => {
                    const lead = leads.find((l) => l.id === f.leadId);
                    if (!lead) return null;
                    const wa = whatsappLink(lead.phone);
                    return (
                      <Card key={f.id} className="flex-row items-start justify-between gap-3 p-4">
                        <div className="min-w-0">
                          <button
                            type="button"
                            className="truncate text-sm font-medium text-foreground hover:underline"
                            onClick={() => openLead(lead.id)}
                          >
                            {lead.name}
                          </button>
                          <p className="text-xs text-muted-foreground">
                            {f.time} · {f.label}
                          </p>
                          <StatusBadge status={lead.status} className="mt-1" />
                        </div>
                        <div className="flex shrink-0 flex-wrap gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              registerContact(lead.id, "ligacao", "Follow-up por telefone");
                              void copyText(formatPhone(lead.phone), "Telefone copiado.");
                            }}
                          >
                            <Phone className="size-4" aria-hidden />
                            Ligar
                          </Button>
                          {wa ? (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => registerContact(lead.id, "whatsapp", "Follow-up via WhatsApp")}
                              asChild
                            >
                              <a href={wa} target="_blank" rel="noreferrer">
                                <MessageCircle className="size-4" aria-hidden />
                                WhatsApp
                              </a>
                            </Button>
                          ) : null}
                          <Button size="sm" onClick={() => completeFollowUp(f.id)}>
                            <Check className="size-4" aria-hidden />
                            Concluir
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
              </div>
            </section>
          ))}
        </div>
      )}

      <SourceNotice />
    </div>
  );
}
