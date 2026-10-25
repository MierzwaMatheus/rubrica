# Comandos do CLI

O `create-rubrica` cria, configura, publica e atualiza projetos do Rubrica. Precisa de Node.js 20 ou mais novo e do git. Tirando o `create`, rode os comandos dentro da pasta do projeto (ou de qualquer subpasta).

| Comando | Para quê |
|---|---|
| `npx create-rubrica@latest <pasta>` | Cria o projeto |
| `npx create-rubrica setup` | Conecta o Convex, cria o admin e os dados iniciais; liga as integrações |
| `npx create-rubrica config` | Troca identidade, aparência, layout ou plugins depois de criado |
| `npx create-rubrica publicar` | Põe o site no ar na Vercel, e publica de novo nas próximas vezes |
| `npx create-rubrica senha` | Troca a senha do painel e libera o login bloqueado |
| `npx create-rubrica@latest update` | Traz a versão nova do Rubrica sem desfazer as suas personalizações |

## `create`

```bash
npx create-rubrica@latest meu-portfolio
# ou
pnpm create rubrica meu-portfolio
```

O assistente baixa a versão mais recente do template e pergunta o modo:

- **Rápido** (padrão): você escolhe o layout; as cores, a textura e as fontes vêm combinadas com ele.
- **Personalizado**: você escolhe também o esquema de cores, o modo claro/escuro, a textura, as fontes e o idioma.

Nos dois modos, ele pergunta:

- **Layout:** um dos 13 do [guia dos templates](../templates/README.md).
- **O que o site vai ter:** um pacote pronto ("Completo", "Para vender serviços", "Só o portfólio") ou a lista de plugins para marcar um a um.
- **Identidade:** seu nome, o nome do site, o endereço (sem `https://`; quem ainda não tem domínio pode deixar o `<projeto>.vercel.app` sugerido), uma frase sobre o que você faz, seu e-mail e o perfil no X (opcional).

No personalizado, entram também:

- **Esquema de cores:** um dos 15 [esquemas](../templates/cores.md), com o recomendado para o layout marcado.
- **Modo de cor:** claro, escuro ou automático (segue o sistema de quem visita), e se a visita pode alternar.
- **Textura:** nenhuma, grão de filme, papel ou scanlines.
- **Fontes:** principal e mono.
- **Idioma:** português ou inglês.

Depois ele inicia o git (branch `main`, com um primeiro commit) e instala as dependências: com pnpm se você rodou `pnpm create`, com npm nos outros casos. Por fim, oferece configurar o painel na hora: aceitando, conecta o projeto ao Convex e roda o `setup`.

### Com as escolhas feitas no site

