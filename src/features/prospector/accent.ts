/** Cor de destaque do tema: só muda o tom (--brand-hue) do degradê. */
export const ACCENTS = [
  { id: "carmesim", label: "Carmesim", hue: 25 },
  { id: "laranja", label: "Laranja", hue: 50 },
  { id: "esmeralda", label: "Esmeralda", hue: 155 },
  { id: "azul", label: "Azul", hue: 245 },
  { id: "violeta", label: "Violeta", hue: 300 },
] as const;

export type AccentId = (typeof ACCENTS)[number]["id"];
const KEY = "prospector:accent";

export function readAccent(): AccentId {
  try {
    const v = window.localStorage.getItem(KEY);
    if (ACCENTS.some((a) => a.id === v)) return v as AccentId;
  } catch {
    // armazenamento indisponível
  }
  return "carmesim";
}

export function applyAccent(id: AccentId, persist = true) {
  const accent = ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
  document.documentElement.style.setProperty("--brand-hue", String(accent.hue));
  if (persist) {
    try {
      window.localStorage.setItem(KEY, accent.id);
    } catch {
      // armazenamento indisponível
    }
  }
}
