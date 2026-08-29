-- SiloScanUX — schema inicial (Trilha A / passo 2 do ROADMAP.md)
-- Rodar no SQL Editor do painel Supabase, num projeto novo.
--
-- Modelo por enquanto: cada silo pertence a um usuário (auth.uid()), sem conceito
-- de organização/cooperativa — isso ainda não foi decidido. Quando for, dá para
-- acrescentar uma tabela de organizações e um `org_id` nullable em `silos` sem
-- quebrar o que já existe aqui.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Perfis (1:1 com auth.users)
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  created_at timestamptz not null default now()
);

-- Cria um perfil vazio automaticamente para todo novo usuário do Supabase Auth.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Silos
-- ---------------------------------------------------------------------------

create table public.silos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  standard_id text not null,
  dims jsonb not null,
  grain_id text not null,
  created_at timestamptz not null default now()
);

create index silos_user_id_idx on public.silos (user_id);

-- ---------------------------------------------------------------------------
-- Leituras (scans de LiDAR, reais ou simulados)
-- ---------------------------------------------------------------------------

create table public.leituras (
  id uuid primary key default gen_random_uuid(),
  silo_id uuid not null references public.silos (id) on delete cascade,
  ocorrido_em timestamptz not null default now(),
  sensor_height_m numeric not null,
  resolution_m numeric not null,
  points jsonb not null,
  volume jsonb,
  origem text not null default 'simulado' check (origem in ('simulado', 'sensor')),
  created_at timestamptz not null default now()
);

create index leituras_silo_id_ocorrido_em_idx on public.leituras (silo_id, ocorrido_em desc);

-- ---------------------------------------------------------------------------
-- Alertas
-- ---------------------------------------------------------------------------

create table public.alertas (
  id uuid primary key default gen_random_uuid(),
  silo_id uuid not null references public.silos (id) on delete cascade,
  severity text not null check (severity in ('info', 'warning', 'critical')),
  message text not null,
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create index alertas_silo_id_idx on public.alertas (silo_id);

-- ---------------------------------------------------------------------------
-- Row Level Security — cada usuário só vê os próprios silos e o que pende deles
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.silos enable row level security;
alter table public.leituras enable row level security;
alter table public.alertas enable row level security;

create policy "usuário vê o próprio perfil"
  on public.profiles for select
  using (id = auth.uid());

create policy "usuário gerencia os próprios silos"
  on public.silos for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "usuário gerencia leituras dos próprios silos"
  on public.leituras for all
  using (silo_id in (select id from public.silos where user_id = auth.uid()))
  with check (silo_id in (select id from public.silos where user_id = auth.uid()));

create policy "usuário gerencia alertas dos próprios silos"
  on public.alertas for all
  using (silo_id in (select id from public.silos where user_id = auth.uid()))
  with check (silo_id in (select id from public.silos where user_id = auth.uid()));
