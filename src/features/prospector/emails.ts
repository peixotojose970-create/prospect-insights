import { toast } from "sonner";
import type { Business } from "@/types";

type WithEmail = { email?: string | null };

/** E-mails únicos e preenchidos, na ordem dos itens. */
export function uniqueEmails(items: WithEmail[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of items) {
    const email = item.email?.trim().toLowerCase();
    if (!email || seen.has(email)) continue;
    seen.add(email);
    out.push(email);
  }
  return out;
}

/** Copia os e-mails dos itens (separados por vírgula, sem repetidos) e avisa quantos foram ignorados. */
export async function copyEmails(items: WithEmail[]) {
  const emails = uniqueEmails(items);
  const ignored = items.filter((i) => !i.email?.trim()).length;
  if (!emails.length) {
    toast.info("Nenhum dos selecionados tem e-mail preenchido.");
    return;
  }
  try {
    await navigator.clipboard.writeText(emails.join(", "));
    toast.success(
      `${emails.length} ${emails.length === 1 ? "e-mail copiado" : "e-mails copiados"}.${ignored ? ` ${ignored} sem e-mail ${ignored === 1 ? "foi ignorado" : "foram ignorados"}.` : ""}`,
    );
  } catch {
    toast.error("Não foi possível copiar neste navegador.");
  }
}

const csvValue = (v: string | null | undefined) => `"${String(v ?? "").replace(/"/g, '""')}"`;

/** CSV com nome, e-mail, categoria, cidade, estado e telefone — somente quem tem e-mail preenchido. */
export function exportEmailsCsv(items: Business[], filename = "emails-prospector.csv") {
  const withEmail = items.filter((b) => b.email?.trim());
  const ignored = items.length - withEmail.length;
  if (!withEmail.length) {
    toast.info("Nenhum dos selecionados tem e-mail preenchido.");
    return;
  }
  const header = ["nome", "email", "categoria", "cidade", "estado", "telefone"];
  const rows = withEmail.map((b) =>
    [b.name, b.email!.trim(), b.category, b.city, b.state, b.phone].map(csvValue).join(","),
  );
  const url = URL.createObjectURL(
    new Blob([[header.join(","), ...rows].join("\n")], { type: "text/csv;charset=utf-8" }),
  );
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
  toast.success(
    `${withEmail.length} ${withEmail.length === 1 ? "lead exportado" : "leads exportados"}.${ignored ? ` ${ignored} sem e-mail ${ignored === 1 ? "foi ignorado" : "foram ignorados"}.` : ""}`,
  );
}
