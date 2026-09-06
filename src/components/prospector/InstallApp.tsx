import { useState } from "react";
import { CheckCircle2, Download, Smartphone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useInstallApp } from "@/features/pwa/useInstallApp";

/** Bloco principal "Baixe nosso aplicativo" — página inicial. */
export function InstallAppCard() {
  const { canPrompt, install, installed, instructions } = useInstallApp();
  const [showHelp, setShowHelp] = useState(false);

  if (installed) {
    return (
      <Card className="flex-row items-center gap-3 p-4">
        <CheckCircle2 className="size-5 shrink-0 text-success" aria-hidden />
        <p className="text-sm text-muted-foreground">Você já está usando o aplicativo instalado.</p>
      </Card>
    );
  }

  return (
    <Card className="gap-4 p-5">
      <div className="flex items-start gap-4">
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
          <Smartphone className="size-5" aria-hidden />
        </span>
        <div className="min-w-0 space-y-1">
          <h2 className="text-base font-semibold text-foreground">Baixe nosso aplicativo</h2>
          <p className="text-sm text-muted-foreground">
            Tenha o Prospector sempre à mão e acesse suas prospecções rapidamente.
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          className="h-12 sm:w-auto"
          onClick={() => {
            if (canPrompt) void install();
            else setShowHelp(true);
          }}
        >
          <Download className="size-4" aria-hidden />
          Baixar aplicativo
        </Button>
        {!canPrompt ? (
          <Button variant="ghost" className="h-12 sm:w-auto" onClick={() => setShowHelp((v) => !v)}>
            Como instalar
          </Button>
        ) : null}
      </div>

      {showHelp && !canPrompt ? (
        <p className="rounded-md border border-border bg-muted/40 p-3 text-sm text-muted-foreground">
          {instructions}
        </p>
      ) : null}
    </Card>
  );
}

/** Faixa discreta no topo do sistema, dispensável e não repetitiva. */
export function InstallAppStrip() {
  const { canPrompt, install, installed, instructions, dismissed, dismiss } = useInstallApp();
  const [showHelp, setShowHelp] = useState(false);

  if (installed || dismissed) return null;

  return (
    <div className="border-b border-border bg-muted/40 px-4 py-2">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-2">
        <Smartphone className="size-4 shrink-0 text-primary" aria-hidden />
        <p className="min-w-0 flex-1 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">Instale o Prospector</span> — acesso rápido pelo celular.
        </p>
        <Button
          size="sm"
          onClick={() => {
            if (canPrompt) void install();
            else setShowHelp(true);
          }}
        >
          Instalar
        </Button>
        <Button size="sm" variant="ghost" onClick={dismiss}>
          Agora não
        </Button>
        <Button size="icon" variant="ghost" aria-label="Fechar aviso" onClick={dismiss}>
          <X className="size-4" aria-hidden />
        </Button>
        {showHelp && !canPrompt ? (
          <p className="w-full text-xs text-muted-foreground">{instructions}</p>
        ) : null}
      </div>
    </div>
  );
}

/** Item de menu / barra lateral. */
export function InstallAppMenuItem({ className }: { className?: string }) {
  const { canPrompt, install, installed, instructions } = useInstallApp();
  const [showHelp, setShowHelp] = useState(false);

  if (installed) return null;

  return (
    <div className={className}>
      <Button
        variant="outline"
        size="sm"
        className="w-full justify-start"
        onClick={() => {
          if (canPrompt) void install();
          else setShowHelp((v) => !v);
        }}
      >
        <Smartphone className="size-4" aria-hidden />
        <span className="truncate">Instalar aplicativo</span>
      </Button>
      {showHelp && !canPrompt ? <p className="mt-2 text-xs text-muted-foreground">{instructions}</p> : null}
    </div>
  );
}
