# Variáveis de ambiente

Quase tudo no Rubrica se configura no painel. O que fica de fora são as **variáveis de ambiente**: chaves secretas e endereços que o sistema precisa conhecer antes de o painel existir. Esta página lista todas, onde cada uma fica e se você precisa dela.

**Nenhuma é obrigatória para o site abrir.** Sem a variável de um recurso, ele fica desligado e o painel diz o que falta. E você quase nunca grava nada à mão: o `npx create-rubrica setup` grava as do computador e o `npx create-rubrica publicar` grava as do site no ar.

## Onde elas ficam

| Lugar | O que guarda | Quem grava |
|---|---|---|
| **Convex** (o backend) | Os segredos: chaves de serviços, tokens, o sal dos formulários. Uma vez no banco de **desenvolvimento** e outra no de **produção** | O `setup` (desenvolvimento) e o `publicar` (produção). À mão: painel do Convex, Settings, Environment Variables |
| **Hospedagem** (Vercel ou outra) | O que o build precisa para gerar o site: o endereço do Convex de produção e do site | O `publicar`, na Vercel. Em outra hospedagem, você, nas configurações do projeto |
| **`.env.local`** (no seu computador) | O endereço do Convex de desenvolvimento | O próprio Convex. Não edite, não mostre e não faça commit dele |

Para gravar uma variável no Convex pelo terminal:

```bash
npx convex env set NOME valor            # no banco de desenvolvimento
npx convex env set NOME valor --prod     # no banco de produção
```

> Antes de qualquer comando `npx convex ...`, confira o `CONVEX_DEPLOYMENT` do `.env.local`: ele diz em qual banco o comando vai rodar.

## No Convex

### Básicas (o CLI grava)

| Variável | Para quê |
|---|---|
| `JWT_PRIVATE_KEY` e `JWKS` | As chaves do login do painel. O `setup` e o `publicar` criam; não mexa |
| `SITE_URL` | Endereço do site no ar. Entra na volta do pagamento e na lista de endereços que podem mandar formulários |
| `RUBRICA_IP_SALT` | Um valor aleatório usado para guardar IPs e e-mails de forma protegida nos formulários. **Defina em produção** e não troque depois: trocar zera os limites de envio |
| `RUBRICA_ALLOW_LOCALHOST` | `true` deixa o site do seu computador mandar formulários. **Só no banco de desenvolvimento** |
| `RUBRICA_DEPLOY_CALLBACK_SECRET` | Opcional. Segredo do aviso de que o build terminou, para o "publicando" do painel acabar na hora |

### Formulários e contatos

| Variável | Para quê |
|---|---|
| `RUBRICA_ALLOWED_ORIGINS` | Outros endereços que podem mandar formulários, separados por vírgula. O endereço do site já vale |
| `RUBRICA_CONTACT_RETENTION_DAYS` | Quantos dias um pedido de contato fica guardado (mínimo 30; padrão 730). Aparece na política de privacidade |
| `TELEGRAM_BOT_TOKEN` e `TELEGRAM_CHAT_ID` | Avisos no Telegram: pedidos de contato, propostas aceitas e pagamentos |
| `RESEND_API_KEY` e `RUBRICA_EMAIL_FROM` | Avisos por e-mail (pelo Resend), com o remetente de um domínio seu |
| `RUBRICA_EMAIL_PROVIDER` | Outro provedor de e-mail. Hoje só existe o `resend`, que é o padrão |
| `RUBRICA_WEBHOOK_SECRET` | Assinatura dos envios para um webhook (um CRM, por exemplo) |

### Publicação

| Variável | Para quê |
|---|---|
| `RUBRICA_DEPLOY_HOOK_URL` | O endereço que o botão **Publicar** do painel chama para refazer o site. Com a Vercel, o `publicar` configura sozinho; em outra hospedagem, copie o "deploy hook" ou "build hook" dela |

### Recursos com IA

| Variável | Para quê |
|---|---|
| `OPENROUTER_API_KEY` | Chave do OpenRouter, para a tradução com IA e o currículo por vaga |
| `OPENROUTER_MODELS` | Opcional. Os modelos da tradução, em ordem de preferência |
| `OPENROUTER_RESUME_MODELS` | Opcional. Os três modelos do currículo por vaga |

### Pagamentos (Asaas)

| Variável | Para quê |
|---|---|
| `ASAAS_API_KEY` | Chave do Asaas. Sem ela, o checkout não funciona |
| `ASAAS_WEBHOOK_TOKEN` | Código que o Asaas manda para confirmar os pagamentos. O `setup` cria: cadastre o **mesmo valor** no painel do Asaas |
| `ASAAS_ENV` | Opcional. `production` ou `sandbox`, para escolher o ambiente do Asaas (sem ela, o ambiente sai da chave) |

## Na hospedagem (build)

| Variável | Para quê |
|---|---|
| `CONVEX_URL` | Endereço do Convex de **produção** (termina em `.convex.cloud`). O build lê o conteúdo daqui |
| `PUBLIC_RUBRICA_API` | Endereço do Convex de produção que recebe os formulários (termina em `.convex.site`). Sem ele, os formulários do site não enviam |
| `SITE_URL` | Endereço do site |
| `CONVEX_DEPLOY_KEY` | Chave que deixa o build enviar o backend para o Convex de produção. Só é preciso quando o build roda `convex deploy`, como faz o da Vercel |
| `PUBLIC_UMAMI_SCRIPT_URL` e `PUBLIC_UMAMI_WEBSITE_ID` | Endereço do script e id do site no Umami, para o plugin Analytics. O que estiver nas Configurações do painel vale mais |

## Nomes da v1

Quem vem da v1 não precisa renomear nada: o Rubrica aceita os nomes antigos `TELEGRAM_ADMIN_CHAT_ID`, `VERCEL_DEPLOY_HOOK_URL`, `VITE_CONVEX_URL`, `VITE_UMAMI_SCRIPT_URL`, `VITE_UMAMI_WEBSITE_ID`, `VITE_ANALYTICS_ENDPOINT` e `VITE_ANALYTICS_WEBSITE_ID`.

Os detalhes de cada serviço (o bot do Telegram, o webhook do Asaas, o formato da assinatura do webhook) estão em [Integrações](./integracoes.md). Para pôr o site no ar em outra hospedagem, veja [Publicar o site](./publicar.md#outras-hospedagens).
