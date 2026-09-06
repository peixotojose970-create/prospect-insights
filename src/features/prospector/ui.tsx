import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Business, LeadStatus } from "@/types";
import { siteLabel } from "./format";

export async function copyText(text: string, message: string) {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(message);
  } catch {
    toast.error("Não foi possível copiar neste navegador.");
  }
}

export function priorityOf(score: number) {
  if (score >= 80) return { key: "alta", label: "Alta prioridade", dot: "bg-danger" } as const;
  if (score >= 60) return { key: "media", label: "Média prioridade", dot: "bg-warning" } as const;
  return { key: "baixa", label: "Baixa prioridade", dot: "bg-muted-foreground" } as const;
}

const statusStyles: Record<LeadStatus, string> = {
  novo: "bg-muted text-muted-foreground",
  contatado: "bg-info/10 text-info",
  respondeu: "bg-info/15 text-info",
  interessado: "bg-warning/15 text-warning",
  negociacao: "bg-primary/10 text-primary",
  fechado: "bg-success/15 text-success",
  perdido: "bg-danger/10 text-danger",
};

const statusLabels: Record<LeadStatus, string> = {
  novo: "Novo",
  contatado: "Contatado",
  respondeu: "Respondeu",
  interessado: "Interessado",
  negociacao: "Negociação",
  fechado: "Fechado",
  perdido: "Perdido",
};

export function StatusBadge({ status, className }: { status: LeadStatus; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium",
        statusStyles[status],
        className,
      )}
    >
      {statusLabels[status]}
    </span>
  );
}

export function SiteBadge({ business }: { business: Business }) {
  return business.website ? (
    <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
      <span className="size-2 shrink-0 rounded-full bg-success" aria-hidden />
      {siteLabel(business)}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-danger">
      <span className="size-2 shrink-0 rounded-full bg-danger" aria-hidden />
      {siteLabel(business)}
    </span>
  );
}

export function ScoreBar({ score, className }: { score: number; className?: string }) {
  const p = priorityOf(score);
  return (
    <div className={cn("h-1.5 w-full overflow-hidden rounded-full bg-muted", className)}>
      <div
        className={cn(
          "h-full rounded-full transition-all",
          p.key === "alta" ? "bg-danger" : p.key === "media" ? "bg-warning" : "bg-muted-foreground",
        )}
        style={{ width: `${score}%` }}
      />
    </div>
  );
}

export function ScorePill({ score }: { score: number }) {
  const p = priorityOf(score);
  return (
    <Badge variant="outline" className="gap-1.5 font-mono tabular-nums">
      <span className={cn("size-1.5 rounded-full", p.dot)} aria-hidden />
      {score}
    </Badge>
  );
}

/** Atribuição obrigatória da fonte oficial utilizada. */
export function SourceNotice({ className }: { className?: string }) {
  return (
    <p className={cn("text-xs text-muted-foreground", className)}>
      Dados de estabelecimentos ©{" "}
      <a
        href="https://developers.google.com/maps/documentation/places/web-service"
        target="_blank"
        rel="noreferrer"
        className="underline underline-offset-2 hover:text-foreground"
      >
        Google Maps Platform — Places API
      </a>
      . Somente resultados no Brasil (pt-BR). Cobertura conforme o retorno oficial do Google — não é a lista
      completa de empresas da cidade.
    </p>
  );
}


export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border px-6 py-14 text-center">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{description}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-b border-border pb-5 sm:flex sm:flex-wrap sm:items-center sm:justify-between">
      <div className="min-w-0">
        <h1 className="truncate text-2xl font-bold tracking-tight text-foreground sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}
