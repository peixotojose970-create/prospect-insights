import { useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Copy,
  Globe,
  MapPin,
  Phone,
  PhoneCall,
  RotateCcw,
  Sparkles,
  XCircle,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { normalizePhone } from "@/features/prospector/format";
import { copyText } from "@/features/prospector/ui";
import { useProspector } from "@/features/prospector/store";
import {
  generateCallScript,
  type CallBranchId,
  type CallNode,
} from "@/features/prospector/callScript";
import type { Business } from "@/types";

export function CallScriptDialog({
  business,
  onOpenChange,
}: {
  business: Business | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { isSaved, saveLead, registerContact, logHistory } = useProspector();
  const [currentNodeId, setCurrentNodeId] = useState<CallBranchId>("abertura");
  const [historyStack, setHistoryStack] = useState<CallBranchId[]>([]);
  const [regenerateKey, setRegenerateKey] = useState(0);

  // Script gerado especificamente para o negócio aberto
  const scriptData = useMemo(() => {
    if (!business) return null;
    return generateCallScript(business);
  }, [business, regenerateKey]);

  if (!business || !scriptData) return null;

  const currentNode: CallNode = scriptData.nodes[currentNodeId] || scriptData.nodes.abertura;
  const digits = normalizePhone(business.phone);

  const ensureSaved = () => {
    if (!isSaved(business.id)) saveLead(business);
  };

  const handleSelectChoice = (target: CallBranchId) => {
    setHistoryStack((prev) => [...prev, currentNodeId]);
    setCurrentNodeId(target);
  };

  const handleBack = () => {
    if (historyStack.length === 0) return;
    const previous = historyStack[historyStack.length - 1];
    setHistoryStack((prev) => prev.slice(0, prev.length - 1));
    setCurrentNodeId(previous);
  };

  const handleNext = () => {
    if (currentNode.choices && currentNode.choices.length > 0) {
      handleSelectChoice(currentNode.choices[0].target);
    }
  };

  const handleRegenerate = () => {
    setRegenerateKey((k) => k + 1);
    setCurrentNodeId("abertura");
    setHistoryStack([]);
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleDial = () => {
    ensureSaved();
    registerContact(business.id, "ligacao", "Ligação guiada por roteiro iniciada pelo app");
    if (digits) {
      window.location.href = `tel:+55${digits}`;
    }
  };

  const handleCopySpeech = () => {
    void copyText(currentNode.speech, "Fala copiada.");
    if (isSaved(business.id)) {
      logHistory(business.id, `Fala copiada (${currentNode.stage})`);
    }
  };

  return (
    <Dialog
      open={!!business}
      onOpenChange={(open) => {
        if (!open) {
          setCurrentNodeId("abertura");
          setHistoryStack([]);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="flex max-h-[94dvh] w-[calc(100vw-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh]">
        {/* Cabeçalho com dados REAIS da empresa */}
        <DialogHeader className="border-b border-border bg-card p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-primary/40 bg-primary/10 text-primary">
                ROTEIRO DE LIGAÇÃO
              </Badge>
              <Badge variant="secondary" className="text-xs font-normal">
                {currentNode.stage}
              </Badge>
            </div>
            {digits ? (
              <Button size="sm" variant="default" className="h-8 gap-1.5 font-medium" onClick={handleDial}>
                <PhoneCall className="size-3.5" aria-hidden />
                Ligar ({business.phone})
              </Button>
            ) : null}
          </div>

          <DialogTitle className="mt-2 text-lg font-bold sm:text-xl">
            {business.name}
          </DialogTitle>

          <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
            {business.category ? (
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Building2 className="size-3.5 shrink-0" />
                {business.category}
              </span>
            ) : null}
            {scriptData.cityState ? (
              <span className="flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0" />
                {scriptData.cityState}
              </span>
            ) : null}
            {business.phone ? (
              <span className="flex items-center gap-1">
                <Phone className="size-3.5 shrink-0" />
                {scriptData.phone}
              </span>
            ) : null}
            <span className="flex items-center gap-1">
              <Globe className="size-3.5 shrink-0" />
              {scriptData.siteStatus}
            </span>
          </DialogDescription>
        </DialogHeader>

        {/* Área central com rolagem e navegação rápida */}
        <ScrollArea className="flex-1 p-4 sm:p-6">
          <div className="space-y-5">
            {/* Bloco visual da fala atual */}
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5 shadow-xs">
              <div className="flex items-center justify-between gap-2 pb-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold tracking-wider text-primary uppercase">
                  <span className="size-2 rounded-full bg-primary animate-pulse" />
                  VOCÊ DIZ:
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 px-2 text-xs"
                  onClick={handleCopySpeech}
                >
                  <Copy className="size-3.5" aria-hidden />
                  Copiar fala
                </Button>
              </div>

              <p className="text-base font-medium leading-relaxed text-foreground sm:text-lg">
                &ldquo;{currentNode.speech}&rdquo;
              </p>

              {currentNode.contextNote ? (
                <p className="mt-3 border-t border-primary/10 pt-2.5 text-xs text-muted-foreground">
                  <strong className="text-foreground/80">Dica de tom:</strong> {currentNode.contextNote}
                </p>
              ) : null}
            </div>

            {/* Possíveis caminhos / respostas da outra pessoa */}
            {currentNode.choices && currentNode.choices.length > 0 ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                    O QUE O CLIENTE / ATENDENTE RESPONDEU? (ESCOLHA O CAMINHO)
                  </p>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  {currentNode.choices.map((choice) => (
                    <Button
                      key={choice.target + choice.label}
                      variant="outline"
                      className="h-auto min-h-12 justify-between border-border bg-card p-3 text-left whitespace-normal hover:border-primary/50 hover:bg-muted"
                      onClick={() => handleSelectChoice(choice.target)}
                    >
                      <span className="text-xs font-semibold text-foreground">→ {choice.label}</span>
                      <ArrowRight className="size-3.5 shrink-0 text-muted-foreground" />
                    </Button>
                  ))}
                </div>
              </div>
            ) : null}

            {/* Guia Rápido de Atalhos (Objeções e Preço sempre à mão durante a ligação) */}
            <div className="rounded-lg border border-border bg-muted/30 p-3.5">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">
                ATALHOS RÁPIDOS DURANTE A LIGAÇÃO:
              </p>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  size="sm"
                  variant={currentNodeId === "preco" ? "default" : "secondary"}
                  className="h-7 text-xs"
                  onClick={() => handleSelectChoice("preco")}
                >
                  Preço (R$300 + R$50)
                </Button>
                <Button
                  size="sm"
                  variant={currentNodeId === "fechamento" ? "default" : "secondary"}
                  className="h-7 text-xs"
                  onClick={() => handleSelectChoice("fechamento")}
                >
                  Fechamento (Demonstração)
                </Button>
                <Button
                  size="sm"
                  variant={currentNodeId === "obj_sem_interesse" ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => handleSelectChoice("obj_sem_interesse")}
                >
                  &ldquo;Não tenho interesse&rdquo;
                </Button>
                <Button
                  size="sm"
                  variant={currentNodeId === "obj_insta_resolve" ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => handleSelectChoice("obj_insta_resolve")}
                >
                  &ldquo;Instagram já resolve&rdquo;
                </Button>
                <Button
                  size="sm"
                  variant={currentNodeId === "obj_whats_resolve" ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => handleSelectChoice("obj_whats_resolve")}
                >
                  &ldquo;WhatsApp já resolve&rdquo;
                </Button>
                <Button
                  size="sm"
                  variant={currentNodeId === "obj_esta_caro" ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => handleSelectChoice("obj_esta_caro")}
                >
                  &ldquo;Está caro&rdquo;
                </Button>
                <Button
                  size="sm"
                  variant={currentNodeId === "obj_preciso_pensar" ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => handleSelectChoice("obj_preciso_pensar")}
                >
                  &ldquo;Preciso pensar&rdquo;
                </Button>
                <Button
                  size="sm"
                  variant={currentNodeId === "obj_falar_socio" ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => handleSelectChoice("obj_falar_socio")}
                >
                  &ldquo;Falar com sócio&rdquo;
                </Button>
                <Button
                  size="sm"
                  variant={currentNodeId === "obj_manda_whats" ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => handleSelectChoice("obj_manda_whats")}
                >
                  &ldquo;Manda no WhatsApp&rdquo;
                </Button>
                <Button
                  size="sm"
                  variant={currentNodeId === "obj_estou_ocupado" ? "default" : "outline"}
                  className="h-7 text-xs"
                  onClick={() => handleSelectChoice("obj_estou_ocupado")}
                >
                  &ldquo;Estou ocupado&rdquo;
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

        {/* Barra inferior de controle da ligação: [COPIAR FALA] [VOLTAR] [PRÓXIMA] [REGENERAR] [ENCERRAR LIGAÇÃO] */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card p-3 sm:p-4">
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1 text-xs"
              onClick={handleBack}
              disabled={historyStack.length === 0}
            >
              <ArrowLeft className="size-3.5" aria-hidden />
              Voltar
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1 text-xs"
              onClick={handleNext}
              disabled={!currentNode.choices || currentNode.choices.length === 0}
            >
              Próxima
              <ArrowRight className="size-3.5" aria-hidden />
            </Button>
            <Button
              size="sm"
              variant="outline"
              className="h-9 gap-1 text-xs"
              onClick={handleCopySpeech}
            >
              <Copy className="size-3.5" aria-hidden />
              Copiar fala
            </Button>
            <Button
              size="sm"
              variant="ghost"
              className="h-9 gap-1 text-xs text-muted-foreground"
              onClick={handleRegenerate}
              title="Reiniciar roteiro do início"
            >
              <RotateCcw className="size-3.5" aria-hidden />
              Regenerar
            </Button>
          </div>

          <Button
            size="sm"
            variant="destructive"
            className="h-9 gap-1 text-xs font-semibold"
            onClick={handleClose}
          >
            <XCircle className="size-3.5" aria-hidden />
            Encerrar ligação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
