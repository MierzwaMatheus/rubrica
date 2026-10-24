# Criando um layout

Guia para quem cria ou mantém um layout do Rubrica. Vale para os layouts novos (esquema de cores completo) e, onde indicado, para os 5 originais.

## O que é um layout

Um layout é uma pasta em `templates/layouts/<id>/` registrada em `cli/src/layouts.ts`. Ao criar ou reconfigurar um projeto, o CLI (`applyLayout`) copia:

| Do template | Para o projeto |
|---|---|
| os arquivos da raiz listados em `copy` (ex.: `Layout.tsx`, a navegação, um `<Nome>Shared.tsx`) | `src/components/` |
| `pages/Home.tsx`, `Resume.tsx`, `Portfolio.tsx`, `About.tsx`, `Blog.tsx` | `src/pages/` |

Por isso, dentro do template:

- `Layout.tsx` exporta `function Layout({ children, className })`, como os layouts atuais. O app envolve todas as páginas públicas com ele.
- Arquivos da raiz se importam entre si por caminho relativo (`./ZineNav`). As páginas importam os arquivos da raiz por `@/components/<Arquivo>` (é onde eles vão estar no projeto).
- Os nomes de arquivo são os do registro. Não crie arquivos fora dessa lista: eles não seriam copiados.

As páginas que nenhum layout substitui (post do blog `/blog/:slug`, estudo de caso `/portfolio/:slug`, depoimentos, propostas, checkout) são do app e seguem o esquema de cores sozinhas. O `Layout.tsx` dá a moldura e a margem para elas: veja `TEMPLATE_PAGES` no `Layout.tsx` do Bento.

## Cores: o esquema completo

O CLI grava o esquema escolhido em `src/index.css`: o modo claro em `:root` e o escuro em `.dark`. Cada modo tem 11 papéis (`cli/src/themes/schemes.ts`):

| Variável | Papel |
|---|---|
| `--bg` | fundo das páginas |
| `--surface` | cartões, painéis, barras |
| `--subtle` | fundos sutis, faixas, hover |
| `--text` | texto principal |
| `--text-muted` | texto secundário, legendas |
| `--line` | bordas e divisórias |
| `--primary` | identidade: botões, links, blocos de destaque |
| `--on-primary` | texto sobre a primária |
| `--accent` | segunda cor de marca |
| `--on-accent` | texto sobre o acento |
| `--accent-2` | terceira cor (só nos layouts novos) |

Também existe `--text-strong` (títulos, derivado de `--text`).

Regras (verificadas por `tests/app/colorContract.test.ts`):

- **Layouts novos** usam só essas variáveis: `var(--surface)`, `color-mix(in srgb, var(--text) 20%, transparent)` etc. Nenhuma cor literal: nada de `#hex`, `rgb()`, `hsl()` nem classes de cor fixa do Tailwind (`text-white`, `bg-gray-100`, `bg-red-500`…). Sombras também: `color-mix(in srgb, var(--text) 18%, transparent)`.
- Variáveis próprias do layout são permitidas se começarem com `--<id>-` e forem derivadas do esquema (ex.: `--zine-tape: color-mix(in srgb, var(--accent-2) 60%, transparent)`).
- Texto sobre a primária usa `--on-primary`; sobre o acento, `--on-accent`. Nunca presuma que o fundo é claro ou escuro.
- **Layouts originais** (`legacy: true`) continuam só com `--bg`, `--text`, `--primary` e `--accent`.

O layout precisa funcionar com **qualquer** esquema, nos **dois modos**. Teste pelo menos: o recomendado do layout, `alto-contraste`, `neon` e um esquema de modo oposto ao recomendado.

## Modo claro/escuro e textura

- O modo vem da classe `dark` no `<html>`. O layout não decide o modo: só usa as variáveis.
- Quando a pessoa liga a alternância (`rubrica config` → Aparência), quem visita pode trocar o modo. **Todo layout coloca o `<ColorModeToggle />` (`@/components/ColorModeToggle`) na navegação.** Ele não renderiza nada com a alternância desligada e herda a cor do texto. Estilize pelo `className`/`style` e posicione onde fizer sentido no layout. Para um controle próprio, use `useTheme()` de `@/contexts/ThemeContext` (`theme`, `toggleTheme`, `switchable`).
- A textura (grão, papel, scanlines) é uma camada global aplicada pelo `index.css` (`data-texture` no `<html>`). O layout não implementa textura e não deve criar camadas fixas opacas por cima da página inteira.

## Fontes

