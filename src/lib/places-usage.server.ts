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
  const [usageResult, settingsResult] = await Promise.all([
    db.from("places_api_usage").select("calls").eq("month", month).maybeSingle(),
    db.from("places_api_settings").select("monthly_limit").eq("id", 1).maybeSingle(),
  ]);
  if (usageResult.error || settingsResult.error || !settingsResult.data) throw new Error("Não foi possível consultar o consumo. Novas chamadas dependem da confirmação do orçamento.");
  const usage = usageResult.data;
  const limit = settingsResult.data.monthly_limit;
  const calls = usage?.calls ?? 0;
  return { month, calls, limit, warnAt: Math.floor(limit * WARN_RATIO), blockAt: Math.floor(limit * BLOCK_RATIO) };
}

export class UsageBlockedError extends Error {
  constructor(public calls: number, public blockAt: number) {
    super(`Limite mensal de buscas atingido (${calls} chamadas). Um administrador pode revisar o limite em Configurações.`);
  }
}

/** Registra a chamada ao Google. */
export async function chargePlacesCall() {
  const db = await admin();
  const { data, error } = await db.rpc("reserve_places_call");
  const reservation = data?.[0];
  if (error || !reservation) throw new Error("Não foi possível reservar o consumo. Nenhuma nova chamada ao Google foi realizada.");
  // Sem limite: o consumo é apenas registrado, nunca bloqueia buscas.
}
