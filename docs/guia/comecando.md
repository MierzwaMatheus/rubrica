# Começando

Do zero ao seu portfólio rodando no computador, com o painel admin pronto para preencher. Leva uns 10 minutos, quase todos esperando a instalação.

## O que você precisa

- **Node.js 20 ou mais novo** e **git**. O pnpm é opcional: sem ele, o CLI usa o npm.
- Uma conta no **[Convex](https://convex.dev)** (gratuita). É onde ficam o banco de dados e as imagens. Não precisa criar antes: o CLI abre o login no navegador na hora certa.
- Para publicar depois, uma conta na **[Vercel](https://vercel.com)** (gratuita). Veja [Publicar o site](./publicar.md).
- Só se for usar as skills de IA: **Python 3.8 ou mais novo**.

Pagamentos (Asaas), IA (OpenRouter) e avisos no Telegram são opcionais. Dá para ligar cada um depois.

## 1. Escolha a aparência no site

No [combinador](https://userubrica.vercel.app/#combinador), teste layout, esquema de cores, modo claro ou escuro, textura e fontes no Rubrica funcionando, com dados de exemplo. Depois, na seção **Crie o seu**, preencha o seu nome, o endereço do site e o e-mail, e copie o comando pronto. Nada do que você digita sai do navegador: o comando é montado na própria página.

Prefere decidir no terminal? Pule para o passo 2 sem o código: o CLI faz as mesmas perguntas.

## 2. Crie o projeto

Cole o comando num terminal, na pasta onde quer criar o projeto:

```bash
npx create-rubrica@latest ana-souza --receita <código-do-site>
```

Sem o código do site, rode só `npx create-rubrica@latest meu-portfolio` e responda às perguntas. No modo **Rápido** (o padrão), ele pergunta o layout, o que o site vai ter e a sua identidade; as cores, a textura e as fontes vêm combinadas com o layout.

O CLI então:

1. baixa a versão mais recente do Rubrica e aplica as suas escolhas;
2. inicia o git na branch `main`, com um primeiro commit, e instala as dependências;
3. conecta o projeto ao Convex (login pelo navegador, se for a primeira vez);
4. gera as chaves de login, cria o seu usuário do painel e os dados iniciais.

No terminal, você só escolhe a senha do painel: 12 ou mais caracteres, com maiúscula, minúscula e número.

Todas as perguntas e opções estão em [Comandos do CLI](./cli.md).

## 3. Abra o site

```bash
cd ana-souza
npm run dev        # ou pnpm dev
```

O site abre em `http://localhost:3000`. O painel fica em `http://localhost:3000/login`, com o e-mail e a senha que você definiu.

Pulou a configuração do painel no `create`? Rode `npx create-rubrica setup` na pasta do projeto antes do `npm run dev`.

## 4. Preencha o conteúdo

Tudo se edita pelo painel, sem tocar no código. O site começa com os dados de exemplo de um perfil fictício: troque pelos seus.

| Tela do painel | O que você preenche |
|---|---|
| `/admin/contact` | Nome, e-mail, telefone, foto e redes sociais |
| `/admin/home` | Apresentação, números de destaque, disponibilidade, serviços e princípios de trabalho |
| `/admin/projects` | Projetos do portfólio e estudos de caso |
| `/admin/blog` | Posts |
| `/admin/resume` | Currículo |
| `/admin/about` | Rotina e perguntas frequentes da página Sobre |
| `/admin/depoimentos` | Depoimentos |
| `/admin/site-config` | **Site & Aparência:** identidade, SEO, fontes e as cores de cada modo |
| `/admin/textos` | Os textos fixos do site, em português e inglês |
| `/admin/plugins` | Liga e desliga partes do site (blog, propostas, pagamentos…) |

Também dá para pedir ao seu agente de IA (Claude Code, Codex ou OpenCode): o projeto já vem com a skill `rubrica`, que lê e altera o conteúdo do site, e com skills que escrevem a apresentação, os cases, o currículo e os posts com a sua voz. Veja a seção "Ou pelo seu agente de IA" do [README](../../README.md).

## 5. Dê a sua cara

O Rubrica resolve a parte técnica. A identidade é com você, e é ela que separa o seu portfólio de "mais um":

- **Cores e fontes pelo painel:** em **Site & Aparência**, troque as 4 cores principais de cada modo e as fontes. "Usar as cores do esquema" desfaz.
- **Outro layout ou esquema:** `npx create-rubrica config` troca layout, esquema, modo, textura e fontes depois de criado. Veja os [templates](../templates/README.md) e os [esquemas de cores](../templates/cores.md).
- **Favicon:** troque `public/favicon.ico` pelo seu.
- **No código:** o esquema de cores fica em `src/index.css`; a estrutura do layout, em `src/components/` e `src/pages/`.

## Próximos passos

- [Publicar o site](./publicar.md): pôr no ar na Vercel e ligar o seu domínio.
- [Atualizando o seu Rubrica](../atualizacao.md): trazer as versões novas sem perder o que você personalizou.
