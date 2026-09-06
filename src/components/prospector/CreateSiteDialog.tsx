import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { buildSitePrompt } from "@/features/prospector/generators";
import { useProspector } from "@/features/prospector/store";
import { copyText } from "@/features/prospector/ui";
import type { Lead } from "@/types";

export function CreateSiteDialog({
  lead,
  onOpenChange,
}: {
  lead: Lead | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { logHistory } = useProspector();
  if (!lead) return null;
  const prompt = buildSitePrompt(lead);

  const fields: [string, string][] = [
    ["Nome", lead.name],
    ["Categoria", lead.category],
    ["Cidade", lead.city],
    ["Estado", lead.state],
    ["Nota", lead.rating.toFixed(1)],
    ["Avaliações", String(lead.reviews)],
    ["Telefone", lead.phone],
    ["Website", lead.website ?? "Sem site"],
    ["Instagram", lead.instagram ?? "Não informado"],
  ];

  return (
    <Dialog open={!!lead} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] gap-0 overflow-hidden sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Preparar projeto do site</DialogTitle>
          <DialogDescription>
            Dados de demonstração da empresa e prompt estruturado pronto para uso.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="-mx-6 max-h-[60vh] px-6">
          <dl className="grid grid-cols-2 gap-3 border-b border-border py-4 sm:grid-cols-3">
            {fields.map(([k, v]) => (
              <div key={k} className="min-w-0">
                <dt className="text-xs text-muted-foreground">{k}</dt>
                <dd className="truncate text-sm font-medium text-foreground">{v}</dd>
              </div>
            ))}
          </dl>

          <h3 className="pt-4 text-sm font-semibold text-foreground">Prompt para criação do site</h3>
          <pre className="mt-2 mb-4 max-h-72 overflow-auto rounded-md border border-border bg-muted/40 p-3 text-xs leading-relaxed whitespace-pre-wrap text-foreground">
            {prompt}
          </pre>
        </ScrollArea>

        <DialogFooter className="border-t border-border pt-4">
          <Button
            onClick={() => {
              copyText(prompt, "Prompt copiado.");
              logHistory(lead.id, "Prompt de site gerado");
            }}
          >
            <Copy className="size-4" aria-hidden />
            Copiar prompt
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
