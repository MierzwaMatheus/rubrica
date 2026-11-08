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
| `RUBRICA_DEPLOY_CALLBACK_SECRET` | Opcional. Segredo do aviso de fim de build: o provedor (ou um passo no fim do build) chama `POST <CONVEX_SITE_URL>/rubrica/publicacao/concluida` com o cabeçalho `X-Rubrica-Secret` (ou `?secret=`). Sem ele, o estado "publicando" termina sozinho em 15 minutos |

## Tradução com IA (plugin `translation`)

| Variável | Para quê | Padrão |
|---|---|---|
| `OPENROUTER_API_KEY` | Chave do OpenRouter | — |
| `OPENROUTER_MODELS` | Lista de modelos em ordem de preferência, separados por vírgula | `google/gemini-2.0-flash-001,google/gemini-2.5-flash-lite,openai/gpt-4o-mini,anthropic/claude-haiku-4.5` |
