import { useState, type FormEvent } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Eye, EyeOff, LoaderCircle, LockKeyhole, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepConnected, setKeepConnected] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      // O identificador técnico fica interno; a pessoa informa apenas o usuário.
      const internalEmail = `${username.trim().toLowerCase()}@prospector.local`;
      const { error: authError } = await supabase.auth.signInWithPassword({ email: internalEmail, password });
      if (authError) {
        setError("Usuário ou senha incorretos. Confira os dados e tente novamente.");
        return;
      }
      // O cliente Lovable mantém a sessão gerenciada pelo provedor. A escolha é mantida para a opção de sessão curta.
      if (!keepConnected) sessionStorage.setItem("prospector:session-preference", "temporary");
      else sessionStorage.removeItem("prospector:session-preference");
      await navigate({ to: "/" });
    } catch {
      setError("Não foi possível entrar agora. Verifique sua conexão e tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.5_0.13_235/0.14),transparent_58%)]" />
      <section className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl shadow-primary/5 sm:p-9">
        <div className="mb-7 text-center">
          <div className="mx-auto mb-5 grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><ShieldCheck className="size-7" aria-hidden /></div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Acesso seguro</p>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">PROSPECTOR</h1>
          <p className="mt-2 text-sm text-muted-foreground">Entre com seu nome de usuário e senha.</p>
        </div>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <label htmlFor="username" className="text-sm font-medium text-foreground">Nome de usuário</label>
            <div className="relative"><UserRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><input id="username" name="username" autoComplete="username" autoCapitalize="none" required value={username} onChange={(event) => setUsername(event.target.value)} className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-3 text-base text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring" placeholder="Seu usuário" /></div>
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium text-foreground">Senha</label>
            <div className="relative"><LockKeyhole className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden /><input id="password" name="password" autoComplete="current-password" required value={password} onChange={(event) => setPassword(event.target.value)} type={showPassword ? "text" : "password"} className="h-11 w-full rounded-md border border-input bg-background pl-10 pr-12 text-base text-foreground outline-none transition focus-visible:ring-2 focus-visible:ring-ring" placeholder="Sua senha" /><button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"} className="absolute right-2 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded text-muted-foreground hover:bg-muted hover:text-foreground">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
          </div>
          <label className="flex cursor-pointer items-center gap-2 text-sm text-muted-foreground"><input type="checkbox" checked={keepConnected} onChange={(event) => setKeepConnected(event.target.checked)} className="size-4 rounded border-input accent-primary" />Manter conectado neste dispositivo</label>
          {error && <p role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</p>}
          <button type="submit" disabled={loading} className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-60">{loading && <LoaderCircle className="size-4 animate-spin" aria-hidden />}{loading ? "Entrando…" : "Entrar"}</button>
        </form>
        <div className="mt-6 flex items-center justify-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" aria-hidden />Seu acesso é protegido e confidencial</div>
      </section>
    </main>
  );
}
