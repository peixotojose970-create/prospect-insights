import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { createHash } from "node:crypto";
import type { Database } from "@/integrations/supabase/types";

const attempts = new Map<string, { count: number; until: number }>();

export const loginWithAccessKey = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    if (!input || typeof input !== "object" || !("key" in input) || typeof input.key !== "string" || input.key.length > 512) {
      throw new Error("Chave inválida.");
    }
    return { key: input.key.trim() };
  })
  .handler(async ({ data }) => {
    const address = (await import("@tanstack/react-start/server")).getRequest()?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const now = Date.now();
    const entry = attempts.get(address);
    if (entry && entry.until > now && entry.count >= 8) throw new Error("Muitas tentativas. Aguarde alguns minutos.");
    if (!entry || entry.until <= now) attempts.set(address, { count: 1, until: now + 10 * 60_000 });
    else entry.count++;

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const anonKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !serviceKey || !anonKey) throw new Error("A autenticação segura ainda não está configurada no ambiente do servidor.");

    const admin = createClient<Database>(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const hash = createHash("sha256").update(data.key).digest("hex");
    const { data: records, error } = await admin.from("prospector_access_keys").select("id, auth_user_id, active, revoked_at").eq("key_hash", hash).limit(1);
    if (error || !records?.length || !records[0].active || records[0].revoked_at || !records[0].auth_user_id) throw new Error("Chave inválida ou desativada.");

    const { data: userResult, error: userError } = await admin.auth.admin.getUserById(records[0].auth_user_id);
    if (userError || !userResult.user?.email || userResult.user.deleted_at) throw new Error("A conta não está habilitada para autenticação.");
    const { data: link, error: linkError } = await admin.auth.admin.generateLink({ type: "magiclink", email: userResult.user.email });
    if (linkError || !link.properties?.hashed_token) throw new Error("Não foi possível iniciar uma sessão segura.");
    const client = createClient<Database>(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: session, error: sessionError } = await client.auth.verifyOtp({ email: userResult.user.email, token_hash: link.properties.hashed_token, type: "email" });
    if (sessionError || !session.session) throw new Error("Não foi possível criar uma sessão segura.");
    return { access_token: session.session.access_token, refresh_token: session.session.refresh_token, expires_at: session.session.expires_at };
  });
