# SiloScanUX — Contrato de API para o Backend

> Documento para o time que vai construir o backend **do zero, separado deste
> repositório**. Este repo é só o frontend (React/Three.js) — ele fica como está.
> Este doc é o contrato completo entre os dois lados: **toda** rota que o frontend
> precisa que exista, o formato exato de cada payload, as regras de negócio que hoje
> vivem espalhadas no código do cliente, e a rota de ingestão de telemetria para os
> sensores ESP32/LoRa em campo.
>
> **Você não precisa deste repositório para implementar o backend.** Tudo que você
> precisa está aqui. As poucas referências a arquivos do frontend (`src/lib/volume.ts`
> etc.) são só para quem quiser conferir a fonte original de uma fórmula — não são
> pré-requisito de leitura.
>
> Hoje existe uma implementação de referência funcional em Supabase (Postgres + Auth +
> RLS) que validou este contrato na prática — as regras de negócio abaixo foram
> extraídas dela. Ela **não** é o que deve ser copiado; é só a fonte de verdade dos
> detalhes de comportamento (o que acontece em cada caso de borda) que aparecem em
> cada seção.
>
> Não repete o que já está em [README.md](README.md) (setup local do frontend) nem em
> [ROADMAP.md](ROADMAP.md) (histórico de decisões de produto) — leia o ROADMAP para o
> contexto de *por quê* certas decisões foram tomadas, se precisar.

## Índice

