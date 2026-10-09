import { supabase } from "@/integrations/supabase/client";

export type AccessSession = {
  access_token: string;
  refresh_token: string;
  expires_at: number;
};

export async function loginWithAccessKey(input: { data: { key: string } }): Promise<AccessSession> {
  const { data, error } = await supabase.functions.invoke<AccessSession>("prospect-auth", {
    body: { action: "login", key: input.data.key.trim() },
  });
  if (error) throw new Error("Não foi possível validar a chave no serviço de autenticação.");
  if (!data?.access_token || !data.refresh_token || !data.expires_at) {
    throw new Error("O serviço não retornou uma sessão autenticada válida.");
  }
  return data;
}

export async function revokeAccessKey(keyId: string): Promise<void> {
  const { data, error } = await supabase.functions.invoke<{ revoked: boolean }>("prospect-auth", {
    body: { action: "revoke", keyId },
  });
  if (error || !data?.revoked) throw new Error("Não foi possível revogar esta chave.");
}
