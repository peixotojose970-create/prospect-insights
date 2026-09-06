import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, BookmarkCheck, BookmarkPlus, Copy, MessageCircle, Monitor, Phone } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CreateSiteDialog } from "@/components/prospector/CreateSiteDialog";
import { MessageDialog } from "@/components/prospector/MessageDialog";
import { formatPhone, ratingLabel, whatsappLink } from "@/features/prospector/format";
import { opportunityHeadline, priorityFor } from "@/features/prospector/scoring";
import { useProspector } from "@/features/prospector/store";
import { EmptyState, PageHeader, ScoreBar, SourceNotice, copyText } from "@/features/prospector/ui";
import type { Business } from "@/types";

export const Route = createFileRoute("/rapido")({
  head: () => ({
    meta: [
      { title: "Prospecção rápida no celular | Prospector B2B" },
      {
        name: "description",
        content:
          "Processe muitos leads pelo celular: veja empresa, score e oportunidade e dispare WhatsApp, mensagem ou site em um toque.",
      },
      { property: "og:title", content: "Prospecção rápida no celular | Prospector B2B" },
      {
        property: "og:description",
        content: "Um lead por vez, botões grandes e avanço imediato para o próximo lead prioritário.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: QuickProspecting,
});

function QuickProspecting() {
  const { search, saveLead, isSaved, openLead } = useProspector();
  const [index, setIndex] = useState(0);
  const [msgFor, setMsgFor] = useState<Business | null>(null);
  const [siteFor, setSiteFor] = useState<Business | null>(null);

  // Prioridade: score, depois sem site, depois telefone disponível.
  const queue = useMemo(
    () =>
      [...search.results].sort(
        (a, b) =>
          b.score - a.score ||
          Number(!a.website) - Number(!b.website) ||
          Number(!!b.phone) - Number(!!a.phone),
      ),
    [search.results],
  );

  const current = queue[Math.min(index, Math.max(queue.length - 1, 0))];

  if (!current) {
    return (
      <div className="space-y-5">
        <PageHeader title="Prospecção rápida" subtitle="Um lead por vez, com as ações essenciais em botões grandes." />
        <EmptyState
          title="Nenhuma busca carregada"
          description="Faça uma busca na Prospecção e volte aqui para percorrer os leads em sequência."
          action={
            <Button asChild>
              <Link to="/prospeccao">Buscar empresas</Link>
            </Button>
          }
        />
      </div>
    );
  }

  const wa = whatsappLink(current.phone);
  const saved = isSaved(current.id);
  const priority = priorityFor(current.score);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Prospecção rápida"
        subtitle={`Lead ${Math.min(index + 1, queue.length)} de ${queue.length} — ordenados por prioridade.`}
      />

      <Card className="gap-4 p-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {priority.emoji} {priority.label}
          </p>
          <h2 className="mt-1 text-xl font-bold text-foreground">{current.name}</h2>
          <p className="text-sm text-muted-foreground">
            {current.category}
            {current.city ? ` · ${current.city}` : ""}
            {current.state ? ` - ${current.state}` : ""}
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Lead Score</span>
            <span className="text-2xl font-bold tabular-nums text-foreground">{current.score}</span>
          </div>
          <ScoreBar score={current.score} />
          <p className="text-sm text-muted-foreground">{opportunityHeadline(current)}</p>
          <p className="text-sm text-muted-foreground">{ratingLabel(current)}</p>
          <p className="text-sm font-medium text-foreground">{formatPhone(current.phone)}</p>
        </div>

        <div className="grid gap-2 sm:grid-cols-2">
          {wa ? (
            <Button className="h-12" asChild>
              <a href={wa} target="_blank" rel="noreferrer">
                <MessageCircle className="size-5" aria-hidden />
                WhatsApp
              </a>
            </Button>
          ) : (
            <Button className="h-12" variant="secondary" onClick={() => toast.info("Telefone não disponível.")}>
              <MessageCircle className="size-5" aria-hidden />
              WhatsApp
            </Button>
          )}
          <Button className="h-12" variant="outline" onClick={() => setMsgFor(current)}>
            <Phone className="size-5" aria-hidden />
            Mensagem
          </Button>
          <Button className="h-12" variant="outline" onClick={() => setSiteFor(current)}>
            <Monitor className="size-5" aria-hidden />
            Criar site
          </Button>
          {saved ? (
            <Button className="h-12" variant="outline" disabled>
              <BookmarkCheck className="size-5" aria-hidden />
              Salvo
            </Button>
          ) : (
            <Button className="h-12" variant="outline" onClick={() => saveLead(current)}>
              <BookmarkPlus className="size-5" aria-hidden />
              Salvar
            </Button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {current.phone ? (
            <Button
              variant="ghost"
              className="h-12 flex-1"
              onClick={() => void copyText(current.phone!, "Telefone copiado.")}
            >
              <Copy className="size-4" aria-hidden />
              Copiar telefone
            </Button>
          ) : null}
          <Button variant="ghost" className="h-12 flex-1" onClick={() => openLead(current.id)}>
            Ver detalhes
          </Button>
        </div>

        <Button
          className="h-14 w-full text-base"
          disabled={index >= queue.length - 1}
          onClick={() => setIndex((i) => Math.min(i + 1, queue.length - 1))}
        >
          Próximo lead
          <ArrowRight className="size-5" aria-hidden />
        </Button>
      </Card>

      <SourceNotice />

      <MessageDialog business={msgFor} onOpenChange={(open) => !open && setMsgFor(null)} />
      <CreateSiteDialog business={siteFor} onOpenChange={(open) => !open && setSiteFor(null)} />
    </div>
  );
}
