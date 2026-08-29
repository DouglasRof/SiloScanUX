# Fornecedores e Contratos de Operador de Dados (LGPD, art. 39)

> Checklist de referência — não é aconselhamento jurídico. Cada acordo listado
> aqui precisa ser revisado (e, quando exigido, assinado/aceito) pela pessoa
> responsável pela InovAgroTec — eu não aceito termos ou contratos em nome de
> ninguém.

Todo fornecedor que processa dado pessoal em nome da InovAgroTec (LGPD: "operador")
precisa de um contrato/DPA (Data Processing Agreement) formalizando isso. A maioria
das plataformas usadas aqui já oferece um DPA padrão de autoatendimento — o trabalho
é revisar e aceitar cada um, não redigir do zero.

| Fornecedor | Usado para | DPA/termos | Status |
| --- | --- | --- | --- |
| **Supabase** | Banco de dados, autenticação, hospedagem dos dados | [supabase.com/legal/dpa](https://supabase.com/legal/dpa) | ⏳ Revisar e aceitar |
| **Vercel** | Hospedagem do front-end (quando o deploy existir) | Ver [vercel.com/legal](https://vercel.com/legal) — DPA geralmente vinculado aos Termos de Serviço, self-serve | ⏳ Revisar quando o deploy existir |
| **Sentry** | Monitoramento de erro (opcional, ver `src/lib/sentry.ts`) | Ver [sentry.io/legal](https://sentry.io/legal/) | ⏳ Revisar se/quando ativado |

## Como proceder

1. Acessar o link do DPA de cada fornecedor já em uso (Supabase agora; Vercel e
   Sentry quando entrarem em produção).
2. Confirmar com um advogado se o DPA padrão do fornecedor é suficiente ou se
   precisa de um aditivo específico para a operação da InovAgroTec.
3. Aceitar/assinar (isso precisa ser feito por alguém com autoridade para
   contratar em nome da empresa — não é algo que eu faço).
4. Atualizar esta tabela com a data de aceite.

## Residência dos dados

O Supabase permite escolher a região do projeto — este projeto foi criado
recomendando `sa-east-1` (São Paulo). Confirmar com o advogado se isso é
suficiente para os fins da LGPD ou se há exigência adicional de residência
para o setor/mercado da InovAgroTec.
