-- Cria armazenamento privado do Prospector por conta
-- Aplicada no Lovable Cloud pela extensão, com autorização do usuário.
-- Registrada por GeckoAI em 2026-10-09T01:55:47.468Z

create table if not exists public.prospector_account_data (
  account_number smallint primary key references public.prospector_access_keys(account_number) on delete cascade,
  payload jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.prospector_account_data enable row level security;

drop policy if exists "Account users read own Prospector data" on public.prospector_account_data;
create policy "Account users read own Prospector data"
  on public.prospector_account_data for select
  to authenticated
  using (exists (
    select 1 from public.prospector_access_keys k
    where k.account_number = prospector_account_data.account_number
      and k.auth_user_id = auth.uid()
      and k.active = true
      and k.revoked_at is null
  ));

drop policy if exists "Account users insert own Prospector data" on public.prospector_account_data;
create policy "Account users insert own Prospector data"
  on public.prospector_account_data for insert
  to authenticated
  with check (exists (
    select 1 from public.prospector_access_keys k
    where k.account_number = prospector_account_data.account_number
      and k.auth_user_id = auth.uid()
      and k.active = true
      and k.revoked_at is null
  ));

drop policy if exists "Account users update own Prospector data" on public.prospector_account_data;
create policy "Account users update own Prospector data"
  on public.prospector_account_data for update
  to authenticated
  using (exists (
    select 1 from public.prospector_access_keys k
    where k.account_number = prospector_account_data.account_number
      and k.auth_user_id = auth.uid()
      and k.active = true
      and k.revoked_at is null
  ))
  with check (exists (
    select 1 from public.prospector_access_keys k
    where k.account_number = prospector_account_data.account_number
      and k.auth_user_id = auth.uid()
      and k.active = true
      and k.revoked_at is null
  ));

grant select, insert, update on public.prospector_account_data to authenticated;
