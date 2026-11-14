import { expect, it } from "vitest";
import { translationFailureMessage } from "./translation-errors";

it("payment_required requires credit recovery, not a provider switch or automatic retry", () => {
  const message = translationFailureMessage({ code: "payment_required", httpStatus: 402 });
  expect(message).toContain("créditos");
  expect(message).toContain("HTTP 402");
  expect(message).not.toContain("Tente novamente.");
});
it("distinguishes authorization from billing", () => {
  expect(translationFailureMessage({ code: "permission_denied", httpStatus: 403 })).toContain("permissões");
  expect(translationFailureMessage({ code: "permission_denied", httpStatus: 403 })).not.toContain("adicionar créditos");
});