-- Isola dados e adiciona administração de contas
-- Aplicada no Lovable Cloud pela extensão, com autorização do usuário.
-- Registrada por GeckoAI em 2026-10-09T02:44:19.573Z

CREATE TABLE IF NOT EXISTS public.prospector_accounts (
  account_number smallint PRIMARY KEY CHECK (account_number BETWEEN 0 AND 5),
  auth_user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  username text NOT NULL UNIQUE,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('admin','user')),
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prospector_accounts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can read own Prospector account" ON public.prospector_accounts;
CREATE POLICY "Users can read own Prospector account" ON public.prospector_accounts FOR SELECT TO authenticated USING (auth_user_id = auth.uid() AND active = true);
DROP POLICY IF EXISTS "Admin can manage Prospector accounts" ON public.prospector_accounts;
CREATE POLICY "Admin can manage Prospector accounts" ON public.prospector_accounts FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.prospector_accounts me WHERE me.auth_user_id = auth.uid() AND me.role = 'admin' AND me.active = true)
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.prospector_accounts me WHERE me.auth_user_id = auth.uid() AND me.role = 'admin' AND me.active = true)
);
DROP POLICY IF EXISTS "Account users read own Prospector data" ON public.prospector_account_data;
CREATE POLICY "Account users read own Prospector data" ON public.prospector_account_data FOR SELECT TO authenticated USING (
 EXISTS (SELECT 1 FROM public.prospector_accounts a WHERE a.account_number = prospector_account_data.account_number AND a.auth_user_id = auth.uid() AND a.active = true)
);
DROP POLICY IF EXISTS "Account users insert own Prospector data" ON public.prospector_account_data;
CREATE POLICY "Account users insert own Prospector data" ON public.prospector_account_data FOR INSERT TO authenticated WITH CHECK (
 EXISTS (SELECT 1 FROM public.prospector_accounts a WHERE a.account_number = prospector_account_data.account_number AND a.auth_user_id = auth.uid() AND a.active = true)
);
DROP POLICY IF EXISTS "Account users update own Prospector data" ON public.prospector_account_data;
CREATE POLICY "Account users update own Prospector data" ON public.prospector_account_data FOR UPDATE TO authenticated USING (
 EXISTS (SELECT 1 FROM public.prospector_accounts a WHERE a.account_number = prospector_account_data.account_number AND a.auth_user_id = auth.uid() AND a.active = true)
) WITH CHECK (
 EXISTS (SELECT 1 FROM public.prospector_accounts a WHERE a.account_number = prospector_account_data.account_number AND a.auth_user_id = auth.uid() AND a.active = true)
);
GRANT SELECT ON public.prospector_accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.prospector_account_data TO authenticated;

CREATE OR REPLACE FUNCTION public.prospector_is_active_admin() RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = '' SET row_security = off AS $$ SELECT EXISTS (SELECT 1 FROM public.prospector_accounts WHERE auth_user_id = auth.uid() AND role = 'admin' AND active = true) $$;
REVOKE ALL ON FUNCTION public.prospector_is_active_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.prospector_is_active_admin() TO authenticated;
DROP POLICY IF EXISTS "Admin can manage Prospector accounts" ON public.prospector_accounts;
CREATE POLICY "Admin can manage Prospector accounts" ON public.prospector_accounts FOR ALL TO authenticated USING (public.prospector_is_active_admin()) WITH CHECK (public.prospector_is_active_admin());
