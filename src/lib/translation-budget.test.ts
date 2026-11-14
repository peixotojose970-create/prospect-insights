import { expect, it } from "vitest";
import { TRANSLATION_TIMEOUT_MS, translationAttemptLimit } from "./translation-budget";
it("tradução normal não repete geração paga automaticamente", () => {
  expect(translationAttemptLimit(false)).toBe(1);
  expect(TRANSLATION_TIMEOUT_MS).toBe(55000);
});
it("preserva o caminho legado rápido", () => expect(translationAttemptLimit(true)).toBe(2));