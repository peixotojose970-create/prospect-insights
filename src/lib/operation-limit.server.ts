import { getRequest } from "@tanstack/react-start/server";
import { operationSubjects } from "./operation-subjects";

export type PublicOperation = "search" | "details" | "photos" | "translate" | "audit" | "usage";

export async function enforceOperationLimit(operation: PublicOperation) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const request = getRequest();
  const authorization = request.headers.get("authorization");
  let userId: string | undefined;
  if (authorization) {
    if (!authorization.startsWith("Bearer ") || authorization.length > 12000) throw new Error("Acesso inválido. Entre novamente.");
    const result = await supabaseAdmin.auth.getUser(authorization.slice(7));
    if (result.error || !result.data.user) throw new Error("Acesso expirado. Entre novamente.");
    userId = result.data.user.id;
  }
  const subjects = await operationSubjects(userId, request.headers.get("origin"));
  const { data, error } = await supabaseAdmin.rpc("reserve_scoped_operation", { p_operation: operation, p_user: subjects.user, p_origin: subjects.origin });
  if (error) throw new Error("Não foi possível verificar o limite de solicitações. Tente novamente mais tarde.");
  if (data !== true) throw new Error("Muitas solicitações simultâneas. Aguarde um minuto antes de tentar novamente.");
}