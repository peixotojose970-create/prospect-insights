import { useState } from "react";
import {
  BookmarkCheck,
  BookmarkPlus,
  Globe,
  MessageCircle,
  MapPin,
  Phone,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MessageDialog } from "@/components/prospector/MessageDialog";
import { OpportunityDialog } from "@/components/prospector/OpportunityDialog";
import { formatPhone, fullAddress, ratingLabel } from "@/features/prospector/format";
import { opportunityHeadline, priorityFor } from "@/features/prospector/scoring";
import { useProspector } from "@/features/prospector/store";
import { ScoreBar, ScorePill, SiteBadge, StatusBadge } from "@/features/prospector/ui";
import type { Business, Lead } from "@/types";

export function LeadCard({
  business,
  onCreateSite,
}: {
  business: Business | Lead;
  onCreateSite: (business: Business) => void;
}) {
  const { openLead, saveLead, isSaved, toggleFavorite } = useProspector();
  const [analyze, setAnalyze] = useState(false);
  const [approach, setApproach] = useState(false);
  const saved = isSaved(business.id);
  const lead = business as Lead;
  const status = lead.status;
  const priority = priorityFor(business.score);

  return (
    <Card className="gap-3 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-foreground">{business.name}</h3>
          <p className="truncate text-xs text-muted-foreground">
            {business.category}
            {business.city ? ` · ${business.city}` : ""}
            {business.state ? ` - ${business.state}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {saved && status ? <StatusBadge status={status} /> : null}
          <ScorePill score={business.score} />
        </div>
      </div>

      <div className="space-y-1.5">
        <p className="text-xs font-medium text-foreground">
          {priority.emoji} {priority.label}
        </p>
        <ScoreBar score={business.score} />
        <p className="text-xs text-muted-foreground">{opportunityHeadline(business)}</p>
      </div>

      <ul className="space-y-1.5 text-xs text-muted-foreground">
        <li className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 break-words">{fullAddress(business)}</span>
        </li>
        <li className="flex items-center gap-2">
          <Star className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{ratingLabel(business)}</span>
        </li>
        <li className="flex items-center gap-2">
          <Phone className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{formatPhone(business.phone)}</span>
        </li>
        <li className="flex items-center gap-2">
          <Globe className="size-3.5 shrink-0" aria-hidden />
          <SiteBadge business={business} />
        </li>
      </ul>

      <div className="flex flex-wrap gap-2 pt-1">
        <Button size="sm" variant="outline" onClick={() => setAnalyze(true)}>
          <Sparkles className="size-4" aria-hidden />
          Analisar
        </Button>
        <Button size="sm" variant="outline" onClick={() => setApproach(true)}>
          <MessageCircle className="size-4" aria-hidden />
          Abordar
        </Button>
        <Button size="sm" variant="ghost" onClick={() => openLead(business.id)}>
          Abrir
        </Button>
        {saved ? (
          <>
            <Button size="sm" variant="ghost" disabled>
              <BookmarkCheck className="size-4" aria-hidden />
              Salvo
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => toggleFavorite(business.id)}
              title={lead.favorite ? "Remover dos favoritos" : "Marcar como favorito"}
            >
              <Star className={lead.favorite ? "size-4 fill-warning text-warning" : "size-4"} aria-hidden />
            </Button>
          </>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => saveLead(business)}>
            <BookmarkPlus className="size-4" aria-hidden />
            Salvar lead
          </Button>
        )}
        <Button size="sm" onClick={() => onCreateSite(business)}>
          Criar Site
        </Button>
      </div>

      <OpportunityDialog business={analyze ? business : null} onOpenChange={(open) => setAnalyze(open)} />
      <MessageDialog business={approach ? business : null} onOpenChange={(open) => setApproach(open)} />
    </Card>
  );
}
