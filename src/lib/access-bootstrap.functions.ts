import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import type { Database } from "@/integrations/supabase/types";

export const provisionAccessKeys = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    if (!input || typeof input !== "object" || !("secret" in input) || typeof input.secret !== "string" || input.secret.length > 512) {
      throw new Error("Informe o segredo administrativo.");
    }
    return { secret: input.secret };
  })
  .handler(async ({ data }) => {
    const configuredSecret = process.env.PROSPECTOR_BOOTSTRAP_SECRET;
    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!configuredSecret || !url || !serviceKey) throw new Error("Provisionamento indisponível: configure PROSPECTOR_BOOTSTRAP_SECRET e as credenciais administrativas do Supabase no ambiente seguro do servidor.");
    const supplied = Buffer.from(data.secret);
    const expected = Buffer.from(configuredSecret);
    if (!expected.length || supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) throw new Error("Segredo administrativo inválido.");

    const admin = createClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: existing, error: lookupError } = await admin.from("prospector_access_keys").select("account_number").limit(6);
    if (lookupError) throw new Error("Não foi possível verificar o estado do provisionamento.");
    if (existing?.length) throw new Error("O provisionamento já foi iniciado. Por segurança, as chaves não podem ser exibidas novamente.");

    const issued: { account: number; key: string }[] = [];
    for (let account = 1; account <= 5; account++) {
      const key = `pr_${randomBytes(32).toString("base64url")}`;
      const email = `prospector-account-${account}@accounts.invalid`;
      const password = randomBytes(48).toString("base64url");
      const { data: userData, error: userError } = await admin.auth.admin.createUser({ email, password, email_confirm: true, user_metadata: { prospector_account_number: account } });
      if (userError || !userData.user) throw new Error(`Falha ao criar a identidade da Conta ${account}. Consulte o administrador antes de tentar novamente.`);
      const { error: insertError } = await admin.from("prospector_access_keys").insert({ account_number: account, auth_user_id: userData.user.id, key_hash: createHash("sha256").update(key).digest("hex"), active: true });
      if (insertError) throw new Error(`Falha ao cadastrar a Conta ${account}. Consulte o administrador; não repita o provisionamento automaticamente.`);
      issued.push({ account, key });
    }
    return { keys: issued };
  });
