import { useState, type FormEvent } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/provisionamento")({ component: ProvisionamentoPage });

const users = ["Alysson", "Isac", "Yago", "Kauan", "reserva", "reserva2"] as const;
type UserName = (typeof users)[number];
type ProvisionResult = { success: boolean; created?: string[]; updated?: string[]; error?: string };

function ProvisionamentoPage() {
  const [secret, setSecret] = useState("");
  const [passwords, setPasswords] = useState<Record<UserName, string>>({
    Alysson: "",
    Isac: "",
    Yago: "",
    Kauan: "",
    reserva: "",
    reserva2: "",
  });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<{ kind: "error" | "success"; text: string } | null>(null);

  async function provisionAccounts(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setNotice(null);
    setBusy(true);
    try {
      if (users.some((username) => passwords[username].length < 12)) {
        throw new Error("Preencha as seis senhas com pelo menos 12 caracteres. Os caracteres informados são enviados sem alteração.");
      }
      const { data, error } = await supabase.functions.invoke<ProvisionResult>("prospect-bootstrap", {
        body: { accounts: users.map((username) => ({ username, password: passwords[username] })) },
        headers: { "x-bootstrap-secret": secret },
      });
      if (error) {
        let message = error.message;
        if (error.context instanceof Response) {
          const payload = await error.context.clone().json().catch(() => null) as { error?: string } | null;
          if (payload?.error) message = payload.error;
        }
        throw new Error(message);
      }
      if (!data?.success) throw new Error(data?.error ?? "O backend não confirmou o provisionamento.");
      const createdCount = data.created?.length ?? 0;
      const updatedCount = data.updated?.length ?? 0;
      setNotice({ kind: "success", text: `Backend concluiu a operação: ${createdCount} identidades criadas e ${updatedCount} atualizadas. Confira os seis acessos testando cada login.` });
      setPasswords({ Alysson: "", Isac: "", Yago: "", Kauan: "", reserva: "", reserva2: "" });
      setSecret("");
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Não foi possível concluir o provisionamento." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <section className="mx-auto w-full max-w-2xl space-y-5">
        <header className="text-center">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-xl bg-primary text-primary-foreground"><ShieldCheck className="size-6" aria-hidden /></div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Operação administrativa</p>
          <h1 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Provisionamento de contas</h1>
          <p className="mt-2 text-sm text-muted-foreground">Cria ou atualiza as seis identidades reais no provedor de autenticação e vincula as contas do PROSPECTOR.</p>
        </header>

        <Card className="space-y-4 p-5 sm:p-6">
          <div className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
            Informe o segredo administrativo configurado em Cloud → Secrets e as seis senhas iniciais. O aplicativo não grava as senhas em armazenamento persistente, no banco ou em logs; elas ficam temporariamente em memória até o envio ao provedor de autenticação. O serviço administrativo permanece somente no backend.
          </div>
          <form className="space-y-5" onSubmit={provisionAccounts}>
            <div className="space-y-2">
              <Label htmlFor="bootstrap-secret">Segredo administrativo do provisionamento</Label>
              <Input id="bootstrap-secret" type="password" autoComplete="off" required value={secret} onChange={(event) => setSecret(event.target.value)} placeholder="PROSPECTOR_BOOTSTRAP_SECRET" />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {users.map((username) => (
                <div key={username} className="space-y-2">
                  <Label htmlFor={`password-${username}`}>Senha inicial — {username}</Label>
                  <Input
                    id={`password-${username}`}
                    type="password"
                    autoComplete="new-password"
                    minLength={12}
                    required
                    value={passwords[username]}
                    onChange={(event) => setPasswords((current) => ({ ...current, [username]: event.target.value }))}
                    placeholder="Mínimo de 12 caracteres"
                  />
                </div>
              ))}
            </div>
            {notice && <p role="status" className={notice.kind === "error" ? "rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive" : "rounded-md border border-primary/30 bg-primary/5 px-3 py-2 text-sm text-foreground"}>{notice.text}</p>}
            <Button className="w-full" type="submit" disabled={busy}>
              {busy && <LoaderCircle className="size-4 animate-spin" aria-hidden />}
              {busy ? "Provisionando contas…" : "Criar ou corrigir as seis contas"}
            </Button>
          </form>
        </Card>
        <p className="text-center text-xs text-muted-foreground">A operação pode ser repetida: as identidades existentes são preservadas e atualizadas, sem criar duplicatas.</p>
      </section>
    </main>
  );
}
