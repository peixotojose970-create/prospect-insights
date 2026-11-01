/** Estilo visual (HUD) do app. Aplicado como data-hud no <html>, sem recarregar. */
export const HUDS = [
  { id: "leve", label: "HUD futurista leve", description: "Escuro e carmesim, sem efeitos pesados." },
  { id: "futurista", label: "HUD futurista", description: "Escuro com degradê carmesim e vidro." },
  { id: "antiga", label: "HUD antiga", description: "Tema claro, azul e cartões simples." },
] as const;

export type HudId = (typeof HUDS)[number]["id"];
const KEY = "prospector:hud";

export function readHud(): HudId {
  try {
    const v = window.localStorage.getItem(KEY);
    if (HUDS.some((h) => h.id === v)) return v as HudId;
  } catch {
    // armazenamento indisponível
  }
  return "leve";
}

export function applyHud(id: HudId, persist = true) {
  const root = document.documentElement;
  root.setAttribute("data-hud", id);
  root.classList.toggle("dark", id !== "antiga");
  if (persist) {
    try {
      window.localStorage.setItem(KEY, id);
    } catch {
      // armazenamento indisponível
    }
  }
}
