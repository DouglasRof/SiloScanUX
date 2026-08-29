# Política de Privacidade — SiloScanUX

> **MINUTA DE TRABALHO — NÃO É ACONSELHAMENTO JURÍDICO.** Este documento foi escrito
> por um assistente de IA a partir do que o sistema efetivamente faz hoje. Ele precisa
> ser revisado e validado por um advogado especializado em proteção de dados (LGPD)
> antes de ser publicado ou de valer como política oficial da InovAgroTec. Campos
> entre colchetes `[assim]` são placeholders que precisam ser preenchidos.
>
> Última atualização do rascunho: 29/08/2026.

## 1. Quem somos

Esta Política de Privacidade se aplica ao SiloScanUX, sistema de monitoramento de
silos de grão, operado por **[RAZÃO SOCIAL DA INOVAGROTEC]**, inscrita no CNPJ sob o
nº **[CNPJ]**, com sede em **[ENDEREÇO]** ("nós", "InovAgroTec"), na qualidade de
controladora dos dados pessoais tratados através do SiloScanUX.

Para dúvidas sobre esta política ou para exercer os direitos descritos abaixo,
entre em contato pelo e-mail **[E-MAIL DE CONTATO / ENCARREGADO DE DADOS]**.

## 2. Quais dados coletamos

Hoje, o SiloScanUX coleta os seguintes dados pessoais:

- **Dados de cadastro**: e-mail e senha (a senha nunca é armazenada em texto puro —
  fica com hash, e nem nós temos acesso a ela). Opcionalmente, nome completo.
- **Dados de uso da conta**: os silos que você cadastra (nome, dimensões, tipo de
  grão armazenado) e as leituras de nível/volume/massa/temperatura associadas a
  eles — sejam simuladas ou vindas de um sensor real no futuro.

Não coletamos, hoje, dados de localização, dados financeiros, dados de terceiros, nem
categorias de dados sensíveis (saúde, biometria, origem étnica, etc.).

O SiloScanUX **não usa cookies de rastreamento nem ferramentas de analytics** no
momento. Se isso mudar no futuro, esta política será atualizada e — quando exigido
por lei — pediremos seu consentimento antes.

## 3. Para que usamos esses dados

| Dado | Finalidade | Base legal |
| --- | --- | --- |
| E-mail e senha | Autenticar seu acesso à conta | Execução de contrato (LGPD, art. 7º, V) |
| Nome, dados dos silos | Exibir e operar o dashboard de monitoramento | Execução de contrato |
| Leituras de nível/volume/temperatura | Calcular e mostrar o estado dos seus silos, gerar alertas | Execução de contrato |
| Registros de acesso e alterações | Segurança e auditoria da conta | Legítimo interesse (LGPD, art. 7º, IX) |

Não usamos seus dados para enviar publicidade de terceiros, nem os vendemos ou
compartilhamos com fins comerciais.

## 4. Com quem compartilhamos dados

Usamos as seguintes empresas como operadoras de dados (processam dados em nosso
nome, sob nossas instruções):

- **Supabase** (banco de dados, autenticação e hospedagem da infraestrutura). Os
  dados ficam hospedados na região **[REGIÃO DO PROJETO SUPABASE — ex.: São Paulo/BR]**.
  Consulte a [política de privacidade do Supabase](https://supabase.com/privacy).

Não compartilhamos seus dados com nenhum outro terceiro além dos listados acima,
exceto quando exigido por lei ou ordem judicial.

## 5. Por quanto tempo guardamos seus dados

Mantemos seus dados enquanto sua conta estiver ativa. Se você excluir sua conta, os
dados associados (silos, leituras, histórico) são apagados de forma definitiva e
irreversível — ver seção 6.

**[Preencher com o advogado: definir prazo de retenção pós-cancelamento, se houver,
antes da exclusão definitiva, e regras específicas para dados que a lei obrigue a
manter por mais tempo, se aplicável.]**

## 6. Seus direitos (LGPD, art. 18)

Você tem direito a, a qualquer momento e mediante solicitação:

- **Confirmação e acesso**: saber quais dados seus tratamos, e obter uma cópia deles.
- **Correção**: corrigir dados incompletos, inexatos ou desatualizados.
- **Exclusão**: apagar seus dados pessoais e a conta inteira — dentro do próprio
  SiloScanUX, você pode fazer isso sozinho, sem precisar nos contatar (ver o
  mecanismo de exclusão de conta no aplicativo).
- **Portabilidade**: exportar seus dados em formato legível por máquina — disponível
  dentro do próprio aplicativo.
- **Revogação de consentimento** e **oposição** a tratamentos baseados em legítimo
  interesse, quando aplicável.

Para exercer esses direitos, use as funções correspondentes no aplicativo ou entre
em contato pelo e-mail informado na seção 1.

## 7. Segurança

Aplicamos controles técnicos razoáveis para proteger seus dados, incluindo
criptografia em trânsito (HTTPS) e em repouso, isolamento de dados entre contas via
Row Level Security no banco de dados, e autenticação com senha com hash. Nenhum
sistema é 100% imune a incidentes — caso ocorra um vazamento de dados pessoais que
represente risco a você, seremos notificados por conta do Supabase (a plataforma que
hospeda a base) e cumpriremos nossa obrigação legal de comunicar você e a ANPD nos
prazos exigidos pela LGPD.

## 8. Alterações nesta política

Podemos atualizar esta política para refletir mudanças no produto ou na legislação.
Mudanças relevantes serão comunicadas dentro do aplicativo antes de entrarem em
vigor.
