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
import { NAO_DISPONIVEL_FONTE, formatPhone, orNotInformed } from "@/features/prospector/format";
import { useProspector } from "@/features/prospector/store";
import { copyText } from "@/features/prospector/ui";
import type { Business } from "@/types";

export function CreateSiteDialog({
  business,
  onOpenChange,
}: {
  business: Business | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { logHistory, isSaved, profile } = useProspector();
  if (!business) return null;
  const prompt = buildSitePrompt(business, profile);

  const fields: [string, string][] = [
    ["Nome", business.name],
    ["Categoria", business.category],
    ["Cidade", orNotInformed(business.city)],
    ["Estado", orNotInformed(business.state)],
    ["Avaliações", NAO_DISPONIVEL_FONTE],
    ["Telefone", formatPhone(business.phone)],
    ["Website", business.website ?? "Sem site informado na fonte"],
    ["Instagram", business.instagram ?? "Não informado"],
    ["Horário", business.openingHours ?? "Não informado"],
  ];

  return (
    <Dialog open={!!business} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] gap-0 overflow-hidden p-4 sm:w-full sm:max-w-3xl sm:p-6">
        <DialogHeader>
          <DialogTitle>Preparar projeto do site</DialogTitle>
          <DialogDescription>
            Dados públicos encontrados no Google Maps e prompt estruturado pronto para uso.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="-mx-4 max-h-[58dvh] px-4 sm:-mx-6 sm:max-h-[60vh] sm:px-6">
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
            className="h-11 w-full sm:h-9 sm:w-auto"
            onClick={() => {
              copyText(prompt, "Prompt copiado.");
              if (isSaved(business.id)) logHistory(business.id, "Prompt de site gerado");
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
