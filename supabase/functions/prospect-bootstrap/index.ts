import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-prospector-bootstrap-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" } });

async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
function randomKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `pr_${btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")}`;
}
async function removeUsers(admin: ReturnType<typeof createClient>, ids: string[]) {
  await Promise.all(ids.map((id) => admin.auth.admin.deleteUser(id)));
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond({ error: "Método não permitido." }, 405);
  try {
    const configured = Deno.env.get("PROSPECTOR_BOOTSTRAP_SECRET");
    if (!configured) return respond({ error: "Segredo de inicialização ainda não configurado no Lovable Cloud." }, 503);
    const supplied = request.headers.get("x-prospector-bootstrap-secret") ?? "";
    if (await digest(configured) !== await digest(supplied)) return respond({ error: "Segredo administrativo inválido." }, 401);

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return respond({ error: "O ambiente gerenciado do Lovable Cloud não está disponível." }, 503);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });

    const { data: existing, error: lookupError } = await admin.from("prospector_access_keys").select("id").limit(1);
    if (lookupError) return respond({ error: "Não foi possível verificar o estado da inicialização." }, 500);
    if (existing?.length) return respond({ error: "A inicialização já foi realizada. Por segurança, as chaves não podem ser recuperadas nem geradas novamente." }, 409);

    const issued = [0, 1, 2, 3, 4, 5].map((account) => ({ account, key: randomKey() }));
    const userIds: string[] = [];
    for (const { account } of issued) {
      const { data, error } = await admin.auth.admin.createUser({
        email: `prospector-account-${account}@accounts.invalid`,
        password: `${randomKey()}${randomKey()}`,
        email_confirm: true,
        user_metadata: { prospector_account_number: account, prospector_admin: account === 0 },
      });
      if (error || !data.user) {
        await removeUsers(admin, userIds);
        return respond({ error: `Não foi possível criar a identidade da Conta ${account}. Nenhuma chave foi gravada; confira o estado e tente novamente.` }, 500);
      }
      userIds.push(data.user.id);
    }

    const rows = await Promise.all(issued.map(async ({ account, key }, index) => ({
      account_number: account,
      auth_user_id: userIds[index],
      key_hash: await digest(key),
      active: true,
    })));
    const { error: insertError } = await admin.from("prospector_access_keys").insert(rows);
    if (insertError) {
      await removeUsers(admin, userIds);
      return respond({ error: "Não foi possível gravar as seis chaves. As identidades temporárias foram removidas; nenhuma chave foi entregue." }, 500);
    }
    return respond({ keys: issued });
  } catch {
    return respond({ error: "Não foi possível concluir o provisionamento." }, 500);
  }
});
