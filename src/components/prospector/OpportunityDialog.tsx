import { useEffect, useState } from "react";
import { Check, Loader2, X } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { auditWebsite, type SiteAudit } from "@/lib/site-audit.functions";
import { mainOpportunity, opportunityHeadline, priorityFor } from "@/features/prospector/scoring";
import { formatPhone, fullAddress, ratingLabel } from "@/features/prospector/format";
import { ScoreBar, SourceNotice } from "@/features/prospector/ui";
import type { Business } from "@/types";

function Signal({ ok, label }: { ok: boolean; label: string }) {
  return (
    <li className="flex items-center gap-2 text-xs">
      {ok ? (
        <Check className="size-3.5 shrink-0 text-success" aria-hidden />
      ) : (
        <X className="size-3.5 shrink-0 text-danger" aria-hidden />
      )}
      <span className={ok ? "text-foreground" : "text-muted-foreground"}>{label}</span>
    </li>
  );
}

function SiteAnalysis({ business }: { business: Business }) {
  const run = useServerFn(auditWebsite);
  const [state, setState] = useState<
    { status: "idle" | "loading" } | { status: "error"; message: string } | { status: "ok"; audit: SiteAudit }
  >({ status: "idle" });

  useEffect(() => {
    if (!business.website) return;
    let alive = true;
    setState({ status: "loading" });
    run({ data: { url: business.website } })
      .then((result) => {
        if (!alive) return;
        setState(result.ok ? { status: "ok", audit: result.audit } : { status: "error", message: result.message });
      })
      .catch(() => alive && setState({ status: "error", message: "Não foi possível analisar o site." }));
    return () => {
      alive = false;
    };
  }, [business.website, run]);

  if (!business.website)
    return (
      <p className="rounded-md border border-dashed border-border p-3 text-xs text-muted-foreground">
        Nenhum site informado no perfil público. Pode existir e não estar cadastrado — vale confirmar com a
        empresa.
      </p>
    );

  if (state.status === "loading" || state.status === "idle")
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" aria-hidden />
        Analisando o site informado…
      </p>
    );

  if (state.status === "error")
    return <p className="text-xs text-danger">{state.message} Vale conferir manualmente.</p>;

  const a = state.audit;
  const qualityLabel = a.quality === "boa" ? "Boa base" : a.quality === "media" ? "Pode melhorar" : "Fraca";

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="outline">{qualityLabel}</Badge>
        {a.tech ? <Badge variant="outline">{a.tech}</Badge> : null}
        <Badge variant="outline">resposta {a.responseMs} ms</Badge>
      </div>
      <p className="text-xs text-muted-foreground">{a.summary}</p>
      <ul className="grid gap-1 sm:grid-cols-2">
        <Signal ok={a.https} label="HTTPS" />
        <Signal ok={a.viewport} label="Preparado para celular" />
        <Signal ok={a.responsiveHints} label="Layout responsivo" />
        <Signal ok={a.whatsapp} label="Contato por WhatsApp" />
        <Signal ok={a.phone} label="Telefone visível" />
        <Signal ok={a.address} label="Endereço visível" />
        <Signal ok={a.form} label="Formulário de contato" />
        <Signal ok={a.cta} label="Chamada para ação" />
        <Signal ok={!!a.title} label="Título da página" />
        <Signal ok={!!a.description} label="Descrição para buscas" />
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Análise automática apenas da página inicial ({a.finalUrl}). Não substitui uma avaliação manual.
      </p>
    </div>
  );
}

export function OpportunityDialog({
  business,
  onOpenChange,
}: {
  business: Business | null;
  onOpenChange: (open: boolean) => void;
}) {
  if (!business) return null;
  const priority = priorityFor(business.score);

  return (
    <Dialog open={!!business} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Analisar oportunidade</DialogTitle>
          <DialogDescription>{business.name}</DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[65vh] pr-3">
          <div className="space-y-5">
            <section className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-foreground">
                  {priority.emoji} {priority.label}
                </p>
                <span className="font-mono text-sm tabular-nums text-muted-foreground">
                  {business.score}/100
                </span>
              </div>
              <ScoreBar score={business.score} />
              <p className="text-xs text-muted-foreground">{opportunityHeadline(business)}</p>
              <p className="text-sm text-foreground">{mainOpportunity(business)}</p>
            </section>

            <section className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Como o score foi calculado
              </h4>
              <ul className="space-y-1">
                {business.scoreFactors.map((f) => (
                  <li key={f.label} className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-foreground">{f.label}</span>
                    <span className="font-mono tabular-nums text-muted-foreground">+{f.points}</span>
                  </li>
                ))}
              </ul>
            </section>

            <section className="space-y-1.5">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Dados públicos
              </h4>
              <ul className="space-y-1 text-xs text-muted-foreground">
                <li>{fullAddress(business)}</li>
                <li>{formatPhone(business.phone)}</li>
                <li>{ratingLabel(business)}</li>
                <li>{business.category}</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                Análise do site
              </h4>
              <SiteAnalysis business={business} />
            </section>

            <SourceNotice />
          </div>
        </ScrollArea>

        <div className="flex justify-end">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
