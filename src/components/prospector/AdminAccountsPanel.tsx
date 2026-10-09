import { useCallback, useEffect, useState } from "react";
import { RefreshCw, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

type Account = { account_number: number; username: string; role: string; active: boolean };
export function AdminAccountsPanel() {
  const [admin, setAdmin] = useState(false);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [passwords, setPasswords] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState(false);
  const callAdmin = useCallback(async (payload: Record<string, unknown>) => {
    const { data, error } = await supabase.functions.invoke("prospector-admin", { body: payload });
    if (error || data?.error) throw new Error(data?.error || "A operação administrativa falhou.");
    return data;
  }, []);
  const refresh = useCallback(async () => {
    try {
      const result = await callAdmin({ action: "list" });
      setAccounts(result.accounts ?? []);
      setAdmin(true);
    } catch { setAdmin(false); }
  }, [callAdmin]);
  useEffect(() => { void refresh(); }, [refresh]);
  if (!admin) return null;
  const setActive = async (account: Account) => {
    setBusy(true);
    try { await callAdmin({ action: "active", account_number: account.account_number, active: !account.active }); await refresh(); toast.success(account.active ? "Conta desativada." : "Conta ativada."); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao atualizar a conta."); }
    finally { setBusy(false); }
  };
  const resetPassword = async (account: Account) => {
    const password = passwords[account.account_number] ?? "";
    if (password.length < 12) { toast.error("A nova senha deve ter pelo menos 12 caracteres."); return; }
    setBusy(true);
    try { await callAdmin({ action: "reset_password", account_number: account.account_number, password }); setPasswords((prev) => ({ ...prev, [account.account_number]: "" })); toast.success(`Senha redefinida para ${account.username}.`); }
    catch (error) { toast.error(error instanceof Error ? error.message : "Falha ao redefinir a senha."); }
    finally { setBusy(false); }
  };
  return <Card className="gap-4 p-5"><div className="flex items-center gap-2"><ShieldCheck className="size-4 text-primary"/><div><h2 className="text-sm font-semibold">Gerenciar contas</h2><p className="text-xs text-muted-foreground">Ative ou desative acessos e redefina senhas. As senhas nunca são exibidas.</p></div><Button className="ml-auto" variant="outline" size="icon" disabled={busy} onClick={() => void refresh()} aria-label="Atualizar contas"><RefreshCw className="size-4"/></Button></div>
    <div className="space-y-3">{accounts.map((account) => <div key={account.account_number} className="grid gap-3 rounded-lg border border-border p-3 sm:grid-cols-[1fr_auto] sm:items-center"><div><p className="text-sm font-medium">{account.username} <span className="text-xs text-muted-foreground">{account.role === "admin" ? "· Administrador" : "· Usuário"}</span></p><p className="text-xs text-muted-foreground">{account.active ? "Acesso ativo" : "Acesso desativado"}</p></div><div className="flex flex-wrap items-end gap-2"><Button variant="outline" size="sm" disabled={busy || account.role === "admin"} onClick={() => void setActive(account)}>{account.active ? "Desativar" : "Ativar"}</Button><div className="flex items-end gap-2"><div className="space-y-1"><Label className="text-xs" htmlFor={`reset-${account.account_number}`}>Nova senha</Label><Input id={`reset-${account.account_number}`} type="password" autoComplete="new-password" minLength={12} className="h-9 w-36" value={passwords[account.account_number] ?? ""} onChange={(event) => setPasswords((prev) => ({ ...prev, [account.account_number]: event.target.value }))}/></div><Button size="sm" disabled={busy} onClick={() => void resetPassword(account)}>Redefinir</Button></div></div></div>)}</div>
  </Card>;
}