- Use `var(--font-sans)` (principal) e `var(--font-mono)`. O CLI carrega as duas do Google Fonts. As recomendadas de cada layout estão no registro.
- Uma fonte de assinatura extra (ex.: a letra à mão do Zine) é permitida. O próprio `Layout.tsx` a carrega com `<Helmet>` de `react-helmet-async` (`<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Caveat:wght@500;700&display=swap" />`) e sempre declara uma fonte de reserva.

## Conteúdo: o que cada página precisa mostrar

Os layouts mudam a forma, não o conteúdo. Toda página cobre o mesmo que as dos layouts atuais, lendo os mesmos hooks. **Leia por inteiro as páginas de um layout existente** (`templates/layouts/swiss/pages/*.tsx` e `templates/layouts/bento/pages/*.tsx`) e a doc dele (`docs/templates/bento.md`) antes de começar. Em resumo:

- **Início** (`useHome`, `useHomeMetrics`, `usePortfolio` + `selectFeaturedCases`, `useContactWizard`, `usePlugin`): disponibilidade (quando ligada), nome, frase de valor (`home.hero.headline`), cargo, botões "Ver cases" e "Fale comigo" (abre o formulário), números de destaque (até 4, a faixa some sem números), 3 cases em destaque com a primeira métrica e link para `/portfolio/<slug>`, sobre, "O que eu faço" (serviços), depoimentos (com "ver todos" e "deixar meu depoimento" conforme os plugins) e a chamada final "Tem um projeto em mente?" com "Tenho um projeto" e "Tenho uma vaga".
- **Currículo** (`useResume`, `groupSkills`, `splitExperiences`, `useDownloadCV`): resumo, botão de baixar o CV em PDF, números de destaque, experiências recentes com as antigas atrás de "ver anteriores", habilidades agrupadas por grupo (sem níveis numéricos), soft skills, idiomas, formação, cursos, certificações e voluntariado (cada bloco some quando vazio).
- **Portfólio** (`usePortfolio`, `listCategories`, `filterByCategory`, `hasCaseStudy`): filtro por categoria (some sem categorias), destaque para os primeiros, a primeira métrica do case em cada projeto e uma ação só: o case quando existe, senão o link do projeto.
- **Sobre** (`useAbout`, `useWorkPrinciples`, `splitParagraphs`, `highlightNumbers`): "Como eu trabalho" (princípios) abrindo a página, resumo profissional, texto pessoal, dia a dia, interesses e FAQ.
- **Blog** (`useBlogPosts`): lista de posts com o destaque primeiro, links para `/blog/<slug>`, data e tempo de leitura, tags e indicação de RSS.

Respeite os plugins (`usePlugin("portfolio")`, `"blog"`, `"resume"`, `"about"`, `"testimonials"`, `"testimonials-intake"`, `"contact-wizard"`): o que estiver desligado some da página e da navegação.

Todo link interno aponta para uma rota de `src/App.tsx` (teste `tests/app/templates/routes-contract.test.ts`).

## Textos e idiomas

- Use as chaves de `src/i18n/translations/pt-BR.ts` com `t()` (`useTranslation`). Não edite os arquivos de tradução.
- Textos próprios do layout (rótulos decorativos como "Folha 02" ou "Caixa de entrada") ficam no `<Nome>Shared.tsx` do layout, em pt-BR e en-US, escolhidos por `useI18n().locale`.
- Nada de dados pessoais fixos no código: nome, e-mail e projetos vêm dos hooks.

## Celular

Tudo funciona a partir de 360px de largura, sem rolagem horizontal. Use classes responsivas do Tailwind, media queries no próprio componente ou os atributos de `MobileLayoutStyles` (`rb-mobile`, `data-m-cols`, `data-m-hide`…). Elementos decorativos que não cabem somem no celular; conteúdo nunca.

## Ver o layout funcionando

```bash
# monta um projeto temporário com o layout aplicado pelo CLI, checa tipos, faz o build e sobe o preview
npx tsx scripts/preview-layout.ts --layout <id> --port <porta> [--scheme <esquema>] [--texture <textura>]

# só checar os tipos
npx tsx scripts/preview-layout.ts --layout <id> --port <porta> --check-only

# fotografa as 5 páginas nos dois modos, em 1440px e 390px, e avisa rolagem horizontal e erros no console
node scripts/shot-layout.mjs --port <porta> --out /tmp/rubrica-shots/<id>

# parar o preview
npx tsx scripts/preview-layout.ts --stop --port <porta>
```

O preview usa os dados de exemplo de `public/data/` (perfil fictício "Alex Rocha") e sai com a alternância de modo ligada.

Testes que cobrem layouts:

```bash
npx vitest run tests/app/colorContract.test.ts tests/app/templates
```
