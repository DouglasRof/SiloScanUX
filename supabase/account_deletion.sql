-- SiloScanUX — exclusão de conta pelo próprio usuário (LGPD, art. 18 — exclusão)
-- Rodar no SQL Editor do painel Supabase, depois do schema.sql.
--
-- Apaga a linha do usuário em auth.users. Como profiles/silos (e, em cascata,
-- leituras/historico_niveis/alertas) têm "on delete cascade" para auth.users,
-- isso já apaga tudo o que pertence à conta. Não dá pra desfazer.

create function public.delete_my_account()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;

grant execute on function public.delete_my_account() to authenticated;
