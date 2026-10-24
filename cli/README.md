# create-rubrica

CLI para criar, configurar e atualizar projetos [Rubrica](https://github.com/MierzwaMatheus/rubrica), o template de portfólio profissional com React + Convex.

Precisa de Node 20+ e do `git` instalado.

## Criar um projeto

```bash
pnpm create rubrica meu-portfolio
# ou
npx create-rubrica meu-portfolio
```

O assistente baixa a versão mais recente do template e pergunta:

- **Layout**: Cyberpunk, Brutalism Terminal, Swiss Grid, Bento ou Magazine ([guia dos layouts](https://github.com/MierzwaMatheus/rubrica/blob/main/docs/templates/README.md))
- **Paleta**: Editorial Cream, Paper Noir, Midnight Blue ou Solar Warm ([esquemas de cores](https://github.com/MierzwaMatheus/rubrica/blob/main/docs/templates/cores.md))
- **Fontes**: principal e mono (o layout sugere uma combinação)
- **Plugins**: blog, portfólio, currículo, propostas, depoimentos, IA etc.
- **Identidade**: nome do site, URL, descrição, autor, e-mail, handle do X, idioma
- **Git e dependências**: inicializar o repositório e instalar com pnpm ou npm

Arquivos que saem com as suas escolhas:

| Arquivo | O que tem |
|---|---|
| `rubrica.json` | Estado do CLI: versão de origem, layout, paleta, fontes, plugins e identidade. Versione junto com o projeto: o `update` depende dele. |
| `rubrica.config.ts` | Identidade, SEO e RSS usados no build |
| `src/index.css` | As 4 cores da paleta e as fontes |
| `index.html` | Meta tags e fonte do Google Fonts |
| `src/components/`, `src/pages/` | Arquivos do layout escolhido |
| `convex/pluginRegistry.ts` | Plugins ligados por padrão |

Depois de criar:

```bash
cd meu-portfolio
npx convex dev                 # deixe rodando: cria o backend e o .env.local
npx create-rubrica setup       # em outro terminal: variáveis, admin e dados iniciais
pnpm dev                       # http://localhost:3000
```

## Comandos

Rode dentro da pasta do projeto (ou de qualquer subpasta).

### `setup`

```bash
npx create-rubrica setup
```

Configura o backend Convex: gera as chaves de autenticação, define `SITE_URL` e as variáveis dos plugins que você ligou (Telegram, OpenRouter, Asaas, Vercel; todas opcionais), cria o usuário root e popula os dados iniciais. Com a chave do Asaas, também gera o token do webhook e mostra a URL e o token para cadastrar no painel do Asaas. Pode ser rodado de novo: o admin existente é mantido e o seed só cria o que falta.

### `config`

```bash
npx create-rubrica config
```

Muda as escolhas feitas no `create`:

- **Identidade**: atualiza `rubrica.config.ts`, as meta tags do `index.html` e o `rubrica.json`
- **Aparência**: paleta e fontes
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

## Licença

MIT
