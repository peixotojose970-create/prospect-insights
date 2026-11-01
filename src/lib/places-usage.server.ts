/**
 * Controle de custo da Places API: cada chamada ao Google é contada no banco, por mês.
 * Aviso em 90% do limite mensal e bloqueio a partir de 95%.
 */
export const WARN_RATIO = 0.9;
export const BLOCK_RATIO = 0.95;

export function currentMonth() {
  return new Date().toISOString().slice(0, 7);
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export async function readUsage() {
  const db = await admin();
  const month = currentMonth();
  const [{ data: usage }, { data: settings }] = await Promise.all([
    db.from("places_api_usage").select("calls").eq("month", month).maybeSingle(),
    db.from("places_api_settings").select("monthly_limit").eq("id", 1).maybeSingle(),
  ]);
  const limit = settings?.monthly_limit ?? 1000;
  const calls = usage?.calls ?? 0;
  return { month, calls, limit, warnAt: Math.floor(limit * WARN_RATIO), blockAt: Math.floor(limit * BLOCK_RATIO) };
}

export class UsageBlockedError extends Error {
  constructor(public calls: number, public blockAt: number) {
    super(`Limite mensal de buscas atingido (${calls} chamadas). Aumente o limite em Configurações.`);
  }
}

/** Bloqueia antes de gastar e registra a chamada ao Google. */
export async function chargePlacesCall() {
  const usage = await readUsage();
  if (usage.calls >= usage.blockAt) throw new UsageBlockedError(usage.calls, usage.blockAt);
  const db = await admin();
  await db.rpc("increment_places_usage", { p_month: usage.month, p_calls: 1 });
}

export async function writeLimit(limit: number) {
  const db = await admin();
  await db.from("places_api_settings").upsert({ id: 1, monthly_limit: limit, updated_at: new Date().toISOString() });
}
