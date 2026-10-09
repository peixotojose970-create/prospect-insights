import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const headers = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bootstrap-secret",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};
const expectedUsers = ["Alysson", "Isac", "Yago", "Kauan", "reserva", "reserva2"] as const;
type BootstrapAccount = { username?: unknown; password?: unknown };

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...headers, "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function sameSecret(received: string, expected: string) {
  const a = new TextEncoder().encode(received);
  const b = new TextEncoder().encode(expected);
  let difference = a.length ^ b.length;
  for (let index = 0; index < Math.max(a.length, b.length); index++) {
    difference |= (a[index] ?? 0) ^ (b[index] ?? 0);
  }
  return difference === 0;
}

Deno.serve(async (request: Request) => {
  if (request.method === "OPTIONS") return new Response("ok", { headers });
  if (request.method !== "POST") return json({ error: "Método não permitido." }, 405);

  const bootstrapSecret = Deno.env.get("PROSPECTOR_BOOTSTRAP_SECRET");
  const url = Deno.env.get("SUPABASE_URL");
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!bootstrapSecret) {
    return json({ error: "PROSPECTOR_BOOTSTRAP_SECRET não está configurado. Abra Cloud → Secrets e cadastre esse segredo." }, 503);
  }
  if (!url || !serviceKey) {
    return json({ error: "O Lovable Cloud não disponibilizou as credenciais administrativas necessárias ao backend." }, 503);
  }
  if (!sameSecret(request.headers.get("x-bootstrap-secret") ?? "", bootstrapSecret)) {
    return json({ error: "Segredo administrativo inválido." }, 401);
  }

  let body: { accounts?: BootstrapAccount[] };
  try {
    body = await request.json();
  } catch {
    return json({ error: "Envie os dados das seis contas." }, 400);
  }
  if (!Array.isArray(body.accounts) || body.accounts.length !== expectedUsers.length) {
    return json({ error: "A inicialização exige exatamente as seis contas previstas." }, 400);
  }
  const credentials = new Map<string, string>();
  for (const account of body.accounts) {
    if (typeof account.username !== "string" || typeof account.password !== "string") {
      return json({ error: "Confira os nomes e as senhas das seis contas." }, 400);
    }
    const normalized = account.username.trim().toLowerCase();
    if (credentials.has(normalized) || account.password.length < 12) {
      return json({ error: "Os seis nomes devem ser únicos e cada senha deve ter ao menos 12 caracteres." }, 400);
    }
    credentials.set(normalized, account.password);
  }
  if (expectedUsers.some((username) => !credentials.has(username.toLowerCase()))) {
    return json({ error: "A lista precisa conter Alysson, Isac, Yago, Kauan, reserva e reserva2." }, 400);
  }

  const admin = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const created: string[] = [];
  const updated: string[] = [];
  try {
    const authUsers: Array<{ id: string; email?: string | null; user_metadata?: Record<string, unknown> | null }> = [];
    for (let page = 1; ; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
      if (error) return json({ error: "Não foi possível verificar as identidades existentes." }, 502);
      authUsers.push(...data.users);
      if (data.users.length < 1000) break;
    }

    const accountPlan = expectedUsers.map((username, accountNumber) => {
      const key = username.toLowerCase();
      const email = `${key}@prospector.local`;
      const matches = authUsers.filter((user) =>
        user.email?.toLowerCase() === email ||
        (typeof user.user_metadata?.username === "string" && user.user_metadata.username.trim().toLowerCase() === key),
      );
      return { username, accountNumber, email, password: credentials.get(key)!, match: matches[0], duplicate: matches.length > 1 };
    });
    if (accountPlan.some((account) => account.duplicate)) {
      return json({ error: "Há mais de uma identidade associada a um dos nomes. Nenhuma conta foi alterada; revise as identidades no Cloud." }, 409);
    }
    const matchedIds = accountPlan.flatMap((account) => account.match ? [account.match.id] : []);
    if (new Set(matchedIds).size !== matchedIds.length) {
      return json({ error: "Uma identidade corresponde a mais de um nome. Nenhuma conta foi alterada; revise as identidades no Cloud." }, 409);
    }

    const { data: linkedAccounts, error: linkedError } = await admin
      .from("prospector_accounts")
      .select("account_number,auth_user_id,username");
    if (linkedError) return json({ error: "Não foi possível verificar os vínculos das contas." }, 502);
    for (const account of accountPlan) {
      const conflict = linkedAccounts.find((row) =>
        row.username.toLowerCase() === account.username.toLowerCase() && row.account_number !== account.accountNumber,
      );
      if (conflict) return json({ error: `O vínculo de ${account.username} existe em outra posição; nenhuma senha foi alterada.` }, 409);
    }

    for (const account of accountPlan) {
      let authUserId = account.match?.id;
      if (authUserId) {
        const { error } = await admin.auth.admin.updateUserById(authUserId, {
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: { ...account.match?.user_metadata, username: account.username, must_change_password: true },
        });
        if (error) return json({ error: `Não foi possível atualizar a identidade de ${account.username}.`, created, updated }, 502);
        updated.push(account.username);
      } else {
        const { data, error } = await admin.auth.admin.createUser({
          email: account.email,
          password: account.password,
          email_confirm: true,
          user_metadata: { username: account.username, must_change_password: true },
        });
        if (error || !data.user) return json({ error: `Não foi possível criar a identidade de ${account.username}.`, created, updated }, 502);
        authUserId = data.user.id;
        created.push(account.username);
      }

      const { error: linkError } = await admin.from("prospector_accounts").upsert({
        account_number: account.accountNumber,
        auth_user_id: authUserId,
        username: account.username,
        role: account.accountNumber === 0 ? "admin" : "user",
        active: true,
        updated_at: new Date().toISOString(),
      }, { onConflict: "account_number" });
      if (linkError) return json({ error: `Não foi possível vincular a conta ${account.username}. Execute novamente após revisar os vínculos.`, created, updated }, 502);
    }

    return json({ success: true, created, updated, message: "As senhas não são retornadas nem registradas." });
  } catch {
    return json({ error: "Falha inesperada no provisionamento. Execute novamente para retomar com segurança.", created, updated }, 500);
  }
});
