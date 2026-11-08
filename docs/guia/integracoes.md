# Integrações

Nenhuma integração é obrigatória: sem a chave de um serviço, o recurso fica desligado e o painel diz o que falta.

Os **segredos** (chaves e tokens) ficam só nas **variáveis de ambiente do Convex**, uma vez em cada deployment (desenvolvimento e produção). Nunca no código, no `rubrica.config.ts` nem no banco. Tudo o que não é segredo (destinatários, URL do webhook, destinos ligados) se configura no painel.

O `npx create-rubrica setup` pergunta as principais e grava por você. Para gravar à mão: painel do Convex, Settings, Environment Variables, ou:

```bash
npx convex env set NOME valor            # no Convex de desenvolvimento
```

> Antes de qualquer comando `npx convex ...`, confira o `CONVEX_DEPLOYMENT` do `.env.local`: ele diz se vai para desenvolvimento ou produção.

## Envios públicos (contato e depoimento)

| Variável | Para quê | Padrão |
|---|---|---|
| `RUBRICA_IP_SALT` | Sal dos hashes de IP e e-mail (limite de envios e registro de consentimento). Valor aleatório longo; não troque depois, porque isso zera os limites. O `setup` grava | O endereço do deployment, que é público: **defina em produção** |
| `RUBRICA_ALLOWED_ORIGINS` | Origens extras que podem enviar, separadas por vírgula (`https://www.exemplo.com`). A URL do site já vale | |
| `RUBRICA_ALLOW_LOCALHOST` | `true` libera `localhost`. **Só no desenvolvimento** | desligado |
| `RUBRICA_CONTACT_RETENTION_DAYS` | Dias que um pedido de contato fica guardado antes de ser apagado (mínimo 30). Aparece na política de privacidade | `730` |

## Destinos dos contatos

O painel sempre recebe os pedidos. Os outros destinos se ligam no painel e precisam destas variáveis:

| Destino | Variáveis |
|---|---|
| **Telegram** | `TELEGRAM_BOT_TOKEN` (token do bot, criado no @BotFather) e `TELEGRAM_CHAT_ID` (a conversa que recebe os avisos) |
| **E-mail** (Resend) | `RESEND_API_KEY`, `RUBRICA_EMAIL_FROM` (remetente de um domínio verificado, como `Site <avisos@exemplo.com>`) e, se usar outro provedor, `RUBRICA_EMAIL_PROVIDER`. O `Reply-To` é o e-mail de quem escreveu |
| **Webhook** (CRM) | `RUBRICA_WEBHOOK_SECRET`: cada envio leva `X-Rubrica-Timestamp` e `X-Rubrica-Signature: sha256=<hex>`, o HMAC-SHA256 de `<timestamp>.<corpo>`. Confira a assinatura e recuse timestamps antigos |

Envios que falham tentam de novo depois de 1 min, 5 min, 30 min e 2 h; depois ficam como falha no painel e podem ser reenviados. As mesmas variáveis do Telegram avisam propostas aceitas, pagamentos confirmados e estornos.

## Publicação

| Variável | Para quê |
|---|---|
| `RUBRICA_DEPLOY_HOOK_URL` | URL do deploy hook da hospedagem. O botão **Publicar** do painel faz um `POST` sem corpo nela. Vercel, Netlify e Cloudflare Pages têm "deploy hook" ou "build hook" |
| `RUBRICA_DEPLOY_CALLBACK_SECRET` | Opcional. Segredo do aviso de fim de build (`POST <CONVEX_SITE_URL>/rubrica/publicacao/concluida`, com o cabeçalho `X-Rubrica-Secret`). Sem ele, o estado "publicando" termina sozinho em 15 minutos |

## Tradução com IA (plugin `translation`)

| Variável | Para quê | Padrão |
|---|---|---|
| `OPENROUTER_API_KEY` | Chave do OpenRouter | |
| `OPENROUTER_MODELS` | Modelos em ordem de preferência, separados por vírgula | `google/gemini-2.0-flash-001`, `google/gemini-2.5-flash-lite`, `openai/gpt-4o-mini`, `anthropic/claude-haiku-4.5` |

## Comercial: propostas, pagamentos e currículo com IA

| Variável | Quando | Para quê |
|---|---|---|
| `ASAAS_API_KEY` | Plugin `payments` | Chave do Asaas. O ambiente sai do prefixo: `$aact_prod_` é produção; qualquer outra, sandbox. Sem ela, o checkout responde `NOT_CONFIGURED` |
| `ASAAS_ENV` | Opcional | `production` ou `sandbox`, para forçar o ambiente |
| `ASAAS_WEBHOOK_TOKEN` | Plugin `payments` | Token que o Asaas manda no cabeçalho `asaas-access-token`. O `setup` gera e mostra: cadastre o **mesmo valor** no painel do Asaas. Sem ele, nenhum pagamento é confirmado |
| `OPENROUTER_API_KEY` | Plugin `ai-resumes` | Chave usada pelo currículo por vaga (pode ser a mesma da tradução) |
| `OPENROUTER_RESUME_MODELS` | Opcional | Três modelos separados por vírgula (análise da vaga, comparação, escrita) |
| `SITE_URL` | Opcional | Endereço do site no ar. Entra no CORS e na volta do pagamento |

O webhook do Asaas fica em `<CONVEX_SITE_URL>/webhooks/asaas`, com os eventos de cobrança. O `CONVEX_SITE_URL` é o endereço `.convex.site` do deployment.

## Analytics (Umami)

Estas **não** ficam no Convex: vão nas variáveis do **build** da hospedagem (Vercel, Settings, Environment Variables), porque o site é gerado no build.

| Variável | Para quê |
|---|---|
| `PUBLIC_UMAMI_SCRIPT_URL` | Endereço do script (`https://cloud.umami.is/script.js`). Só https |
| `PUBLIC_UMAMI_WEBSITE_ID` | Id do site no Umami |

Ligue o plugin **Analytics** (desligado por padrão). Sem plugin, sem script ou sem id, nenhuma página leva o script. A origem do script precisa estar liberada na política de segurança do site: o comando abaixo ajusta o `vercel.json` e o `public/_headers`.

```bash
npx create-rubrica config --analytics https://cloud.umami.is/script.js --analytics-id <id>
```

## LGPD

Os formulários (contato, depoimento, proposta) têm consentimento explícito, registrado junto com o envio. A política de privacidade é gerada a partir dos dados da empresa e dos plugins ligados, e fica editável na tela **Privacidade**, que também exporta e apaga os dados de um titular. A política também diz se algum recurso ligado usa cookies (o Umami não usa).
