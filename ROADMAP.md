# Roteiro de Prontidão Comercial — SiloScanUX

> Baseado no diagnóstico de 28/08/2026 (commit `0cbc2f0`): 58 lacunas mapeadas entre o
> protótipo atual (SPA client-side, dados sintéticos, login sem autenticação) e uma
> v1 comercial. Este documento define **por onde começar e em que ordem**.
>
> A seção de LGPD deste roteiro é um mapa de lacunas, não aconselhamento jurídico —
> validar com advogado especializado antes de qualquer lançamento com dados reais de usuário.

## Decisão central: comprar auth+banco, não construir

Hoje o projeto não tem nenhuma linha de backend. Construir API própria + Postgres +
hash de senha + JWT + refresh token + RBAC do zero é o caminho mais lento e o que mais
historicamente gera falha de segurança — autenticação "caseira" é onde a maioria dos
vazamentos começa.

**Recomendação:** usar uma plataforma tipo Supabase (Postgres gerenciado + Auth +
Row Level Security para multi-tenancy + Storage). Isso resolve de uma vez boa parte
dos itens bloqueantes de dados e autenticação: senha com hash, sessão segura,
criptografia em repouso, backup automatizado e rate limiting de login já vêm prontos.
Sobra desenhar o schema e a lógica de negócio, não reinventar a parte mais perigosa
do sistema.

## Trilhas paralelas

Isto **não é uma fila única** — algumas trilhas rodam ao mesmo tempo.

### Trilha A — Fundação técnica (sequencial, é a espinha dorsal)

1. ✅ Escolher e provisionar backend + banco + auth (Supabase). Login real via
   `supabase.auth`, sessão gerida em [App.tsx](../src/App.tsx).
2. ✅ Desenhar o schema real: usuários, silos, leituras, alertas — isolados por
   usuário via RLS ([schema.sql](../supabase/schema.sql)). Modelo de
   organização/cooperativa fica em aberto até haver clareza do modelo de
   negócio; o schema atual não tranca essa decisão.
3. ✅ `useSiloStore.ts` persiste a configuração do silo (nome, dimensões, grão)
   no Supabase via um botão "Salvar" explícito. O histórico ao vivo/alertas
   continuam só na memória do navegador — decisão deliberada, para não gravar
   volume de dado sintético no banco.
4. ✅ Rotas protegidas pela sessão real do Supabase (sem sessão, sem dashboard).
5. ✅ Endpoint de ingestão de scan ([ingest_scan.sql](../supabase/ingest_scan.sql))
   — uma função RPC autenticada por chave de API por dispositivo, já que um
   sensor de campo não tem login de usuário. Aceita o formato "já decodificado"
   que o app usa; o tradutor específico do payload real do LoRa/ESP32 fica para
   quando esse protocolo estiver definido pelo time de hardware (banda do LoRa
   deve forçar o dispositivo a mandar um resumo, não a nuvem de pontos crua —
   decisão pendente com o time de firmware). Testável com
   `npm run test:ingest -- <api-key> <silo-id>`, sem precisar do sensor físico.

### Trilha B — Higiene (começa já, em paralelo, custo baixo)

- ✅ CI ([ci.yml](../.github/workflows/ci.yml): lint + testes + build a cada push/PR) e
  Dependabot ([dependabot.yml](../.github/dependabot.yml): npm + GitHub Actions,
  semanal) — falta só confirmar em **Settings → Code security** do repositório no
  GitHub que os alertas do Dependabot estão habilitados.
- ✅ 42 testes unitários (Vitest) em `volume.ts`, `topography.ts` e `grainGeometry.ts`
  — `npm test`.
- ✅ Error boundary ([ErrorBoundary.tsx](../src/components/ErrorBoundary.tsx)) em
  volta da cena 3D, com opção de tentar de novo ou trocar pra visão 2D em vez de
  travar o app inteiro.
- ✅ [README.md](../README.md) real, substituindo o texto padrão do template Vite.

### Trilha C — Jurídico / LGPD (começa já, em paralelo, não trava a engenharia)

- ✅ Minutas de [política de privacidade](../legal/politica-de-privacidade.md) e
  [termos de uso](../legal/termos-de-uso.md) — **não são parecer jurídico**, têm
  placeholders (`[CNPJ]`, endereço, etc.) e precisam de revisão de um advogado
  especializado em LGPD antes de valer como documento oficial.
- ✅ Log de auditoria ([audit_log.sql](../supabase/audit_log.sql)) — registra
  criação/exclusão de silo, por usuário.
- ✅ Exclusão de conta pelo próprio usuário
  ([account_deletion.sql](../supabase/account_deletion.sql) + botão em "Minha
  conta" no app) — apaga a conta e, em cascata, todos os silos/leituras/histórico.
- ✅ Exportação de dados (portabilidade, LGPD art. 18) — botão em "Minha conta",
  baixa um `.json` com todos os silos, leituras, histórico e alertas do usuário.
- Ainda em aberto: decisão formal de residência dos dados, contratos de operador
  com fornecedores, DPO formalizado, RIPD — itens da Trilha E.

### Trilha D — Depois que a Trilha A tiver um backend rodando

- Cabeçalhos de segurança, WAF, validação de upload de scan.
- Log de auditoria, RBAC fino.
- Monitoramento de erro (Sentry) e uptime.
- Ambiente de staging isolado.
- Testes end-to-end dos fluxos críticos (login, scan, alertas).

### Trilha E — Última milha antes do lançamento

- Teste de penetração externo.
- Contratos de operador de dados com fornecedores (hosting, e-mail, analytics).
- Encarregado de dados (DPO) formalizado.
- Política de retenção e expurgo de dados.

### Trilha F — Pode esperar o pós-lançamento

- Modelo de cobrança / billing.
- Termos de adesão específicos para cooperativas.
- RIPD (Relatório de Impacto à Proteção de Dados).
- Auditoria de acessibilidade (WCAG).
- Documentação de API completa e diagramas de arquitetura.

## Por onde começar esta semana

1. Ativar Dependabot no repositório (5 minutos).
2. Escrever os primeiros testes de `volume.ts` com Vitest.
3. Adicionar um error boundary no `SiloScene`.
4. Decidir a plataforma de backend (Supabase é o ponto de partida recomendado) e
   criar o projeto.
5. Iniciar a conversa com um advogado sobre política de privacidade/LGPD, em
   paralelo — não pode esperar a engenharia terminar, senão vira gargalo no
   lançamento.
