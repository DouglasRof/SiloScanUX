#!/usr/bin/env node
// Simula um dispositivo de campo mandando uma leitura via a função ingest_scan —
// prova o pipeline (chave de API -> RPC -> grava em `leituras`) sem precisar do
// sensor físico. Uso:
//
//   node scripts/test-ingest-scan.mjs <API_KEY_DO_DISPOSITIVO> <SILO_ID>
//
// A API key vem de `insert into public.device_api_keys (...) returning api_key`
// (ver supabase/ingest_scan.sql). O silo_id é o `id` da sua linha em `public.silos`
// (visível no Table Editor do Supabase).

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

function loadEnvLocal() {
  const path = fileURLToPath(new URL('../.env.local', import.meta.url))
  const raw = readFileSync(path, 'utf8')
  const env = {}
  for (const line of raw.split('\n')) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const idx = trimmed.indexOf('=')
    if (idx === -1) continue
    env[trimmed.slice(0, idx)] = trimmed.slice(idx + 1)
  }
  return env
}

const [, , apiKey, siloId] = process.argv
if (!apiKey || !siloId) {
  console.error('Uso: node scripts/test-ingest-scan.mjs <API_KEY_DO_DISPOSITIVO> <SILO_ID>')
  process.exit(1)
}

const env = loadEnvLocal()
if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_ANON_KEY) {
  console.error('VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY não encontrados em .env.local')
  process.exit(1)
}

// Um punhado de pontos grosseiros simulando uma varredura pan/tilt — só pra
// provar que o payload chega e é gravado, não uma leitura realista.
const points = Array.from({ length: 12 }, (_, i) => ({
  angleDeg: i * 30,
  radiusM: 1.2,
  distanceM: Number((3.4 + Math.sin(i)).toFixed(2)),
}))

const body = {
  p_api_key: apiKey,
  p_silo_id: siloId,
  p_sensor_height_m: 4.5,
  p_resolution_m: 0.05,
  p_points: points,
  p_origem: 'sensor',
}

const res = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/rpc/ingest_scan`, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    apikey: env.VITE_SUPABASE_ANON_KEY,
    Authorization: `Bearer ${env.VITE_SUPABASE_ANON_KEY}`,
  },
  body: JSON.stringify(body),
})

const text = await res.text()
console.log(res.status, text)
