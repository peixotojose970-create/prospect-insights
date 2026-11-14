import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export async function canManagePlacesLimit(supabase: SupabaseClient<Database>, userId: string) {
  const { data, error } = await supabase.from("user_roles").select("role").eq("user_id", userId).eq("role", "admin").maybeSingle();
  if (error) throw new Error("Não foi possível verificar a autorização administrativa.");
  return data?.role === "admin";
}