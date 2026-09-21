import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Copy, MessageCircle, Play, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { buildMessages } from "@/features/prospector/generators";
import { formatPhone, ratingLabel, whatsappLink } from "@/features/prospector/format";
import { useProspector } from "@/features/prospector/store";
import { EmptyState, PageHeader, ScorePill, SiteBadge, SourceNotice, copyText } from "@/features/prospector/ui";

const STYLES = [
  { value: "curta", label: "Curta" },
  { value: "natural", label: "Natural" },
  { value: "comercial", label: "Comercial" },
  { value: "curiosidade", label: "Desperta curiosidade" },
] as const;

type Style = (typeof STYLES)[number]["value"];

export const Route = createFileRoute("/trabalhar-leads")({
  head: () => ({
    meta: [
      { title: "Trabalhar leads salvos | Prospector B2B" },
      {
        name: "description",
        content:
          "Selecione seus leads salvos e percorra um por vez, com mensagem personalizada e WhatsApp aberto manualmente.",
      },
      { property: "og:title", content: "Trabalhar leads salvos | Prospector B2B" },
      {
        property: "og:description",
        content: "Fluxo guiado para trabalhar os leads salvos que você escolher, um a um.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: WorkSavedLeads,
});

function WorkSavedLeads() {
  const { leads, profile, openLead } = useProspector();
  const [picked, setPicked] = useState<Record<string, boolean>>({});
  const [running, setRunning] = useState(false);
  const [index, setIndex] = useState(0);
  const [style, setStyle] = useState<Style>("natural");
  const [edits, setEdits] = useState<Record<string, string>>({});

  const queue = useMemo(() => leads.filter((l) => picked[l.id]), [leads, picked]);
  const selectedCount = queue.length;
  const current = queue[index];

  const toggle = (id: string) => setPicked((p) => ({ ...p, [id]: !p[id] }));
  const setAll = (value: boolean) =>
    setPicked(value ? Object.fromEntries(leads.map((l) => [l.id, true])) : {});

  if (leads.length === 0) {
    return (
      <div className="space-y-5">
        <PageHeader title="Trabalhar leads salvos" subtitle="Escolha os leads salvos e atenda um por vez." />
        <EmptyState
          title="Nenhum lead salvo"
          description="Salve empresas na prospecção para trabalhá-las aqui."
          action={
            <Button asChild>
              <Link to="/prospeccao">Buscar empresas</Link>
            </Button>
          }
        />
      </div>
    );
  }

  if (!running || !current) {
    return (
      <div className="space-y-5">
        <PageHeader
          title="Trabalhar leads salvos"
          subtitle="Marque os leads que quer trabalhar agora e inicie o fluxo, um por vez."
          actions={
            <>
              <Button variant="outline" className="h-11 sm:h-9" onClick={() => setAll(true)}>
                Marcar todos
              </Button>
              <Button variant="outline" className="h-11 sm:h-9" onClick={() => setAll(false)}>
                Limpar
              </Button>
              <Button
                className="h-11 sm:h-9"
                disabled={selectedCount === 0}
                onClick={() => {
                  setIndex(0);
                  setRunning(true);
                }}
              >
                <Play className="size-4" aria-hidden />
                Iniciar ({selectedCount})
              </Button>
            </>
          }
        />

        <Card className="gap-0 divide-y divide-border p-0">
          {leads.map((l) => (
            <label key={l.id} className="flex cursor-pointer items-start gap-3 px-4 py-3">
              <Checkbox
                checked={!!picked[l.id]}
                onCheckedChange={() => toggle(l.id)}
                aria-label={`Selecionar ${l.name}`}
                className="mt-0.5"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-foreground">{l.name}</span>
                <span className="block truncate text-xs text-muted-foreground">
                  {l.category}
                  {l.city ? ` · ${l.city}` : ""}
                  {l.state ? ` - ${l.state}` : ""}
                  {l.phone ? ` · ${formatPhone(l.phone)}` : ""}
                </span>
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <SiteBadge business={l} />
                <ScorePill score={l.score} />
              </span>
            </label>
          ))}
        </Card>

        <SourceNotice />
      </div>
    );
  }

  const generated = buildMessages(current, profile)[style];
  const text = edits[current.id] ?? generated;
  const wa = whatsappLink(current.phone);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Trabalhar leads salvos"
        subtitle={`${index + 1} de ${selectedCount} leads selecionados.`}
        actions={
          <Button
            variant="outline"
            className="h-11 sm:h-9"
            onClick={() => {
              setRunning(false);
              setIndex(0);
            }}
          >
            <RotateCcw className="size-4" aria-hidden />
            Voltar à seleção
          </Button>
        }
      />

      <Progress value={((index + 1) / selectedCount) * 100} className="h-2" />

      <Card className="gap-4 p-5">
        <div>
          <p className="text-xs font-medium text-muted-foreground">
            {index + 1} de {selectedCount}
          </p>
          <h2 className="mt-1 text-xl font-bold text-foreground">{current.name}</h2>
          <p className="text-sm text-muted-foreground">
            {current.category}
            {current.city ? ` · ${current.city}` : ""}
            {current.state ? ` - ${current.state}` : ""}
          </p>
          <p className="mt-1 text-sm text-muted-foreground">{ratingLabel(current)}</p>
          <p className="text-sm font-medium text-foreground">{formatPhone(current.phone)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <SiteBadge business={current} />
            <ScorePill score={current.score} />
          </div>
        </div>

        <div className="space-y-2">
          <Select value={style} onValueChange={(v) => setStyle(v as Style)}>
            <SelectTrigger className="h-11 sm:h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STYLES.map((s) => (
                <SelectItem key={s.value} value={s.value}>
                  {s.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Textarea
            value={text}
            rows={7}
            onChange={(e) => setEdits((prev) => ({ ...prev, [current.id]: e.target.value }))}
            aria-label="Mensagem personalizada deste lead"
          />
          <div className="grid gap-2 sm:grid-cols-2">
            <Button variant="outline" className="h-11" onClick={() => void copyText(text, "Mensagem copiada.")}>
              <Copy className="size-4" aria-hidden />
              Copiar mensagem
            </Button>
            {wa ? (
              <Button
                className="h-11"
                onClick={() =>
                  window.open(`${wa}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer")
                }
              >
                <MessageCircle className="size-4" aria-hidden />
                Abrir WhatsApp
              </Button>
            ) : (
              <Button className="h-11" variant="secondary" onClick={() => toast.info("Telefone não disponível.")}>
                <MessageCircle className="size-4" aria-hidden />
                Abrir WhatsApp
              </Button>
            )}
          </div>
        </div>

        <Button variant="ghost" className="h-11" onClick={() => openLead(current.id)}>
          Ver detalhes do lead
        </Button>

        <div className="grid gap-2 sm:grid-cols-2">
          <Button
            variant="outline"
            className="h-12"
            disabled={index === 0}
            onClick={() => setIndex((i) => Math.max(i - 1, 0))}
          >
            <ArrowLeft className="size-5" aria-hidden />
            Anterior
          </Button>
          <Button
            className="h-12"
            disabled={index >= selectedCount - 1}
            onClick={() => setIndex((i) => Math.min(i + 1, selectedCount - 1))}
          >
            Próximo
            <ArrowRight className="size-5" aria-hidden />
          </Button>
        </div>
      </Card>

      <SourceNotice />
    </div>
  );
}
