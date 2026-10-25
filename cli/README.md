# create-rubrica

CLI para criar, configurar e atualizar projetos [Rubrica](https://github.com/MierzwaMatheus/rubrica), o template de portfólio profissional com React + Convex.

Precisa de Node 20+ e do `git` instalado.

## Criar um projeto

```bash
pnpm create rubrica meu-portfolio
# ou
npx create-rubrica meu-portfolio
```

O assistente baixa a versão mais recente do template e começa perguntando o modo:

- **Rápido** (padrão): você escolhe o layout e as cores, a textura e as fontes vêm combinadas com ele.
- **Personalizado**: você escolhe também o esquema de cores, o modo claro/escuro, a textura, as fontes e o idioma.

Nos dois modos ele pergunta:

- **Layout**: um de 13 — Cyberpunk, Brutalism Terminal, Swiss Grid, Bento, Magazine, Desktop Retrô, Índice, Monografia, Zine, Blueprint, Jardim Digital, Conversa ou Pôster Cinético ([guia dos layouts](https://github.com/MierzwaMatheus/rubrica/blob/main/docs/templates/README.md))
- **O que o site vai ter**: um pacote pronto (Completo, Para vender serviços, Só o portfólio) ou a lista de plugins para marcar um por um
- **Identidade**: seu nome, o nome do site, o endereço (não precisa do `https://`; quem ainda não tem domínio pode deixar o `<projeto>.vercel.app` sugerido), uma frase sobre o que você faz, seu e-mail e o perfil no X (opcional)

No personalizado, entram também:

- **Esquema de cores**: um de 15, cada um com modo claro e escuro; o recomendado para o layout vem marcado ([esquemas de cores](https://github.com/MierzwaMatheus/rubrica/blob/main/docs/templates/cores.md))
- **Modo de cor**: claro, escuro ou automático (segue o sistema de quem visita), e se a visita pode alternar
- **Textura**: nenhuma, grão de filme, papel ou scanlines
- **Fontes**: principal e mono (o layout sugere uma combinação)
- **Idioma**: português ou inglês

Depois ele inicia o git e instala as dependências sem perguntar: com pnpm se você rodou `pnpm create`, com npm nos outros casos. Por fim, oferece configurar o painel admin na hora. Aceitando, ele conecta o projeto ao Convex (login pelo navegador, conta gratuita) e já roda o `setup`.

### Com as escolhas feitas no site

No [site do Rubrica](https://userubrica.vercel.app), o combinador mostra o app funcionando com cada layout, esquema e fonte. Na seção **Crie o seu**, você preenche os seus dados e copia um comando pronto:

```bash
npx create-rubrica@latest ana-souza --receita eyJ2IjoxLCJsIjoiZGVza3RvcCIs...
```

A **receita** leva o visual, os plugins, a identidade, a profissão e as especialidades num texto só, sem espaços nem acentos, então funciona colada em qualquer terminal (bash, PowerShell, cmd). O CLI mostra um resumo, pede confirmação e só pergunta o que faltar: nome, endereço e e-mail, se não vieram. Depois cria o projeto no Convex sem as perguntas dele (login pelo navegador, se for a primeira vez) e roda o `setup` pedindo só a senha do painel. Telegram e Vercel ficam para um `setup` posterior. Nada é enviado a servidor nenhum: o site monta o comando no navegador. A senha do painel é sempre pedida no terminal.

Se algo da receita não existir na versão do CLI (um layout novo, por exemplo), ele avisa e pergunta só aquilo.

### Opções

Também dá para passar as escolhas uma a uma. Elas valem por cima da receita.

| Opção | Valores |
|---|---|
| `--receita <código>` | o código gerado pelo site |
| `--layout <id>` | `cyberpunk`, `brutalist`, `swiss`, `bento`, `magazine`, `desktop`, `index`, `monograph`, `zine`, `blueprint`, `garden`, `chat`, `poster` |
| `--esquema <id>` | um dos [esquemas de cores](https://github.com/MierzwaMatheus/rubrica/blob/main/docs/templates/cores.md) (`neon`, `riso`, `sumi`...) |
| `--modo <modo>` | `claro`, `escuro` ou `automatico` |
| `--alternancia` / `--sem-alternancia` | mostra ou esconde o botão para a visita alternar o modo |
| `--textura <textura>` | `nenhuma`, `grao`, `papel` ou `scanlines` |
| `--fonte <família>` / `--mono <família>` | nome da fonte, com hífens no lugar dos espaços (`--fonte instrument-sans`) |
| `--plugins <lista>` | ids separados por vírgula (`blog,portfolio`), um pacote (`recommended`, `freelancer`, `simple`) ou `nenhum` |

Arquivos que saem com as suas escolhas:

| Arquivo | O que tem |
|---|---|
| `rubrica.json` | Estado do CLI: versão de origem, layout, esquema de cores, modo, textura, fontes, plugins e identidade. Versione junto com o projeto: o `update` depende dele. |
| `rubrica.config.ts` | Identidade, SEO e RSS usados no build |
| `src/index.css` | O esquema de cores (modo claro e escuro) e as fontes |
| `index.html` | Meta tags, o link das fontes e a aparência (modo de cor, alternância e textura, como atributos do `<html>`) |
| `src/components/`, `src/pages/` | Arquivos do layout escolhido |
| `convex/pluginRegistry.ts` | Plugins ligados por padrão |

Se você pulou a configuração do painel, faça depois:

```bash
cd meu-portfolio
npx create-rubrica setup       # conecta o Convex, cria o admin e os dados iniciais
npm run dev                    # http://localhost:3000 (ou pnpm dev)
```

## Comandos

Rode dentro da pasta do projeto (ou de qualquer subpasta).

### `setup`

```bash
npx create-rubrica setup
```

Configura o backend Convex. Se o projeto ainda não estiver ligado ao Convex (sem `.env.local`), ele conecta sozinho: abre o login no navegador e cria o projeto, sem precisar deixar o `npx convex dev` rodando em outro terminal. Num clone de um site que já foi publicado (o `rubrica.json` traz o endereço de produção), ele não cria projeto: pede para você escolher o projeto do Convex onde o site está e mostra qual é o banco de produção dele.

Depois gera as chaves de autenticação, grava o endereço do site que você informou no `create`, cria o usuário admin (o e-mail já vem preenchido) e popula os dados iniciais. As integrações são opcionais e só aparecem para os plugins ligados: o Telegram e a Vercel começam com uma pergunta de sim/não; OpenRouter e Asaas pedem a chave, e dá para pular com Enter. Com a chave do Asaas, ele também gera o token do webhook e mostra a URL e o token para cadastrar no painel do Asaas. Pode ser rodado de novo: o admin existente é mantido (sem pedir a senha de novo; para trocá-la, use o `senha`) e o seed só cria o que falta.

### `publicar`

```bash
npx create-rubrica publicar
```

Coloca o site no ar na [Vercel](https://vercel.com) (conta gratuita), sem copiar nada à mão. Na primeira vez, depois de confirmar:

1. entra na sua conta da Vercel (o login abre no navegador, se precisar);
2. cria o projeto na Vercel com o nome da pasta e usa o endereço `<projeto>.vercel.app`;
3. prepara o banco de produção no Convex: cria a chave de produção, envia o backend, gera as chaves de login e copia do ambiente do computador as integrações do Telegram e do OpenRouter, a profissão e o contexto da IA;
4. cria o admin do site publicado (você escolhe a senha) e os dados iniciais;
5. liga o botão **Publicar** do painel: abre a página de tokens da Vercel, você cria um token (nome Rubrica, sem validade) e cola no terminal, sem ele aparecer na tela. O CLI confere se o token acessa o projeto e grava no Convex de produção. Sem GitHub, a Vercel não oferece Deploy Hook, então o painel usa esse token para refazer o último deploy de produção, e o build busca o conteúdo novo. Dá para pular com Enter;
6. grava as variáveis na Vercel (`VITE_CONVEX_URL`, `CONVEX_URL`, `SITE_URL`, `CONVEX_DEPLOY_KEY`) e publica;
7. anota no `rubrica.json` (em `producao`) o endereço do Convex e do site publicados. É com ele que a skill `rubrica` do agente de IA entra no site no ar (`--producao`).

Depois disso, rodar de novo só publica a versão atual do projeto: o build da Vercel envia junto as mudanças do backend para o Convex de produção. Antes de publicar, ele leva para a produção o Telegram e o OpenRouter que você tenha ligado no computador depois da primeira vez (só os que faltam lá). Em outro computador ou num clone novo (a pasta `.vercel` fica fora do git), ele percebe que o site já está publicado, liga a pasta ao mesmo projeto da Vercel e só publica: não gera chaves de login novas nem regrava os dados do painel. E, se este computador estiver ligado a outro projeto do Convex (não ao do site no ar), ele para antes de gravar qualquer coisa, para não trocar o banco do site por um vazio. Projetos publicados antes da 1.5 ganham a anotação do item 7 na próxima vez que publicarem, e o `publicar` oferece ligar o botão Publicar quando ele ainda não está configurado. Mudança de código (layout, componentes) vai ao ar pelo `publicar`; o botão do painel publica o conteúdo. O que você cadastrou no painel do computador não vai junto: o site publicado começa com os dados de exemplo e é editado pelo painel dele. A chave de produção do Asaas e o webhook de pagamentos são configurados à parte. Domínio próprio: na Vercel, em Settings → Domains.

Tem mais de uma conta da Vercel no computador? Escolha qual usar com `RUBRICA_VERCEL_GLOBAL_CONFIG=<pasta de config da conta> npx create-rubrica publicar` (é o `--global-config` do CLI da Vercel).

### `senha`

```bash
npx create-rubrica senha
```

Troca a senha de quem entra no painel admin: para quem esqueceu a senha ou ficou bloqueado por tentativas erradas (o bloqueio também é liberado). Pergunta se a troca é no site publicado ou no do seu computador, o e-mail e a senha nova. A senha segue as mesmas regras do painel: 12 ou mais caracteres, com maiúscula, minúscula e número.

Só funciona para quem tem acesso ao projeto no Convex, ou seja, o dono, com a pasta do projeto e logado no Convex. Projetos de versões anteriores precisam de `npx create-rubrica@latest update` antes; no site publicado, publique de novo depois de atualizar.

### `config`

```bash
npx create-rubrica config
```

Muda as escolhas feitas no `create`:

- **Identidade**: as perguntas vêm preenchidas com o que está salvo; atualiza `rubrica.config.ts`, as meta tags do `index.html` e o `rubrica.json`
- **Aparência**: esquema de cores, modo claro/escuro, alternância, textura e fontes
- **Layout**: troca o layout (⚠ sobrescreve os arquivos do layout; personalizações neles se perdem)
- **Plugins**: quais vêm ligados por padrão

### `update`

```bash
npx create-rubrica@latest update --dry-run   # mostra o que mudaria
npx create-rubrica@latest update             # aplica
```

Atualiza o projeto para a versão mais recente **sem desfazer as suas personalizações**. O CLI compara, arquivo por arquivo, a versão de onde o projeto saiu, a versão nova e o seu projeto:

- arquivo que você não mexeu recebe a versão nova;
- arquivo que você mexeu e o Rubrica não mudou fica como está;
- quando os dois mudaram partes diferentes, as mudanças são mescladas;
- quando os dois mudaram o mesmo trecho, o seu arquivo fica intacto e a versão nova é salva ao lado, em `<arquivo>.rubrica-new`.

`.env*`, `rubrica.json` e os dados gerados no build (`public/data/`, RSS, sitemap) nunca são tocados.

| Opção | Para que serve |
|---|---|
| `--dry-run` | Só mostra o plano |
| `--to <versão>` | Atualiza para uma versão específica |
| `--from <versão>` | Versão com que o projeto foi criado (projetos criados até a v0.3.18 gravavam sempre `0.1.0`) |
| `--yes` | Aplica sem perguntar |

Guia completo: [Atualizando o seu Rubrica](https://github.com/MierzwaMatheus/rubrica/blob/main/docs/atualizacao.md).

## Manutenção

Layout, esquema de cores, fonte ou plugin novo no template precisa entrar também nas listas do CLI. O passo a passo está em [Manutenção do CLI](https://github.com/MierzwaMatheus/rubrica/blob/main/docs/cli/manutencao.md).

## Licença

MIT
