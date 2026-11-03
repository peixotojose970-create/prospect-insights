import { resolveLang, translate, useMessageLang } from "./language";
import { useSyncExternalStore } from "react";
import type { Business } from "@/types";
import { buildMessages, buildSecondMessages } from "./generators";

type SenderProfile = { personalName: string; companyName: string };

export const BUILTIN_STYLES = [
  { key: "curta", label: "Curta" },
  { key: "natural", label: "Natural" },
  { key: "comercial", label: "Comercial" },
  { key: "curiosidade", label: "Desperta curiosidade" },
  { key: "direto", label: "Direto" },
] as const;
export type BuiltinKey = (typeof BUILTIN_STYLES)[number]["key"];

export type TemplateOverride = { title?: string; first?: string; second?: string };
export type CustomTemplate = { id: string; title: string; first: string; second: string };
export type TemplatesState = { overrides: Partial<Record<BuiltinKey, TemplateOverride>>; custom: CustomTemplate[] };

/** Variáveis aceitas nos textos editados — trocadas pelos dados reais de cada lead. */
export const TEMPLATE_VARIABLES = [
  { tag: "{empresa}", label: "Nome da empresa" },
  { tag: "{categoria}", label: "Categoria" },
  { tag: "{cidade}", label: "Cidade" },
  { tag: "{bairro}", label: "Bairro" },
  { tag: "{nota}", label: "Nota no Google" },
  { tag: "{avaliacoes}", label: "Nº de avaliações" },
  { tag: "{site}", label: "Situação do site" },
  { tag: "{meu_nome}", label: "Seu nome" },
  { tag: "{minha_empresa}", label: "Sua empresa" },
];

const KEY = "prospector:templates:v1";
const empty: TemplatesState = { overrides: {}, custom: [] };
let cache: TemplatesState | null = null;
const listeners = new Set<() => void>();

function read(): TemplatesState {
  if (typeof window === "undefined") return empty;
  if (cache) return cache;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(KEY) ?? "null");
    cache = {
      overrides: parsed?.overrides && typeof parsed.overrides === "object" ? parsed.overrides : {},
      custom: Array.isArray(parsed?.custom) ? parsed.custom : [],
    };
  } catch {
    cache = empty;
  }
  return cache;
}

function write(next: TemplatesState) {
  cache = next;
  window.localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function useTemplatesState() {
  return useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    read,
    () => empty,
  );
}

export function saveOverride(key: BuiltinKey, override: TemplateOverride) {
  const s = read();
  write({ ...s, overrides: { ...s.overrides, [key]: override } });
}
export function restoreBuiltin(key: BuiltinKey) {
  const s = read();
  const overrides = { ...s.overrides };
  delete overrides[key];
  write({ ...s, overrides });
}
export function saveCustom(t: CustomTemplate) {
  const s = read();
  const exists = s.custom.some((c) => c.id === t.id);
  write({ ...s, custom: exists ? s.custom.map((c) => (c.id === t.id ? t : c)) : [...s.custom, t] });
}
export function deleteCustom(id: string) {
  const s = read();
  write({ ...s, custom: s.custom.filter((c) => c.id !== id) });
}

export function fillTemplate(text: string, b: Business, profile?: SenderProfile) {
  const values: Record<string, string> = {
    empresa: b.name.trim(),
    categoria: b.category?.trim() || "",
    cidade: b.city?.trim() || "",
    bairro: b.neighborhood?.trim() || "",
    nota: b.rating !== null && b.rating !== undefined ? b.rating.toFixed(1) : "",
    avaliacoes: b.reviews ? String(b.reviews) : "",
    site: b.website ? "tem site" : "sem site informado",
    meu_nome: profile?.personalName.trim() || "Alysson",
    minha_empresa: profile?.companyName.trim() || "Apex SLS",
  };
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in values ? values[k]! : m));
}

/** Lista de abordagens (padrão + personalizadas) e textos finais por lead, usados em toda a plataforma. */
export function useApproaches() {
  const state = useTemplatesState();
  const lang = useMessageLang();
  const list = [
    ...BUILTIN_STYLES.map((s) => ({ key: s.key as string, label: state.overrides[s.key]?.title?.trim() || s.label })),
    ...state.custom.map((c) => ({ key: `custom:${c.id}`, label: c.title || "Modelo sem nome" })),
  ];
  const resolve = (key: string, b: Business, profile: SenderProfile | undefined, step: 1 | 2) => {
    if (key.startsWith("custom:")) {
      const c = state.custom.find((t) => `custom:${t.id}` === key);
      return c ? fillTemplate(step === 1 ? c.first : c.second, b, profile) : "";
    }
    const k = key as BuiltinKey;
    const o = state.overrides[k];
    const custom = step === 1 ? o?.first : o?.second;
    if (custom?.trim()) return fillTemplate(custom, b, profile);
    return (step === 1 ? buildMessages(b, profile) : buildSecondMessages(b, profile))[k] ?? "";
  };
  return {
    list,
    first: (key: string, b: Business, profile?: SenderProfile) => translate(resolve(key, b, profile, 1), resolveLang(lang, b.country)),
    second: (key: string, b: Business, profile?: SenderProfile) => translate(resolve(key, b, profile, 2), resolveLang(lang, b.country)),
    lang,
  };
}
