import { useCallback, useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

export type Platform = "ios" | "android" | "desktop";

const DISMISS_KEY = "prospector:install-dismissed";

function detectPlatform(): Platform {
  if (typeof navigator === "undefined") return "desktop";
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && (navigator.maxTouchPoints ?? 0) > 1);
  if (isIOS) return "ios";
  if (/Android/i.test(ua)) return "android";
  return "desktop";
}

export const INSTALL_INSTRUCTIONS: Record<Platform, string> = {
  ios: "No Safari, toque em Compartilhar e depois em “Adicionar à Tela de Início”.",
  android:
    "Abra o menu do navegador (⋮) e escolha “Instalar aplicativo” ou “Adicionar à tela inicial”.",
  desktop:
    "No Chrome ou Edge, clique no ícone de instalar na barra de endereço e confirme “Instalar”.",
};

/** Instalação real de PWA: usa beforeinstallprompt quando o navegador oferece. */
export function useInstallApp() {
  const [promptEvent, setPromptEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<Platform>("desktop");
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setPlatform(detectPlatform());
    setDismissed(localStorage.getItem(DISMISS_KEY) === "1");

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (navigator as unknown as { standalone?: boolean }).standalone === true;
    setInstalled(standalone);

    const onPrompt = (e: Event) => {
      e.preventDefault();
      setPromptEvent(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => {
      setInstalled(true);
      setPromptEvent(null);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", onPrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  const install = useCallback(async () => {
    if (!promptEvent) return "unsupported" as const;
    await promptEvent.prompt();
    const { outcome } = await promptEvent.userChoice;
    setPromptEvent(null);
    return outcome;
  }, [promptEvent]);

  const dismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, "1");
    setDismissed(true);
  }, []);

  return {
    /** true quando o navegador disponibilizou o prompt oficial de instalação */
    canPrompt: !!promptEvent,
    install,
    installed,
    platform,
    dismissed,
    dismiss,
    instructions: INSTALL_INSTRUCTIONS[platform],
  };
}
