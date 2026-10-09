-- Confirmo que pode prosseguir com o plano de implementação da
-- Aplicada no Lovable Cloud pela extensão, com autorização do usuário.
-- Registrada por GeckoAI em 2026-10-09T01:54:28.905Z

create table if not exists public.prospector_access_keys (
  id uuid primary key default gen_random_uuid(),
  account_number smallint not null unique check (account_number between 1 and 5),
  key_hash text not null unique,
  auth_user_id uuid unique references auth.users(id) on delete cascade,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.prospector_access_keys enable row level security;

drop policy if exists "Users cannot read access key records" on public.prospector_access_keys;
create policy "Users cannot read access key records"
  on public.prospector_access_keys for select
  to authenticated
  using (false);

drop policy if exists "Users cannot modify access key records" on public.prospector_access_keys;
create policy "Users cannot modify access key records"
  on public.prospector_access_keys for all
  to authenticated
  using (false)
  with check (false);

grant select, insert, update, delete on public.prospector_access_keys to authenticated;
