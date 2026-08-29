-- SiloScanUX — log de auditoria (Trilha C: mecanismos que dependem do backend)
-- Rodar no SQL Editor do painel Supabase, depois do schema.sql.
--
-- Cobre eventos administrativos sobre dados (criar/excluir silo) — não cada
-- leitura de sensor, isso já é rastreável pela própria tabela `leituras`
-- (coluna `created_at`). Login/logout já ficam registrados pelo próprio
-- Supabase Auth (Authentication → Logs no painel).
--
-- Decisão deliberada: este log NÃO tem "on delete cascade" para auth.users —
-- ele sobrevive à exclusão da conta (mecanismo em account_deletion.sql), porque
-- um registro de auditoria de segurança normalmente precisa sobreviver à própria
-- ação que ele registra. Ninguém mais consegue lê-lo depois (a policy de select
-- exige auth.uid() = user_id), mas a linha continua existindo para fins de
-- auditoria interna, se um dia isso for exigido.

create table public.audit_log (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz not null default now()
);

create index audit_log_user_id_created_at_idx on public.audit_log (user_id, created_at desc);

alter table public.audit_log enable row level security;

create policy "usuário vê o próprio log de auditoria"
  on public.audit_log for select
  using (user_id = auth.uid());
-- Sem policy de insert/update/delete pública — só as funções abaixo (security
-- definer, disparadas por trigger) escrevem aqui.

create function public.log_silo_created()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.audit_log (user_id, action, entity_type, entity_id, metadata)
  values (new.user_id, 'created', 'silo', new.id, jsonb_build_object('nome', new.nome));
  return new;
end;
$$;

create trigger on_silo_created
  after insert on public.silos
  for each row execute procedure public.log_silo_created();

create function public.log_silo_deleted()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.audit_log (user_id, action, entity_type, entity_id, metadata)
  values (old.user_id, 'deleted', 'silo', old.id, jsonb_build_object('nome', old.nome));
  return old;
end;
$$;

create trigger on_silo_deleted
  after delete on public.silos
  for each row execute procedure public.log_silo_deleted();
