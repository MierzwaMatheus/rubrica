# Variáveis de ambiente do backend (v2)

Segredos e chaves ficam **só nas variáveis de ambiente do Convex** (painel do Convex → Settings → Environment Variables, ou `npx convex env set NOME valor`), uma vez em cada deployment (desenvolvimento e produção). Nunca no código, no `rubrica.config.ts` nem no banco. Tudo o que não é segredo (destinatários de e-mail, URL do webhook, destinos ligados) se configura no painel.

Nenhuma é obrigatória para o site funcionar: sem ela, o recurso correspondente fica desligado e o painel diz o que falta.

## Envios públicos (contato e depoimento)

| Variável | Para quê | Padrão |
|---|---|---|
| `RUBRICA_IP_SALT` | Sal dos hashes de IP e e-mail (limite de envios e registro de consentimento). Use um valor aleatório longo e não troque depois: trocar zera os limites e quebra a correspondência dos hashes antigos. | O endereço do deployment (`CONVEX_SITE_URL`), que é público: **defina em produção** |
| `RUBRICA_ALLOWED_ORIGINS` | Origens extras que podem enviar, separadas por vírgula (ex.: `https://www.exemplo.com,https://exemplo.vercel.app`). A URL do site (`siteSettings.url`) já vale sempre. | — |
| `RUBRICA_ALLOW_LOCALHOST` | `true` libera `http://localhost:<porta>` e `127.0.0.1`. **Só no deployment de desenvolvimento.** | desligado |
| `RUBRICA_CONTACT_RETENTION_DAYS` | Dias que um pedido de contato fica guardado antes do cron apagar (mínimo 30). Aparece na política de privacidade. | `730` |

## Destinos dos contatos

O painel sempre recebe. Os destinos abaixo se ligam no painel (`contacts.setDestinations`) e precisam destas variáveis:

| Variável | Destino | Observação |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Telegram | Token do bot (BotFather) |
| `TELEGRAM_CHAT_ID` | Telegram | Chat que recebe os avisos. Aceita também `TELEGRAM_ADMIN_CHAT_ID`, o nome da v1 |
| `RUBRICA_EMAIL_PROVIDER` | E-mail | Provedor de envio. Hoje: `resend` (padrão). Outro provedor entra em `EMAIL_PROVIDERS` (`packages/core/src/convex/lib/destinations.ts`) |
| `RESEND_API_KEY` | E-mail | Chave da API do Resend (com `RUBRICA_EMAIL_PROVIDER=resend`) |
| `RUBRICA_EMAIL_FROM` | E-mail | Remetente, de um domínio verificado no provedor (ex.: `Site <avisos@exemplo.com>`). O `Reply-To` é o e-mail de quem escreveu |
| `RUBRICA_WEBHOOK_SECRET` | Webhook | Segredo do HMAC. Cada envio leva `X-Rubrica-Timestamp` e `X-Rubrica-Signature: sha256=<hex>`, com o HMAC-SHA256 de `<timestamp>.<corpo>`. Confira a assinatura no CRM e recuse timestamps antigos |

Envios que falham tentam de novo depois de 1 min, 5 min, 30 min e 2 h. Depois disso ficam como falha no painel (`contacts.failedDeliveries`) e podem ser reenviados (`contacts.retryDelivery`).

## Publicação

| Variável | Para quê |
|---|---|
| `RUBRICA_DEPLOY_HOOK_URL` | Deploy hook do provedor de hospedagem (Vercel, Netlify, Cloudflare Pages…). O botão "publicar" faz um `POST` sem corpo nele. Aceita também `VERCEL_DEPLOY_HOOK_URL`, o nome da v1 |
| `RUBRICA_DEPLOY_CALLBACK_SECRET` | Opcional. Segredo do aviso de fim de build: `POST <CONVEX_SITE_URL>/rubrica/publicacao/concluida` com o cabeçalho `X-Rubrica-Secret` (ou `?secret=`). Vai no Convex (o `setup` cria) e no ambiente do build (o `publicar` grava na Vercel): no `astro:build:done`, a integração do núcleo chama a rota sozinha, com o endereço `.convex.site` de `CONVEX_SITE_URL` ou derivado do `CONVEX_URL`; pula builds de prévia e nunca falha o build. Sem ele, o estado "publicando" termina sozinho 5 minutos depois do clique (`PUBLISHING_WINDOW_MS`: um build na Vercel leva de 30 s a 2 min, e a folga cobre sites maiores e a fila do provedor). O painel decide o fim da janela com o relógio dele, já que a query do Convex só roda de novo quando os dados mudam |

## Tradução com IA (plugin `translation`)

| Variável | Para quê | Padrão |
|---|---|---|
| `OPENROUTER_API_KEY` | Chave do OpenRouter | — |
| `OPENROUTER_MODELS` | Lista de modelos em ordem de preferência, separados por vírgula | `google/gemini-2.0-flash-001,google/gemini-2.5-flash-lite,openai/gpt-4o-mini,anthropic/claude-haiku-4.5` |

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
| `RUBRICA_ALLOWED_ORIGINS` | Não | Origens extras aceitas no CORS das rotas públicas, separadas por vírgula. A URL do site (com e sem `www`) já vale sempre |
| `RUBRICA_ALLOW_LOCALHOST` | Não | `true` libera o servidor local (`localhost:4321`, `:5173`, `:3000`) no CORS. **Só no deployment de desenvolvimento** |
| `TELEGRAM_BOT_TOKEN` | Não | Bot que avisa o dono do site de proposta aceita, pagamento confirmado, estorno e pagamento extra |
| `TELEGRAM_CHAT_ID` | Não | Conversa que recebe os avisos (aceita também `TELEGRAM_ADMIN_CHAT_ID`, o nome da v1). Sem token e conversa, os avisos não saem (nada falha) |

As rotas HTTP do comercial ficam em `<CONVEX_SITE_URL>` (o endereço `.convex.site` do deployment): `/api/proposal/session`, `/api/proposal/accept`, `/api/checkout/start` e `/webhooks/asaas`.

## Build do site (hospedagem)

Estas não ficam no Convex: vão nas variáveis de ambiente do **build** (Vercel → Settings → Environment Variables), porque o site é gerado no build.

| Variável | Para quê |
|---|---|
| `PUBLIC_UMAMI_SCRIPT_URL` | Plugin `analytics`: endereço do script do Umami (`https://cloud.umami.is/script.js`). Só https. As Configurações do painel vencem esta. Aceita também `VITE_UMAMI_SCRIPT_URL` e `VITE_ANALYTICS_ENDPOINT` (o script em `<endpoint>/umami`), os nomes da v1 |
| `PUBLIC_UMAMI_WEBSITE_ID` | Plugin `analytics`: id do site no Umami. Aceita também `VITE_UMAMI_WEBSITE_ID` e `VITE_ANALYTICS_WEBSITE_ID` |

Sem o plugin ligado, ou sem script e id, nenhuma página leva o script. A origem do script precisa estar em `script-src` e `connect-src` da CSP: `npx create-rubrica config --analytics <script> --analytics-id <id>` grava as duas coisas (e atualiza o `vercel.json` e o `public/_headers`).
