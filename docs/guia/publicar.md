# Publicar o site

O site público é um conjunto de arquivos estáticos gerados no **build**: o build lê o conteúdo do Convex de produção e escreve todas as páginas. Por isso o jeito de publicar é o mesmo em qualquer hospedagem: **rodar o build de novo**.

> Salvar no painel muda o banco na hora, mas o site no ar só muda no próximo build. O botão **Publicar** do painel dispara esse build.

## Dois bancos

| | Desenvolvimento | Produção |
|---|---|---|
| Onde fica | No Convex, ligado ao `.env.local` | No Convex, endereço em `producao` no `rubrica.json` |
| Quem usa | O site do seu computador (`pnpm dev`) | O site no ar |
| Como mudar o conteúdo | Painel em `localhost:4321/admin` | Painel em `https://seusite.com/admin` |

O conteúdo de um **não** vai para o outro. A produção começa com as páginas iniciais do tema.

## Vercel: o caminho automático

A Vercel é a hospedagem oficial; só ela tem publicação automatizada pelo CLI. Precisa de uma conta gratuita.

```bash
npx create-rubrica publicar
```

Na primeira vez, o comando mostra o plano e pede confirmação antes de gravar em produção. Ele:

1. entra na sua conta da Vercel (abre o navegador);
2. cria o projeto na Vercel;
3. cria o deployment de **produção** no Convex, envia o backend, grava as chaves de login e as variáveis;
4. cria o usuário `root` da produção (você escolhe a senha) e monta as páginas iniciais;
5. leva para a produção as integrações que você ligou no computador (Telegram, e-mail, OpenRouter);
6. grava as variáveis do build na Vercel (`CONVEX_DEPLOY_KEY`, `CONVEX_URL`, `SITE_URL`…);
7. configura o botão **Publicar** do painel (deploy hook);
8. publica.

O build da Vercel roda `convex deploy` e depois `npm run build`, então **cada build envia junto o backend atual** e gera o site com o conteúdo de produção. O comando mostra o endereço do site e do painel (`/admin`) no fim.

Depois da primeira vez, `npx create-rubrica publicar` só publica de novo. Se a Vercel estiver ligada ao seu repositório no GitHub, o jeito de sempre é o **merge na branch de produção**: a Vercel faz o build sozinha.

### Domínio próprio

Na Vercel: Settings, Domains. Depois, avise o Rubrica do endereço novo:

```bash
npx create-rubrica config --url meusite.com
npx create-rubrica config --url meusite.com --producao   # grava também no banco de produção
```

O endereço entra no canonical, no sitemap, no RSS, no CORS dos formulários e na volta do pagamento.

## Outras hospedagens

Netlify, Cloudflare Pages ou qualquer hospedagem de arquivos estáticos funciona: a saída é neutra. O projeto já traz, a partir da mesma configuração, `vercel.json`, `public/_redirects` e `public/_headers` (redirecionamentos, cabeçalhos de segurança e cache). Netlify e Cloudflare Pages leem os dois últimos sozinhos.

Na hospedagem escolhida:

| Configuração | Valor |
|---|---|
| Comando de build | `npm run build` |
| Pasta publicada | `dist` |
| Variável `CONVEX_URL` | O endereço do Convex de **produção** (`https://<nome>.convex.cloud`, está em `producao.convexUrl` no `rubrica.json` depois que você preparar a produção) |
| Variável `PUBLIC_RUBRICA_API` | O endereço HTTP do Convex de produção (`https://<nome>.convex.site`), para os formulários do site enviarem |
| Variável `SITE_URL` | O endereço do site |

O backend de produção precisa existir antes do primeiro build em outra hospedagem. O jeito mais simples é rodar `npx create-rubrica publicar` uma vez: ele prepara o Convex de produção (backend, chaves de login, `root` e páginas iniciais) junto com a Vercel, e você pode desligar o projeto da Vercel depois. Quem prefere que a hospedagem envie o backend a cada build usa `npx convex deploy --cmd-url-env-var-name CONVEX_URL --cmd "npm run build"` como comando de build, com a variável `CONVEX_DEPLOY_KEY` (como o `vercel.json` faz). Lembre: `convex deploy` publica sempre em produção.

O botão **Publicar** do painel dispara qualquer hospedagem: crie um **deploy hook** (Vercel: Settings, Git, Deploy Hooks; Netlify e Cloudflare: Build hooks) e grave a URL na variável `RUBRICA_DEPLOY_HOOK_URL` do Convex. Veja [Integrações](./integracoes.md#publicação). Opcionalmente, o fim do build pode avisar o painel pelo endereço `/rubrica/publicacao/concluida`, para o aviso "publicando" terminar na hora.

Ao trocar de hospedagem, confira se o domínio e o `SITE_URL` batem, e se a `Content-Security-Policy` do `_headers` ou do `vercel.json` libera o que o seu site usa (o script do analytics, por exemplo: `npx create-rubrica config --analytics <script> --analytics-id <id>` já ajusta os dois arquivos).

## Antes de publicar

- `pnpm check`, `pnpm test` e `pnpm build` passam.
- A URL do site (`config --url`) é a definitiva.
- O `RUBRICA_IP_SALT` está definido na produção (o `setup` e o `publicar` gravam; veja [Integrações](./integracoes.md)).
- Os formulários do site precisam que a origem do site esteja liberada no Convex: a URL do site já vale, e `RUBRICA_ALLOWED_ORIGINS` aceita outras.
