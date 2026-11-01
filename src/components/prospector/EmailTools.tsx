import { useEffect, useState } from "react";
import { Copy, Download, Mail, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useProspector } from "@/features/prospector/store";
import type { Business } from "@/types";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Campo editável de e-mail, salvo junto com o lead. */
export function EmailField({ business }: { business: Business }) {
  const { emailOf, setEmail } = useProspector();
  const saved = emailOf(business);
  const [value, setValue] = useState(saved);
  useEffect(() => setValue(saved), [saved]);
  const commit = () => {
    const next = value.trim();
    if (next === saved) return;
    if (next && !EMAIL_RE.test(next)) {
      toast.error("E-mail inválido.");
      setValue(saved);
      return;
    }
    setEmail(business, next);
  };
  return (
    <label className="flex items-center gap-2 text-xs text-muted-foreground">
      <Mail className="size-3.5 shrink-0" strokeWidth={1.6} aria-hidden />
      <input
        type="email"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => e.key === "Enter" && (e.currentTarget as HTMLInputElement).blur()}
        placeholder="E-mail"
        aria-label={`E-mail de ${business.name}`}
        className="h-8 min-w-0 flex-1 rounded-full border border-input bg-transparent px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none"
      />
    </label>
  );
}

function csvCell(v: string | null | undefined) {
  const s = (v ?? "").replace(/"/g, '""');
  return `"${s}"`;
}

/** Separa os leads com e-mail (sem repetidos) e conta os ignorados. */
export function collectEmails(items: Business[], emailOf: (b: Business) => string) {
  const seen = new Set<string>();
  const withEmail: { business: Business; email: string }[] = [];
  let ignored = 0;
  for (const b of items) {
    const email = emailOf(b);
    if (!email) {
      ignored += 1;
      continue;
    }
    const key = email.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    withEmail.push({ business: b, email });
  }
  return { withEmail, ignored };
}

function ignoredNote(ignored: number) {
  return ignored ? ` ${ignored} sem e-mail ${ignored === 1 ? "foi ignorado" : "foram ignorados"}.` : "";
}

export function EmailSelectionBar({ items, onClear }: { items: Business[]; onClear: () => void }) {
  const { emailOf } = useProspector();
  if (items.length === 0) return null;
  const copy = async () => {
    const { withEmail, ignored } = collectEmails(items, emailOf);
    if (!withEmail.length) return toast.error(`Nenhum lead selecionado tem e-mail.${ignoredNote(ignored)}`);
    try {
      await navigator.clipboard.writeText(withEmail.map((e) => e.email).join(", "));
      toast.success(`${withEmail.length} e-mails copiados.${ignoredNote(ignored)}`);
    } catch {
      toast.error("Não foi possível copiar neste navegador.");
    }
  };
  const exportCsv = () => {
    const { withEmail, ignored } = collectEmails(items, emailOf);
    if (!withEmail.length) return toast.error(`Nenhum lead selecionado tem e-mail.${ignoredNote(ignored)}`);
    const header = "nome,e-mail,categoria,cidade,estado,telefone";
    const rows = withEmail.map(({ business: b, email }) => [b.name, email, b.category, b.city, b.state, b.phone].map(csvCell).join(","));
    const url = URL.createObjectURL(new Blob(["\uFEFF" + [header, ...rows].join("\n")], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "emails-prospector.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`${withEmail.length} leads exportados.${ignoredNote(ignored)}`);
  };
  return (
    <div className="glass-card sticky bottom-24 z-30 flex flex-wrap items-center gap-2 rounded-full px-4 py-2.5 animate-rise md:bottom-4">
      <span className="text-sm font-semibold">{items.length} selecionado{items.length === 1 ? "" : "s"}</span>
      <div className="ml-auto flex flex-wrap gap-2">
        <Button size="sm" onClick={() => void copy()}><Copy className="size-4" />Copiar e-mails</Button>
        <Button size="sm" variant="outline" onClick={exportCsv}><Download className="size-4" />Exportar CSV</Button>
        <Button size="sm" variant="ghost" onClick={onClear} aria-label="Limpar seleção"><X className="size-4" /></Button>
      </div>
    </div>
  );
}
