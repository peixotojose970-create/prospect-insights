import { expect, it } from "vitest";
import { operationSubjects } from "./operation-subjects";
it("uses verified identity separately from origin", async () => {
  const value = await operationSubjects("00000000-0000-0000-0000-000000000001", "https://prospector2026kl.lovable.app");
  expect(value.user).toBe("user:00000000-0000-0000-0000-000000000001");
  expect(value.origin).toMatch(/^origin:[a-f0-9]{64}$/);
});
it("anonymous and absent origins share bounded fallback buckets", async () => {
  const first = await operationSubjects(undefined, null);
  const second = await operationSubjects(undefined, null);
  expect(first.user).toBe("anonymous");
  expect(first).toEqual(second);
});