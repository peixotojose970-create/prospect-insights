import { MapPin, MessageCircle, Monitor, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useProspector } from "@/features/prospector/store";
import { copyText, ScoreBar, ScorePill, SiteBadge, priorityOf } from "@/features/prospector/ui";
import type { Lead } from "@/types";

export function LeadCard({ lead, onCreateSite }: { lead: Lead; onCreateSite: (lead: Lead) => void }) {
  const { openLead, registerContact } = useProspector();
  const p = priorityOf(lead.score);

  return (
    <Card className="gap-0 p-4 transition-colors hover:border-primary/40">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 items-center gap-2">
            <span className={`size-2 shrink-0 rounded-full ${p.dot}`} aria-hidden />
            <h3 className="truncate text-sm font-semibold text-foreground">{lead.name}</h3>
          </div>
          <p className="mt-0.5 truncate text-xs text-muted-foreground">{lead.category}</p>
        </div>
        <ScorePill score={lead.score} />
      </div>

      <dl className="mt-3 space-y-1.5 text-xs text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <Star className="size-3.5 shrink-0 text-warning" aria-hidden />
          <span className="font-medium text-foreground">{lead.rating.toFixed(1)}</span>
          <span>· {lead.reviews} avaliações</span>
        </div>
        <div className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" aria-hidden />
          {lead.city} - {lead.state}
        </div>
        <div className="flex items-center gap-1.5">
          <Phone className="size-3.5 shrink-0" aria-hidden />
          {lead.phone}
        </div>
        <SiteBadge lead={lead} />
      </dl>

      <div className="mt-3">
        <div className="mb-1.5 flex items-center justify-between text-xs">
          <span className="text-muted-foreground">Lead Score</span>
          <span className="font-medium text-foreground">{lead.score}/100</span>
        </div>
        <ScoreBar score={lead.score} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button size="sm" onClick={() => openLead(lead.id)}>
          Abrir
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={() => {
            registerContact(lead.id, "whatsapp", "Abordagem via WhatsApp (demonstração)");
            copyText(lead.phone, "Telefone copiado. Integração de WhatsApp virá na versão conectada.");
          }}
        >
          <MessageCircle className="size-3.5" aria-hidden />
          WhatsApp
        </Button>
        <Button size="sm" variant="outline" onClick={() => onCreateSite(lead)}>
          <Monitor className="size-3.5" aria-hidden />
          Criar Site
        </Button>
      </div>
    </Card>
  );
}
