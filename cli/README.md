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

Configura o backend Convex. Se o projeto ainda não estiver ligado ao Convex (sem `.env.local`), ele conecta sozinho: abre o login no navegador e cria o projeto, sem precisar deixar o `npx convex dev` rodando em outro terminal.

Depois gera as chaves de autenticação, grava o endereço do site que você informou no `create`, cria o usuário admin (o e-mail já vem preenchido) e popula os dados iniciais. As integrações são opcionais e só aparecem para os plugins ligados: o Telegram e a Vercel começam com uma pergunta de sim/não; OpenRouter e Asaas pedem a chave, e dá para pular com Enter. Com a chave do Asaas, ele também gera o token do webhook e mostra a URL e o token para cadastrar no painel do Asaas. Pode ser rodado de novo: o admin existente é mantido e o seed só cria o que falta.

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
