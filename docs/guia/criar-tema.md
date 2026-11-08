# Criar um tema

Um **tema** dá forma ao site: a casca (cabeçalho, navegação, rodapé), o desenho de cada bloco, as variações e as páginas de partida. O conteúdo é o mesmo em qualquer tema. O que é de SEO, acessibilidade e idiomas (o `<head>`, o `h1` único, os dados estruturados, as imagens responsivas) fica no núcleo, então o tema não precisa cuidar disso.

Este guia é para quem quer escrever um tema do zero ou a partir de um dos 14. Para só escolher e trocar de tema, veja [Temas](./temas.md). Para mudar um bloco num site só, [ejetar o componente](#ejetar-um-componente) costuma bastar.

## Onde um tema mora

Um tema é um pacote npm, `@rubrica/theme-<id>`, e hoje nasce no [monorepo do Rubrica](https://github.com/MierzwaMatheus/rubrica), em `packages/themes/<id>`. É lá que roda a [bateria de testes](#a-bateria-de-testes) que todo tema precisa passar, e é de lá que ele é publicado. O CLI só oferece os temas da lista oficial (`create --tema`, `config --tema`): um tema novo entra nessa lista quando é aceito no repositório. As regras de contribuição estão em [Contribuindo](../v2/contribuindo.md#adicionar-um-tema).

O pacote tem esta forma:

```
packages/themes/farol/
  package.json
  src/
    index.tsx      a definição (defineTheme), exportada como padrão
    styles.css     a folha de estilo
    fonts.json     as fontes padrão
    shell.tsx      a casca
    blocks.tsx     os blocos que o tema desenha (opcional)
    templates.tsx  post, case e 404 (opcional)
    texts.ts       textos de interface do tema (opcional)
```

O `package.json` exporta as três entradas que a integração procura e declara o contrato:

<!-- exemplo: tema/package.json -->
```json
{
  "name": "@rubrica/theme-farol",
  "version": "0.1.0",
  "type": "module",
  "license": "GPL-3.0-only",
  "exports": {
    ".": "./src/index.tsx",
    "./styles.css": "./src/styles.css",
    "./fonts.json": "./src/fonts.json"
  },
  "files": ["src", "LICENSE"],
  "rubrica": { "contract": "^1" },
  "scripts": { "check": "tsc --noEmit -p tsconfig.json" },
  "peerDependencies": { "@rubrica/core": "workspace:^", "react": "^19.2.0" },
  "devDependencies": { "@rubrica/core": "workspace:^", "@types/react": "^19.2.0", "react": "^19.2.1", "typescript": "^5.9.0" }
}
```

O **contrato** (`"rubrica": { "contract": "^1" }`, o mesmo valor do campo `contract` da definição) diz com qual versão do contrato de blocos o tema funciona. Bloco novo no núcleo é versão menor: o tema herda o componente padrão até desenhar o seu. Mudar ou remover um campo é versão maior, sempre com migração de dados.

## A definição: `defineTheme`

O exemplo usado neste guia, um tema chamado `farol`:

<!-- exemplo: tema/src/index.tsx -->
```tsx
import { CORE_RECIPES, defineTheme, type Recipe } from "@rubrica/core";
import fonts from "./fonts.json";
import { CasesBlock } from "./blocks";
import { FarolShell } from "./shell";
import { FarolNotFound } from "./templates";
import { FAROL_TEXTS } from "./texts";

const tr = (ptBR: string, en: string, es: string) => ({ "pt-BR": ptBR, en, es });

/** A receita do núcleo, com outro hero na home. */
const pessoal: Recipe = CORE_RECIPES.pessoal.map((page) =>
  page.path !== "/"
    ? page
    : {
        ...page,
        blocks: [
          {
            type: "hero",
            fields: {
              eyebrow: tr("Seu cargo", "Your role", "Tu cargo"),
              title: tr("Uma frase sobre o que você faz", "One sentence on what you do", "Una frase sobre lo que haces"),
            },
          },
          ...page.blocks.filter((b) => b.type !== "hero"),
        ],
      },
);

export default defineTheme({
  id: "farol",
  label: "Farol",
  description: "Réguas finas, títulos serifados e cases em faixa.",
  contract: "^1",
  scheme: "azulejo",
  colorMode: "light",
  texture: "paper",
  fonts,
  tokens: {
    "rb-radius": { label: "Raio das bordas", kind: "length", default: "0.25rem" },
    "farol-rule": { label: "Espessura das réguas", kind: "length", default: "2px" },
  },
  Shell: FarolShell,
  blocks: { cases: CasesBlock },
  templates: { notFound: FarolNotFound },
  variants: {
    cases: [
      { value: "faixa", label: "Faixa" },
      { value: "grade", label: "Grade" },
      { value: "lista", label: "Lista" },
    ],
  },
  recipes: { pessoal },
  texts: FAROL_TEXTS,
});
```

| Campo | Obrigatório | Para quê |
|---|---|---|
| `id` | sim | O id do pacote sem o escopo (`farol` para `@rubrica/theme-farol`), em letras minúsculas, números e hífen |
| `label`, `description` | `label` | Nome e uma frase sobre o tema |
| `contract` | sim | Faixa do contrato de blocos (`^1`) |
| `tokens` | sim | Tokens que o painel deixa ajustar em **Aparência** (pode ser `{}`). Veja [Tokens](#tokens) |
| `Shell` | sim | A casca. Veja [A casca](#a-casca) |
| `blocks` | não | Componente por tipo de bloco; o que faltar herda o do núcleo. Veja [Blocos](#blocos) |
| `templates` | não | `post`, `case` e `notFound`. Veja [Templates](#templates) |
| `variants` | não | Variações por bloco; a primeira é a padrão. Veja [Variações](#variações) |
| `recipes` | não | Páginas de partida por tipo de site (`pessoal`, `empresa`). Veja [Receitas](#receitas) |
| `scheme` | não | Esquema de cor padrão (`neon`, `azulejo`...), quando o site não escolhe um |
| `colorMode` | não | Modo que o layout foi desenhado para mostrar primeiro: `dark` (o padrão), `light` ou `system`. O CLI usa ao criar o site e ao trocar de tema; quem decide é a **Aparência** do site |
| `texture` | não | Textura padrão: `grain`, `paper`, `scanlines` ou `none`. Uma camada fixa sobre a página, que não recebe cliques e some com `prefers-reduced-transparency` |
| `fonts` | não | As fontes padrão, importadas do `fonts.json`. Veja [Fontes](#fontes) |
| `texts` | não | Textos de interface próprios. Veja [Textos de interface](#textos-de-interface) |

## Tokens

Tokens são propriedades CSS `--rb-*` na raiz da página. Os blocos padrão do núcleo usam **só tokens**, sem cor fixa, então o tema muda muito só com eles.

**Cores** vêm do esquema escolhido (são os 11 papéis de cada esquema, em claro e escuro):

| Token | Papel |
|---|---|
| `--rb-bg` | Fundo das páginas |
| `--rb-surface` | Cartões, painéis, barra lateral |
| `--rb-subtle` | Fundos sutis, hover, faixas |
| `--rb-fg` | Texto principal |
| `--rb-muted` | Texto secundário |
| `--rb-border` | Bordas e divisórias |
| `--rb-accent` | Cor de identidade: botões e links |
| `--rb-accent-fg` | Texto sobre `--rb-accent` |
| `--rb-accent-2` | Segunda cor da marca (com contraste de texto sobre o fundo) |
| `--rb-accent-2-fg` | Texto sobre `--rb-accent-2` |
| `--rb-accent-3` | Terceira cor, só decorativa (sem garantia de contraste) |
| `--rb-danger`, `--rb-success` | Texto de erro e de confirmação |

**Os outros** vêm do tema:

| Token | Para quê |
|---|---|
| `--rb-font-sans`, `--rb-font-mono`, `--rb-font-display` | Fontes de texto, de código e de títulos |
| `--rb-fg-strong` | Cor dos títulos (padrão: igual a `--rb-fg`) |
| `--rb-radius` | Raio das bordas |
| `--rb-container` | Largura máxima do conteúdo |

A ordem de precedência é sempre: **tokens do tema, depois o esquema, depois os ajustes do painel**. O esquema usa um seletor mais forte que o `:root` do tema, então declare as cores no tema só se ele não deve seguir o esquema (raro). O normal é o tema definir o que não é cor e derivar o resto dos tokens do esquema, com `color-mix()`:

```css
:root {
  --rb-font-display: "Fraunces", ui-serif, serif;
  --rb-radius: 0.25rem;
  --rb-container: 68rem;
  --farol-rule: 2px;
  --farol-hairline: color-mix(in srgb, var(--rb-fg) 12%, transparent);
}
.farol-header { border-bottom: var(--farol-rule) solid var(--rb-border); }
```

A raiz da página traz `data-theme-id`, `data-color-mode` (`dark`, `light` ou `system`), `data-scheme` e `data-texture`, para o CSS variar quando precisar.

O campo `tokens` da definição lista o que o painel deixa a pessoa ajustar em **Aparência**: a chave é o nome da propriedade sem os dois hífens (`farol-rule`), `kind` é `color`, `font`, `length` ou `other`, `default` é o valor mostrado como sugestão e `light`, o valor do modo claro quando difere. O valor inicial continua sendo o que o `styles.css` declara.

## A casca

A casca envolve todas as páginas. Ela recebe `ShellProps`:

| Prop | O que é |
|---|---|
| `ctx` | O contexto da página: `ctx.site` (nome, logo, navegação, redes, pessoa ou empresa), `ctx.t`, `ctx.href`, `ctx.locale`, `ctx.alternates`, `ctx.feeds` |
| `pageType` | `page`, `post`, `case` ou `notFound`, para a casca variar |
| `collections` | Projetos e posts do idioma, resumidos (título, endereço, etiquetas), para um mapa do site ou um menu |
| `children` | O conteúdo da página |
| `colorToggle` | O botão de modo claro e escuro, pronto. Só existe quando o site liga a alternância |
| `localeSwitcher` | Os links para a página nos outros idiomas, prontos |

<!-- exemplo: tema/src/shell.tsx -->
```tsx
import type { ShellProps } from "@rubrica/core";
import { Logo } from "@rubrica/core/components";

export function FarolShell({ ctx, pageType, children, colorToggle, localeSwitcher }: ShellProps) {
  const { site } = ctx;
  return (
    <div className="farol" data-page={pageType}>
      <a className="rb-skip" href="#conteudo">
        {ctx.t("nav.skip")}
      </a>
      <header className="farol-header">
        <a className="farol-brand" href={ctx.href("/")}>
          {site.logo ? <Logo logo={site.logo} priority /> : site.name}
        </a>
        <nav aria-label={ctx.t("nav.menu")}>
          <details className="farol-menu">
            <summary>{ctx.t("nav.menu")}</summary>
            <ul>
              {site.navigation.map((item) => (
                <li key={item.href}>
                  <a href={item.href} aria-current={item.current ? "page" : undefined}>
                    {item.label}
                  </a>
                </li>
              ))}
            </ul>
          </details>
        </nav>
        <div className="farol-tools">
          {localeSwitcher}
          {colorToggle}
        </div>
      </header>
      <main id="conteudo">{children}</main>
      <footer className="farol-footer">
        <p>{ctx.t("farol.footer", { name: site.organization?.legalName ?? site.name })}</p>
      </footer>
    </div>
  );
}
```

O que toda casca precisa ter:

- o link para pular ao conteúdo (`.rb-skip`, com `ctx.t("nav.skip")`) apontando para o `<main id="conteudo">`;
- a navegação com `aria-label` e `aria-current="page"` no item atual (`item.current`);
- o `localeSwitcher` e o `colorToggle` em algum lugar visível;
- navegação que funcione no celular **sem JavaScript**: `<details>`, ou uma caixa de seleção marcada por um `<label>` (o tema `padrao` faz assim).

A casca pode ir bem longe do cabeçalho com menu: o tema `desktop` vira uma área de trabalho com janelas, o `chat` uma conversa, o `garden` um mapa de notas que usa `collections`. Vale ler o `shell.tsx` deles no repositório antes de desenhar uma casca especial.

### Faixa de aviso e botão do WhatsApp

A **faixa de aviso** e o **botão flutuante do WhatsApp** ([Conteúdo](./conteudo.md#whatsapp-e-faixa-de-aviso)) são do núcleo: a faixa vem antes da casca, o botão depois, só com tokens `--rb-*`. Se a casca tem algo fixo no topo ou no rodapé, o tema abre espaço com CSS, sem JavaScript: o `<html>` ganha `data-announcement` quando há faixa e `data-whatsapp-float` quando há botão, e as variáveis `--rb-float-bottom` e `--rb-float-right` mudam a posição do botão (`--rb-whatsapp-bg` e `--rb-whatsapp-fg`, as cores). O `padrao` troca a barra e a lateral fixas por `sticky` com a faixa; o `bento` sobe o botão acima do dock; o `chat` o põe na barra de respostas.

## Blocos

`blocks` tem um componente por tipo de bloco, só para os que o tema quer desenhar. Os outros **herdam** o componente padrão do núcleo e ganham o visual pelo CSS (cada seção tem a classe `rb-<tipo>` e os atributos `data-block` e `data-variant`). Um bloco que o núcleo acrescentar depois também aparece no tema, com o componente padrão.

O componente recebe as mesmas props de um [bloco próprio](./criar-bloco.md#o-componente), com os itens da coleção já resolvidos (`ProjectItem`, `PostItem`...). As regras também são as mesmas: React puro, sem texto fixo, título com `headingLevel` e itens em `h3`.

O tema pode reaproveitar o componente do núcleo e desenhar só o que muda. Aqui, o `farol` desenha a variação `faixa` e devolve as outras ao núcleo:

<!-- exemplo: tema/src/blocks.tsx -->
```tsx
import type { BlockProps, ProjectItem, ResolvedFields } from "@rubrica/core";
import type { cases } from "@rubrica/core/blocks";
import { CasesBlock as CoreCasesBlock, Heading, Img, LinkButton, Section, SectionHeader } from "@rubrica/core/components";

type CasesFields = ResolvedFields<typeof cases.fields>;

export function CasesBlock(props: BlockProps<CasesFields, ProjectItem>) {
  if (props.variant !== "faixa") return <CoreCasesBlock {...props} />;
  const { id, variant, fields, items, headingLevel, ctx } = props;
  return (
    <Section id={id} anchor={fields.anchor} type="cases" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      <ol className="farol-faixa">
        {items.map((project) => (
          <li key={project.id}>
            {project.cover && <Img image={project.cover} sizes="(min-width: 64rem) 20rem, 80vw" />}
            <Heading level={3}>{project.title}</Heading>
            {project.summary && <p>{project.summary}</p>}
            <a href={project.url}>{ctx.t("farol.openCase")}</a>
          </li>
        ))}
      </ol>
      {fields.cta && <LinkButton link={fields.cta} variant="secondary" />}
    </Section>
  );
}
```

Os componentes padrão e as peças (`Section`, `SectionHeader`, `Heading`, `Img`, `Html`, `LinkButton`, `Logo`, `LocaleLinks`, `ColorToggleButton`) e alguns utilitários puros (`formatDays`, `safeId`, `shorten`, `tagFilterCss`) vêm de `@rubrica/core/components`.

## Variações

`variants` dá nomes a desenhos diferentes de um bloco (decisão 23): o painel mostra só as do tema em uso, e a **primeira é a padrão**. Ao trocar de tema, uma variação que o tema novo não tem cai na padrão dele. O componente lê a escolhida em `variant`.

Os componentes padrão do núcleo só sabem desenhar as variações de `CORE_VARIANTS` (hoje, `grade` e `lista` em `cases`, `vertical` e `horizontal` em `linha-do-tempo`). Um tema que herda o componente padrão de um bloco só pode declarar essas, em qualquer ordem. Variação nova pede componente próprio, como a `faixa` acima. O [catálogo de blocos](./blocos.md) mostra as variações que cada tema declara, e o MCP as entrega ao agente (e recusa uma variação que o tema não tem).

## Receitas

A **receita** é a lista de páginas e blocos com que um site novo começa (decisão 24), por tipo de site. O `setup` usa a receita do tema ao criar o conteúdo inicial, e o `migrar` usa a mesma para trazer um site da v1. Sem receita, vale a do núcleo (`CORE_RECIPES`).

Cada página tem `path`, `title` (um texto por idioma) e `blocks`, e cada bloco, `type` e, se quiser, `variant`, `fields` (no mesmo formato que fica guardado, com um texto por idioma) e `source`. O jeito mais seguro é partir da receita do núcleo e trocar só o que o tema muda, como no exemplo da definição. A vitrine da bateria (`/vitrine/receita/...`) mostra as receitas montadas. O MCP também entrega a receita aos agentes (`page_recipes`), como ponto de partida para montar uma página do mesmo tipo: mantenha a ordem dos blocos de cada página coerente com o desenho do tema.

## Templates

Templates opcionais para as páginas que não são feitas de blocos. Cada um renderiza o próprio `h1`, dentro da casca:

| Template | Props |
|---|---|
| `post` | `post` (o `PostItem`), `html` (o corpo, já sanitizado no backend), `related`, `ctx` |
| `case` | `project` (o `ProjectItem`, com as seções do case), `related`, `ctx` |
| `notFound` | `ctx` |

<!-- exemplo: tema/src/templates.tsx -->
```tsx
import type { NotFoundProps } from "@rubrica/core";

export function FarolNotFound({ ctx }: NotFoundProps) {
  return (
    <section className="farol-404">
      <h1>{ctx.t("notFound.title")}</h1>
      <p>{ctx.t("notFound.body")}</p>
      <a href={ctx.href("/")}>{ctx.t("notFound.home")}</a>
    </section>
  );
}
```

Sem template, valem os do núcleo (`DefaultPost`, `DefaultCase`, `DefaultNotFound`), estilizados pelo CSS do tema.

## Fontes

O `fonts.json` diz as famílias de cada papel. O `index` do tema importa o arquivo (para `fonts`) e o pacote o exporta em `./fonts.json` (para o build), então há uma fonte só:

<!-- exemplo: tema/src/fonts.json -->
```json
{ "sans": "Instrument Sans", "mono": "IBM Plex Mono", "display": "Fraunces", "italic": ["display"] }
```

- `sans`, `mono` e `display` são famílias do Google Fonts. O build baixa os arquivos e o site os serve: o navegador de quem visita nunca fala com o Google. Prefira as do catálogo do painel (Inter, Chakra Petch, Fraunces, Instrument Sans...), que já têm os pesos conhecidos; outra família baixa os pesos 400 e 700.
- `italic` lista os papéis que também baixam o itálico de verdade, no lugar do oblíquo que o navegador inventa. Vale para a família que ocupar o papel, mesmo que o site troque a fonte.
- Na **Aparência**, o site pode trocar a fonte de texto e a de código. A de títulos (`display`) é sempre a do tema.
- No `styles.css`, declare as famílias nos tokens (`--rb-font-sans: "Instrument Sans", system-ui, sans-serif;`) como reserva: o núcleo aponta os tokens para as fontes baixadas por cima disso.

## Textos de interface

Texto que não é do conteúdo (o "abrir case" da faixa, o rodapé) vem de `ctx.t`. As chaves do núcleo (`nav.skip`, `nav.menu`, `footer.rights`, `notFound.title`...) estão em `packages/core/src/i18n/ui-texts.ts`. O tema acrescenta as suas em `texts`, com um prefixo do id dele e um texto por idioma base (`pt`, `en`, `es`). Variáveis vão entre chaves:

<!-- exemplo: tema/src/texts.ts -->
```ts
export const FAROL_TEXTS: Record<string, Record<string, string>> = {
  "farol.footer": { pt: "Feito por {name}", en: "Made by {name}", es: "Hecho por {name}" },
  "farol.openCase": { pt: "Abrir o case", en: "Open the case", es: "Abrir el caso" },
};
```

O site pode trocar qualquer texto em **Textos**, no painel. Sem tradução no idioma da página, vale a do idioma principal.

## Ilhas e JavaScript

Página sem ilha não carrega JavaScript, e a bateria confere isso. Por isso:

- **O tema não cria ilhas.** As ilhas (o assistente de contato, o envio de depoimento, o botão de PDF do currículo) são do núcleo, e o núcleo decide quando montar cada uma. O componente do bloco recebe a ilha pronta em `island` e só escolhe onde ela fica. Um tema que desenha o bloco `contato` e esquece o `island` deixa o formulário de fora.
- O `colorToggle` e o `localeSwitcher` também não são ilhas: são HTML pronto, com um script pequeno do núcleo para o modo de cor.
- Para interação no tema, use HTML e CSS: `<details>`, `:target`, uma caixa de seleção com `<label>`, ou um `<style>` gerado no build (o `tagFilterCss` do núcleo monta o CSS de um filtro por etiqueta assim).

## A bateria de testes

Todo tema passa pela mesma bateria (decisão 31) antes de entrar. Ela constrói os sites de demonstração, pessoal e empresa, com o tema, mais a **vitrine** (`/vitrine`: uma página por bloco com todas as variações do tema, e as receitas montadas), e confere em cada página:

| Verificação | O que pede |
|---|---|
| `status` | A página responde sem erro |
| `axe` | Nenhuma violação de acessibilidade do axe |
| `h1` | Exatamente um `<h1>` |
| `title`, `description`, `canonical`, `lang`, `hreflang` | `<head>` completo: título, descrição, canonical para a própria página, `lang` do idioma da URL, `hreflang` recíproco |
| `overflow` | Sem rolagem horizontal a 360 px de largura |
| `console`, `network` | Console sem erro e nenhuma requisição com resposta 4xx ou 5xx |
| `js` | Página sem ilha: só o script do modo de cor, JSON-LD e o analytics configurado. Página com ilha: até 120 KB de JavaScript (gzip) |
| `hydration` | Toda ilha hidrata em até 10 segundos |

E o Lighthouse na home, num post e num case: **performance 90 ou mais, acessibilidade e SEO 95 ou mais** (mediana de até 3 execuções).

No monorepo:

```bash
pnpm --filter @rubrica/theme-tester exec playwright install chromium   # uma vez
pnpm testar-tema farol
```

Opções úteis: `--site pessoal`, `--sem-lighthouse` (bem mais rápido, para o dia a dia), `--so-lighthouse`, `--sem-vitrine`, `--json relatorio.json`, `--manter-dist` e `--todos`. Os limites mudam com `--js-kb`, `--lh-performance`, `--lh-acessibilidade` e `--lh-seo`, mas o tema entra com os padrões. A lista completa está em [Comandos do CLI](./cli.md#testar-tema).

## Do padrão ao seu tema

1. **Copie o `padrao`.** No monorepo (`pnpm install` na raiz, Node 24): copie `packages/themes/padrao` para `packages/themes/<id>`, apague o `CHANGELOG.md`, troque o `name` do `package.json` para `@rubrica/theme-<id>` e o `id` e o `label` do `defineTheme`. Rode `pnpm install` de novo.
2. **Veja funcionando.** `THEME=@rubrica/theme-<id> pnpm demo` abre o site de demonstração com o seu tema (`SITE=empresa` para o de empresa), e `/admin` mostra o painel com a prévia.
3. **Comece pelos tokens.** Mude fontes (`fonts.json`), raio e largura no `styles.css`, e escolha `scheme`, `colorMode` e `texture`. Só isso já muda bastante.
4. **Desenhe a casca.** Troque o `shell.tsx`, mantendo o link de pular, o `<main id="conteudo">`, o `aria-current`, os idiomas, o modo de cor e o menu sem JavaScript.
5. **Desenhe os blocos que quiser.** Um por vez, em `blocks`, partindo do componente do núcleo (`packages/core/src/components/blocks/`). Os que você não desenhar continuam funcionando.
6. **Acrescente variações e receitas**, se o tema pedir.
7. **Rode a bateria** (`pnpm testar-tema <id> --sem-lighthouse` enquanto desenha; completa antes de entregar) e `pnpm --filter @rubrica/theme-<id> check`.
8. **Proponha no repositório**, seguindo [Contribuindo](../v2/contribuindo.md#adicionar-um-tema).

## Ejetar um componente

Para mudar a marcação de um bloco num site só, sem fazer um tema, ejete o componente:

```bash
npx create-rubrica ejetar hero     # copia o componente do bloco hero para src/overrides/
npx create-rubrica ejetar --listar # mostra o que já foi ejetado e se o original mudou
```

A cópia vem do tema em uso (ou do núcleo, se o tema não desenha o bloco) e passa a valer por cima dele. A partir daí ela é sua: o `update` não mexe nela, mas avisa quando o original mudou. Detalhes em [Comandos do CLI](./cli.md#ejetar).
