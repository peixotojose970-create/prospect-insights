import { franc } from "franc-min";
import type { MessageLang } from "@/data/countries";
const codes: Record<MessageLang, string> = { pt: "por", "pt-PT": "por", es: "spa", fr: "fra", it: "ita", en: "eng" };
/** Short openings need the combined pair; brands and place names are excluded separately by the caller. */
export function validMessageLanguage(texts: string[], lang: MessageLang) {
  const text = texts.join(" ").trim();
  if (!text || texts.some((value) => !value.trim())) return false;
  if (lang === "pt-PT" && /\b(oi|pra|vocês|celular|legal)\b/i.test(text)) return false;
  return franc(text, { minLength: 10, only: ["por", "spa", "fra", "ita", "eng"] }) === codes[lang];
}