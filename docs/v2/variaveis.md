# Variáveis de ambiente (v2)

Segredos e chaves ficam **só nas variáveis do Convex** (`npx convex env set NOME valor`, uma vez no Convex de desenvolvimento e outra no de produção). Nunca no código, no `rubrica.json` nem num `.env` com commit.

## Comercial

Propostas, modelos de contrato, pagamentos (Asaas) e currículos com IA (`packages/core/src/convex/commerce/`).

| Variável | Obrigatória | Para quê |
|---|---|---|
| `ASAAS_API_KEY` | Para o plugin `payments` | Chave da API do Asaas. O ambiente sai do prefixo: `$aact_prod_` é produção; qualquer outra, sandbox. Sem ela, o checkout responde `NOT_CONFIGURED` |
| `ASAAS_ENV` | Não | `production` ou `sandbox`, para forçar o ambiente em vez de deduzir pela chave |
| `ASAAS_WEBHOOK_TOKEN` | Para o plugin `payments` | Token que o Asaas manda no cabeçalho `asaas-access-token` do webhook (`POST <CONVEX_SITE_URL>/webhooks/asaas`). Cadastre o mesmo valor no painel do Asaas. Sem ele, o webhook responde 500 e nenhum pagamento é confirmado |
| `OPENROUTER_API_KEY` | Para o plugin `ai-resumes` | Chave do OpenRouter usada pelo currículo por vaga. (O plugin de tradução pode usar a mesma) |
| `OPENROUTER_RESUME_MODELS` | Não | Três ids de modelo do OpenRouter separados por vírgula (análise da vaga, comparação, escrita). Vazio: os da v1 |
| `SITE_URL` | Não | Endereço do site no ar (`https://...`). Entra no CORS das rotas públicas e na volta do cartão (`/payment-success/<link>`). Sem ela, vale a URL das configurações do site |
| `TELEGRAM_BOT_TOKEN` | Não | Bot que avisa o dono do site de proposta aceita, pagamento confirmado, estorno e pagamento extra |
| `TELEGRAM_ADMIN_CHAT_ID` | Não | Conversa que recebe os avisos. Sem as duas variáveis do Telegram, os avisos não saem (nada falha) |

As rotas HTTP do comercial ficam em `<CONVEX_SITE_URL>` (o endereço `.convex.site` do deployment): `/api/proposal/session`, `/api/proposal/accept`, `/api/checkout/start` e `/webhooks/asaas`.
