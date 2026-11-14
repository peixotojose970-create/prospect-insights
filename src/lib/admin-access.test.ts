import { expect, it, vi } from "vitest";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import { canManagePlacesLimit } from "./admin-access.server";
function client(result: { data: { role: string } | null; error: unknown }) {
  const eq = vi.fn();
  eq.mockReturnValue({ eq, maybeSingle: async () => result });
  const value = { from: vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) }) };
  return { value: value as unknown as SupabaseClient<Database>, eq };
}
it("ausência de papel administrativo nega edição", async () => {
  const db = client({ data: null, error: null });
  expect(await canManagePlacesLimit(db.value, "user-id")).toBe(false);
  expect(db.eq).toHaveBeenCalledWith("user_id", "user-id");
  expect(db.eq).toHaveBeenCalledWith("role", "admin");
});
it("papel administrativo verificado permite edição", async () => {
  const db = client({ data: { role: "admin" }, error: null });
  expect(await canManagePlacesLimit(db.value, "admin-id")).toBe(true);
});
it("falha de leitura nunca concede administração", async () => {
  const db = client({ data: { role: "admin" }, error: { message: "failure" } });
  await expect(canManagePlacesLimit(db.value, "admin-id")).rejects.toThrow("autorização");
});