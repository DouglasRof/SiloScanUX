-- SiloScanUX — camada de propriedades entre usuário e silo
-- Rodar no SQL Editor do painel Supabase, depois do schema.sql.
--
-- Modelo: 1 propriedade tem 1 usuário dono (sem múltiplos usuários por
-- propriedade ainda — decisão deliberada, ver BACKEND_HANDOFF.md). 1 propriedade
-- tem N silos. `silos.user_id` continua existindo (não removido, ainda usado pelo
-- audit_log e por simplicidade), mas deixa de ser a fonte de verdade do RLS —
-- agora o acesso passa pela propriedade.
--
-- Seguro rodar mais de uma vez, mesmo que uma tentativa anterior tenha falhado no
-- meio: `if not exists`/`drop policy if exists` em tudo, e o bloco de migração de
-- dados (`do $$ ... $$`) só afeta silos com `propriedade_id is null` — depois da
-- primeira vez que roda até o fim, não sobra nenhum.

create table if not exists public.propriedades (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  nome text not null,
  created_at timestamptz not null default now()
);

create index if not exists propriedades_user_id_idx on public.propriedades (user_id);

alter table public.propriedades enable row level security;

drop policy if exists "usuário gerencia as próprias propriedades" on public.propriedades;
create policy "usuário gerencia as próprias propriedades"
  on public.propriedades for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- Silos passam a pertencer a uma propriedade.
alter table public.silos add column if not exists propriedade_id uuid references public.propriedades (id) on delete cascade;

-- Migração dos dados existentes: cria uma propriedade "Propriedade 1" por
-- usuário que já tem silo, e associa os silos existentes dele a ela.
do $$
declare
  v_user record;
  v_prop_id uuid;
begin
  for v_user in select distinct user_id from public.silos where propriedade_id is null loop
    insert into public.propriedades (user_id, nome) values (v_user.user_id, 'Propriedade 1')
    returning id into v_prop_id;

    update public.silos set propriedade_id = v_prop_id
    where user_id = v_user.user_id and propriedade_id is null;
  end loop;
end $$;

alter table public.silos alter column propriedade_id set not null;

-- RLS de silos passa a ser via propriedade, não mais via user_id direto. As duas
-- variantes de nome de policy (a original de schema.sql e esta) levam "if
-- exists" pra este arquivo poder rodar de novo em qualquer ordem de tentativas.
drop policy if exists "usuário gerencia os próprios silos" on public.silos;
drop policy if exists "usuário gerencia silos das próprias propriedades" on public.silos;
create policy "usuário gerencia silos das próprias propriedades"
  on public.silos for all
  using (propriedade_id in (select id from public.propriedades where user_id = auth.uid()))
  with check (propriedade_id in (select id from public.propriedades where user_id = auth.uid()));
