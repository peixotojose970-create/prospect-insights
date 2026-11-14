import { expect, it, vi } from "vitest";
import { enforceOperationLimit } from "./operation-limit.server";
const rpc = vi.hoisted(() => vi.fn());
vi.mock("@tanstack/react-start/server", () => ({ getRequest: () => new Request("http://localhost:8080") }));
vi.mock("@/integrations/supabase/client.server", () => ({ supabaseAdmin: { rpc } }));
it("allows only a confirmed atomic reservation", async () => {
  rpc.mockResolvedValue({ data: true, error: null });
  await enforceOperationLimit("search");
  expect(rpc).toHaveBeenCalledWith("reserve_scoped_operation", expect.objectContaining({ p_operation: "search", p_user: "anonymous", p_origin: expect.stringMatching(/^origin:[a-f0-9]{64}$/) }));
});
it("fails closed when accounting is unavailable", async () => {
  rpc.mockResolvedValue({ data: true, error: { message: "unavailable" } });
  await expect(enforceOperationLimit("audit")).rejects.toThrow("verificar");
});
it("denies exhausted or absent reservations", async () => {
  for (const data of [false, null]) {
    rpc.mockResolvedValue({ data, error: null });
    await expect(enforceOperationLimit("translate")).rejects.toThrow("Aguarde");
  }
});