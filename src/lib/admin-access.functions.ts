import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getPlacesAdminAccess = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { canManagePlacesLimit } = await import("./admin-access.server");
    return { canEdit: await canManagePlacesLimit(context.supabase, context.userId) };
  });