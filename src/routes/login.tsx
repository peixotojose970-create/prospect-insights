import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowRight, Eye, EyeOff, KeyRound, LoaderCircle, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { loginWithAccessKey } from "@/lib/access-login.functions";
import { useRouter } from "@tanstack/react-router";

export const Route = createFileRoute("/login")({ component: AccessLogin });

function AccessLogin() {
  const [key, setKey] = useState("");
  const [visible, setVisible] = useState(false);
  const [remember, setRemember] = useState(false);
  const [status, setStatus] = useState<"idle" | "validating" | "invalid" | "disabled" | "connection" | "authorized">("idle");
  const router = useRouter();

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!key.trim()) return;
    setStatus("validating");
    try {
      const tokens = await loginWithAccessKey({ data: { key: key.trim() } });
      const { error } = await supabase.auth.setSession({ access_token: tokens.access_token, refresh_token: tokens.refresh_token });
      if (error) throw error;
      setKey("");
      setStatus("authorized");
      await router.navigate({ to: "/" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Não foi possível validar esta chave.";
      setStatus(message.includes("configurada") || message.includes("configurado") ? "connection" : "invalid");
    }
  }

  const message = {
    idle: "Aguardando sua chave de acesso.",
    validating: "Validando seu acesso…",
    invalid: "Não foi possível validar esta chave. Confira e tente novamente.",
    disabled: "Esta chave está desativada. Entre em contato com o responsável pelo acesso.",
    connection: "A validação de chaves ainda não está configurada. Tente novamente mais tarde.",
    authorized: "Acesso autorizado.",
  }[status];

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.5_0.13_235/0.12),transparent_58%)]" />
      <section className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-9">
        <div className="mb-8 flex flex-col items-center text-center">
          <div className="mb-5 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/20"><KeyRound className="size-7" aria-hidden /></div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Acesso seguro</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">PROSPECTOR</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Entre na sua conta para continuar sua prospecção.</p>
        </div>
        <form onSubmit={submit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="access-key">Chave de acesso</Label>
            <div className="relative">
              <KeyRound className="absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
              <input id="access-key" autoComplete="off" value={key} onChange={(e) => { setKey(e.target.value); if (status !== "validating") setStatus("idle"); }} type={visible ? "text" : "password"} placeholder="Digite ou cole sua chave de acesso" className="h-12 w-full rounded-lg border border-input bg-background pr-12 pl-10 text-sm text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/30" />
              <button type="button" onClick={() => setVisible(!visible)} className="absolute top-1/2 right-2 grid size-9 -translate-y-1/2 place-items-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground" aria-label={visible ? "Ocultar chave" : "Mostrar chave"}>{visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
            </div>
          </div>
          <div className="flex items-center gap-2.5"><Checkbox id="remember" checked={remember} onCheckedChange={(checked) => setRemember(checked === true)} /><Label htmlFor="remember" className="cursor-pointer text-sm font-normal text-muted-foreground">Manter conectado neste dispositivo</Label></div>
          <Button type="submit" disabled={!key.trim() || status === "validating"} className="h-12 w-full text-sm font-semibold">{status === "validating" ? <><LoaderCircle className="size-4 animate-spin" />Validando acesso…</> : <>Entrar no Prospector<ArrowRight className="size-4" /></>}</Button>
          <p role="status" aria-live="polite" className={`min-h-5 text-center text-xs ${status === "invalid" || status === "disabled" || status === "connection" ? "text-destructive" : "text-muted-foreground"}`}>{message}</p>
        </form>
        <div className="mt-5 flex items-center justify-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" aria-hidden />Seu acesso é protegido e confidencial</div>
      </section>
    </main>
  );
}
