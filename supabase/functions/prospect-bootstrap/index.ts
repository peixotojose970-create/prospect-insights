import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const respond = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, "Content-Type": "application/json" } });

async function digest(value: string) {
  const bytes = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function randomKey() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return `pr_${btoa(String.fromCharCode(...bytes)).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "")}`;
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (request.method !== "POST") return respond({ error: "Método não permitido." }, 405);
  try {
    const configured = Deno.env.get("PROSPECTOR_BOOTSTRAP_SECRET");
    if (!configured) return respond({ error: "Segredo de inicialização ainda não configurado no Cloud." }, 503);
    const supplied = request.headers.get("x-prospector-bootstrap-secret") ?? "";
    // Comparing fixed-size digests avoids exposing the configured value in logs or a direct comparison.
    if (await digest(configured) !== await digest(supplied)) return respond({ error: "Segredo administrativo inválido." }, 401);

    const url = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!url || !serviceKey) return respond({ error: "O ambiente gerenciado do Cloud não está disponível." }, 503);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: existing, error: lookupError } = await admin.from("prospector_access_keys").select("id").limit(1);
    if (lookupError) return respond({ error: "Não foi possível verificar o provisionamento." }, 500);
    if (existing?.length) return respond({ error: "O provisionamento já foi iniciado. As chaves não podem ser exibidas novamente." }, 409);

    const issued: { account: number; key: string }[] = [];
    for (const account of [0, 1, 2, 3, 4, 5]) {
      const key = randomKey();
      const email = `prospector-account-${account}@accounts.invalid`;
      const password = randomKey() + randomKey();
      const { data: created, error: createError } = await admin.auth.admin.createUser({
        email, password, email_confirm: true, user_metadata: { prospector_account_number: account, prospector_admin: account === 0 },
      });
      if (createError || !created.user) return respond({ error: `Falha ao criar a identidade da Conta ${account}. A inicialização foi interrompida; não repita sem verificar o estado.` }, 500);
      const { error: insertError } = await admin.from("prospector_access_keys").insert({
        account_number: account, auth_user_id: created.user.id, key_hash: await digest(key), active: true,
      });
      if (insertError) return respond({ error: `Falha ao cadastrar a Conta ${account}. A inicialização foi interrompida; não repita sem verificar o estado.` }, 500);
      issued.push({ account, key });
    }
    return respond({ keys: issued });
  } catch {
    return respond({ error: "Não foi possível concluir o provisionamento." }, 500);
  }
});
