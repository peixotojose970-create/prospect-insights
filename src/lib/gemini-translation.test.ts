import { expect, it, vi } from "vitest";
import { assertGeminiConfiguration, geminiRequestBody, parseGeminiTranslation, requestGeminiTranslation } from "./gemini-translation.server";

const input = { lang: "en" as const, texts: ["Olá, estou falando com o responsável da {empresa}?", "Sou da Nextor Studio e gostaria de apresentar uma proposta para criar o site da {empresa}."] };
const translated = ["Hello, am I speaking with the person in charge of {empresa}?", "I am from Nextor Studio and would like to present a proposal to create the website for {empresa}."];
const payload = (texts: string[]) => ({ status: "completed", steps: [{ type: "model_output", content: [{ type: "text", text: JSON.stringify({ translations: texts }) }] }] });

it("pins the requested gemini-3.1-flash-lite model and Standard tier without tools or billing setup", () => {
  const body = geminiRequestBody(input);
  expect(body.model).toBe("gemini-3.1-flash-lite");
  expect(body.service_tier).toBe("standard");
  expect(body.store).toBe(false);
  expect(body).not.toHaveProperty("tools");
});
it("blocks external work until key and unbilled project are confirmed", () => {
  expect(() => assertGeminiConfiguration(undefined, "true")).toThrow("gemini_key_missing");
  expect(() => assertGeminiConfiguration("test-only", undefined)).toThrow("free_tier_unconfirmed");
  expect(() => assertGeminiConfiguration("test-only", "false")).toThrow("free_tier_unconfirmed");
  expect(() => assertGeminiConfiguration("test-only", "true")).not.toThrow();
});
it("preserves both message stages and placeholders", () => {
  expect(parseGeminiTranslation(payload(translated), input)).toEqual(translated);
  expect(() => parseGeminiTranslation(payload([translated[0] ?? "", "Proposal without the variable"]), input)).toThrow("invalid_translation");
});
it("rejects Portuguese as a completed English translation", () => {
  expect(() => parseGeminiTranslation(payload(input.texts), input)).toThrow("invalid_translation");
});
it("rejects incomplete interactions and missing stages", () => {
  expect(() => parseGeminiTranslation({ ...payload(translated), status: "in_progress" }, input)).toThrow();
  expect(() => parseGeminiTranslation(payload(translated.slice(0, 1)), input)).toThrow("invalid_translation");
});
it("stops at free quota refusal without retries or provider fallback", async () => {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response("quota", { status: 429 }));
  await expect(requestGeminiTranslation(input, "test-only", fetcher)).rejects.toThrow("gemini_quota_exceeded");
  expect(fetcher).toHaveBeenCalledTimes(1);
  expect(fetcher.mock.calls[0]?.[0]).toBe("https://generativelanguage.googleapis.com/v1beta/interactions");
  expect(fetcher.mock.calls[0]?.[1]?.signal).toBeInstanceOf(AbortSignal);
});
it("maps provider access, model and billing errors without fallback", async () => {
  for (const [status, code] of [[401, "gemini_access_denied"], [403, "gemini_access_denied"], [404, "gemini_model_unavailable"], [402, "gemini_billing_required"]] as const) {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(new Response(null, { status }));
    await expect(requestGeminiTranslation(input, "test-only", fetcher)).rejects.toThrow(code);
    expect(fetcher).toHaveBeenCalledTimes(1);
  }
});
it("rejects empty responses", () => {
  expect(() => parseGeminiTranslation(payload(["", ""]), input)).toThrow();
  expect(() => parseGeminiTranslation({ status: "completed", steps: [] }, input)).toThrow();
});
it("does not retry connection errors or timeouts", async () => {
  for (const error of [new TypeError("Connection failed"), new DOMException("Timed out", "TimeoutError")]) {
    const fetcher = vi.fn<typeof fetch>().mockRejectedValue(error);
    await expect(requestGeminiTranslation(input, "test-only", fetcher)).rejects.toBe(error);
    expect(fetcher).toHaveBeenCalledTimes(1);
  }
});