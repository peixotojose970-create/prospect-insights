export type PublicOperation = "search" | "details" | "photos" | "translate" | "audit" | "usage";

export async function enforceOperationLimit(operation: PublicOperation) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("reserve_public_operation", { p_operation: operation });
  if (error) throw new Error("Não foi possível verificar o limite de solicitações. Tente novamente mais tarde.");
  if (data !== true) throw new Error("Muitas solicitações simultâneas. Aguarde um minuto antes de tentar novamente.");
}