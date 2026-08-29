-- SiloScanUX — ingestão de leituras de sensor (Trilha A / passo 5 do ROADMAP.md)
-- Rodar no SQL Editor do painel Supabase, depois do schema.sql.
--
-- Isto faz o papel do "endpoint HTTP" para o sensor: em vez de um servidor
-- dedicado, a leitura chega via RPC do PostgREST (POST /rest/v1/rpc/ingest_scan).
-- Um sensor de campo não tem sessão de usuário, então a autenticação aqui é uma
-- chave de API simples por dispositivo — não login.
--
-- O formato exato do payload que vem do ESP32 via LoRa ainda não está definido
-- (a banda do LoRa provavelmente vai forçar o dispositivo a mandar um resumo, não
-- a nuvem de pontos crua). Esta função aceita o formato "já decodificado" que o
-- app já usa (ver RawLidarScan/LidarScan em src/types/silo.ts) — quando o
-- protocolo real existir, só precisa de um tradutor pequeno na ponta que decodifica
-- o LoRa e chama esta mesma função, sem mexer no resto do pipeline.
--
-- Limitação conhecida: uma chave de API válida pode gravar em qualquer silo_id —
-- não há vínculo dispositivo → silo ainda, porque não existe um cadastro de
-- dispositivos. Suficiente enquanto for um sensor de teste; revisar quando tiver
-- mais de um sensor em campo.

create table public.device_api_keys (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  api_key text not null unique,
  created_at timestamptz not null default now(),
  revoked_at timestamptz
);

alter table public.device_api_keys enable row level security;
-- Sem policy de select/insert pública de propósito — só a função abaixo (security
-- definer) consulta essa tabela. Gerencie chaves direto pelo SQL Editor por enquanto.

-- create or replace (não "create") para que rodar este arquivo de novo, depois de
-- uma atualização como a validação abaixo, funcione sem precisar dropar a função.
create or replace function public.ingest_scan(
  p_api_key text,
  p_silo_id uuid,
  p_sensor_height_m numeric,
  p_resolution_m numeric,
  p_points jsonb,
  p_origem text default 'sensor'
)
returns uuid
language plpgsql
security definer set search_path = public
as $$
declare
  v_leitura_id uuid;
  -- Um scan com resolução realista (mesmo bem densa) não deveria ter mais que
  -- alguns milhares de pontos — isso também é uma trava contra payload malicioso
  -- ou corrompido tentando inflar uma linha do banco.
  v_max_points constant int := 5000;
begin
  if not exists (
    select 1 from public.device_api_keys
    where api_key = p_api_key and revoked_at is null
  ) then
    raise exception 'Chave de API inválida ou revogada';
  end if;

  if not exists (select 1 from public.silos where id = p_silo_id) then
    raise exception 'Silo não encontrado: %', p_silo_id;
  end if;

  if p_sensor_height_m is null or p_sensor_height_m <= 0 then
    raise exception 'sensor_height_m precisa ser positivo';
  end if;

  if p_resolution_m is null or p_resolution_m <= 0 then
    raise exception 'resolution_m precisa ser positivo';
  end if;

  if jsonb_typeof(p_points) is distinct from 'array' then
    raise exception 'points precisa ser um array JSON';
  end if;

  if jsonb_array_length(p_points) = 0 then
    raise exception 'points não pode ser vazio';
  end if;

  if jsonb_array_length(p_points) > v_max_points then
    raise exception 'points excede o limite de % elementos', v_max_points;
  end if;

  insert into public.leituras (silo_id, sensor_height_m, resolution_m, points, origem)
  values (p_silo_id, p_sensor_height_m, p_resolution_m, p_points, p_origem)
  returning id into v_leitura_id;

  return v_leitura_id;
end;
$$;

-- anon porque um dispositivo de campo chama isso sem estar logado como usuário —
-- a chave de API dentro da função é quem garante que só quem tem uma chave válida
-- consegue gravar algo.
grant execute on function public.ingest_scan(text, uuid, numeric, numeric, jsonb, text) to anon, authenticated;

-- Para criar a primeira chave de teste, rode (guarde o valor retornado, não dá pra
-- ver de novo depois):
--
-- insert into public.device_api_keys (label, api_key)
-- values ('simulador-dev', gen_random_uuid()::text)
-- returning api_key;
