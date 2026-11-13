import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
const schema = z.object({ country: z.enum(["BR", "US", "PT", "ES", "FR", "IT"]), countries: z.record(z.enum(["BR", "US", "PT", "ES", "FR", "IT"]), z.object({ style: z.string().min(1).max(200), language: z.enum(["auto", "pt", "pt-PT", "es", "fr", "it", "en"]) })) });
export const readProspectingPreferences = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data, error } = await context.supabase.from("prospecting_preferences").select("selected_country,countries").eq("user_id", context.userId).maybeSingle();
  if (error) throw new Error("Não foi possível recuperar suas preferências salvas.");
  return data ? { country: data.selected_country, countries: data.countries } : null;
});
export const saveProspectingPreferences = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((data: unknown) => schema.parse(data)).handler(async ({ data, context }) => {
  const { error } = await context.supabase.from("prospecting_preferences").upsert({ user_id: context.userId, selected_country: data.country, countries: data.countries, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) throw new Error("Não foi possível salvar suas preferências na conta. Tente novamente.");
  return { ok: true };
});