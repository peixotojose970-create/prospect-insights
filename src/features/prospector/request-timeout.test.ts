import { afterEach, expect, it, vi } from "vitest";
import { withRequestTimeout } from "./request-timeout";
afterEach(() => vi.useRealTimers());
it("encerra uma tradução que nunca responde", async () => {
  vi.useFakeTimers();
  const result = withRequestTimeout(new Promise(() => {}), 65_000);
  const assertion = expect(result).rejects.toThrow("A tradução demorou");
  await vi.advanceTimersByTimeAsync(65_000);
  await assertion;
  expect(vi.getTimerCount()).toBe(0);
});
it("resposta concluída não deixa temporizador ativo", async () => {
  vi.useFakeTimers();
  expect(await withRequestTimeout(Promise.resolve("tradução"), 65_000)).toBe("tradução");
  expect(vi.getTimerCount()).toBe(0);
});