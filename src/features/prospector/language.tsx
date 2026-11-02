import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { translateMessages } from "@/lib/translate.functions";

export type MessageLang = "pt" | "es" | "en";
export const MESSAGE_LANGS: { key: MessageLang; label: string }[] = [
  { key: "pt", label: "Português" },
  { key: "es", label: "Español" },
  { key: "en", label: "English" },
];

const LANG_KEY = "prospector:message-lang:v1";
const CACHE_KEY = "prospector:translations:v1";
const MAX_CACHE = 2000;

let lang: MessageLang = "pt";
let cache: Record<string, string> = {};
let loaded = false;
let version = 0;
const listeners = new Set<() => void>();
const pending = new Set<string>();
const failed = new Set<string>();
let timer: ReturnType<typeof setTimeout> | null = null;

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  const l = window.localStorage.getItem(LANG_KEY);
  if (l === "es" || l === "en" || l === "pt") lang = l;
  try {
    cache = JSON.parse(window.localStorage.getItem(CACHE_KEY) || "{}") as Record<string, string>;
  } catch {
    cache = {};
  }
}

function emit() {
  version++;
  for (const fn of listeners) fn();
}

function persist() {
  const keys = Object.keys(cache);
  if (keys.length > MAX_CACHE) for (const k of keys.slice(0, keys.length - MAX_CACHE)) delete cache[k];
  try {
    window.localStorage.setItem(CACHE_KEY, JSON.stringify(cache));
  } catch {
    /* armazenamento cheio: segue só em memória */
  }
}

const keyOf = (l: MessageLang, text: string) => `${l}\u0000${text}`;

async function flush() {
  timer = null;
  const byLang: Record<string, string[]> = {};
  for (const k of pending) {
    const [l, text] = k.split("\u0000") as [MessageLang, string];
    (byLang[l] ??= []).push(text);
  }
  pending.clear();
  for (const [l, texts] of Object.entries(byLang)) {
    for (let i = 0; i < texts.length; i += 20) {
      const chunk = texts.slice(i, i + 20);
      const res = await translateMessages({ data: { lang: l as "es" | "en", texts: chunk } });
      if (res.translations) {
        chunk.forEach((t, j) => (cache[keyOf(l as MessageLang, t)] = res.translations![j]!));
        persist();
      } else {
        chunk.forEach((t) => failed.add(keyOf(l as MessageLang, t)));
        toast.error(res.error ?? "Falha na tradução.");
      }
      emit();
    }
  }
}

/** Devolve a tradução já pronta, ou o original enquanto a tradução é buscada. */
export function translate(text: string, l: MessageLang): string {
  if (l === "pt" || !text.trim()) return text;
  const k = keyOf(l, text);
  const hit = cache[k];
  if (hit !== undefined) return hit;
  if (!pending.has(k) && !failed.has(k) && typeof window !== "undefined") {
    pending.add(k);
    if (!timer) timer = setTimeout(() => void flush(), 50);
  }
  return text;
}

export function isTranslating(text: string, l: MessageLang) {
  if (l === "pt" || !text.trim()) return false;
  const k = keyOf(l, text);
  return cache[k] === undefined && !failed.has(k);
}

export function setMessageLang(l: MessageLang) {
  load();
  lang = l;
  failed.clear();
  window.localStorage.setItem(LANG_KEY, l);
  emit();
}

function subscribe(fn: () => void) {
  load();
  listeners.add(fn);
  if (lang !== "pt") emit();
  return () => listeners.delete(fn);
}

/** Idioma atual das abordagens + versão do cache (re-render quando traduções chegam). */
export function useMessageLang() {
  useSyncExternalStore(subscribe, () => version, () => 0);
  return loaded ? lang : "pt";
}

export function LanguagePicker() {
  const current = useMessageLang();
  return (
    <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Idioma da abordagem">
      <span className="text-xs font-semibold text-muted-foreground">Idioma:</span>
      {MESSAGE_LANGS.map((l) => (
        <button
          key={l.key}
          type="button"
          role="radio"
          aria-checked={current === l.key}
          onClick={() => setMessageLang(l.key)}
          className={
            "rounded-full border px-3 py-1 text-xs font-medium transition-colors " +
            (current === l.key
              ? "border-primary bg-primary text-primary-foreground"
              : "border-border text-muted-foreground hover:text-foreground")
          }
        >
          {l.label}
        </button>
      ))}
    </div>
  );
}
