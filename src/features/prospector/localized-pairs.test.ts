import { afterEach, expect, it, vi } from "vitest";
const translator = vi.hoisted(() => vi.fn());
vi.mock("@/lib/translate.functions", () => ({ translateMessages: translator }));
import { localizedPair, retryLocalizedPairs } from "./localized-pairs";
import type { Business } from "@/types";
afterEach(() => { retryLocalizedPairs(); vi.useRealTimers(); vi.unstubAllGlobals(); translator.mockReset(); });
it("uma seleção antiga não substitui o idioma novo", async () => {
  vi.stubGlobal("window", {});
  vi.useFakeTimers();
  let completeFrench: ((value: { translations: string[]; error: null }) => void) | undefined;
  translator.mockImplementationOnce(() => new Promise((resolve) => { completeFrench = resolve; })).mockResolvedValueOnce({ translations: ["Apertura", "Proposta"], error: null });
  const business = { name: "Empresa", city: null, country: "FR", category: "Serviço" } as Business;
  localizedPair("Abertura", "Proposta", "fr", business, "curta");
  localizedPair("Abertura", "Proposta", "it", business, "curta");
  await vi.advanceTimersByTimeAsync(0);
  expect(localizedPair("Abertura", "Proposta", "it", business, "curta").first).toBe("Apertura");
  completeFrench?.({ translations: ["Bonjour", "Proposition"], error: null });
  await vi.advanceTimersByTimeAsync(0);
  expect(localizedPair("Abertura", "Proposta", "it", business, "curta").first).toBe("Apertura");
});
it("payment_required stops queued work without Portuguese fallback and permits explicit recovery", async () => {
  vi.stubGlobal("window", {});
  vi.useFakeTimers();
  translator.mockResolvedValue({ translations: null, errorCode: "payment_required", error: "Créditos exigidos (HTTP 402)" });
  const business = { name: "Oficina Pagamento", city: "Campinas", country: "BR", category: "Oficina" } as Business;
  for (const lang of ["en", "es", "fr", "it", "pt-PT"] as const) localizedPair("Olá", "Proposta", lang, business, "direto");
  await vi.advanceTimersByTimeAsync(0);
  expect(translator.mock.calls.length).toBeLessThanOrEqual(2);
  for (const lang of ["en", "es", "fr", "it", "pt-PT"] as const) {
    expect(localizedPair("Olá", "Proposta", lang, business, "direto")).toEqual({ first: "", second: "", pending: false, error: "Créditos exigidos (HTTP 402)" });
  }
  expect(localizedPair("Olá", "Proposta", "pt", business, "direto").first).toBe("Olá");
  retryLocalizedPairs();
  translator.mockResolvedValue({ translations: ["Hello", "Proposal"], error: null, errorCode: null });
  localizedPair("Olá", "Proposta", "en", business, "direto");
  await vi.advanceTimersByTimeAsync(0);
  expect(localizedPair("Olá", "Proposta", "en", business, "direto").first).toBe("Hello");
});
it("Gemini quota refusal stops queued pairs and ends loading without Portuguese fallback", async () => {
  vi.stubGlobal("window", {});
  vi.useFakeTimers();
  translator.mockResolvedValue({ translations: null, errorCode: "gemini_quota_exceeded", error: "Cota Gemini esgotada" });
  const business = { name: "Oficina Gemini", city: "Campinas", country: "BR", category: "Oficina" } as Business;
  for (const lang of ["en", "es", "fr", "it"] as const) localizedPair("Olá Gemini", "Proposta Gemini", lang, business, "direto");
  await vi.advanceTimersByTimeAsync(0);
  expect(translator).toHaveBeenCalledTimes(2);
  for (const lang of ["en", "es", "fr", "it"] as const) expect(localizedPair("Olá Gemini", "Proposta Gemini", lang, business, "direto")).toEqual({ first: "", second: "", pending: false, error: "Cota Gemini esgotada" });
});