# Publicar o site

Põe o seu portfólio no ar na Vercel, com um banco de produção separado do computador e um endereço `<projeto>.vercel.app`. Depois, você liga o seu domínio. As contas da Vercel e do Convex são gratuitas.

## Antes de publicar

- O projeto precisa estar rodando no computador. Se ainda não está, veja [Começando](./comecando.md).
- Versione o `rubrica.json` junto com o projeto. É por ele que o `publicar` e o `setup` reconhecem, em outro computador, que o site já está no ar.

## A primeira vez

Na pasta do projeto:

```bash
npx create-rubrica publicar
```

Depois de você confirmar, o CLI:

1. entra na sua conta da Vercel (o login abre no navegador, se precisar);
2. cria o projeto na Vercel com o nome da pasta e usa o endereço `<projeto>.vercel.app`;
3. prepara o banco de produção no Convex: envia o backend, gera as chaves de login e leva do computador as integrações do Telegram e do OpenRouter, a profissão e o contexto da IA;
4. cria o admin do site publicado (você escolhe a senha) e os dados iniciais;
5. liga o botão **Publicar** do painel (veja abaixo);
6. grava as variáveis na Vercel e publica;
7. anota no `rubrica.json`, em `producao`, o endereço do banco e do site publicados.

O site publicado começa com os dados de exemplo e é editado pelo painel dele, em `<seu-site>/login`. O que você cadastrou no painel do computador não vai junto: o computador e o site no ar têm bancos separados.

## Publicar de novo

Rode o mesmo comando:

```bash
npx create-rubrica publicar
```

Das próximas vezes, ele só publica a versão atual do projeto: o build da Vercel envia junto as mudanças do backend para o banco de produção. Antes, leva para a produção o Telegram e o OpenRouter que você tenha ligado no computador depois da primeira vez (só os que faltam lá).

Quando usar cada caminho:

- **Mudou o código** (layout, componentes, cores no `src/index.css`, uma versão nova do Rubrica): `npx create-rubrica publicar`.
- **Mudou o conteúdo** no painel do site publicado: o botão **Publicar** do painel.

## O botão Publicar do painel

O site é gerado no build: posts, projetos e textos novos só aparecem depois de publicar. O botão **Publicar** do painel refaz o build sem você abrir o terminal.

Na primeira publicação, o CLI abre a página de tokens da Vercel. Crie um token com o nome Rubrica, sem validade, e cole no terminal (ele não aparece na tela). O CLI confere se o token acessa o projeto e grava no banco de produção. Com ele, o painel refaz o último deploy de produção, e o build busca o conteúdo novo.

Pulou essa etapa, ou o painel diz que o botão não está configurado ou que o token não vale? Rode `npx create-rubrica publicar` de novo: ele oferece ligar o botão e pede um token novo.

Quem tem o projeto da Vercel ligado ao GitHub também pode usar um Deploy Hook da Vercel no lugar do token.

## Em outro computador

Num clone novo do projeto (a pasta `.vercel` fica fora do git), o `publicar` percebe pelo `rubrica.json` que o site já está publicado, liga a pasta ao mesmo projeto da Vercel e só publica. Não gera chaves de login novas nem regrava os dados do painel.

Se o computador estiver ligado a outro projeto do Convex, e não ao do site no ar, o `publicar` para antes de gravar qualquer coisa, para não trocar o banco do site por um vazio. Rode `npx create-rubrica setup` e escolha o projeto do Convex onde o site está.

Tem mais de uma conta da Vercel no computador? Escolha qual usar:

```bash
RUBRICA_VERCEL_GLOBAL_CONFIG=<pasta de config da conta> npx create-rubrica publicar
```

## Domínio próprio

1. Na Vercel, abra o projeto e vá em **Settings → Domains → Add Domain**.
2. Adicione `seudominio.com` e `www.seudominio.com`.
3. No registrador do domínio (Registro.br, Cloudflare, GoDaddy…), configure o DNS:
   - raiz (`seudominio.com`): registro **A** apontando para `76.76.21.21`;
   - `www`: registro **CNAME** apontando para `cname.vercel-dns.com`.
4. Espere a propagação (de minutos a algumas horas). O certificado HTTPS sai sozinho.
5. Na Vercel, em **Settings → Environment Variables**, troque a `SITE_URL` pelo endereço final.
6. Publique de novo (`npx create-rubrica publicar`) para refazer o `sitemap.xml` e o `rss.xml` com o endereço novo.

## Pagamentos em produção

A chave de produção do Asaas e o webhook de pagamentos são configurados à parte: o `publicar` não leva a chave do computador, que em geral é a do sandbox. Veja "Configurando os pagamentos (Asaas)" no [README](../../README.md).

## Problemas comuns

| Sintoma | O que fazer |
|---|---|
| O botão Publicar diz que não está configurado ou que o token não vale | Rode `npx create-rubrica publicar` e cole um token novo da Vercel |
| Mudei no painel e o site não mudou | Use o botão **Publicar** do painel: o site é gerado no build |
| Plugin desligado ainda aparece no site | Publique de novo: a lista de plugins é gerada no build |
| O `publicar` parou dizendo que o Convex é outro | Rode `npx create-rubrica setup` e escolha o projeto do Convex do site no ar |
| Esqueci a senha do painel do site no ar | `npx create-rubrica senha` e escolha o site publicado |
| Imagens quebradas depois de mudar de banco | As imagens ficam no banco de cada ambiente: envie de novo pelo painel do site publicado |
