import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { CheckCircle2, Download, Loader2, MessageCircle, Save, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { BulkMessagesDialog } from "@/components/prospector/BulkMessagesDialog";
import { formatPhone, whatsappLink } from "@/features/prospector/format";
import { useProspector, type BatchSaveResult } from "@/features/prospector/store";
import type { Business, LeadStatus } from "@/types";

export function selectionLabel(count: number) {
  return `${count} ${count === 1 ? "selecionada" : "selecionadas"}`;
}

const csvValue = (v: string | number | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;

function exportSelection(selection: Business[]) {
  const header = [
    "empresa",
    "categoria",
    "cidade",
    "estado",
    "telefone",
    "website",
    "instagram",
    "whatsapp",
    "score",
    "status",
  ];
  const rows = selection.map((b) =>
    [
      b.name,
      b.category,
      b.city,
      b.state,
      formatPhone(b.phone),
      b.website,
      b.instagram,
      whatsappLink(b.phone) ?? "",
      b.score,
      "selecionada",
    ]
      .map(csvValue)
      .join(","),
  );
  const csv = [header.join(","), ...rows].join("\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "selecionadas-prospector.csv";
  a.click();
  URL.revokeObjectURL(url);
  toast.success(`${selection.length} empresas exportadas.`);
}

/** Barra fixa com as ações em lote da seleção. */
export function SelectionBar() {
  const { selection, clearSelection } = useProspector();
  const [listOpen, setListOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [clearOpen, setClearOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);
  const [result, setResult] = useState<BatchSaveResult | null>(null);

  if (selection.length === 0) return null;

  return (
    <>
      <div className="fixed inset-x-0 bottom-16 z-40 px-3 pb-2 lg:bottom-0 lg:px-6 lg:pb-4">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center gap-2 rounded-xl border border-primary/40 bg-card/95 p-3 shadow-lg backdrop-blur">
          <p className="flex items-center gap-2 text-sm font-medium text-foreground">
            <CheckCircle2 className="size-4 text-primary" aria-hidden />
            <span className="hidden sm:inline">{selectionLabel(selection.length)}</span>
            <span className="sm:hidden">{selection.length}</span>
            <span className="hidden text-muted-foreground sm:inline">empresas</span>
          </p>
          <div className="ml-auto flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="h-10" onClick={() => setListOpen(true)}>
              Ver
            </Button>
            <Button size="sm" className="h-10" onClick={() => setMessagesOpen(true)}>
              <MessageCircle className="size-4" aria-hidden />
              Enviar mensagens
            </Button>
            <Button size="sm" variant="outline" className="h-10" onClick={() => setSaveOpen(true)}>
              <Save className="size-4" aria-hidden />
              Salvar {selection.length}
            </Button>
            <Button size="sm" variant="outline" className="h-10" onClick={() => exportSelection(selection)}>
              <Download className="size-4" aria-hidden />
              <span className="hidden sm:inline">Exportar</span>
            </Button>
            <Button size="sm" variant="ghost" className="h-10" onClick={() => setClearOpen(true)}>
              <Trash2 className="size-4" aria-hidden />
              <span className="hidden sm:inline">Limpar</span>
            </Button>
          </div>
        </div>
      </div>

      <BulkMessagesDialog open={messagesOpen} onOpenChange={setMessagesOpen} />
      <SelectionSheet open={listOpen} onOpenChange={setListOpen} onSave={() => setSaveOpen(true)} />
      <SaveSelectionDialog open={saveOpen} onOpenChange={setSaveOpen} onDone={setResult} />
      <ResultDialog result={result} onOpenChange={() => setResult(null)} />

      <AlertDialog open={clearOpen} onOpenChange={setClearOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover todas as empresas da seleção?</AlertDialogTitle>
            <AlertDialogDescription>
              Isso limpa apenas a seleção temporária. Os leads já salvos continuam no seu CRM.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                clearSelection();
                toast.success("Seleção limpa.");
              }}
            >
              Limpar seleção
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

/** Lista das empresas selecionadas, agrupadas por categoria, com busca e filtros. */
function SelectionSheet({
  open,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onSave: () => void;
}) {
  const { selection, deselectMany } = useProspector();
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("todas");
  const [city, setCity] = useState("todas");
  const [minScore, setMinScore] = useState(0);
  const [onlyNoSite, setOnlyNoSite] = useState(false);
  const [onlyPhone, setOnlyPhone] = useState(false);
  const [marked, setMarked] = useState<string[]>([]);

  const categories = useMemo(
    () => Array.from(new Set(selection.map((b) => b.category))).sort(),
    [selection],
  );
  const cities = useMemo(
    () => Array.from(new Set(selection.map((b) => b.city).filter(Boolean) as string[])).sort(),
    [selection],
  );

  const visible = useMemo(() => {
    const t = term.trim().toLowerCase();
    return selection
      .filter((b) => (t ? `${b.name} ${b.city ?? ""} ${b.category}`.toLowerCase().includes(t) : true))
      .filter((b) => (category === "todas" ? true : b.category === category))
      .filter((b) => (city === "todas" ? true : b.city === city))
      .filter((b) => b.score >= minScore)
      .filter((b) => (onlyNoSite ? !b.website : true))
      .filter((b) => (onlyPhone ? !!b.phone : true));
  }, [selection, term, category, city, minScore, onlyNoSite, onlyPhone]);

  const grouped = useMemo(() => {
    const map = new Map<string, Business[]>();
    for (const b of visible) map.set(b.category, [...(map.get(b.category) ?? []), b]);
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [visible]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-xl">
        <SheetHeader className="border-b border-border p-4">
          <SheetTitle>Empresas selecionadas ({selection.length})</SheetTitle>
        </SheetHeader>

        <div className="space-y-3 border-b border-border p-4">
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Pesquisar na seleção"
            className="h-11"
          />
          <div className="grid gap-2 sm:grid-cols-3">
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Categoria" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as categorias</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={city} onValueChange={setCity}>
              <SelectTrigger className="h-10">
                <SelectValue placeholder="Cidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todas">Todas as cidades</SelectItem>
                {cities.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              type="number"
              min={0}
              max={100}
              value={minScore}
              onChange={(e) => setMinScore(Number(e.target.value) || 0)}
              className="h-10"
              aria-label="Score mínimo"
              placeholder="Score mínimo"
            />
          </div>
          <div className="flex flex-wrap gap-4 text-sm">
            <label className="flex min-h-10 items-center gap-2">
              <Checkbox checked={onlyNoSite} onCheckedChange={(v) => setOnlyNoSite(v === true)} />
              Sem site
            </label>
            <label className="flex min-h-10 items-center gap-2">
              <Checkbox checked={onlyPhone} onCheckedChange={(v) => setOnlyPhone(v === true)} />
              Com telefone
            </label>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {grouped.length === 0 ? (
            <p className="text-sm text-muted-foreground">Nenhuma empresa com esses filtros.</p>
          ) : (
            <div className="space-y-5">
              {grouped.map(([groupName, items]) => (
                <section key={groupName} className="space-y-2">
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {groupName} ({items.length})
                  </h3>
                  <ul className="space-y-2">
                    {items.map((b) => (
                      <li
                        key={b.id}
                        className="flex items-center gap-3 rounded-lg border border-border p-3 text-sm"
                      >
                        <Checkbox
                          checked={marked.includes(b.id)}
                          onCheckedChange={(v) =>
                            setMarked((prev) => (v === true ? [...prev, b.id] : prev.filter((i) => i !== b.id)))
                          }
                          aria-label={`Marcar ${b.name}`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium text-foreground">{b.name}</p>
                          <p className="truncate text-xs text-muted-foreground">
                            {[b.city, b.state].filter(Boolean).join(" - ")}
                            {b.website ? "" : " · sem site"}
                          </p>
                        </div>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-9 shrink-0"
                          aria-label={`Remover ${b.name} da seleção`}
                          onClick={() => deselectMany([b.id])}
                        >
                          <X className="size-4" aria-hidden />
                        </Button>
                      </li>
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2 border-t border-border p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
          {marked.length > 0 ? (
            <Button
              variant="outline"
              className="h-11 flex-1"
              onClick={() => {
                deselectMany(marked);
                setMarked([]);
              }}
            >
              Remover {marked.length} selecionadas
            </Button>
          ) : null}
          <Button className="h-11 flex-1" onClick={onSave} disabled={selection.length === 0}>
            <Save className="size-4" aria-hidden />
            Salvar {selection.length} leads
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Confirmação do salvamento em lote, com tag e status inicial. */
function SaveSelectionDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onDone: (result: BatchSaveResult) => void;
}) {
  const { selection, saveSelected } = useProspector();
  const [tag, setTag] = useState("");
  const [status, setStatus] = useState<LeadStatus>("novo");
  const [saving, setSaving] = useState(false);

  const submit = () => {
    if (saving) return;
    setSaving(true);
    try {
      const result = saveSelected({ tag: tag.trim() || undefined, status });
      onOpenChange(false);
      setTag("");
      onDone(result);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Salvar leads</DialogTitle>
          <DialogDescription>
            {selectionLabel(selection.length)} serão salvas no seu CRM. Empresas já salvas não são duplicadas.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="lote-tag">Tag (opcional)</Label>
            <Input
              id="lote-tag"
              className="h-11"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="Ex.: Campanha Setembro"
            />
          </div>
          <div className="space-y-2">
            <Label>Status inicial</Label>
            <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus)}>
              <SelectTrigger className="h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="novo">Novo</SelectItem>
                <SelectItem value="contatado">Contatado</SelectItem>
                <SelectItem value="interessado">Interessado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button className="h-11" onClick={submit} disabled={saving || selection.length === 0}>
            {saving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
            {saving ? `Salvando ${selection.length} leads…` : `Salvar ${selection.length} leads`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Resumo do lote salvo. */
function ResultDialog({
  result,
  onOpenChange,
}: {
  result: BatchSaveResult | null;
  onOpenChange: (v: boolean) => void;
}) {
  return (
    <Dialog open={!!result} onOpenChange={(v) => !v && onOpenChange(false)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Leads salvos</DialogTitle>
          <DialogDescription>{result?.selected ?? 0} empresas processadas.</DialogDescription>
        </DialogHeader>
        <ul className="space-y-2 text-sm text-foreground">
          <li>✅ {result?.created ?? 0} novos leads</li>
          <li>ℹ️ {result?.duplicates ?? 0} já estavam salvos</li>
          {result && result.failed.length > 0 ? (
            <li className="text-destructive">
              ⚠️ {result.failed.length} falharam: {result.failed.map((f) => f.name).join(", ")} (continuam
              selecionadas para tentar novamente)
            </li>
          ) : null}
        </ul>
        <DialogFooter>
          <Button variant="outline" className="h-11" onClick={() => onOpenChange(false)}>
            Fechar
          </Button>
          <Button className="h-11" asChild>
            <Link to="/leads" onClick={() => onOpenChange(false)}>
              Ver meus leads
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
