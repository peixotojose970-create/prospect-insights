import { useEffect, useSyncExternalStore } from "react";
import { translateMessages } from "@/lib/translate.functions";
import type { MessageLang } from "@/data/countries";
import type { Business } from "@/types";

type Pair = { first: string; second: string; pending: boolean; error: string | null };
const pairs = new Map<string, Pair>();
const listeners = new Set<() => void>();
const jobs: (() => Promise<void>)[] = [];
let running = false;
let version = 0;
const emit = () => { version++; listeners.forEach((listener) => listener()); };
export function useLocalizedPairs() {
  useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => version, () => 0);
  useEffect(() => {
    if (running || !jobs.length) return;
    running = true;
    void (async () => { try { while (jobs.length) { const job = jobs.shift(); if (job) await job(); } } finally { running = false; } })();
  });
}
export function localizedPair(first: string, second: string, lang: MessageLang, business: Business, style: string): Pair {
  if (lang === "pt") return { first, second, pending: false, error: null };
  const key = JSON.stringify([lang, business.country, business.name, business.category, business.city, style, first, second]);
  const hit = pairs.get(key);
  if (hit) return hit;
  const initial: Pair = { first: "", second: "", pending: true, error: null };
  pairs.set(key, initial);
  jobs.push(async () => {
    try {
      const result = await translateMessages({ data: { lang, texts: [first, second], country: business.country ?? "BR", context: { company: business.name, category: business.category, city: business.city, style } } });
      const opening = result.translations?.[0];
      const proposal = result.translations?.[1];
      pairs.set(key, opening && proposal ? { first: opening, second: proposal, pending: false, error: null } : { first: "", second: "", pending: false, error: result.error ?? "Não foi possível adaptar a abordagem." });
    } catch { pairs.set(key, { first: "", second: "", pending: false, error: "Não foi possível gerar a abordagem. Verifique a conexão e tente novamente." }); }
    emit();
  });
  return initial;
}
export function retryLocalizedPairs() {
  for (const [key, pair] of pairs) if (pair.error) pairs.delete(key);
  emit();
}