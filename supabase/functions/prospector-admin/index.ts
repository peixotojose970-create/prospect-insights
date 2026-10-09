import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };
Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: cors });
  const respond = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "no-store" } });
  if (request.method !== "POST") return respond({ error: "Método não permitido." }, 405);
  const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authorization = request.headers.get("Authorization");
  if (!url || !key || !authorization) return respond({ error: "Sessão necessária." }, 401);
  const admin = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
  const bearer = authorization.replace(/^Bearer\s+/i, "");
  const { data: userData, error: authError } = await admin.auth.getUser(bearer);
  if (authError || !userData.user) return respond({ error: "Sessão inválida." }, 401);
  const { data: caller } = await admin.from("prospector_accounts").select("role,active").eq("auth_user_id", userData.user.id).maybeSingle();
  if (caller?.role !== "admin" || !caller.active) return respond({ error: "Acesso administrativo não autorizado." }, 403);
  let body: { action?: string; account_number?: number; active?: boolean; password?: string };
  try { body = await request.json(); } catch { return respond({ error: "Solicitação inválida." }, 400); }
  if (body.action === "list") {
    const { data, error } = await admin.from("prospector_accounts").select("account_number,username,role,active,created_at").order("account_number");
    return error ? respond({ error: "Não foi possível listar as contas." }, 500) : respond({ accounts: data });
  }
  if (!Number.isInteger(body.account_number) || body.account_number! < 0 || body.account_number! > 5) return respond({ error: "Conta inválida." }, 400);
  const { data: target } = await admin.from("prospector_accounts").select("auth_user_id,role").eq("account_number", body.account_number!).maybeSingle();
  if (!target) return respond({ error: "Conta não encontrada." }, 404);
  if (body.action === "active" && typeof body.active === "boolean") {
    if (target.role === "admin" && !body.active) return respond({ error: "A conta administradora não pode ser desativada por esta tela." }, 400);
    const { error } = await admin.from("prospector_accounts").update({ active: body.active }).eq("account_number", body.account_number!);
    return error ? respond({ error: "Não foi possível atualizar a conta." }, 500) : respond({ success: true });
  }
  if (body.action === "reset_password" && typeof body.password === "string" && body.password.length >= 12) {
    const { error } = await admin.auth.admin.updateUserById(target.auth_user_id, { password: body.password });
    return error ? respond({ error: "Não foi possível redefinir a senha." }, 500) : respond({ success: true });
  }
  return respond({ error: "Ação inválida." }, 400);
});
