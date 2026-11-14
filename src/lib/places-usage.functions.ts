import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type PlacesUsage = { month: string; calls: number; limit: number; warnAt: number; blockAt: number };

export const getPlacesUsage = createServerFn({ method: "GET" }).handler(async (): Promise<PlacesUsage> => {
  const { enforceOperationLimit } = await import("./operation-limit.server");
  await enforceOperationLimit("usage");
  const { readUsage } = await import("./places-usage.server");
  return readUsage();
});

export const setPlacesLimit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ limit: z.number().int().min(10).max(1_000_000) }).parse(data))
  .handler(async ({ data, context }): Promise<PlacesUsage> => {
    const { canManagePlacesLimit } = await import("./admin-access.server");
    if (!(await canManagePlacesLimit(context.supabase, context.userId))) throw new Error("Somente um administrador pode alterar o limite mensal.");
    const { error } = await context.supabase.rpc("set_places_limit_authorized", { p_limit: data.limit });
    if (error) throw new Error("Não foi possível salvar o limite mensal com segurança.");
    const { readUsage } = await import("./places-usage.server");
    return readUsage();
  });
