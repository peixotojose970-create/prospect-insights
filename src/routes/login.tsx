import { createFileRoute } from "@tanstack/react-router";
import { KeyRound, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6">
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,oklch(0.5_0.13_235/0.12),transparent_58%)]" />
      <section className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 text-center shadow-xl shadow-primary/5 sm:p-9">
        <div className="mb-5 inline-grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground"><KeyRound className="size-7" aria-hidden /></div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-[0.22em] text-primary">Acesso seguro</p>
        <h1 className="text-2xl font-bold tracking-tight text-foreground">PROSPECTOR</h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">A tela de acesso está sendo preparada para o novo login.</p>
        <div className="mt-6 flex items-center justify-center gap-2 border-t border-border pt-5 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-primary" aria-hidden />Seu acesso é protegido e confidencial</div>
      </section>
    </main>
  );
}
