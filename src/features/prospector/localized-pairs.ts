import { useSyncExternalStore } from "react";
import { translateMessages } from "@/lib/translate.functions";
import type { MessageLang } from "@/data/countries";
import type { Business } from "@/types";
import { withRequestTimeout } from "./request-timeout";

type Pair = { first: string; second: string; pending: boolean; error: string | null };
const pairs = new Map<string, Pair>();
const listeners = new Set<() => void>();
const jobs: (() => Promise<void>)[] = [];
let active = 0;
let paymentBlock: string | null = null;
function drain() {
  while (active < 2 && jobs.length) {
    const job = jobs.shift();
    if (!job) return;
    active++;
    void job().finally(() => { active--; drain(); });
  }
}
let version = 0;
const emit = () => { version++; listeners.forEach((listener) => listener()); };
export function useLocalizedPairs() {
  useSyncExternalStore((listener) => { listeners.add(listener); return () => { listeners.delete(listener); }; }, () => version, () => 0);
}
export function localizedPair(first: string, second: string, lang: MessageLang, business: Business, style: string): Pair {
  if (lang === "pt") return { first, second, pending: false, error: null };
  const key = JSON.stringify([lang, business.country, business.name, business.category, business.city, style, first, second]);
  const hit = pairs.get(key);
  if (hit) return hit;
  if (paymentBlock) return { first: "", second: "", pending: false, error: paymentBlock };
  const initial: Pair = { first: "", second: "", pending: true, error: null };
  // Schedule independently of React effects: a closed dialog cannot strand the queue.
  if (typeof window === "undefined") return initial;
  pairs.set(key, initial);
  jobs.push(async () => {
    let completed: Pair = { first: "", second: "", pending: false, error: "Não foi possível traduzir a abordagem." };
    try {
      if (paymentBlock) { completed.error = paymentBlock; return; }
      const result = await withRequestTimeout(translateMessages({ data: { lang, texts: [first, second], country: business.country ?? "BR", context: { company: business.name, category: business.category, city: business.city, style } } }), 65_000);
      if (["payment_required", "gemini_quota_exceeded", "gemini_key_missing", "free_tier_unconfirmed", "gemini_access_denied", "gemini_billing_required", "gemini_model_unavailable"].includes(result.errorCode ?? "")) paymentBlock = result.error ?? "Tradução bloqueada: revise a configuração ou a cota antes de tentar novamente.";
      const opening = result.translations?.[0];
      const proposal = result.translations?.[1];
      completed = opening && proposal ? { first: opening, second: proposal, pending: false, error: null } : { ...completed, error: result.error ?? completed.error };
    } catch (error) { completed.error = error instanceof Error ? error.message : "Não foi possível gerar a abordagem. Verifique a conexão e tente novamente."; }
    finally { if (pairs.get(key) === initial) { pairs.set(key, completed); emit(); } }
  });
  setTimeout(drain, 0);
  return initial;
}
export function retryLocalizedPairs() {
  paymentBlock = null;
  for (const [key, pair] of pairs) if (pair.error) pairs.delete(key);
  emit();
}