0. [Como ler este documento](#0-como-ler-este-documento)
1. [O que é o produto](#1-o-que-é-o-produto)
2. [Arquitetura esperada](#2-arquitetura-esperada)
3. [Convenções gerais da API](#3-convenções-gerais-da-api)
4. [Autenticação e sessão](#4-autenticação-e-sessão)
5. [Perfil / conta do usuário](#5-perfil--conta-do-usuário)
6. [Propriedades](#6-propriedades)
7. [Silos](#7-silos)
8. [Histórico de nível (dados do gráfico)](#8-histórico-de-nível-dados-do-gráfico)
9. [Ingestão de telemetria — ESP32 / LoRa](#9-ingestão-de-telemetria--esp32--lora)
10. [Alertas](#10-alertas)
11. [Back office administrativo](#11-back-office-administrativo)
12. [LGPD — exportação e exclusão de dados](#12-lgpd--exportação-e-exclusão-de-dados)
13. [Modelos de dados — referência completa](#13-modelos-de-dados--referência-completa)
14. [O que muda no frontend quando a API estiver pronta](#14-o-que-muda-no-frontend-quando-a-api-estiver-pronta)
15. [Checklist de entrega](#15-checklist-de-entrega)

---

## 0. Como ler este documento

Cada seção de rota traz: método + caminho, quem pode chamar (usuário dono, qualquer
autenticado, admin, ou dispositivo de campo), o corpo da requisição, o corpo da
resposta em sucesso, e os erros esperados. Os nomes de campo em JSON estão em
**camelCase** (é o que o frontend consome hoje) — isso é uma escolha, não uma
obrigação técnica; se o backend preferir `snake_case` internamente, tudo bem, desde
que a resposta HTTP use camelCase.

Todo campo marcado **obrigatório** que faltar deve gerar `400` com o formato de erro
da seção 3.4 — não `500`, não sucesso parcial.

## 1. O que é o produto

Dashboard de monitoramento de silos de grão/ração via sensor LiDAR: o sensor mede a
altura da superfície do grão em vários ângulos/raios, o volume/massa/nível (%) e a
taxa de enchimento/esvaziamento são calculados a partir disso, e o app mostra tudo em
visualização 3D e 2D (planta + corte), histórico de tendência e alertas. Cliente-alvo:
granjas (silos alimentadores pequenos, 2–18 t) e cooperativas (silos de armazenagem
grandes, 4,6–16,5 m de diâmetro).

Cada usuário tem uma ou mais **propriedades**; cada propriedade tem uma ou mais
**silos**; cada silo recebe leituras de um sensor físico (hoje, simulação no
navegador — objetivo deste contrato é substituir isso por hardware real via LoRa).

## 2. Arquitetura esperada

```
Frontend (este repo)  ──── HTTPS / JSON ────▶  Backend (novo, seu time)
Frontend (este repo)  ◀─── HTTPS / JSON ─────  Backend (novo, seu time)

Sensor (LiDAR)  ── rádio LoRa ──▶  Gateway (ESP32 + LoRa)  ── HTTPS / JSON ──▶  Backend (mesmo de cima)
```

- O frontend fala **só** com a API HTTP/JSON descrita aqui. Sem acesso direto a
  banco, sem SDK de backend-as-a-service no cliente.
- Autenticação de usuário: **token** (ver seção 4) enviado em
  `Authorization: Bearer <token>` em toda rota autenticada.
- Autenticação de dispositivo (sensor): **chave de API por dispositivo**, sem sessão
  de usuário — ver seção 9.
- Multi-tenant: cada usuário só vê/edita suas próprias propriedades/silos. Um usuário
  com papel `admin` vê e gerencia tudo. **Essa checagem de propriedade é
  responsabilidade do backend em cada rota** — não existe mais uma camada de RLS de
  banco fazendo isso por fora (era assim no Postgres/Supabase da referência; num
  backend novo, essa lógica precisa estar explícita no código da API).
- CORS: liberar a origem do frontend (dev: `http://localhost:5173`; produção: a URL
  final do deploy, a combinar).

## 3. Convenções gerais da API

### 3.1 Formato

- `Content-Type: application/json` em toda requisição e resposta com corpo.
- Datas/horários: string ISO 8601 UTC (`2026-08-31T14:22:00.000Z`).
- IDs: string. Pode ser UUID ou qualquer outro formato único — o frontend só guarda e
  reenvia a string, nunca faz parsing dela.
- Nada de campos `null` vs. campo ausente com significados diferentes — se um campo é
  opcional e não tem valor, mande `null` explícito, não omita a chave.

### 3.2 Autenticação de requisições de usuário

```
Authorization: Bearer <accessToken>
```

Toda rota das seções 5–8, 10–12 exige esse header, exceto onde marcado
"**público**" (cadastro, login). Sem header válido → `401`.

### 3.3 Paginação

Nenhuma rota abaixo precisa de paginação de verdade nos volumes esperados (um usuário
tem poucas propriedades/silos; o histórico é limitado por janela de tempo, não por
contagem). Onde há uma janela de tempo (seção 8), use `from`/`to` como query params.

### 3.4 Formato de erro

Toda resposta de erro (`4xx`/`5xx`) usa o mesmo envelope:

```json
{
  "error": {
    "code": "INVALID_CREDENTIALS",
    "message": "E-mail (ou ID de usuário) e senha não coincidem."
  }
}
```

`message` é texto para exibir direto ao usuário (em português, já traduzido — o
frontend não traduz `code`). `code` é para o frontend decidir *comportamento*
diferente por caso (ex.: mostrar campo de senha errada vs. desabilitar botão).
Códigos que o frontend precisa distinguir, com o HTTP status esperado:

| `code` | HTTP | Quando |
| --- | --- | --- |
| `VALIDATION_ERROR` | 400 | Campo obrigatório ausente/formato inválido |
| `INVALID_CREDENTIALS` | 401 | Login: e-mail/username OU senha errados (nunca diga qual dos dois — evita enumeração) |
| `UNAUTHENTICATED` | 401 | Token ausente/expirado/inválido |
| `FORBIDDEN` | 403 | Autenticado, mas sem permissão para este recurso (ex.: silo de outro usuário) |
| `BLOCKED_ACCOUNT` | 403 | Login válido, mas `blocked = true` |
| `NOT_FOUND` | 404 | Recurso não existe (ou existe mas não é seu — mesma resposta, não revele existência) |
| `USERNAME_TAKEN` | 409 | Cadastro ou troca de username colidindo com um já existente |
| `EMAIL_TAKEN` | 409 | Cadastro com e-mail já registrado |
| `WRONG_PASSWORD` | 401 | Confirmação de senha para ação sensível (renomear propriedade) falhou |
| `RATE_LIMITED` | 429 | Excesso de tentativas (login, resolução de username, ingestão com chave inválida) |
| `DEVICE_UNAUTHORIZED` | 401 | Chave de API de dispositivo inválida/revogada (seção 9) |
| `SERVER_ERROR` | 500 | Qualquer falha inesperada |

### 3.5 Isolamento multi-tenant (obrigatório em toda rota de propriedade/silo/histórico)

Em toda rota que recebe um `propertyId`/`siloId` na URL: se o recurso não existir OU
existir mas pertencer a outro usuário (e quem está chamando não é admin), devolva
`404 NOT_FOUND` — não `403`. Não revele que o recurso existe para outra conta.

## 4. Autenticação e sessão

### 4.1 `POST /auth/signup` — público

Cria conta e perfil.

**Corpo:**
```json
{ "fullName": "João Silva", "username": "joao.silva", "email": "joao@cooperativa.com.br", "password": "••••••••" }
```
- `fullName`: obrigatório, texto livre.
- `username`: obrigatório, `/^[a-z0-9._]{3,24}$/` (letras minúsculas, números, ponto,
  underscore, 3–24 caracteres). Único no sistema.
- `email`: obrigatório, único no sistema.
- `password`: obrigatório, mínimo 6 caracteres (o mínimo pode subir se o backend
  quiser reforçar — o frontend só valida esse mínimo hoje).

**Resposta (201):** acesso imediato — sem confirmação por e-mail nem aprovação de
admin. Mesmo formato de `POST /auth/login`:
```json
{
  "accessToken": "...",
  "refreshToken": "...",
  "expiresIn": 3600,
  "user": { "id": "...", "fullName": "João Silva", "username": "joao.silva", "email": "joao@cooperativa.com.br", "role": "user", "blocked": false, "createdAt": "..." }
}
```

**Erros:** `VALIDATION_ERROR`, `USERNAME_TAKEN`, `EMAIL_TAKEN`.

> Se o produto decidir no futuro exigir confirmação de e-mail antes do primeiro
> login, isso muda a resposta desta rota (sem token ainda) — é uma decisão de produto
> em aberto, não algo que o frontend força hoje.

### 4.2 `POST /auth/login` — público

**Corpo:**
```json
{ "identifier": "joao@cooperativa.com.br", "password": "••••••••" }
```
`identifier` é e-mail OU username — **o backend resolve isso internamente**, num
único campo. (Diferente da referência em Supabase, que tinha uma RPC pública separada
de "username → e-mail" chamada antes do login: isso permitia enumerar se um username
existe. Resolvendo dentro do próprio `/auth/login`, sem endpoint público equivalente,
fecha essa brecha — devolva sempre `INVALID_CREDENTIALS` genérico tanto para
"identificador não existe" quanto para "senha errada".)

**Resposta (200):** mesmo formato da seção 4.1.

**Erros:** `VALIDATION_ERROR`, `INVALID_CREDENTIALS`, `BLOCKED_ACCOUNT` (conta existe,
senha certa, mas `blocked = true` — só nesse caso específico é aceitável devolver um
código diferente de `INVALID_CREDENTIALS`, já que a pessoa comprovou a senha).

Aplique rate limit por IP e por `identifier` (ex.: 10 tentativas/15min) — devolva
`RATE_LIMITED` acima do limite.

### 4.3 `POST /auth/refresh` — público (mas exige refresh token válido)

**Corpo:** `{ "refreshToken": "..." }`

**Resposta (200):** `{ "accessToken": "...", "refreshToken": "...", "expiresIn": 3600 }`
(refresh token rotativo — o antigo é invalidado ao usar).

**Erros:** `UNAUTHENTICATED` (refresh token expirado/revogado/inválido) — o frontend
trata isso deslogando e voltando pra tela de login.

Sugestão de expiração: access token 1h, refresh token 30 dias.

### 4.4 `POST /auth/logout` — autenticado

Revoga o refresh token atual (server-side). **Resposta:** `204`.

### 4.5 `POST /auth/forgot-password` — público

**Corpo:** `{ "email": "..." }`

Sempre devolve `202` (mesmo se o e-mail não existir — não revele) e, se existir,
dispara um e-mail com link de redefinição.

### 4.6 `POST /auth/reset-password` — público (token vem do e-mail)

**Corpo:** `{ "token": "...", "newPassword": "..." }`

**Resposta:** `204`. **Erros:** `VALIDATION_ERROR` (token inválido/expirado, ou senha
curta).

> Hoje esse fluxo self-service não existe no frontend (botão "Esqueceu a senha?" fica
> desabilitado) — só o admin consegue disparar redefinição por outra pessoa (seção
> 11). Recomendo implementar este self-service mesmo assim; é uma melhoria óbvia sobre
> o que existe hoje, e o botão já está pronto na tela de login esperando a rota
> existir.

## 5. Perfil / conta do usuário

### 5.1 `GET /me` — autenticado

**Resposta (200):**
```json
{ "id": "...", "fullName": "João Silva", "username": "joao.silva", "pendingUsername": null, "email": "joao@cooperativa.com.br", "role": "user", "blocked": false, "createdAt": "..." }
```
Chamado no boot do app pra restaurar a sessão (junto com a validação do token).

### 5.2 `PATCH /me/username` — autenticado

**Corpo:** `{ "username": "novo.id" }` (mesma regex da seção 4.1)

**Regra de negócio (importante):**
- Se o usuário **ainda não tem** `username` definido (conta antiga, criada antes
  dessa feature existir): aplica direto.
- Se o usuário **já tem** um `username`: a troca **não aplica direto** — fica em
  `pendingUsername` até um admin aprovar ou rejeitar (seção 11.1). Motivo: username
  também é usado como credencial de login (seção 4.2); troca livre e ilimitada
  facilitaria uma conta "reservar" ou imitar o identificador de outra.

**Resposta (200):** `{ "status": "applied" }` ou `{ "status": "pending" }`.

**Erros:** `VALIDATION_ERROR`, `USERNAME_TAKEN`.

### 5.3 `GET /me/export` — autenticado (LGPD, art. 18)

Ver seção 12.1.

### 5.4 `DELETE /me` — autenticado (LGPD, art. 18 — exclusão)

Ver seção 12.2.

## 6. Propriedades

Modelo: 1 propriedade tem exatamente 1 usuário dono (sem múltiplos usuários
compartilhando a mesma propriedade ainda — ex.: "dono + funcionário vendo os mesmos
silos" não existe hoje; decisão deliberada de produto, não implementar isso agora).
1 propriedade tem N silos.

**Invariante que o backend deve garantir:** todo usuário sempre tem pelo menos 1
propriedade, e toda propriedade sempre tem pelo menos 1 silo. Isso significa:
- No cadastro (seção 4.1), crie automaticamente 1 propriedade padrão ("Propriedade
  1") com 1 silo padrão ("Silo 1", ver dimensões-padrão na seção 13.3) para toda
  conta nova.
- Ao criar uma propriedade (6.2), crie também 1 silo padrão dentro dela na mesma
  operação.
- Ao excluir o último silo de uma propriedade (7.5), recrie automaticamente 1 silo
  padrão na mesma propriedade.
- Ao excluir a última propriedade de um usuário (6.4), recrie automaticamente 1
  propriedade padrão com 1 silo padrão.

Isso existe pra nunca deixar a tela sem nada pra mostrar — o frontend assume que
sempre existe ao menos um silo ativo depois do primeiro login.

### 6.1 `GET /properties` — autenticado

**Resposta (200):** `[{ "id": "...", "nome": "Propriedade 1" }, ...]`

### 6.2 `POST /properties` — autenticado

**Corpo:** `{ "nome": "Fazenda Norte" }`

Cria a propriedade **e** um silo padrão dentro dela (ver invariante acima).

**Resposta (201):**
```json
{
  "property": { "id": "...", "nome": "Fazenda Norte" },
  "defaultSilo": { "id": "...", "nome": "Silo 1", "propriedadeId": "..." }
}
```

### 6.3 `PATCH /properties/{id}` — autenticado, dono ou admin

Renomear é considerado ação sensível — exige confirmar a senha atual na mesma
requisição (o frontend já mostra esse campo na UI).

**Corpo:** `{ "nome": "Novo nome", "password": "senha atual do usuário logado" }`

**Resposta (200):** `{ "id": "...", "nome": "Novo nome" }`

**Erros:** `NOT_FOUND`, `WRONG_PASSWORD`, `VALIDATION_ERROR`.

### 6.4 `DELETE /properties/{id}` — autenticado, dono ou admin

Exclui a propriedade e, em cascata, todos os seus silos, leituras, histórico e
alertas associados. Ver invariante acima (recria uma padrão se era a última).

**Resposta:** `204`.

## 7. Silos

### 7.1 `GET /properties/{propertyId}/silos` — autenticado, dono ou admin

**Resposta (200):** `[{ "id": "...", "nome": "Silo 1", "propriedadeId": "..." }, ...]`

### 7.2 `GET /silos/{id}` — autenticado, dono ou admin

Configuração completa (o que a tela de "Novo silo"/"Configurações" edita):

```json
{
  "id": "...",
  "nome": "Silo 1",
  "propriedadeId": "...",
  "standardId": "alim-240",
  "grainId": "racao",
  "dims": {
    "diameterM": 2.4,
    "cylinderHeightM": 3.6,
    "roofHeightM": 0.64,
    "hopperType": "cone",
    "hopperHeightM": 2.16,
    "outletDiameterM": 0.3
  }
}
```

`standardId` e `grainId` são strings livres que referenciam catálogos que só existem
**no frontend** (`src/data/standardSilos.ts` e `src/data/grainProfiles.ts` — modelos
de silo padrão e perfis de grão com densidade/ângulo de repouso). O backend não valida
o conteúdo desses IDs contra nada — só guarda e devolve a string. Se o valor for
`"custom"`, `dims` é o que importa; senão, o frontend usa `standardId` só pra
pré-selecionar um modelo na UI (as `dims` retornadas é que valem para o cálculo).

### 7.3 `POST /silos` — autenticado, dono da propriedade

**Corpo:** `{ "propriedadeId": "...", "nome": "Silo 2", "standardId": "alim-240", "grainId": "racao", "dims": { ... } }`

**Resposta (201):** o objeto completo (mesmo formato de 7.2).

### 7.4 `PATCH /silos/{id}` — autenticado, dono ou admin

**Corpo:** mesmo formato de 7.3 (sem `propriedadeId` — não existe mover silo entre
propriedades hoje).

**Resposta (200):** objeto atualizado.

### 7.5 `DELETE /silos/{id}` — autenticado, dono ou admin

Exclui o silo e, em cascata, suas leituras/histórico/alertas. Ver invariante da
seção 6 (recria um silo padrão na mesma propriedade se era o último).

**Resposta:** `204`.

## 8. Histórico de nível (dados do gráfico)

Uma amostra por silo a cada ~5 minutos: nível (%), volume, massa, temperatura — é o
que alimenta o gráfico de tendência de 24h/7 dias. **Não é a nuvem de pontos do
sensor** (isso é a seção 9) — é um resumo já calculado, uma linha por amostra.

### 8.1 `GET /silos/{id}/history?from=&to=` — autenticado, dono ou admin

`from`/`to`: ISO 8601, opcionais — sem eles, default para os últimos 7 dias.

**Resposta (200):**
```json
[
  { "t": "2026-08-31T10:00:00.000Z", "levelPercent": 68.2, "volumeM3": 12.4, "massTon": 7.9, "temperatureC": 24.1 },
  ...
]
```
Ordenado por `t` ascendente. Em 7 dias a ~1 ponto/5min são ~2.000 linhas — não precisa
paginar.

### 8.2 Quem escreve aqui

**Recomendado (ver seção 9.4):** o próprio backend grava uma linha aqui a cada
ingestão de telemetria (ou a cada ~5 min, o que vier primeiro), calculada a partir da
leitura recebida do sensor — não o frontend. Isso é diferente da implementação de
referência (onde o *cliente* gravava, porque o cliente também *era* o simulador do
sensor); com sensor real, ninguém garante que alguém está com o dashboard aberto no
momento da leitura, então o cálculo e a gravação do histórico precisam acontecer no
backend, na ingestão.

## 9. Ingestão de telemetria — ESP32 / LoRa

**Esta é a rota que o hardware de campo chama.** Peça explícita: um endpoint para o
ESP32 enviar a telemetria do silo, considerando que a transmissão é via **LoRa**.

### 9.1 Topologia esperada

```
Sensor LiDAR ──(serial/I²C)──▶ ESP32 + módulo LoRa (no silo)
                                        │
                                   rádio LoRa (uns poucos km, baixa banda)
                                        │
                                        ▼
                          Gateway (outro ESP32/LoRaWAN + Wi-Fi/celular)
                                        │
                                   HTTPS / JSON
                                        │
                                        ▼
                              Este endpoint no backend
```

O dispositivo no silo (ESP32 + LoRa) normalmente **não tem internet direto** — ele
transmite por rádio LoRa até um gateway que tem conectividade (Wi-Fi/celular/Ethernet)
e é esse gateway que efetivamente faz a chamada HTTP abaixo. Tanto o formato exato do
pacote de rádio LoRa quanto o firmware do gateway são problema de hardware/firmware,
**não desta API** — o contrato abaixo é o que chega decodificado, em JSON, por HTTP,
depois que o gateway já traduziu o pacote de rádio. Se o gateway for feito num único
ESP32 (LiDAR + LoRa + Wi-Fi no mesmo dispositivo, sem um gateway separado), o contrato
é exatamente o mesmo — só muda quem faz a chamada HTTP.

### 9.2 Autenticação — chave de API por dispositivo

Sem login de usuário — um sensor de campo não loga. Cada dispositivo físico recebe
uma chave de API, cadastrada pelo back office (seção 11.3).

```
POST /devices/telemetry
Headers:
  Content-Type: application/json
  Authorization: Bearer <device_api_key>
```

Chave inválida ou revogada → `401 DEVICE_UNAUTHORIZED`.

### 9.3 Corpo da requisição

```json
{
  "siloId": "...",
  "sensorHeightM": 4.5,
  "resolutionM": 0.05,
  "points": [
    { "angleDeg": 0,   "radiusM": 1.2, "distanceM": 3.42 },
    { "angleDeg": 30,  "radiusM": 1.2, "distanceM": 3.38 },
    { "angleDeg": 60,  "radiusM": 1.2, "distanceM": 3.51 }
  ],
  "origem": "sensor"
}
```

| Campo | Tipo | Obrigatório | Descrição |
| --- | --- | --- | --- |
| `siloId` | string | sim | Qual silo esta leitura pertence |
| `sensorHeightM` | number | sim | Altura do sensor até a junção cilindro/moega — referência pra converter distância em altura |
| `resolutionM` | number | sim | Resolução/precisão nominal do sensor, em metros |
| `points` | array | sim | Ver abaixo — não-vazio, **máximo 5000 elementos** |
| `points[].angleDeg` | number | sim | Ângulo da leitura, 0–360° |
| `points[].radiusM` | number | sim | Distância radial do ponto ao centro do silo |
| `points[].distanceM` | number | sim | **Distância inclinada do sensor até a superfície do grão** (não é altura — o backend calcula altura como `sensorHeightM - distanceM`) |
| `origem` | `"sensor"` \| `"simulado"` | não (default `"sensor"`) | Só pra diferenciar leitura real de teste/simulação nos dados guardados |

**Validações obrigatórias** (devolver `400 VALIDATION_ERROR` se falhar, sem gravar
nada):
- `siloId` precisa existir (senão `404 NOT_FOUND`).
- `sensorHeightM > 0`, `resolutionM > 0`.
- `points` é array não-vazio com no máximo 5000 elementos (trava contra payload
  malformado/malicioso inflando uma linha do banco).

> ⚠️ **Banda do LoRa é baixa** — o payload acima (com muitos pontos) provavelmente
> **não** é o que o rádio LoRa consegue transmitir de uma vez; o protocolo exato de
> rádio (quantos pontos por transmissão, se manda a nuvem completa ou um resumo por
> setor) ainda não está definido — depende do hardware final. Este contrato aceita o
> formato "já decodificado" que o resto do pipeline espera; **o gateway é quem monta
> este JSON a partir do(s) pacote(s) de rádio recebidos**, agregando várias
> transmissões LoRa pequenas num payload só antes de chamar esta rota, se for o caso.
> Isso significa: aceite tanto uma chamada com poucos pontos (ex.: 8–12, uma leitura
> por setor grosseiro) quanto uma mais densa — a mesma validação (`≥1`, `≤5000`) cobre
> os dois casos sem mudança de contrato.

### 9.4 O que o backend faz com isso

1. Valida a chave de API e o `siloId` (seção 9.2/9.3).
2. Grava a leitura crua (nuvem de pontos) — equivalente a uma tabela `leituras`:
   `siloId`, `ocorridoEm` (agora), `sensorHeightM`, `resolutionM`, `points`, `origem`.
3. **Recomendado:** calcula volume/massa/nível a partir dos pontos (ver seção 13.4
   para o algoritmo) e grava uma linha de histórico (seção 8) com o resultado —
   assim o gráfico de tendência funciona sem depender de ninguém estar com o
   dashboard aberto no momento da leitura.
4. **Recomendado:** avalia as regras de alerta (seção 10.2) contra o resultado do
   passo 3 e persiste um alerta novo se alguma regra disparar e ainda não houver um
   alerta *aberto* daquele tipo para aquele silo.

**Resposta (201):** `{ "readingId": "..." }`

### 9.5 Vínculo dispositivo → silo (decisão para este projeto, não um gap a deixar aberto)

Na implementação de referência, qualquer chave de API válida podia gravar em
*qualquer* `siloId` — não havia cadastro de dispositivos, só a chave solta. Como este
é um backend novo, **não repita isso**: modele uma entidade `device` própria —

```json
{ "id": "...", "label": "Sensor Galpão 3", "apiKey": "...", "siloId": "...", "createdAt": "...", "revokedAt": null }
```

com `siloId` fixo no cadastro do dispositivo (seção 11.3), e valide na ingestão que o
`siloId` do corpo da requisição bate com o `siloId` vinculado à chave — devolva `403
FORBIDDEN` se não bater. Isso fecha a brecha de uma chave comprometida conseguir
gravar lixo em silos de outros clientes.

### 9.6 Rate limiting

Limite tentativas de chave inválida por IP/chave (ex.: 20/min) — devolva
`429 RATE_LIMITED`. A entropia da própria chave (se for um token longo e aleatório)
já ajuda, mas não substitui rate limiting na borda da API.

## 10. Alertas

### 10.1 `GET /silos/{id}/alerts?status=open` — autenticado, dono ou admin

**Resposta (200):**
```json
[
  { "id": "...", "severity": "critical", "message": "Nível crítico (12%) — abastecimento urgente", "createdAt": "...", "resolvedAt": null }
]
```
`severity`: `"info" | "warning" | "critical"`.

### 10.2 Regras de alerta (extraídas da implementação de referência)

Se o backend assumir o cálculo (recomendado, seção 9.4), replique exatamente estas
regras, avaliadas a cada nova leitura de telemetria:

| Condição | `severity` | Mensagem (template) |
| --- | --- | --- |
| `levelPercent < 15` | `critical` | `Nível crítico (X%) — abastecimento urgente` |
| `15 ≤ levelPercent < 35` | `warning` | `Nível baixo (X%) — planeje o abastecimento` |
| `levelPercent ≥ 90` | `warning` | `Silo próximo da capacidade máxima` |
| `temperatureC ≥ 32` | `warning` | `Temperatura elevada da massa (X°C)` |
| cobertura do scan `< 70%` | `info` | `Cobertura do scanner LiDAR baixa (X%)` |
| previsão de reabastecer em `< 24h` | `info` | `Abastecimento recomendado em ~X h` |

`levelPercent`, `temperatureC` e a % de cobertura vêm do cálculo de volume da mesma
leitura (seção 13.4); a previsão de reabastecimento é uma taxa de fluxo derivada da
tendência das últimas leituras (janela de 1h) — se o backend não quiser reimplementar
essa parte agora, pode deixar de fora só essa última regra sem quebrar as outras
cinco.

Evite duplicar alerta: só crie um novo se não existir um alerta **aberto**
(`resolvedAt: null`) da mesma condição para o mesmo silo; marque `resolvedAt` quando a
condição deixar de valer na leitura seguinte.

### 10.3 Quem lê

O dono do silo (tela de alertas do app) e a exportação de dados (seção 12.1); admin
vê os de todo mundo.

## 11. Back office administrativo

Visível só para `role = "admin"`. **Não existe promoção a admin pela própria API** —
de propósito, por segurança. O primeiro admin do sistema precisa ser promovido
manualmente (uma operação direta no banco/painel do backend, fora de qualquer rota
HTTP).

### 11.1 `GET /admin/users` — admin

**Resposta (200):**
```json
[
  { "id": "...", "fullName": "João Silva", "username": "joao.silva", "pendingUsername": null, "email": "joao@cooperativa.com.br", "role": "user", "blocked": false, "createdAt": "..." }
]
```

### 11.2 Ações sobre usuário — admin

- `PATCH /admin/users/{id}/role` — corpo `{ "role": "admin" | "user" }` → `200`.
- `PATCH /admin/users/{id}/blocked` — corpo `{ "blocked": true | false }` → `200`.
  (Bloqueio de aplicação: a próxima vez que essa conta chamar qualquer rota
  autenticada, ou tentar logar, devolva `403 BLOCKED_ACCOUNT`. Não precisa ser um ban
  de infraestrutura de verdade.)
- `POST /admin/users/{id}/send-password-reset` — dispara o mesmo fluxo da seção 4.5
  para o e-mail dessa conta → `202`.
- `POST /admin/users/{id}/approve-username` — aplica a `pendingUsername` (seção 5.2)
  → `200`.
- `POST /admin/users/{id}/reject-username` — descarta a `pendingUsername` → `200`.

Não existe "resetar senha direto"/"banir de verdade" pela API por design — a pessoa
sempre troca a própria senha pelo link de redefinição.

### 11.3 Propriedades/silos e dispositivos — admin

- `GET /admin/properties` — visão cross-tenant de tudo:
  ```json
  [{ "id": "...", "nome": "Fazenda Norte", "userId": "...", "silos": [{ "id": "...", "nome": "Silo 1" }] }]
  ```
- `GET /admin/devices` — lista dispositivos (sem expor a `apiKey` de novo, só na
  criação):
  ```json
  [{ "id": "...", "label": "Sensor Galpão 3", "siloId": "...", "createdAt": "...", "revokedAt": null }]
  ```
- `POST /admin/devices` — corpo `{ "label": "...", "siloId": "..." }` → cria e
  devolve a chave **em texto puro, só nesta resposta**:
  ```json
  { "id": "...", "label": "Sensor Galpão 3", "apiKey": "...", "siloId": "...", "createdAt": "...", "revokedAt": null }
  ```
  (ver seção 9.5 — `siloId` é obrigatório e fixo na criação, não uma chave solta)
- `POST /admin/devices/{id}/revoke` → `200`, `revokedAt` preenchido.

## 12. LGPD — exportação e exclusão de dados

### 12.1 `GET /me/export`

Baixa tudo que pertence ao usuário logado — botão em "Minha conta" (art. 18 LGPD,
portabilidade).

**Resposta (200):**
```json
{
  "exportadoEm": "...",
  "propriedades": [...],
  "silos": [...],
  "leituras": [...],
  "historicoNiveis": [...],
  "alertas": [...]
}
```
Cada array com os objetos completos (mesmo formato das seções 6/7/8/9/10), só do
usuário que está chamando.

### 12.2 `DELETE /me`

Exclusão de conta, irreversível, sem soft-delete — apaga a conta e, em cascata, tudo
que pertence a ela (propriedades, silos, leituras, histórico, alertas). **Resposta:**
`204`.

### 12.3 Log de auditoria (opcional, recomendado)

A referência registra criação/exclusão de silo num log de auditoria que sobrevive à
exclusão da própria conta (decisão deliberada: um log de segurança normalmente
precisa sobreviver à ação que ele registra). Se implementar, **não** dê cascade de
`ON DELETE` a partir do usuário nessa tabela — mas também não exponha rota de leitura
pública sobre ela; é uso interno.

## 13. Modelos de dados — referência completa

### 13.1 Usuário / perfil

```ts
interface Profile {
  id: string
  fullName: string | null
  username: string | null
  pendingUsername: string | null   // troca aguardando aprovação de admin
  email: string
  role: 'user' | 'admin'
  blocked: boolean
  createdAt: string
}
```

### 13.2 Propriedade e silo (resumo, para listas)

```ts
interface PropertySummary { id: string; nome: string }
interface SiloSummary { id: string; nome: string; propriedadeId: string }
```

### 13.3 Silo (configuração completa)

```ts
type HopperType = 'flat' | 'cone'

interface SiloDimensions {
  diameterM: number
  cylinderHeightM: number
  roofHeightM: number
  hopperType: HopperType
  hopperHeightM: number
  outletDiameterM: number
}

interface Silo {
  id: string
  nome: string
  propriedadeId: string
  standardId: string   // referencia catálogo do FRONTEND, string livre — backend não valida conteúdo
  grainId: string       // idem
  dims: SiloDimensions
}
```

Dimensões-padrão pra usar como "Silo 1" default (invariante da seção 6) — modelo
"Alimentador 9 t":
```json
{ "diameterM": 2.4, "cylinderHeightM": 3.6, "roofHeightM": 0.64, "hopperType": "cone", "hopperHeightM": 2.16, "outletDiameterM": 0.3 }
```
com `standardId: "alim-240"`, `grainId: "racao"`.

### 13.4 Leitura crua e cálculo de volume/massa/nível

```ts
interface RawLidarPoint { angleDeg: number; radiusM: number; distanceM: number }

interface Reading {
  id: string
  siloId: string
  ocorridoEm: string
  sensorHeightM: number
  resolutionM: number
  points: RawLidarPoint[]
  origem: 'sensor' | 'simulado'
}
```

Se o backend for calcular volume/massa/nível (recomendado, seção 9.4), o algoritmo
de referência é:

1. **Altura por ponto:** `heightM = sensorHeightM - distanceM` (altura da superfície
   relativa à junção cilindro/moega; negativo = dentro da moega).
2. **Grade polar:** distribua os pontos numa grade de anéis × setores (referência
   usa 40 anéis × 96 setores) sobre o raio do silo, tirando a média de altura por
   célula; células sem nenhum ponto (buraco na cobertura do scan) recebem o valor do
   vizinho mais próximo já preenchido (flood-fill).
3. **Cobertura:** `% de células com pelo menos 1 ponto real antes do flood-fill` — é
   o número usado no alerta de "cobertura baixa" (seção 10.2).
4. **Volume do cilindro:** para cada célula, `altura (limitada a cylinderHeightM +
   roofHeightM) × área da célula (setor anular)`, somado.
5. **Volume da moega (só `hopperType: "cone"`):** frustum de cone entre o raio do
   silo e o raio da saída, proporcional à altura média da superfície relativa à
   moega (se a superfície estiver acima da junção, moega conta como cheia).
6. **Volume total:** cilindro + moega.
7. **Capacidade total:** mesmo cálculo com a grade toda no nível máximo (moega cheia
   + cilindro cheio + uma folga de "monte" cônico proporcional ao `roofHeightM`).
8. **`levelPercent` = volume / capacidade × 100. `massTon` = volume × densidade do
   grão (`bulkDensityKgM3`, do catálogo de grãos) / 1000.**

Fórmulas exatas (frustum de cone, integração da área anular) estão em
`src/lib/volume.ts` neste repositório, se quiser conferir bit a bit — mas o resumo
acima é suficiente para reimplementar.

### 13.5 Histórico (amostra de tendência)

```ts
interface HistorySample {
  t: string           // ocorridoEm
  levelPercent: number
  volumeM3: number
  massTon: number
  temperatureC: number
}
```

### 13.6 Alerta

```ts
interface Alert {
  id: string
  siloId: string
  severity: 'info' | 'warning' | 'critical'
  message: string
  createdAt: string
  resolvedAt: string | null
}
```

### 13.7 Dispositivo (sensor de campo)

```ts
interface Device {
  id: string
  label: string
  apiKey?: string   // só na resposta de criação
  siloId: string
  createdAt: string
  revokedAt: string | null
}
```

## 14. O que muda no frontend quando a API estiver pronta

Isso é trabalho **deste lado** (frontend), não do time de backend — mas ajuda saber
o tamanho do que vai mudar: toda a lógica de acesso a dados do app vive num único
arquivo, `src/store/useSiloStore.ts` (mais `src/lib/auth.ts` e `src/lib/admin.ts`).
Trocar de Supabase para esta API é reescrever esses três arquivos para chamar as
rotas acima em vez do SDK do Supabase — nenhum componente React, a cena 3D, ou os
cálculos de volume precisam mudar (eles já só consomem o estado da store, sem saber
de onde os dados vêm). `VITE_SUPABASE_URL`/`VITE_SUPABASE_ANON_KEY` (env vars atuais)
virariam algo como `VITE_API_BASE_URL`.

## 15. Checklist de entrega

Rotas (seções 4–12):
- [ ] `POST /auth/signup`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- [ ] `POST /auth/forgot-password`, `POST /auth/reset-password`
- [ ] `GET /me`, `PATCH /me/username`, `GET /me/export`, `DELETE /me`
- [ ] `GET /properties`, `POST /properties`, `PATCH /properties/{id}`, `DELETE /properties/{id}`
- [ ] `GET /properties/{id}/silos`, `GET /silos/{id}`, `POST /silos`, `PATCH /silos/{id}`, `DELETE /silos/{id}`
- [ ] `GET /silos/{id}/history`
- [ ] `POST /devices/telemetry` (autenticado por chave de API de dispositivo)
- [ ] `GET /silos/{id}/alerts`
- [ ] `GET /admin/users` + as 5 ações da seção 11.2
- [ ] `GET /admin/properties`, `GET /admin/devices`, `POST /admin/devices`, `POST /admin/devices/{id}/revoke`

Regras de negócio:
- [ ] Invariante "todo usuário tem ≥1 propriedade, toda propriedade tem ≥1 silo" (seção 6)
- [ ] Troca de username exige aprovação de admin depois da primeira vez (seção 5.2)
- [ ] Renomear propriedade exige confirmar senha (seção 6.3)
- [ ] Isolamento multi-tenant em toda rota (seção 3.5) — testar explicitamente com 2 contas
- [ ] Vínculo dispositivo → silo fixo na chave de API (seção 9.5) — **não** repetir o gap da referência
- [ ] Cálculo de volume/nível/alerta feito no backend na ingestão (seções 9.4, 10.2) — não deixar 100% no cliente
- [ ] Rate limiting em login e em ingestão com chave inválida (seções 4.2, 9.6)

Não-funcional:
- [ ] CORS liberado pra origem do frontend
- [ ] Senhas com hash (bcrypt/argon2), nunca texto puro
- [ ] Chaves de dispositivo com entropia suficiente (token longo e aleatório)
- [ ] Formato de erro consistente em toda rota (seção 3.4)
