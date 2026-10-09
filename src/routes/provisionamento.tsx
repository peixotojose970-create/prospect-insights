import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Check, Copy, KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { provisionAccessKeys } from "@/lib/access-bootstrap.functions";

export const Route = createFileRoute("/provisionamento")({ component: ProvisioningPage });

function ProvisioningPage() {
  const [secret, setSecret] = useState("");
  const [keys, setKeys] = useState<{ account: number; key: string }[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!secret || loading || keys.length) return;
    setLoading(true);
    setError("");
    try {
      const result = await provisionAccessKeys({ data: { secret } });
      setKeys(result.keys);
      setSecret("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Não foi possível concluir o provisionamento.");
    } finally {
      setLoading(false);
    }
  }

  async function copyKey(account: number, key: string) {
    await navigator.clipboard.writeText(key);
    setCopied(account);
    window.setTimeout(() => setCopied(null), 1800);
  }

  return <main className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
    <section className="w-full max-w-xl rounded-2xl border border-border bg-card p-6 shadow-xl sm:p-9">
      <div className="mb-7 text-center"><div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="size-6" /></div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Configuração administrativa</p><h1 className="mt-2 text-2xl font-bold text-foreground">Provisionar contas do Prospector</h1><p className="mt-2 text-sm text-muted-foreground">Gera uma única chave de acesso para cada uma das cinco contas.</p></div>
      {!keys.length ? <form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="bootstrap-secret">Segredo administrativo</Label><input id="bootstrap-secret" type="password" autoComplete="off" value={secret} onChange={(event) => setSecret(event.target.value)} className="h-11 w-full rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring/30" /></div><Button type="submit" disabled={!secret || loading} className="w-full">{loading ? <><LoaderCircle className="size-4 animate-spin" />Provisionando…</> : <><KeyRound className="size-4" />Gerar cinco chaves</>}</Button>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</form> : <div className="space-y-3"><div className="rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-foreground">Copie e guarde estas chaves agora. Elas são mostradas somente nesta resposta e não poderão ser recuperadas depois.</div>{keys.map(({ account, key }) => <div key={account} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-3"><strong className="w-20 text-sm text-foreground">Conta {account}</strong><code className="min-w-0 flex-1 break-all text-xs text-muted-foreground">{key}</code><Button type="button" variant="outline" size="sm" onClick={() => void copyKey(account, key)}>{copied === account ? <Check className="size-4" /> : <Copy className="size-4" />}{copied === account ? "Copiada" : "Copiar"}</Button></div>)}</div>}
    </section>
  </main>;
}
