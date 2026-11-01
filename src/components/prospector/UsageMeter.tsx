import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { Gauge } from "lucide-react";
import { useProspector } from "@/features/prospector/store";
import { getPlacesUsage } from "@/lib/places-usage.functions";
import { cn } from "@/lib/utils";

export const usageQueryKey = ["places-usage"] as const;

export function usePlacesUsage() {
  return useQuery({ queryKey: usageQueryKey, queryFn: () => getPlacesUsage(), staleTime: 15_000 });
}

/** Mostra "X de N buscas no mês", aviso em 90% e bloqueio em 95%. */
export function UsageMeter({ estimate, className }: { estimate?: string | undefined; className?: string }) {
  const { data } = usePlacesUsage();
  const qc = useQueryClient();
  const { search } = useProspector();
  useEffect(() => {
    if (search.status === "success" || search.status === "error") void qc.invalidateQueries({ queryKey: usageQueryKey });
  }, [search.status, qc]);

  if (!data) return null;
  const pct = Math.min(100, (data.calls / data.limit) * 100);
  const blocked = data.calls >= data.blockAt;
  const warn = !blocked && data.calls >= data.warnAt;
  return (
    <div className={cn("glass-card rounded-[20px] p-4", className)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <Gauge className="size-4 text-primary" strokeWidth={1.6} aria-hidden />
        <p className="text-sm font-semibold">
          <span className="tabular-nums">{data.calls}</span> de <span className="tabular-nums">{data.limit}</span> buscas no mês
        </p>
        {estimate ? <p className="text-xs text-muted-foreground sm:ml-auto">{estimate}</p> : null}
      </div>
      <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-muted">
        <div className={cn("h-full rounded-full transition-all", blocked || warn ? "bg-warning" : "bg-gradient-brand")} style={{ width: `${pct}%` }} />
      </div>
      {blocked ? (
        <p className="mt-2 text-xs font-medium text-danger">
          Novas buscas bloqueadas ({data.blockAt}+ chamadas). <Link to="/configuracoes" className="underline">Aumente o limite em Configurações</Link>.
        </p>
      ) : warn ? (
        <p className="mt-2 text-xs font-medium text-warning">Atenção: você já usou {data.calls} chamadas. Em {data.blockAt} as buscas serão bloqueadas.</p>
      ) : null}
    </div>
  );
}
