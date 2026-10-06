import React, { Component, useState, useMemo } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  ChevronDown,
  ChevronUp,
  Copy,
  Globe,
  MapPin,
  MessageSquare,
  Phone,
  PhoneCall,
  RotateCcw,
  Volume2,
  X,
  AlertTriangle,
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
  type CallStageId,
  type CallStageData,
  type GeneratedCallScript,
} from "@/features/prospector/callScript";
import type { Business } from "@/types";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  onReset?: () => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CallScriptErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("CallScriptDialog error caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="rounded-full bg-destructive/10 p-3 text-destructive">
            <AlertTriangle className="size-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">
            Não foi possível carregar o roteiro deste estabelecimento
          </h3>
          <p className="max-w-md text-xs text-muted-foreground">
            Ocorreu um erro ao montar o roteiro da ligação. Você pode tentar reiniciar o gerador ou fechar o modal.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                this.setState({ hasError: false, error: null });
                if (this.props.onReset) this.props.onReset();
              }}
            >
              <RotateCcw className="mr-1.5 size-3.5" />
              Tentar novamente
            </Button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const STAGES_LIST: { id: CallStageId; label: string }[] = [
  { id: 1, label: "PRIMEIRO CONTATO" },
  { id: 2, label: "RESPONSÁVEL" },
  { id: 3, label: "DESCOBERTA" },
  { id: 4, label: "APRESENTAÇÃO" },
  { id: 5, label: "OBJEÇÕES" },
  { id: 6, label: "PREÇO" },
  { id: 7, label: "FECHAMENTO" },
];

