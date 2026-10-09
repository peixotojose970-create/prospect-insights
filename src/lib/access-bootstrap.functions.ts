import { createServerFn } from "@tanstack/react-start";

export const provisionAccessKeys = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => {
    if (!input || typeof input !== "object" || !("secret" in input) || typeof input.secret !== "string" || input.secret.length > 512) {
      throw new Error("Informe o segredo administrativo.");
    }
    return { secret: input.secret };
  })
  .handler(async ({ data }) => {
    const url = process.env.SUPABASE_URL;
    const publicKey = process.env.SUPABASE_PUBLISHABLE_KEY;
    if (!url || !publicKey) throw new Error("O Lovable Cloud ainda não está conectado a esta função do servidor.");
    const response = await fetch(`${url.replace(/\/+$/, "")}/functions/v1/prospect-bootstrap`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: publicKey,
        "x-prospector-bootstrap-secret": data.secret,
      },
      body: "{}",
    });
    const result = await response.json().catch(() => ({})) as { keys?: { account: number; key: string }[]; error?: string };
    if (!response.ok || !result.keys) throw new Error(result.error ?? "Não foi possível concluir o provisionamento.");
    return { keys: result.keys };
  });
