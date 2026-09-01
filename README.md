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
   - `supabase/propriedades.sql`
   - `supabase/login_por_usuario.sql`
   - `supabase/roles_admin.sql` (depende da coluna `username` criada no arquivo anterior)
   - `supabase/ingest_scan.sql`
   - `supabase/historico_niveis.sql`
   - `supabase/audit_log.sql`
   - `supabase/account_deletion.sql`
5. Em **Authentication → Providers → Email**, desmarque *Confirm email* — o cadastro
   pela tela de login dá acesso imediato, sem confirmação por e-mail.
6. Crie sua conta pela própria tela de login (aba "Criar conta"), depois torne ela
   admin rodando no SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where id = '<seu uuid, em Authentication → Users>';
   ```
7. `npm run dev`
8. (Opcional) Crie um projeto gratuito em [Sentry](https://sentry.io) e cole o DSN em
   `VITE_SENTRY_DSN` no `.env.local` para monitoramento de erro em produção. Sem essa
   variável, o app funciona normalmente, só sem reportar erros.

## Scripts

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Sobe o servidor de desenvolvimento (Vite) |
| `npm run build` | Typecheck + build de produção |
| `npm run lint` | Lint (oxlint) |
| `npm test` | Roda a suíte de testes (Vitest) uma vez |
| `npm run test:watch` | Vitest em modo watch |
| `npm run test:e2e` | Testes end-to-end (Playwright) — sobe o próprio servidor de dev |
| `npm run test:ingest -- <api-key> <silo-id>` | Simula um sensor enviando uma leitura, sem precisar do hardware físico |
| `npm run preview` | Serve o build de produção (`dist/`) — é como testar o PWA de verdade, já que o service worker só ativa no build |

## Estrutura

- `src/components/silo3d/` — cena 3D (Three.js/R3F): silo, grão, câmera, anotações
- `src/components/silo2d/` — vistas 2D de planta e elevação
- `src/lib/` — lógica de negócio pura: cálculo de volume (`volume.ts`), geometria do
  grão (`grainGeometry.ts`), topografia/cores (`topography.ts`), gerador de leitura
  sintética (`mockLidar.ts`), estimativa de fluxo (`flow.ts`)
- `src/store/useSiloStore.ts` — estado global (Zustand); a configuração de
  propriedades/silos persiste no Supabase, a simulação ao vivo roda só na memória do
  navegador
- `src/lib/supabaseClient.ts` — client do Supabase
- `src/lib/auth.ts` — login por username (resolve pra e-mail antes de autenticar)
- `src/lib/admin.ts` — funções do back office (usuários, visão cross-tenant, chaves de
  sensor)
- `src/components/admin/` — telas do back office (visível só para `role = 'admin'`)
- `supabase/` — schema do banco (`schema.sql`), propriedades (`propriedades.sql`),
  papéis/admin (`roles_admin.sql`), login por username (`login_por_usuario.sql`), a
  função de ingestão de leituras de sensor (`ingest_scan.sql`), log de auditoria
  (`audit_log.sql`) e exclusão de conta (`account_deletion.sql`)
- `scripts/test-ingest-scan.mjs` — simula um dispositivo de campo chamando o endpoint
  de ingestão
- `legal/` — minutas de política de privacidade e termos de uso (precisam de revisão
  de um advogado antes de valer como documento oficial)
- `e2e/` — testes end-to-end (Playwright)
- `src/lib/sentry.ts` — inicialização do Sentry (fica desligado sem `VITE_SENTRY_DSN`)
- `vercel.json` — cabeçalhos de segurança (CSP, HSTS, etc.) para deploy na Vercel
- `public/icons/` — ícone do PWA (só 192×192 por enquanto — falta um 512×512 de
  verdade, feito num editor de imagem, não gerado programaticamente)

## Mobile / PWA

A partir do breakpoint `sm` do Tailwind, o layout muda de barra lateral pra barra
inferior fixa (padrão de app mobile), e o painel de dados empilha abaixo da
visualização 3D/2D em vez de ficar ao lado. O app é instalável como PWA (ícone na
tela inicial, abre em tela cheia) — isso só ativa no build de produção
(`npm run build && npm run preview`), não no `npm run dev`.

## Estado do projeto

Ainda é um protótipo em direção a um produto comercial — dados de sensor real ainda
não chegam de um sensor físico (LiDAR TF02-Pro + pan/tilt + ESP32 + LoRa, em
desenvolvimento pelo time de hardware), e vários requisitos de segurança/conformidade
ainda estão em aberto. Veja [ROADMAP.md](ROADMAP.md) para o diagnóstico completo e a
ordem sugerida de execução.