Na seção **Crie o seu** do [site do Rubrica](https://userubrica.vercel.app/#criar), você monta a aparência no combinador, preenche os seus dados e copia um comando com uma **receita**:

```bash
npx create-rubrica@latest ana-souza --receita eyJ2IjoxLCJsIjoiZGVza3RvcCIs...
```

A receita leva a aparência, os plugins e a identidade num texto sem espaços nem acentos, que funciona colado em qualquer terminal (bash, PowerShell, cmd). O CLI mostra um resumo, pede confirmação e só pergunta o que faltar. Depois cria o projeto no Convex e roda o `setup` pedindo só a senha do painel. Telegram e Vercel ficam para um `setup` posterior.

Se algo da receita não existir nesta versão do CLI (um layout novo, por exemplo), ele avisa e pergunta só aquilo.

### Opções

As opções valem por cima da receita.

| Opção | Valores |
|---|---|
| `--receita <código>` | o código gerado pelo site |
| `--layout <id>` | `cyberpunk`, `brutalist`, `swiss`, `bento`, `magazine`, `desktop`, `index`, `monograph`, `zine`, `blueprint`, `garden`, `chat`, `poster` |
| `--esquema <id>` | um dos [esquemas de cores](../templates/cores.md) (`neon`, `riso`, `sumi`…) |
| `--modo <modo>` | `claro`, `escuro` ou `automatico` |
| `--alternancia` / `--sem-alternancia` | mostra ou esconde o botão para a visita alternar o modo |
| `--textura <textura>` | `nenhuma`, `grao`, `papel` ou `scanlines` |
| `--fonte <família>` / `--mono <família>` | nome da fonte, com hífens no lugar dos espaços (`--fonte instrument-sans`) |
| `--plugins <lista>` | ids separados por vírgula (`blog,portfolio`), um pacote (`recommended`, `freelancer`, `simple`) ou `nenhum` |

### Arquivos que saem com as suas escolhas

| Arquivo | O que tem |
|---|---|
| `rubrica.json` | Estado do CLI: versão de origem, aparência, plugins, identidade e, depois do `publicar`, os endereços do site no ar. Versione junto com o projeto: o `update` e o `publicar` dependem dele. |
| `rubrica.config.ts` | Identidade, SEO e RSS usados no build |
| `src/index.css` | O esquema de cores (claro e escuro) e as fontes |
| `index.html` | Meta tags, o link das fontes e a aparência (modo de cor, alternância e textura) |
| `src/components/`, `src/pages/` | Os arquivos do layout escolhido |
| `convex/pluginRegistry.ts` | Os plugins ligados por padrão |

## `setup`

```bash
npx create-rubrica setup
```

Configura o backend no Convex. Se o projeto ainda não estiver ligado ao Convex (sem `.env.local`), ele conecta sozinho: abre o login no navegador e cria o projeto. Num clone de um site que já foi publicado (o `rubrica.json` traz o endereço de produção), ele não cria projeto novo: pede para você escolher o projeto do Convex onde o site está.

Depois, gera as chaves de login, grava o endereço do site, cria o usuário admin e os dados iniciais. As integrações aparecem só para os plugins ligados:

- **Telegram** e **Vercel** começam com uma pergunta de sim ou não.
- **OpenRouter** (IA e tradução) e **Asaas** (pagamentos) pedem a chave; Enter pula. Com a chave do Asaas, ele também gera o token do webhook e mostra a URL e o token para cadastrar no painel do Asaas.

Pode rodar de novo quando quiser: o admin existente é mantido e os dados iniciais só criam o que falta.

## `config`

```bash
npx create-rubrica config
```

Muda as escolhas feitas no `create`:

- **Identidade:** as perguntas vêm preenchidas com o que está salvo; atualiza `rubrica.config.ts`, as meta tags do `index.html` e o `rubrica.json`.
- **Aparência:** esquema de cores, modo claro/escuro, alternância, textura e fontes.
- **Layout:** troca o layout. Atenção: sobrescreve os arquivos do layout, e personalizações neles se perdem.
- **Plugins:** quais vêm ligados por padrão.

## `publicar`

```bash
npx create-rubrica publicar
```

Põe o site no ar na Vercel. Na primeira vez, cria o projeto na Vercel, prepara o banco de produção, cria o admin do site publicado e liga o botão **Publicar** do painel. Depois, rodar de novo só publica. O passo a passo está em [Publicar o site](./publicar.md).

## `senha`

```bash
npx create-rubrica senha
```

Para quem esqueceu a senha do painel ou ficou bloqueado por tentativas erradas (o bloqueio também é liberado). Pergunta se a troca é no site publicado ou no do computador, o e-mail e a senha nova: 12 ou mais caracteres, com maiúscula, minúscula e número.

Só funciona com acesso ao projeto no Convex, ou seja, para o dono, na pasta do projeto e com o login do Convex feito.

## `update`

```bash
npx create-rubrica@latest update --dry-run   # mostra o que mudaria
npx create-rubrica@latest update             # aplica
```

Atualiza o projeto para a versão mais recente sem desfazer as suas personalizações. O CLI compara, arquivo por arquivo, a versão de onde o projeto saiu, a versão nova e o seu projeto:

- arquivo que você não mexeu recebe a versão nova;
- arquivo que você mexeu e o Rubrica não mudou fica como está;
- quando os dois mudaram partes diferentes, as mudanças são mescladas;
- quando os dois mudaram o mesmo trecho, o seu arquivo fica intacto e a versão nova é salva ao lado, como `<arquivo>.rubrica-new`.

`.env*`, `rubrica.json` e os dados gerados no build (`public/data/`, RSS, sitemap) nunca são tocados.

| Opção | Para que serve |
|---|---|
| `--dry-run` | Só mostra o plano |
| `--to <versão>` | Atualiza para uma versão específica |
| `--from <versão>` | Versão com que o projeto foi criado (projetos criados até a v0.3.18 gravavam sempre `0.1.0`) |
| `--yes` | Aplica sem perguntar |

Guia completo: [Atualizando o seu Rubrica](../atualizacao.md).

## Variáveis de ambiente

| Variável | Para quê |
|---|---|
| `RUBRICA_VERCEL_GLOBAL_CONFIG` | Escolhe a conta da Vercel quando há mais de uma no computador: a pasta de configuração da conta (é o `--global-config` do CLI da Vercel). |

## Com um agente de IA

O projeto vem com um `AGENTS.md` (e um `CLAUDE.md`, para o Claude Code) que ensina agentes como Claude Code, Codex e Cursor a usar o CLI: o que eles podem rodar sozinhos (o `update --dry-run` e, com o seu "ok", o `update --yes`), o que você roda no seu terminal (`setup`, `config`, `publicar`, `senha`) e o passo a passo para atualizar o Rubrica, incluindo os arquivos `.rubrica-new`. Peça "atualize o Rubrica" e o agente segue esse roteiro.
