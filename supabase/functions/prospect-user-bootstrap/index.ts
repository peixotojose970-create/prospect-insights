import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bootstrap-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const expectedUsers = ["Alysson", "Isac", "Yago", "Kauan", "reserva", "reserva2"] as const;

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const bootstrapSecret = Deno.env.get("PROSPECTOR_BOOTSTRAP_SECRET");
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!bootstrapSecret || !url || !serviceKey) return json({ error: "Provisionamento indisponível: configure os segredos do serviço." }, 503);
  if (request.headers.get("x-bootstrap-secret") !== bootstrapSecret) return json({ error: "Não autorizado." }, 401);

  let body: { accounts?: Array<{ username?: string; password?: string }> };
  try { body = await request.json(); } catch { return json({ error: "Envie uma lista válida de contas." }, 400); }
  if (!Array.isArray(body.accounts) || body.accounts.length !== expectedUsers.length) return json({ error: "A inicialização exige exatamente as seis contas previstas." }, 400);
  const byName = new Map(body.accounts.map((account) => [account.username?.trim().toLowerCase(), account.password]));
  if (expectedUsers.some((name) => typeof byName.get(name.toLowerCase()) !== "string" || (byName.get(name.toLowerCase()) as string).length < 12)) {
    return json({ error: "Confira os nomes e use senhas com pelo menos 12 caracteres." }, 400);
  }

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const created: string[] = [];
  const existing: string[] = [];
  try {
    for (const [index, username] of expectedUsers.entries()) {
      const email = `${username.toLowerCase()}@prospector.local`;
      const { data: list, error: listError } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
      if (listError) return json({ error: "Não foi possível verificar as contas." }, 502);
      if (list.users.some((user) => user.email?.toLowerCase() === email)) {
        existing.push(username);
        continue;
      }
      const { error: createError } = await admin.auth.admin.createUser({
        email,
        password: byName.get(username.toLowerCase())!,
        email_confirm: true,
        user_metadata: { username, prospector_account_number: index, prospector_role: index === 0 ? "admin" : "user", must_change_password: true },
      });
      if (createError) return json({ error: `Não foi possível concluir o provisionamento (${username}).`, created, existing }, 502);
      created.push(username);
    }
    return json({ success: true, created, existing, message: "Credenciais não são retornadas nem registradas." });
  } catch {
    return json({ error: "Falha inesperada ao provisionar as contas.", created, existing }, 500);
  }
});
