import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });
async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond({ error: "Método não permitido." }, 405);
  try {
    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return respond({ error: "O ambiente gerenciado do Cloud não está disponível." }, 503);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const body = await request.json() as { action?: string; key?: string; keyId?: string };

    if (body.action === "login") {
      if (typeof body.key !== "string" || body.key.length < 8 || body.key.length > 512) return respond({ error: "Chave inválida." }, 400);
      const { data: rows, error } = await admin.from("prospector_access_keys").select("id, auth_user_id, active, revoked_at").eq("key_hash", await digest(body.key.trim())).limit(1);
      const record = rows?.[0];
      if (error || !record || !record.active || record.revoked_at || !record.auth_user_id) return respond({ error: "Chave inválida ou desativada." }, 401);
      const { data: found, error: userError } = await admin.auth.admin.getUserById(record.auth_user_id);
      if (userError || !found.user?.email || found.user.deleted_at) return respond({ error: "A conta não está habilitada para autenticação." }, 401);
      const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email: found.user.email });
      if (linkError || !link.properties?.hashed_token) return respond({ error: "Não foi possível iniciar uma sessão segura." }, 500);
      const publicKey = Deno.env.get("SUPABASE_ANON_KEY") ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY");
      if (!publicKey) return respond({ error: "A autenticação gerenciada não está disponível." }, 503);
      const client = createClient(url, publicKey, { auth: { persistSession: false, autoRefreshToken: false } });
      const { data: result, error: sessionError } = await client.auth.verifyOtp({ email: found.user.email, token_hash: link.properties.hashed_token, type: "email" });
      if (sessionError || !result.session) return respond({ error: "Não foi possível criar uma sessão segura." }, 500);
      return respond({ access_token: result.session.access_token, refresh_token: result.session.refresh_token, expires_at: result.session.expires_at });
    }

    if (body.action === "revoke") {
      const authorization = request.headers.get("Authorization") ?? "";
      const token = authorization.replace(/^Bearer\s+/i, "");
      if (!token || token === authorization) return respond({ error: "Sessão administrativa obrigatória." }, 401);
      const { data: caller, error: callerError } = await admin.auth.getUser(token);
      if (callerError || !caller.user || caller.user.user_metadata?.prospector_admin !== true || caller.user.user_metadata?.prospector_account_number !== 0) return respond({ error: "Apenas a conta administradora pode revogar chaves." }, 403);
      if (typeof body.keyId !== "string") return respond({ error: "Identificador de chave inválido." }, 400);
      const { data: target, error: targetError } = await admin.from("prospector_access_keys").select("id, auth_user_id, account_number").eq("id", body.keyId).limit(1);
      if (targetError || !target?.[0] || target[0].account_number === 0 || !target[0].auth_user_id) return respond({ error: "Chave não encontrada ou não revogável." }, 404);
      const { error: updateError } = await admin.from("prospector_access_keys").update({ active: false, revoked_at: new Date().toISOString() }).eq("id", body.keyId);
      if (updateError) return respond({ error: "Não foi possível revogar a chave." }, 500);
      const { error: signOutError } = await admin.auth.admin.signOut(target[0].auth_user_id, "global");
      if (signOutError) return respond({ error: "A chave foi desativada, mas não foi possível encerrar as sessões existentes." }, 500);
      return respond({ revoked: true });
    }
    return respond({ error: "Operação inválida." }, 400);
  } catch {
    return respond({ error: "Não foi possível concluir a operação." }, 500);
  }
});
