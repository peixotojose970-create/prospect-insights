import { beforeEach, expect, it, vi } from "vitest";
const rpc = vi.hoisted(() => vi.fn());
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc } }));
import { chargePlacesCall, UsageBlockedError } from "./places-usage.server";
beforeEach(() => rpc.mockReset());
it("recusa chamada quando a reserva falha", async () => {
  rpc.mockResolvedValue({ data: null, error: { message: "failure" } });
  await expect(chargePlacesCall()).rejects.toThrow("Nenhuma nova chamada");
});
it("bloqueia em 95 por cento do limite sem nova reserva", async () => {
  rpc.mockResolvedValue({ data: [{ allowed: false, calls: 950, monthly_limit: 1000 }], error: null });
  await expect(chargePlacesCall()).rejects.toBeInstanceOf(UsageBlockedError);
  expect(rpc).toHaveBeenCalledWith("reserve_places_call");
});
it("aceita reserva confirmada pelo banco", async () => {
  rpc.mockResolvedValue({ data: [{ allowed: true, calls: 949, monthly_limit: 1000 }], error: null });
  await expect(chargePlacesCall()).resolves.toBeUndefined();
});