import { useState } from "react";
import {
  BookmarkCheck,
  BookmarkPlus,
  Copy,
  Globe,
  MapPin,
  MessageCircle,
  MoreVertical,
  Monitor,
  Phone,
  Sparkles,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MessageDialog } from "@/components/prospector/MessageDialog";
import { OpportunityDialog } from "@/components/prospector/OpportunityDialog";
import { formatPhone, fullAddress, ratingLabel, whatsappLink } from "@/features/prospector/format";
import { opportunityHeadline, priorityFor } from "@/features/prospector/scoring";
import { useProspector } from "@/features/prospector/store";
import { ScoreBar, ScorePill, SiteBadge, StatusBadge, copyText } from "@/features/prospector/ui";
import type { Business, Lead } from "@/types";
import { toast } from "sonner";

export function LeadCard({
  business,
  onCreateSite,
  selectable = false,
}: {
  business: Business | Lead;
  onCreateSite: (business: Business) => void;
  /** Mostra o checkbox de seleção múltipla (tela de Prospecção). */
  selectable?: boolean;
}) {
  const { openLead, saveLead, isSaved, toggleFavorite, isSelected, toggleSelected } = useProspector();
  const selected = selectable && isSelected(business.id);
  const [analyze, setAnalyze] = useState(false);
  const [approach, setApproach] = useState(false);
  const saved = isSaved(business.id);
  const lead = business as Lead;
  const status = lead.status;
  const priority = priorityFor(business.score);
  const wa = whatsappLink(business.phone);

  return (
    <Card
      className={
        selected
          ? "gap-3 border-primary bg-primary/5 p-4 ring-1 ring-primary/30 transition-colors"
          : "gap-3 p-4 transition-colors"
      }
    >
      <div className="flex items-start justify-between gap-3">
        {selectable ? (
          <label className="-m-2 flex shrink-0 cursor-pointer items-start p-2">
            <Checkbox
              checked={selected}
              onCheckedChange={() => toggleSelected(business as Business)}
              aria-label={`Selecionar ${business.name}`}
              className="size-5"
            />
          </label>
        ) : null}
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-semibold text-foreground sm:truncate">
            {priority.emoji} {business.name}
          </h3>
          <p className="truncate text-xs text-muted-foreground">
            {business.category}
            {business.city ? ` · ${business.city}` : ""}
            {business.state ? ` - ${business.state}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {saved && status ? <StatusBadge status={status} className="hidden sm:inline-flex" /> : null}
          <ScorePill score={business.score} />
        </div>
      </div>

      <div className="space-y-1.5">
        <ScoreBar score={business.score} />
        <p className="text-xs text-muted-foreground">{opportunityHeadline(business)}</p>
      </div>

      <ul className="space-y-1.5 text-xs text-muted-foreground">
        <li className="flex items-center gap-2">
          <Star className="size-3.5 shrink-0" aria-hidden />
          <span className="truncate">{ratingLabel(business)}</span>
        </li>
        <li className="flex items-start gap-2">
          <MapPin className="mt-0.5 size-3.5 shrink-0" aria-hidden />
          <span className="min-w-0 break-words sm:line-clamp-2">{fullAddress(business)}</span>
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

      {/* Ações principais: sempre visíveis, com área de toque confortável. */}
      <div className="flex items-center gap-2 pt-1">
        {wa ? (
          <Button size="sm" className="h-10 flex-1" asChild>
            <a href={wa} target="_blank" rel="noreferrer">
              <MessageCircle className="size-4" aria-hidden />
              WhatsApp
            </a>
          </Button>
        ) : (
          <Button
            size="sm"
            className="h-10 flex-1"
            variant="secondary"
            onClick={() => toast.info("Telefone não disponível.")}
          >
            <MessageCircle className="size-4" aria-hidden />
            WhatsApp
          </Button>
        )}
        <Button size="sm" variant="outline" className="h-10 flex-1" onClick={() => openLead(business.id)}>
          Abrir
        </Button>
        {saved ? (
          <Button
            size="icon"
            variant="outline"
            className="size-10 shrink-0"
            onClick={() => toggleFavorite(business.id)}
            aria-label={lead.favorite ? "Remover dos favoritos" : "Marcar como favorito"}
          >
            <Star className={lead.favorite ? "size-4 fill-warning text-warning" : "size-4"} aria-hidden />
          </Button>
        ) : (
          <Button
            size="icon"
            variant="outline"
            className="size-10 shrink-0"
            onClick={() => saveLead(business)}
            aria-label="Salvar lead"
          >
            <BookmarkPlus className="size-4" aria-hidden />
          </Button>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button size="icon" variant="ghost" className="size-10 shrink-0" aria-label="Mais ações">
              <MoreVertical className="size-4" aria-hidden />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem onSelect={() => setAnalyze(true)}>
              <Sparkles className="size-4" aria-hidden />
              Analisar oportunidade
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setApproach(true)}>
              <MessageCircle className="size-4" aria-hidden />
              Gerar mensagem
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => onCreateSite(business)}>
              <Monitor className="size-4" aria-hidden />
              Criar site
            </DropdownMenuItem>
            {business.phone ? (
              <DropdownMenuItem onSelect={() => void copyText(business.phone!, "Telefone copiado.")}>
                <Copy className="size-4" aria-hidden />
                Copiar telefone
              </DropdownMenuItem>
            ) : null}
            {business.mapsUrl ? (
              <DropdownMenuItem asChild>
                <a href={business.mapsUrl} target="_blank" rel="noreferrer">
                  <MapPin className="size-4" aria-hidden />
                  Ver localização
                </a>
              </DropdownMenuItem>
            ) : null}
            {saved ? (
              <DropdownMenuItem disabled>
                <BookmarkCheck className="size-4" aria-hidden />
                Lead salvo
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <OpportunityDialog business={analyze ? business : null} onOpenChange={(open) => setAnalyze(open)} />
      <MessageDialog business={approach ? business : null} onOpenChange={(open) => setApproach(open)} />
    </Card>
  );
}
