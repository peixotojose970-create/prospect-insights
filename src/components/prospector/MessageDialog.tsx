import { Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { buildMessages } from "@/features/prospector/generators";
import { useProspector } from "@/features/prospector/store";
import { copyText } from "@/features/prospector/ui";
import type { Business } from "@/types";

export function MessageDialog({
  business,
  onOpenChange,
}: {
  business: Business | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { logHistory, isSaved } = useProspector();
  if (!business) return null;
  const messages = buildMessages(business);
  const tabs: [keyof typeof messages, string][] = [
    ["curta", "Curta"],
    ["natural", "Natural"],
    ["comercial", "Comercial"],
  ];

  return (
    <Dialog open={!!business} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Mensagem de abordagem</DialogTitle>
          <DialogDescription>{business.name} — escolha o tom da abordagem.</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="curta">
          <TabsList className="w-full">
            {tabs.map(([key, label]) => (
              <TabsTrigger key={key} value={key} className="flex-1">
                {label}
              </TabsTrigger>
            ))}
          </TabsList>
          {tabs.map(([key]) => (
            <TabsContent key={key} value={key} className="space-y-3">
              <p className="rounded-md border border-border bg-muted/40 p-3 text-sm leading-relaxed whitespace-pre-wrap text-foreground">
                {messages[key]}
              </p>
              <Button
                onClick={() => {
                  copyText(messages[key], "Mensagem copiada.");
                  if (isSaved(business.id)) logHistory(business.id, "Mensagem copiada");
                }}
              >
                <Copy className="size-4" aria-hidden />
                Copiar mensagem
              </Button>
            </TabsContent>
          ))}
        </Tabs>
        <p className="text-xs text-muted-foreground">
          Revise a mensagem antes de enviar: os dados vêm de uma base pública e podem estar incompletos.
        </p>
      </DialogContent>
    </Dialog>
  );
}
