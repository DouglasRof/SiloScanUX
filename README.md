# SiloScanUX

Dashboard de monitoramento de silos de grão via LiDAR: visualização 3D e 2D (planta e
corte), cálculo de volume/massa/nível a partir da nuvem de pontos do scanner, histórico
e alertas. Desenvolvido para a InovAgroTec.

## Stack

- **React 19 + TypeScript + Vite**
- **Three.js / @react-three/fiber / drei** — cena 3D do silo e do grão
- **Zustand** — estado do app
- **Tailwind CSS 4**
- **Supabase** — banco de dados (Postgres + RLS), autenticação e ingestão de leituras de sensor

## Configuração local

1. `npm install`
2. Crie um projeto no [Supabase](https://supabase.com) (recomendado: região `sa-east-1`).
3. Copie `.env.example` para `.env.local` e preencha com a URL e a anon key do seu projeto
   (*Project Settings → API*).
4. No **SQL Editor** do painel Supabase, rode nesta ordem:
   - `supabase/schema.sql`
   - `supabase/ingest_scan.sql`
5. Crie seu primeiro usuário em **Authentication → Users** (marque *Auto Confirm User*).
6. `npm run dev`

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento (Vite) |
| `npm run build` | Typecheck + build de produção |
| `npm run lint` | Lint (oxlint) |
| `npm test` | Roda a suíte de testes (Vitest) uma vez |
| `npm run test:watch` | Vitest em modo watch |
| `npm run test:ingest -- <api-key> <silo-id>` | Simula um sensor enviando uma leitura, sem precisar do hardware físico |

## Estrutura

- `src/components/silo3d/` — cena 3D (Three.js/R3F): silo, grão, câmera, anotações
- `src/components/silo2d/` — vistas 2D de planta e elevação
- `src/lib/` — lógica de negócio pura: cálculo de volume (`volume.ts`), geometria do
  grão (`grainGeometry.ts`), topografia/cores (`topography.ts`), gerador de leitura
  sintética (`mockLidar.ts`), estimativa de fluxo (`flow.ts`)
- `src/store/useSiloStore.ts` — estado global (Zustand); a configuração do silo persiste
  no Supabase, a simulação ao vivo roda só na memória do navegador
- `src/lib/supabaseClient.ts` — client do Supabase
- `supabase/` — schema do banco (`schema.sql`) e a função de ingestão de leituras de
  sensor (`ingest_scan.sql`)
- `scripts/test-ingest-scan.mjs` — simula um dispositivo de campo chamando o endpoint
  de ingestão

## Estado do projeto

Ainda é um protótipo em direção a um produto comercial — dados de sensor real ainda
não chegam de um sensor físico (LiDAR TF02-Pro + pan/tilt + ESP32 + LoRa, em
desenvolvimento pelo time de hardware), e vários requisitos de segurança/conformidade
ainda estão em aberto. Veja [ROADMAP.md](ROADMAP.md) para o diagnóstico completo e a
ordem sugerida de execução.
