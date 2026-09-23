import { useEffect, useMemo, useState } from "react";
import { Check, ChevronLeft, ChevronRight, MessageCircle, Pause, Play, SkipForward } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { formatPhone, whatsappLink } from "@/features/prospector/format";
import { buildMessages, buildSecondMessages } from "@/features/prospector/generators";
import { copyText } from "@/features/prospector/ui";
import { useProspector } from "@/features/prospector/store";
import type { Business } from "@/types";

type Style = "curta" | "natural" | "comercial" | "curiosidade";
type Status = "pendente" | "enviado" | "pulado";

const STYLE_LABELS: Record<Style, string> = {
  curta: "Curta",
  natural: "Natural",
  comercial: "Comercial",
  curiosidade: "Curiosidade",
};

/** Preparação e fila manual de mensagens de WhatsApp para as empresas selecionadas. */
export function BulkMessagesDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { selection, profile } = useProspector();
  const [style, setStyle] = useState<Style>("natural");
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [chosen, setChosen] = useState<string[]>([]);
  const [status, setStatus] = useState<Record<string, Status>>({});
  const [queueOn, setQueueOn] = useState(false);
  const [index, setIndex] = useState(0);

  // Mensagens geradas a partir dos dados reais de cada empresa.
  const generated = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of selection) map[b.id] = buildMessages(b, profile)[style];
    return map;
  }, [selection, profile, style]);
  const seconds = useMemo(() => {
    const map: Record<string, string> = {};
    for (const b of selection) map[b.id] = buildSecondMessages(b, profile)[style];
    return map;
  }, [selection, profile, style]);
  const [secondEdits, setSecondEdits] = useState<Record<string, string>>({});
  const secondFor = (b: Business) => secondEdits[b.id] ?? seconds[b.id] ?? "";
  const SecondBlock = ({ b }: { b: Business }) => (
    <div className="space-y-2 border-t border-border pt-2">
      <p className="text-xs font-semibold text-muted-foreground">2ª mensagem — depois que a pessoa responder</p>
      <Textarea
        value={secondFor(b)}
        onChange={(e) => setSecondEdits((prev) => ({ ...prev, [b.id]: e.target.value }))}
        className="min-h-28 text-sm"
      />
      <Button size="sm" variant="outline" className="h-10" onClick={() => void copyText(secondFor(b), "2ª mensagem copiada.")}>
        Copiar 2ª mensagem
      </Button>
    </div>
  );

  useEffect(() => {
    if (!open) return;
    setTexts({});
    setSecondEdits({});
    setChosen(selection.filter((b) => whatsappLink(b.phone)).map((b) => b.id));
    setStatus({});
    setQueueOn(false);
    setIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, style]);

  const textFor = (b: Business) => texts[b.id] ?? generated[b.id] ?? "";
  const queue = useMemo(() => selection.filter((b) => chosen.includes(b.id)), [selection, chosen]);
  const current = queue[index];
  const done = queue.filter((b) => status[b.id] === "enviado").length;
  const allChosen = selection.length > 0 && chosen.length === selection.length;

  const openWhatsApp = (b: Business) => {
    const base = whatsappLink(b.phone);
    if (!base) {
      toast.error(`${b.name} não tem telefone para WhatsApp.`);
      return;
    }
    window.open(`${base}?text=${encodeURIComponent(textFor(b))}`, "_blank", "noopener,noreferrer");
    setStatus((prev) => ({ ...prev, [b.id]: "enviado" }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] overflow-y-auto p-4 sm:w-full sm:max-w-2xl sm:p-6">
        <DialogHeader>
          <DialogTitle>Enviar mensagens</DialogTitle>
          <DialogDescription>
            {selection.length} empresas selecionadas · {chosen.length} mensagens marcadas. Nada é enviado
            automaticamente: o WhatsApp abre com o texto pronto para você revisar e enviar.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <Label>Tipo de abordagem</Label>
            <Select value={style} onValueChange={(v) => setStyle(v as Style)}>
              <SelectTrigger className="h-11 w-full sm:w-52">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(STYLE_LABELS) as Style[]).map((s) => (
                  <SelectItem key={s} value={s}>
                    {STYLE_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            variant="outline"
            className="h-11"
            onClick={() => setChosen(allChosen ? [] : selection.map((b) => b.id))}
          >
            {allChosen ? "Desmarcar todas" : "Selecionar todas"}
          </Button>
        </div>

        {queueOn && current ? (
          <div className="space-y-3 rounded-lg border border-primary/40 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {index + 1} de {queue.length} — {current.name}
              </p>
              <span className="text-xs text-muted-foreground">
                {done} concluídas · {formatPhone(current.phone)}
              </span>
            </div>
            <Progress value={queue.length ? (done / queue.length) * 100 : 0} />
            <p className="text-xs font-semibold text-muted-foreground">1ª mensagem — abertura</p>
            <Textarea
              value={textFor(current)}
              onChange={(e) => setTexts((prev) => ({ ...prev, [current.id]: e.target.value }))}
              className="min-h-32"
            />
            <div className="grid gap-2 sm:grid-cols-2">
              <Button className="h-11" onClick={() => openWhatsApp(current)}>
                <MessageCircle className="size-4" aria-hidden />
                Enviar no WhatsApp
              </Button>
              <Button
                variant="outline"
                className="h-11"
                onClick={() => {
                  setStatus((prev) => ({ ...prev, [current.id]: prev[current.id] ?? "pulado" }));
                  setIndex((i) => Math.min(i + 1, queue.length - 1));
                }}
                disabled={index >= queue.length - 1}
              >
                <ChevronRight className="size-4" aria-hidden />
                Próxima
              </Button>
              <Button
                variant="ghost"
                className="h-11"
                onClick={() => setIndex((i) => Math.max(0, i - 1))}
                disabled={index === 0}
              >
                <ChevronLeft className="size-4" aria-hidden />
                Anterior
              </Button>
              <Button variant="ghost" className="h-11" onClick={() => setQueueOn(false)}>
                <Pause className="size-4" aria-hidden />
                Pausar fila
              </Button>
            </div>
            {SecondBlock({ b: current })}
          </div>
        ) : null}

        <ul className="space-y-3">
          {selection.map((b) => {
            const st = status[b.id] ?? "pendente";
            const hasWhats = !!whatsappLink(b.phone);
            return (
              <li key={b.id} className="space-y-2 rounded-lg border border-border p-3">
                <div className="flex items-start gap-3">
                  <Checkbox
                    checked={chosen.includes(b.id)}
                    onCheckedChange={(v) =>
                      setChosen((prev) => (v === true ? [...prev, b.id] : prev.filter((i) => i !== b.id)))
                    }
                    aria-label={`Selecionar mensagem de ${b.name}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{b.name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {[b.category, b.city, b.state].filter(Boolean).join(" · ")}
                      {hasWhats ? "" : " · sem telefone"}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full border px-2 py-1 text-xs ${
                      st === "enviado"
                        ? "border-primary/40 text-primary"
                        : st === "pulado"
                          ? "border-border text-muted-foreground"
                          : "border-border text-muted-foreground"
                    }`}
                  >
                    {st === "enviado" ? "aberto" : st}
                  </span>
                </div>
                <p className="text-xs font-semibold text-muted-foreground">1ª mensagem — abertura</p>
                <Textarea
                  value={textFor(b)}
                  onChange={(e) => setTexts((prev) => ({ ...prev, [b.id]: e.target.value }))}
                  className="min-h-28 text-sm"
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" className="h-10" onClick={() => openWhatsApp(b)} disabled={!hasWhats}>
                    <MessageCircle className="size-4" aria-hidden />
                    Abrir WhatsApp
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-10"
                    onClick={() => {
                      void navigator.clipboard.writeText(textFor(b));
                      toast.success("Mensagem copiada.");
                    }}
                  >
                    <Check className="size-4" aria-hidden />
                    Copiar 1ª mensagem
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-10"
                    onClick={() => setStatus((prev) => ({ ...prev, [b.id]: "pulado" }))}
                  >
                    <SkipForward className="size-4" aria-hidden />
                    Pular
                  </Button>
                </div>
                {SecondBlock({ b })}
              </li>
            );
          })}
        </ul>

        <DialogFooter>
          <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button
            className="h-11"
            disabled={chosen.length === 0}
            onClick={() => {
              setIndex(0);
              setQueueOn(true);
            }}
          >
            <Play className="size-4" aria-hidden />
            {queueOn ? `Reiniciar fila (${chosen.length})` : `Iniciar fila (${chosen.length})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