export function CallScriptDialog({
  business,
  onOpenChange,
}: {
  business: Business | null;
  onOpenChange: (open: boolean) => void;
}) {
  const { isSaved, saveLead, registerContact, logHistory } = useProspector();
  const [currentStageId, setCurrentStageId] = useState<CallStageId>(1);
  const [historyStack, setHistoryStack] = useState<CallStageId[]>([]);
  const [showAlternatives, setShowAlternatives] = useState<boolean>(true);
  const [regenerateKey, setRegenerateKey] = useState(0);

  // Geração 100% isolada e segura para o estabelecimento selecionado
  const scriptData: GeneratedCallScript | null = useMemo(() => {
    if (!business) return null;
    try {
      return generateCallScript(business);
    } catch (e) {
      console.error("Erro ao gerar roteiro de ligação:", e);
      return null;
    }
  }, [business, regenerateKey]);

  if (!business) return null;

  const currentStage: CallStageData =
    scriptData?.stages[currentStageId] ||
    scriptData?.stages[1] || {
      stageId: 1,
      stepNumber: "1",
      title: "PRIMEIRO CONTATO",
      mainSpeaker: "VOCÊ",
      mainSpeech: `Boa tarde, é da ${business.name || "empresa"}?`,
      alternatives: [],
    };

  const digits = normalizePhone(business.phone);

  const goToStage = (target: CallStageId) => {
    if (target < 1 || target > 7) return;
    setHistoryStack((prev) => [...prev, currentStageId]);
    setCurrentStageId(target);
  };

  const handleBack = () => {
    if (historyStack.length > 0) {
      const prev = historyStack[historyStack.length - 1];
      setHistoryStack((s) => s.slice(0, -1));
      if (prev) setCurrentStageId(prev);
    } else if (currentStageId > 1) {
      setCurrentStageId((s) => (s - 1) as CallStageId);
    }
  };

  const handleNext = () => {
    if (currentStageId < 7) {
      goToStage((currentStageId + 1) as CallStageId);
    }
  };

  const handleCopySpeech = (speechText: string, stageTitle: string) => {
    void copyText(speechText, "Fala copiada com sucesso.");
    if (business && isSaved(business.id)) {
      logHistory(business.id, `Roteiro: fala copiada (${stageTitle})`);
    }
  };

  const handleDial = () => {
    if (!isSaved(business.id)) saveLead(business);
    registerContact(business.id, "ligacao", "Ligação guiada pelo Roteiro da Nexora");
    if (digits) {
      window.location.href = `tel:+55${digits}`;
    }
  };

  const handleRegenerate = () => {
    setRegenerateKey((k) => k + 1);
    setCurrentStageId(1);
    setHistoryStack([]);
  };

  return (
    <Dialog
      open={!!business}
      onOpenChange={(open) => {
        if (!open) {
          setCurrentStageId(1);
          setHistoryStack([]);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="flex max-h-[95dvh] w-[calc(100vw-1.5rem)] max-w-3xl flex-col gap-0 overflow-hidden p-0 sm:max-h-[90dvh]">
        <CallScriptErrorBoundary onReset={handleRegenerate}>
          {/* TOPO: Cabeçalho com Nome da Empresa e Dados Principais */}
          <DialogHeader className="border-b border-border bg-card p-4 sm:p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/40 bg-primary/10 text-xs font-semibold text-primary">
                  GERAR LIGAÇÃO
                </Badge>
                <span className="text-xs text-muted-foreground">
                  Etapa {currentStage.stepNumber} de 7
                </span>
              </div>
              {digits ? (
                <Button size="sm" className="h-8 gap-1.5 text-xs font-medium" onClick={handleDial}>
                  <PhoneCall className="size-3.5" aria-hidden />
                  Ligar ({business.phone})
                </Button>
              ) : null}
            </div>

            <div className="mt-2 text-left">
              <span className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
                Empresa selecionada:
              </span>
              <DialogTitle className="text-lg font-bold text-foreground sm:text-xl">
                {scriptData?.companyName || business.name || "Não informado"}
              </DialogTitle>
            </div>

            {/* Metadados pequenos do estabelecimento */}
            <DialogDescription className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="font-medium text-foreground">Categoria:</span>{" "}
                {scriptData?.category || business.category || "Não informado"}
              </span>

              <span className="inline-flex items-center gap-1">
                <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="font-medium text-foreground">Cidade:</span>{" "}
                {scriptData?.city || "Não informado"}
              </span>

              <span className="inline-flex items-center gap-1">
                <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="font-medium text-foreground">Telefone:</span>{" "}
                {scriptData?.phone || "Não informado"}
              </span>

              <span className="inline-flex items-center gap-1">
                <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="font-medium text-foreground">Site:</span>{" "}
                {scriptData?.siteStatus || "Não encontrado"}
              </span>
            </DialogDescription>
          </DialogHeader>

          {/* INDICADOR DE PROGRESSO: 1 → 2 → 3 → 4 → 5 → 6 → 7 */}
          <div className="border-b border-border bg-muted/40 px-3 py-2 sm:px-4">
            <div className="flex items-center justify-between gap-1 overflow-x-auto no-scrollbar py-0.5">
              {STAGES_LIST.map((st, idx) => {
                const isActive = st.id === currentStageId;
                const isPassed = st.id < currentStageId;
                return (
                  <div key={st.id} className="flex items-center shrink-0">
                    <button
                      type="button"
                      onClick={() => goToStage(st.id)}
                      className={`flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium transition-colors ${
                        isActive
                          ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                          : isPassed
                            ? "bg-muted text-foreground hover:bg-muted/80"
                            : "text-muted-foreground hover:text-foreground"
                      }`}
                      title={`${st.id}. ${st.label}`}
                    >
                      <span
                        className={`grid size-4 place-items-center rounded-full text-[10px] font-bold ${
                          isActive
                            ? "bg-primary-foreground text-primary"
                            : isPassed
                              ? "bg-foreground/20 text-foreground"
                              : "bg-muted-foreground/20 text-muted-foreground"
                        }`}
                      >
                        {st.id}
                      </span>
                      <span className="hidden md:inline whitespace-nowrap">{st.label}</span>
                    </button>
                    {idx < STAGES_LIST.length - 1 && (
                      <span className="mx-1 text-xs text-muted-foreground/60 select-none">→</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* ÁREA CENTRAL DO ROTEIRO: RÁPIDO PARA OLHAR DURANTE A LIGAÇÃO */}
          <ScrollArea className="flex-1 p-4 sm:p-6">
            <div className="space-y-4">
              {/* TÍTULO DA ETAPA ATUAL */}
              <div className="flex items-center justify-between border-b border-border/60 pb-2">
                <div className="flex items-center gap-2">
                  <span className="grid size-6 place-items-center rounded bg-primary/10 text-xs font-bold text-primary">
                    {currentStage.stageId}
                  </span>
                  <h2 className="text-sm font-bold tracking-tight text-foreground uppercase sm:text-base">
                    {currentStage.stageId}. {currentStage.title}
                  </h2>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 gap-1 px-2.5 text-xs"
                  onClick={() => handleCopySpeech(currentStage.mainSpeech, currentStage.title)}
                >
                  <Copy className="size-3.5" aria-hidden />
                  Copiar fala
                </Button>
              </div>

              {/* FALA PRINCIPAL: DESTAQUE MÁXIMO E LIMPO */}
              <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 sm:p-5 shadow-xs">
                <div className="flex items-center justify-between pb-2">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-primary uppercase">
                    <Volume2 className="size-3.5 animate-pulse" />
                    VOCÊ DIZ:
                  </span>
                  <span className="text-[11px] text-muted-foreground">Leitura rápida</span>
                </div>

                <div className="whitespace-pre-line text-base font-medium leading-relaxed text-foreground sm:text-lg">
                  &ldquo;{currentStage.mainSpeech}&rdquo;
                </div>

                {currentStage.contextTip ? (
                  <p className="mt-3 border-t border-primary/15 pt-2 text-xs text-muted-foreground">
                    <strong className="text-foreground/90">Dica:</strong> {currentStage.contextTip}
                  </p>
                ) : null}
              </div>

              {/* RESPOSTAS DO CLIENTE / ÁRVORE DE CONVERSA */}
              {currentStage.alternatives && currentStage.alternatives.length > 0 ? (
                <div className="rounded-lg border border-border bg-card">
                  <button
                    type="button"
                    onClick={() => setShowAlternatives((prev) => !prev)}
                    className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-muted/40"
                  >
                    <div className="flex items-center gap-2">
                      <MessageSquare className="size-4 text-primary" />
                      <span className="text-xs font-semibold tracking-wide text-foreground uppercase">
                        Possíveis respostas do cliente ({currentStage.alternatives.length})
                      </span>
                    </div>
                    {showAlternatives ? (
                      <ChevronUp className="size-4 text-muted-foreground" />
                    ) : (
                      <ChevronDown className="size-4 text-muted-foreground" />
                    )}
                  </button>

                  {showAlternatives && (
                    <div className="divide-y divide-border/60 border-t border-border p-2 sm:p-3 space-y-2">
                      {currentStage.alternatives.map((alt, index) => (
                        <div
                          key={index}
                          className="rounded-md bg-muted/30 p-2.5 transition-colors hover:bg-muted/60"
                        >
                          <div className="flex flex-wrap items-center justify-between gap-1 pb-1">
                            <span className="text-xs font-semibold text-foreground">
                              CLIENTE: <span className="font-normal text-muted-foreground">{alt.customerSays}</span>
                            </span>
                            {alt.nextStage ? (
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 gap-1 px-1.5 text-[11px] text-primary hover:text-primary"
                                onClick={() => goToStage(alt.nextStage!)}
                              >
                                Ir para etapa {alt.nextStage}
                                <ArrowRight className="size-3" />
                              </Button>
                            ) : null}
                          </div>

                          <div className="flex items-start justify-between gap-2 mt-1">
                            <p className="text-xs leading-relaxed text-foreground/90 sm:text-sm">
                              <span className="font-semibold text-primary">VOCÊ:</span> &ldquo;{alt.recommendedReply}&rdquo;
                            </p>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-7 shrink-0 p-0 text-muted-foreground hover:text-foreground"
                              title="Copiar resposta"
                              onClick={() => handleCopySpeech(alt.recommendedReply, `${currentStage.title} - Resposta`)}
                            >
                              <Copy className="size-3" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : null}

              {/* ATALHOS RÁPIDOS PARA OBJEÇÕES OU PREÇO */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-semibold text-muted-foreground">Ir direto:</span>
                <Button
                  size="sm"
                  variant={currentStageId === 5 ? "default" : "outline"}
                  className="h-6 text-[11px]"
                  onClick={() => goToStage(5)}
                >
                  5. Objeções
                </Button>
                <Button
                  size="sm"
                  variant={currentStageId === 6 ? "default" : "outline"}
                  className="h-6 text-[11px]"
                  onClick={() => goToStage(6)}
                >
                  6. Preço (R$300 + R$50)
                </Button>
                <Button
                  size="sm"
                  variant={currentStageId === 7 ? "default" : "outline"}
                  className="h-6 text-[11px]"
                  onClick={() => goToStage(7)}
                >
                  7. Fechamento
                </Button>
              </div>
            </div>
          </ScrollArea>

          {/* BARRA INFERIOR COM OS CONTROLES EXIGIDOS: [VOLTAR] [PRÓXIMA ETAPA] [COPIAR FALA] */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card p-3 sm:p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1 text-xs"
                onClick={handleBack}
                disabled={currentStageId === 1 && historyStack.length === 0}
              >
                <ArrowLeft className="size-3.5" aria-hidden />
                VOLTAR
              </Button>

              <Button
                size="sm"
                variant="default"
                className="h-9 gap-1 text-xs font-semibold"
                onClick={handleNext}
                disabled={currentStageId === 7}
              >
                PRÓXIMA ETAPA
                <ArrowRight className="size-3.5" aria-hidden />
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="h-9 gap-1 text-xs"
                onClick={() => handleCopySpeech(currentStage.mainSpeech, currentStage.title)}
              >
                <Copy className="size-3.5" aria-hidden />
                COPIAR FALA
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                className="h-9 gap-1 text-xs text-muted-foreground"
                onClick={handleRegenerate}
                title="Reiniciar roteiro do início"
              >
                <RotateCcw className="size-3.5" aria-hidden />
                Reiniciar
              </Button>

              <Button
                size="sm"
                variant="secondary"
                className="h-9 text-xs"
                onClick={() => onOpenChange(false)}
              >
                Fechar
              </Button>
            </div>
          </div>
        </CallScriptErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
