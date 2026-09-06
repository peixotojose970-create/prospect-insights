import { BookmarkCheck, BookmarkPlus, Globe, MapPin, MessageCircle, Phone, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatPhone, fullAddress, ratingLabel, whatsappLabel, whatsappLink } from "@/features/prospector/format";

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
  const { openLead, saveLead, isSaved } = useProspector();
  const saved = isSaved(business.id);
  const status = (business as Lead).status;
  const wa = whatsappLink(business.phone);

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

      <ScoreBar score={business.score} />

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
        <Button size="sm" variant="outline" onClick={() => openLead(business.id)}>
          Abrir
        </Button>
        {saved ? (
          <Button size="sm" variant="ghost" disabled>
            <BookmarkCheck className="size-4" aria-hidden />
            Salvo
          </Button>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => saveLead(business)}>
            <BookmarkPlus className="size-4" aria-hidden />
            Salvar lead
          </Button>
        )}
        {wa ? (
          <Button size="sm" variant="ghost" asChild title={whatsappLabel(business.phone)}>
            <a href={wa} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp
            </a>
          </Button>
        ) : null}
        <Button size="sm" onClick={() => onCreateSite(business)}>
          Criar Site
        </Button>
      </div>
    </Card>
  );
}
