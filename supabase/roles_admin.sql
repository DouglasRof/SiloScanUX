-- SiloScanUX — papéis (admin) e back office
-- Rodar no SQL Editor do painel Supabase, depois de schema.sql, propriedades.sql e
-- login_por_usuario.sql (nessa ordem — admin_list_users() abaixo referencia
-- profiles.username, que só existe depois de login_por_usuario.sql).
--
-- Seguro rodar mais de uma vez, mesmo que uma tentativa anterior tenha falhado no
-- meio: `add column if not exists`, `drop policy if exists` antes de cada
-- `create policy`, e `create or replace function` em tudo.
--
-- `role` e `blocked` ficam em `profiles` (não em `auth.users`) porque só o
-- schema `public` é acessível via anon key + RLS — não dá pra ler/escrever
-- `auth.users` direto do cliente de qualquer jeito, e não precisamos disso aqui.
--
-- `blocked` é um bloqueio "de aplicação", não um ban de verdade do Supabase Auth
-- (isso exigiria a service_role key, que nunca deve ir para o frontend). O app
-- confere esse campo assim que a sessão carrega e desloga sozinho se `blocked =
-- true` — suficiente para impedir o uso do produto, mas a pessoa ainda
-- tecnicamente "existe" no Supabase Auth. Se precisar de um ban de verdade
-- (nível de infraestrutura), isso vai exigir uma função server-side com a
-- service_role key (edge function, por exemplo) — não é algo que dá pra fazer
-- só com anon key.
--
-- Não existe promoção a admin pelo próprio app (de propósito, por segurança).
-- Pra tornar o primeiro usuário admin, rode manualmente:
--
--   update public.profiles set role = 'admin' where id = '<uuid do usuário>';
--
-- (o uuid aparece em Authentication → Users no painel).

alter table public.profiles add column if not exists role text not null default 'user' check (role in ('user', 'admin'));
alter table public.profiles add column if not exists blocked boolean not null default false;

-- security definer: evita qualquer risco de recursão de RLS ao checar o papel
-- de dentro de uma policy que protege a própria tabela profiles, e permite
-- reuso em policies de outras tabelas sem repetir o subselect em cada uma.
create or replace function public.is_admin()
returns boolean
language sql
security definer set search_path = public
stable
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Múltiplas policies "for select"/"for all" na mesma tabela são combinadas com
-- OR — um usuário comum continua vendo só o que já via (pela policy dele), um
-- admin passa a ver tudo também (pela policy abaixo), sem precisar de nenhum
-- código especial no frontend: a mesma query `supabase.from(...).select('*')`
-- já volta tudo pra quem é admin.
drop policy if exists "admin vê todos os perfis" on public.profiles;
create policy "admin vê todos os perfis" on public.profiles for select using (public.is_admin());

drop policy if exists "admin atualiza qualquer perfil" on public.profiles;
create policy "admin atualiza qualquer perfil" on public.profiles for update using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin gerencia todas as propriedades" on public.propriedades;
create policy "admin gerencia todas as propriedades" on public.propriedades for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin gerencia todos os silos" on public.silos;
create policy "admin gerencia todos os silos" on public.silos for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin vê todas as leituras" on public.leituras;
create policy "admin vê todas as leituras" on public.leituras for select using (public.is_admin());

-- A policy de admin para `historico_niveis` NÃO fica aqui: essa tabela só é criada
-- em historico_niveis.sql, que roda depois deste arquivo (ver ordem documentada no
-- README.md/BACKEND_HANDOFF.md) — colocá-la aqui faz este arquivo falhar com
-- "relation public.historico_niveis does not exist" numa instalação nova. Ela vive
-- em historico_niveis.sql, logo após a criação da tabela.

drop policy if exists "admin vê todos os alertas" on public.alertas;
create policy "admin vê todos os alertas" on public.alertas for select using (public.is_admin());

-- device_api_keys tinha RLS habilitado sem nenhuma policy (só a função
-- ingest_scan, security definer, conseguia ler). Agora admin também gerencia
-- via UI (criar/revogar chave).
drop policy if exists "admin gerencia chaves de dispositivo" on public.device_api_keys;
create policy "admin gerencia chaves de dispositivo" on public.device_api_keys for all using (public.is_admin()) with check (public.is_admin());

-- Lista usuários pro back office, juntando com o e-mail (que vive em
-- auth.users, não em profiles). Sem policy de select pública nisso — só esta
-- função (security definer) expõe o join, e ela mesma confere is_admin() antes
-- de devolver qualquer linha, então um usuário comum que a chamar recebe uma
-- lista vazia, não um erro (evita dar dica de que a função existe/funciona).
--
-- `drop function` antes: mudei as colunas de retorno (adicionei
-- pending_username, ver login_por_usuario.sql), e Postgres não deixa
-- `create or replace` trocar a assinatura de retorno de uma function existente.
drop function if exists public.admin_list_users();
create function public.admin_list_users()
returns table (id uuid, full_name text, username text, pending_username text, email text, role text, blocked boolean, created_at timestamptz)
language sql
security definer set search_path = public
stable
as $$
  select p.id, p.full_name, p.username, p.pending_username, au.email, p.role, p.blocked, p.created_at
  from public.profiles p
  join auth.users au on au.id = p.id
  where public.is_admin()
  order by p.created_at asc;
$$;

grant execute on function public.admin_list_users() to authenticated;

-- Aprova/rejeita uma troca de username pendente (set_my_username em
-- login_por_usuario.sql deixa pendente em vez de aplicar direto quando já existe
-- um username antes). `is_admin()` é conferido dentro da function, não só como
-- policy — quem não é admin recebe um erro explícito ao chamar, já que estas duas
-- são ações (RPC de escrita visível na UI do back office), não uma listagem.
create or replace function public.admin_approve_username(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem aprovar troca de ID de usuário';
  end if;

  update public.profiles
  set username = pending_username, pending_username = null
  where id = p_user_id and pending_username is not null;
end;
$$;

grant execute on function public.admin_approve_username(uuid) to authenticated;

create or replace function public.admin_reject_username(p_user_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if not public.is_admin() then
    raise exception 'Apenas administradores podem rejeitar troca de ID de usuário';
  end if;

  update public.profiles set pending_username = null where id = p_user_id;
end;
$$;

grant execute on function public.admin_reject_username(uuid) to authenticated;
