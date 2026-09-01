-- SiloScanUX — histórico de nível persistido, por silo
-- Rodar no SQL Editor do painel Supabase, depois do schema.sql e do roles_admin.sql
-- (nesta ordem — a policy de admin abaixo usa `public.is_admin()`, criada em
-- roles_admin.sql).
--
-- Guarda um ponto por silo a cada ~5 minutos (ver `useSiloStore.ts`), não cada
-- leitura — pensado pro gráfico de tendência de médio prazo (dias/semana), não pra
-- nuvem de pontos do scanner (isso já vive em `leituras`). Com 1 ponto/5min, uma
-- semana de histórico de um silo são ~2.000 linhas — folgado pro plano gratuito.
--
-- Seguro rodar mais de uma vez: `create table/index if not exists`, `drop policy
-- if exists` antes de cada `create policy`.

create table if not exists public.historico_niveis (
  id uuid primary key default gen_random_uuid(),
  silo_id uuid not null references public.silos (id) on delete cascade,
  ocorrido_em timestamptz not null default now(),
  level_percent numeric not null,
  volume_m3 numeric not null,
  mass_ton numeric not null,
  temperature_c numeric not null,
  created_at timestamptz not null default now()
);

create index if not exists historico_niveis_silo_id_ocorrido_em_idx on public.historico_niveis (silo_id, ocorrido_em desc);

alter table public.historico_niveis enable row level security;

drop policy if exists "usuário gerencia o histórico dos próprios silos" on public.historico_niveis;
create policy "usuário gerencia o histórico dos próprios silos"
  on public.historico_niveis for all
  using (silo_id in (select id from public.silos where user_id = auth.uid()))
  with check (silo_id in (select id from public.silos where user_id = auth.uid()));

-- Fica aqui (não em roles_admin.sql) porque esta tabela só existe a partir deste
-- arquivo — ver comentário equivalente em roles_admin.sql.
drop policy if exists "admin vê todo o histórico" on public.historico_niveis;
create policy "admin vê todo o histórico" on public.historico_niveis for select using (public.is_admin());
