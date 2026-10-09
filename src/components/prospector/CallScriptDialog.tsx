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
  AlertTriangle,
  HelpCircle,
  Sparkles,
} from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
            Não foi possível gerar o roteiro agora.
          </h3>
          <p className="max-w-md text-xs text-muted-foreground">
            Ocorreu uma instabilidade ao montar o roteiro deste estabelecimento. Clique no botão abaixo para tentar novamente.
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="default"
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

const STAGES_LIST: { id: CallStageId; title: string; short: string }[] = [
  { id: 1, title: "Primeiro contato", short: "1. Primeiro contato" },
  { id: 2, title: "Responsável", short: "2. Responsável" },
  { id: 3, title: "Descoberta", short: "3. Descoberta" },
  { id: 4, title: "Apresentação", short: "4. Apresentação" },
  { id: 5, title: "Objeções", short: "5. Objeções" },
  { id: 6, title: "Preço", short: "6. Preço" },
  { id: 7, title: "Fechamento", short: "7. Fechamento" },
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
  const [generationError, setGenerationError] = useState(false);

  // Geração isolada e segura para o estabelecimento selecionado
  const scriptData: GeneratedCallScript | null = useMemo(() => {
    if (!business) return null;
    try {
      setGenerationError(false);
      return generateCallScript(business);
    } catch (e) {
      console.error("Erro ao gerar roteiro de ligação:", e);
      setGenerationError(true);
      return null;
    }
  }, [business, regenerateKey]);

  if (!business) return null;

  const currentStage: CallStageData =
    scriptData?.stages[currentStageId] ||
    scriptData?.stages[1] || {
      stageId: 1,
      stepNumber: "1",
      title: "1. Primeiro contato",
      shortLabel: "Primeiro contato",
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
    setGenerationError(false);
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
          setGenerationError(false);
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="flex h-[100dvh] max-h-[100dvh] w-full max-w-3xl flex-col gap-0 overflow-hidden rounded-none p-0 sm:h-[88dvh] sm:max-h-[88dvh] sm:w-[calc(100vw-1.5rem)] sm:rounded-lg">
        <CallScriptErrorBoundary onReset={handleRegenerate}>
          {generationError || !scriptData ? (
            <div className="flex flex-col items-center justify-center p-8 text-center space-y-4">
              <div className="rounded-full bg-destructive/10 p-3 text-destructive">
                <AlertTriangle className="size-6" />
              </div>
              <h3 className="text-base font-semibold text-foreground">
                Não foi possível gerar o roteiro agora.
              </h3>
              <p className="max-w-md text-xs text-muted-foreground">
                Não foi possível carregar as informações do roteiro para esta empresa. Clique para tentar novamente.
              </p>
              <Button size="sm" onClick={handleRegenerate}>
                <RotateCcw className="mr-1.5 size-3.5" />
                Tentar novamente
              </Button>
            </div>
          ) : (
            <>
              {/* TOPO: Roteiro de ligação + Dados do estabelecimento */}
              <DialogHeader className="shrink-0 border-b border-border bg-card p-4 sm:p-5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <DialogTitle className="text-base font-bold tracking-tight text-foreground sm:text-lg">
                      Roteiro de ligação
                    </DialogTitle>
                    <Badge variant="outline" className="border-primary/40 bg-primary/10 text-xs font-semibold text-primary">
                      NEXORA
                    </Badge>
                  </div>
                  {digits ? (
                    <Button size="sm" className="h-8 gap-1.5 text-xs font-medium" onClick={handleDial}>
                      <PhoneCall className="size-3.5" aria-hidden />
                      Ligar ({business.phone})
                    </Button>
                  ) : null}
                </div>

                {/* Dados da empresa no topo */}
                <div className="mt-2 rounded-lg border border-border/70 bg-muted/30 p-3">
                  <div className="flex flex-wrap items-baseline justify-between gap-1">
                    <span className="text-sm font-bold text-foreground sm:text-base">
                      {scriptData.companyName}
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-wider text-primary">
                      ETAPA {currentStageId} DE 7
                    </span>
                  </div>

                  <DialogDescription className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs text-muted-foreground sm:grid-cols-4">
                    <span className="inline-flex items-center gap-1.5">
                      <Building2 className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="font-medium text-foreground">Categoria:</span>{" "}
                      <span className="truncate">{scriptData.category}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <MapPin className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="font-medium text-foreground">Cidade:</span>{" "}
                      <span className="truncate">{scriptData.city}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Phone className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="font-medium text-foreground">Telefone:</span>{" "}
                      <span className="truncate">{scriptData.phone}</span>
                    </span>

                    <span className="inline-flex items-center gap-1.5">
                      <Globe className="size-3.5 shrink-0 text-muted-foreground" />
                      <span className="font-medium text-foreground">Site:</span>{" "}
                      <span className="truncate">{scriptData.siteStatus}</span>
                    </span>
                  </DialogDescription>
                </div>
              </DialogHeader>

              {/* INDICADOR VISUAL DE PROGRESSO: 1 → 2 → 3 → 4 → 5 → 6 → 7 */}
              <div className="shrink-0 border-b border-border bg-muted/40 px-3 py-2 sm:px-4">
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
                          title={st.short}
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
                          <span className="hidden md:inline whitespace-nowrap">{st.title}</span>
                        </button>
                        {idx < STAGES_LIST.length - 1 && (
                          <span className="mx-1 text-xs text-muted-foreground/60 select-none">→</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ÁREA CENTRAL: UMA ETAPA POR VEZ, DIRETO AO PONTO */}
              <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-6 pb-8">
                <div className="space-y-4">
                  {/* Título da etapa */}
                  <div className="flex items-center justify-between border-b border-border/60 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="grid size-6 place-items-center rounded bg-primary/10 text-xs font-bold text-primary">
                        {currentStage.stageId}
                      </span>
                      <h2 className="text-sm font-bold tracking-tight text-foreground sm:text-base">
                        {currentStage.title}
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

                  {/* FALA PRINCIPAL: O QUE VOCÊ FALA AGORA */}
                  <div className="rounded-xl border-2 border-primary/30 bg-primary/5 p-4 sm:p-5 shadow-xs">
                    <div className="flex items-center justify-between pb-2">
                      <span className="inline-flex items-center gap-1.5 text-[11px] font-bold tracking-wider text-primary uppercase">
                        <Volume2 className="size-3.5 text-primary" />
                        VOCÊ:
                      </span>
                      <span className="text-[11px] text-muted-foreground">O que você fala agora</span>
                    </div>

                    <div className="whitespace-pre-line text-base font-semibold leading-relaxed text-foreground sm:text-lg">
                      &ldquo;{currentStage.mainSpeech}&rdquo;
                    </div>

                    {currentStage.contextTip ? (
                      <p className="mt-3 border-t border-primary/15 pt-2 text-xs text-muted-foreground">
                        <strong className="text-foreground/90">Dica:</strong> {currentStage.contextTip}
                      </p>
                    ) : null}
                  </div>

                  {/* SUBSEÇÕES ADICIONAIS (ex: caminhos SE SIM / SE NÃO na Etapa 2 ou alternativas de fechamento) */}
                  {currentStage.subSections && currentStage.subSections.length > 0 ? (
                    <div className="grid gap-2.5 sm:grid-cols-2">
                      {currentStage.subSections.map((sub, sIdx) => (
                        <div key={sIdx} className="rounded-lg border border-border bg-card p-3 shadow-2xs">
                          <div className="flex items-center justify-between pb-1">
                            <span className="text-[11px] font-bold tracking-wide text-primary">
                              {sub.label}
                            </span>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="size-6 p-0 text-muted-foreground hover:text-foreground"
                              title="Copiar fala"
                              onClick={() => handleCopySpeech(sub.speech, sub.label)}
                            >
                              <Copy className="size-3" />
                            </Button>
                          </div>
                          <p className="text-xs font-medium leading-relaxed text-foreground sm:text-sm">
                            <span className="font-semibold text-primary">VOCÊ:</span> &ldquo;{sub.speech}&rdquo;
                          </p>
                          {sub.note ? (
                            <p className="mt-1 text-[11px] text-muted-foreground">{sub.note}</p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {/* RESPOSTAS DO CLIENTE / ÁRVORE DE DIÁLOGO */}
                  {currentStage.alternatives && currentStage.alternatives.length > 0 ? (
                    <div className="rounded-lg border border-border bg-card">
                      <button
                        type="button"
                        onClick={() => setShowAlternatives((prev) => !prev)}
                        className="flex w-full items-center justify-between p-3 text-left transition-colors hover:bg-muted/40"
                      >
                        <div className="flex items-center gap-2">
                          <MessageSquare className="size-4 text-primary" />
                          <span className="text-xs font-semibold tracking-wide text-foreground">
                            {currentStageId === 5
                              ? `Principais objeções e respostas recomendadas (${currentStage.alternatives.length})`
                              : `Possíveis respostas do cliente (${currentStage.alternatives.length})`}
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
                              className="rounded-md bg-muted/30 p-3 transition-colors hover:bg-muted/60"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-1 pb-1.5">
                                <span className="text-xs font-bold text-foreground">
                                  CLIENTE: <span className="font-medium text-foreground/80">{alt.customerSays}</span>
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

                              {alt.nextQuestion ? (
                                <div className="mt-2 rounded bg-background/80 p-2 text-xs border border-border/50">
                                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                    PRÓXIMA PERGUNTA:
                                  </span>{" "}
                                  <span className="italic text-foreground/90">&ldquo;{alt.nextQuestion}&rdquo;</span>
                                </div>
                              ) : null}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : null}

                  {/* ATALHOS RÁPIDOS PARA NAVEGAÇÃO DIRETA */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2">
                    <span className="text-[11px] font-semibold text-muted-foreground">Ir direto:</span>
                    <Button
                      size="sm"
                      variant={currentStageId === 3 ? "default" : "outline"}
                      className="h-6 text-[11px]"
                      onClick={() => goToStage(3)}
                    >
                      3. Descoberta
                    </Button>
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
                      6. Preço
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
              </div>

              {/* BARRA INFERIOR COM OS CONTROLES EXIGIDOS: [VOLTAR] [PRÓXIMA ETAPA] [COPIAR FALA] [REGENERAR] [FECHAR] */}
              <div className="shrink-0 flex flex-wrap items-center justify-between gap-2 border-t border-border bg-card p-3 sm:p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1 text-xs"
                    onClick={handleBack}
                    disabled={currentStageId === 1 && historyStack.length === 0}
                  >
                    <ArrowLeft className="size-3.5" aria-hidden />
                    Voltar
                  </Button>

                  <Button
                    size="sm"
                    variant="default"
                    className="h-9 gap-1 text-xs font-semibold"
                    onClick={handleNext}
                    disabled={currentStageId === 7}
                  >
                    Próxima etapa
                    <ArrowRight className="size-3.5" aria-hidden />
                  </Button>

                  <Button
                    size="sm"
                    variant="outline"
                    className="h-9 gap-1 text-xs"
                    onClick={() => handleCopySpeech(currentStage.mainSpeech, currentStage.title)}
                  >
                    <Copy className="size-3.5" aria-hidden />
                    Copiar fala
                  </Button>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-9 gap-1 text-xs text-muted-foreground hover:text-foreground"
                    onClick={handleRegenerate}
                    title="Regenerar roteiro"
                  >
                    <RotateCcw className="size-3.5" aria-hidden />
                    Regenerar
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
            </>
          )}
        </CallScriptErrorBoundary>
      </DialogContent>
    </Dialog>
  );
}
