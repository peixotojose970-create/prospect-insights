import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
export function InternationalAccess() {
  const [signedIn, setSignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => setSignedIn(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, session) => setSignedIn(!!session));
    return () => data.subscription.unsubscribe();
  }, []);
  if (signedIn) return null;
  const submit = async (signup: boolean) => {
    setBusy(true); setMessage("");
    try {
      const result = signup ? await supabase.auth.signUp({ email, password, options: { emailRedirectTo: window.location.origin } }) : await supabase.auth.signInWithPassword({ email, password });
      setMessage(result.error ? result.error.message : signup ? "Confira seu e-mail para confirmar a conta antes de entrar." : "Acesso confirmado.");
    } catch { setMessage("Não foi possível entrar. Tente novamente."); }
    finally { setBusy(false); }
  };
  return <section className="space-y-3 border-y border-border py-4" aria-label="Acesso à pesquisa internacional">
    <p className="text-sm text-muted-foreground">Entre para pesquisar no exterior. Consultas do Google Maps são cobradas e buscas ampliadas podem aumentar o custo.</p>
    <div className="grid gap-3 sm:grid-cols-2"><div><Label htmlFor="international-email">E-mail</Label><Input id="international-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} /></div><div><Label htmlFor="international-password">Senha</Label><Input id="international-password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} /></div></div>
    <div className="flex flex-wrap gap-2"><Button disabled={busy || !email || password.length < 6} onClick={() => void submit(false)}>Entrar</Button><Button variant="outline" disabled={busy || !email || password.length < 6} onClick={() => void submit(true)}>Criar conta</Button></div>
    {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
  </section>;
}