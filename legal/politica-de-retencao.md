# Política de Retenção e Expurgo de Dados — proposta

> **MINUTA DE TRABALHO — NÃO É ACONSELHAMENTO JURÍDICO.** Isto é um ponto de
> partida com prazos propostos por padrão de mercado, não uma decisão. Precisa
> de validação do advogado e, principalmente, da sua decisão de negócio antes
> de qualquer prazo virar real (e antes de eu implementar o expurgo automático
> correspondente no banco).

## Proposta de prazos

| Dado | Prazo proposto | Motivo |
| --- | --- | --- |
| Conta e dados do silo (nome, dimensões, grão) | Enquanto a conta existir | Necessário pra operar o serviço |
| Leituras de sensor (`leituras`) e histórico de nível (`historico_niveis`) | Enquanto a conta existir; sem expurgo automático por enquanto | Ainda é pouco volume (ver `historico_niveis.sql`); reavaliar se isso crescer muito |
| Log de auditoria (`audit_log`) | 12 meses após o evento, depois expurgo automático | Prazo comum pra retenção de log de segurança — longo o bastante pra investigar um incidente, curto o bastante pra não acumular indefinidamente |
| Conta excluída pelo usuário | Imediato e definitivo (sem período de carência) | Já é o comportamento hoje (`account_deletion.sql`) — perguntar ao advogado se um período de carência de alguns dias antes da exclusão definitiva é desejável (dá chance de desistir) |

## O que fazer com isso

1. Decidir se os prazos acima fazem sentido pro negócio (ou ajustar).
2. Validar com o advogado se algum prazo precisa ser maior por obrigação legal
   (ex.: alguma exigência setorial de guarda de registro).
3. Uma vez decidido, eu implemento o expurgo automático correspondente — por
   exemplo, uma rotina agendada no Supabase (pg_cron) que apaga linhas de
   `audit_log` mais antigas que o prazo definido. Hoje isso ainda não está
   implementado porque o prazo ainda não foi decidido.
