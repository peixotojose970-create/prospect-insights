import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Check, MessageCircle, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageDialog } from "@/components/prospector/MessageDialog";
import { useProspector } from "@/features/prospector/store";
import { copyText, EmptyState, PageHeader, StatusBadge } from "@/features/prospector/ui";
import type { Lead } from "@/types";

export const Route = createFileRoute("/follow-ups")({
  head: () => ({
    meta: [
      { title: "Follow-ups — Prospector" },
      {
        name: "description",
        content: "Follow-ups atrasados, de hoje e próximos, com ações rápidas de abordagem.",
      },
      { property: "og:title", content: "Follow-ups — Prospector" },
      {
        property: "og:description",
        content: "Nunca perca um retorno: acompanhe atrasados, hoje e próximos.",
      },
    ],
  }),
  component: FollowUps,
});

const groups = [
  { key: "atrasado", title: "Atrasados", dot: "bg-danger" },
  { key: "hoje", title: "Hoje", dot: "bg-warning" },
  { key: "proximo", title: "Próximos", dot: "bg-info" },
] as const;

function FollowUps() {
  const { followUps, leads, completeFollowUp, openLead, registerContact } = useProspector();
  const [msgLead, setMsgLead] = useState<Lead | null>(null);
  const pending = followUps.filter((f) => !f.done);

  return (
    <>
      <PageHeader title="Follow-ups" subtitle="Organize seus retornos e mantenha a cadência de contato." />

      {pending.length === 0 ? (
        <EmptyState
          title="Tudo em dia"
          description="Você não possui follow-ups pendentes. Crie um novo dentro de um lead."
        />
      ) : (
        groups.map((g) => {
          const items = pending.filter((f) => f.when === g.key);
          return (
            <section key={g.key} className="space-y-3">
              <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <span className={`size-2 rounded-full ${g.dot}`} aria-hidden />
                {g.title}
                <span className="text-muted-foreground">({items.length})</span>
              </h2>
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {g.key === "hoje" ? "Você não possui follow-ups para hoje." : "Nada por aqui."}
                </p>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {items.map((f) => {
                    const lead = leads.find((l) => l.id === f.leadId);
                    if (!lead) return null;
                    return (
                      <Card key={f.id} className="gap-3 p-4">
                        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-3">
                          <div className="min-w-0">
                            <button
                              type="button"
                              onClick={() => openLead(lead.id)}
                              className="truncate text-sm font-semibold text-foreground hover:underline"
                            >
                              {lead.name}
                            </button>
                            <p className="mt-0.5 text-xs text-muted-foreground">{f.label}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="font-mono text-xs text-foreground">{f.time}</p>
                            <StatusBadge status={lead.status} className="mt-1" />
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          <Button size="sm" variant="outline" onClick={() => setMsgLead(lead)}>
                            <Mail className="size-3.5" aria-hidden />
                            Gerar mensagem
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              registerContact(lead.id, "whatsapp", "Follow-up via WhatsApp");
                              copyText(lead.phone, "Telefone copiado.");
                            }}
                          >
                            <MessageCircle className="size-3.5" aria-hidden />
                            WhatsApp
                          </Button>
                          <Button size="sm" onClick={() => completeFollowUp(f.id)}>
                            <Check className="size-3.5" aria-hidden />
                            Concluir
                          </Button>
                        </div>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          );
        })
      )}

      <MessageDialog lead={msgLead} onOpenChange={(o) => !o && setMsgLead(null)} />
    </>
  );
}
