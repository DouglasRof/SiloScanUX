# SiloScanUX

Dashboard de monitoramento de silos de grão e ração via sensor LiDAR. O sensor mede a
altura da superfície do grão em vários ângulos, e o app calcula volume, massa e nível
(%) a partir disso — mostrando tudo em visualização 3D e 2D (planta e corte), histórico
de tendência e alertas. Desenvolvido para a InovAgroTec.

## O que o app faz

- **Visualização 3D e 2D** do silo e do grão, atualizada a partir da leitura do sensor
- **Cálculo automático** de volume, massa e nível de enchimento
- **Histórico e tendência** de nível ao longo do tempo, com estimativa de tempo até
  esvaziar ou encher
- **Alertas** de nível crítico/baixo
- **Múltiplas propriedades e silos** por conta, com um back office administrativo para
  gestão de usuários
- **Instalável como PWA** (ícone na tela inicial, funciona em tela cheia no celular)
- Pensado desde já para conformidade com a **LGPD** (exportação e exclusão de dados
  pelo próprio usuário)

## Stack

React 19 + TypeScript + Vite, Three.js (`@react-three/fiber`/`drei`) para a cena 3D,
Zustand para estado, Tailwind CSS 4, Supabase (Postgres + autenticação).

## Status

Em desenvolvimento ativo, em direção a uma primeira versão comercial. A integração com
o sensor físico (LiDAR + ESP32 + LoRa) está em andamento pelo time de hardware; o app
hoje roda com dados simulados enquanto isso avança.

---

Projeto mantido pela InovAgroTec.
