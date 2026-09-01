-- SiloScanUX — cadastro de conta e login por ID de usuário (username)
-- Rodar no SQL Editor do painel Supabase, depois de schema.sql — e antes de
-- roles_admin.sql, cuja função admin_list_users() já referencia profiles.username.
-- Seguro rodar mais de uma vez (add column if not exists + create or replace).
--
-- IMPORTANTE — passo manual no painel, fora deste SQL: em Authentication →
-- Providers → Email, desmarque "Confirm email". A decisão foi acesso imediato
-- após o cadastro (sem confirmação por e-mail nem aprovação de admin) — sem
-- desmarcar essa opção, o Supabase continua exigindo confirmação e o cadastro
-- feito pela tela de login fica com sessão nula até a pessoa clicar no link
-- que o Supabase manda por e-mail.
--
-- `username` é um identificador curto e único, escolhido no cadastro,
-- alternativo ao e-mail pra logar. Fica em `profiles`, não em `auth.users`
-- (que só aceita login por e-mail/telefone nativamente) — o login por username
-- funciona resolvendo username → e-mail via `get_email_for_username` antes de
-- chamar `signInWithPassword` com o e-mail resolvido (ver
-- src/lib/auth.ts).
--
-- Risco de segurança aceito, documentado (mesmo padrão que o Supabase recomenda
-- pra esse tipo de login): `get_email_for_username` devolve o e-mail de
-- qualquer username existente pra qualquer chamador (mesmo sem sessão) — ela
-- roda ANTES da senha ser checada, então tecnicamente permite descobrir se um
-- username existe e qual e-mail está associado a ele (enumeração). Aceitável
-- para uma ferramenta B2B interna; se isso vier a importar, a mitigação padrão
-- é rate limiting na API (configurável no painel do Supabase) — não dá pra
-- resolver só com SQL.

alter table public.profiles add column if not exists username text unique;
-- Troca de username depois da primeira vez exige aprovação de admin (ver
-- set_my_username abaixo e admin_approve_username/admin_reject_username em
-- roles_admin.sql) — fica pendente aqui até ser aprovada ou rejeitada.
alter table public.profiles add column if not exists pending_username text;

-- create or replace (função já existe, criada em schema.sql) — agora também
-- grava o username vindo do cadastro (options.data.username no signUp do
-- cliente). full_name/username ficam null se não vierem (ex.: usuário criado
-- manualmente no painel, sem passar por este fluxo).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, username)
  values (new.id, new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'username');
  return new;
end;
$$;

create or replace function public.get_email_for_username(p_username text)
returns text
language plpgsql
security definer set search_path = public
stable
as $$
declare
  v_email text;
begin
  select au.email into v_email
  from public.profiles p
  join auth.users au on au.id = p.id
  where p.username = p_username;
  return v_email;
end;
$$;

grant execute on function public.get_email_for_username(text) to anon, authenticated;

-- `profiles` só tem policy de SELECT do próprio perfil (schema.sql) — de propósito,
-- não existe policy de UPDATE geral pra usuário comum, porque isso deixaria qualquer
-- um alterar a própria `role`/`blocked` (profiles.role = 'admin' por exemplo). Esta
-- function abre uma porta estreita: só toca username/pending_username de quem está
-- chamando (auth.uid()), nada mais.
--
-- Regra: definir o username por PRIMEIRA vez (ainda não tem nenhum) aplica direto —
-- não tem nada pra abusar, é só reivindicar um identificador. TROCAR um username que
-- já existe fica pendente até um admin aprovar (admin_approve_username/
-- admin_reject_username em roles_admin.sql) — evita que a pessoa mude o próprio ID
-- de login quando quiser, sem nenhum controle.
--
-- `drop function` antes do `create or replace`: mudei o tipo de retorno de void pra
-- text (o frontend precisa saber se aplicou direto ou ficou pendente), e Postgres não
-- deixa `create or replace` trocar o tipo de retorno de uma function existente.
drop function if exists public.set_my_username(text);
create function public.set_my_username(p_username text)
returns text
language plpgsql
security definer set search_path = public
as $$
declare
  v_current text;
begin
  select username into v_current from public.profiles where id = auth.uid();

  if v_current is null or v_current = p_username then
    update public.profiles set username = p_username, pending_username = null where id = auth.uid();
    return 'applied';
  end if;

  update public.profiles set pending_username = p_username where id = auth.uid();
  return 'pending';
end;
$$;

grant execute on function public.set_my_username(text) to authenticated;
