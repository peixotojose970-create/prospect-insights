import { Copy, MessageCircle, PhoneCall } from "lucide-react";
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
import { normalizePhone, whatsappLabel, whatsappLink } from "@/features/prospector/format";
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
  const { logHistory, isSaved, saveLead, registerContact } = useProspector();
  if (!business) return null;
  const messages = buildMessages(business);
  const wa = whatsappLink(business.phone);
  const digits = normalizePhone(business.phone);
  const tabs: [keyof typeof messages, string][] = [
    ["curta", "Curta"],
    ["natural", "Natural"],
    ["comercial", "Comercial"],
  ];

  const ensureSaved = () => {
    if (!isSaved(business.id)) saveLead(business);
  };

  return (
    <Dialog open={!!business} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Abordar empresa</DialogTitle>
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
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => {
                    copyText(messages[key], "Mensagem copiada.");
                    if (isSaved(business.id)) logHistory(business.id, "Mensagem copiada");
                  }}
                >
                  <Copy className="size-4" aria-hidden />
                  Copiar mensagem
                </Button>
                {wa ? (
                  <Button variant="outline" asChild title={whatsappLabel(business.phone)}>
                    <a
                      href={`${wa}?text=${encodeURIComponent(messages[key])}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => {
                        ensureSaved();
                        registerContact(business.id, "whatsapp", "Mensagem enviada pelo WhatsApp");
                      }}
                    >
                      <MessageCircle className="size-4" aria-hidden />
                      Enviar no WhatsApp
                    </a>
                  </Button>
                ) : null}
                {digits ? (
                  <Button variant="outline" asChild>
                    <a
                      href={`tel:+55${digits}`}
                      onClick={() => {
                        ensureSaved();
                        registerContact(business.id, "ligacao", "Ligação iniciada pelo app");
                      }}
                    >
                      <PhoneCall className="size-4" aria-hidden />
                      Ligar
                    </a>
                  </Button>
                ) : null}
                <Button
                  variant="ghost"
                  onClick={() => {
                    ensureSaved();
                    registerContact(business.id, "outro", "Contato registrado manualmente");
                  }}
                >
                  Registrar contato
                </Button>
              </div>
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
