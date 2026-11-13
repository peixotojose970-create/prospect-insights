import { Loader2, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { retryLocalizedPairs } from "@/features/prospector/localized-pairs";
export function MessageStatus({ pending, error }: { pending: boolean; error: string | null }) {
  if (pending) return <p role="status" className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" />Gerando abordagem no idioma selecionado…</p>;
  if (error) return <div role="alert" className="space-y-2 text-sm text-destructive"><p>{error}</p><Button variant="outline" onClick={retryLocalizedPairs}><RotateCcw />Tentar novamente</Button></div>;
  return null;
}