# Criar um bloco

Um **bloco próprio** é uma seção nova, que o [catálogo](./blocos.md) não tem: um selo de certificações, uma tabela de horários, um mapa de atendimento. Ele mora no seu projeto, aparece no editor de páginas como os blocos do núcleo, com formulário e prévia, e o backend valida os campos dele.

Antes de criar, veja se o menor esforço resolve:

1. **Configuração e tokens**, pelo painel ou pelo `config`, para mudar cor, fonte e espaçamento.
2. **Bloco próprio** (este guia), para uma seção que não existe.
3. **Componente ejetado**, quando o bloco existe e você quer outra marcação. Veja [Ejetar um componente](./criar-tema.md#ejetar-um-componente).

Este guia supõe que você sabe o básico de React e TypeScript.

## Como um bloco funciona

Um bloco tem duas partes:

- a **definição**, feita com `defineBlock`: o tipo, o nome no painel e os **campos**. Os campos são escritos uma vez e servem a três lugares: o formulário do painel, a validação no backend (e no MCP) e as props do componente, já no idioma da página;
- o **componente**, um componente React **puro**: recebe props e devolve HTML. O Astro o transforma em HTML estático no build, sem JavaScript no navegador.

As duas partes ficam em `src/blocks/`, e o `src/blocks/index.ts` junta tudo. O projeto criado pelo CLI já lê esse arquivo em dois lugares, então não há mais nada para registrar:

- o `astro.config.ts` passa `blocks: ["./src/blocks/index.ts"]` e os `components` dele para a integração (o site, o painel e a prévia);
- o `convex/rubrica.config.ts` passa os mesmos `blocks` para `createRubrica` (o backend valida o que o painel e o MCP gravam).

## Exemplo completo: selos e certificações

Um bloco `selos` que mostra selos com imagem, ano e link. São três arquivos.

A definição:

<!-- exemplo: projeto/src/blocks/selos.ts -->
```ts
import { defineBlock, field } from "@rubrica/core";

export const selos = defineBlock({
  type: "selos",
  label: "Selos e certificações",
  description: "Selos, prêmios e certificações, com imagem, ano e link.",
  guidance: {
    use: "Mostrar selos, prêmios e certificações que dão confiança, perto dos cases ou do contato.",
    avoid: "Para logos de clientes, use logos-clientes; para um prêmio só, texto com imagem.",
    pairsWith: ["logos-clientes", "depoimentos", "cta"],
  },
  category: "comum",
  fields: {
    anchor: field.text({ label: "Âncora", localized: false, maxLength: 40, help: "Para links na página (#selos). Opcional." }),
    title: field.text({ label: "Título", maxLength: 140 }),
    intro: field.text({ label: "Texto de apoio", multiline: true, maxLength: 400 }),
    layout: field.select({
      label: "Disposição",
      options: [
        { value: "linha", label: "Em linha" },
        { value: "grade", label: "Em grade" },
      ],
      default: "linha",
    }),
    showYear: field.boolean({ label: "Mostrar o ano", default: true }),
    items: field.list({
      label: "Selos",
      itemLabel: "Selo",
      required: true,
      min: 1,
      max: 12,
      of: {
        name: field.text({ label: "Nome", required: true, maxLength: 80 }),
        image: field.image({ label: "Imagem", required: true }),
        year: field.number({ label: "Ano", integer: true, min: 1900, max: 2100 }),
        link: field.link({ label: "Link" }),
      },
    }),
  },
});
```

O componente. O tipo dos campos sai da própria definição, com `ResolvedFields`:

<!-- exemplo: projeto/src/blocks/Selos.tsx -->
```tsx
import type { BlockProps, ResolvedFields } from "@rubrica/core";
import { Heading, Img, Section, SectionHeader } from "@rubrica/core/components";
import type { selos } from "./selos";

type Fields = ResolvedFields<typeof selos.fields>;

export default function Selos({ id, variant, fields, headingLevel }: BlockProps<Fields>) {
  const items = fields.items ?? [];
  if (items.length === 0) return null;
  return (
    <Section id={id} anchor={fields.anchor} type="selos" variant={variant}>
      <SectionHeader title={fields.title} intro={fields.intro} level={headingLevel} />
      <ul className="rb-grid" data-layout={fields.layout}>
        {items.map((item, i) => (
          <li key={`${i}-${item.name}`} className="rb-card">
            {item.image && <Img image={item.image} sizes="12rem" />}
            <Heading level={3} className="rb-card__title">
              {item.name}
            </Heading>
            {fields.showYear && item.year !== undefined && <p className="rb-card__text">{item.year}</p>}
            {item.link && (
              <a href={item.link.href} {...(item.link.external && { rel: "noopener noreferrer", target: "_blank" })}>
                {item.link.label}
              </a>
            )}
          </li>
        ))}
      </ul>
    </Section>
  );
}
```

E o registro:

<!-- exemplo: projeto/src/blocks/index.ts -->
```ts
import type { BlockDefinition } from "@rubrica/core";
import { selos } from "./selos";

export const blocks: BlockDefinition[] = [selos];

/** Componente de cada bloco próprio: tipo → arquivo (export default), a partir da raiz. */
export const components: Record<string, string> = {
  selos: "./src/blocks/Selos.tsx",
};
```

Rode `pnpm dev` (e `pnpm dev:convex`, para o backend conhecer o bloco novo). No painel, em **Páginas**, abra uma página e clique em adicionar bloco: **Selos e certificações** está na lista, com o formulário gerado dos campos e a prévia no tema em uso.

## A definição: `defineBlock`

| Opção | Para quê |
|---|---|
| `type` | Identificador estável, em letras minúsculas, números e hífen (`selos`, `tabela-horarios`). Fica gravado em cada página que usa o bloco: trocar depois quebra essas páginas. Não pode repetir um tipo do núcleo; use um nome bem seu, porque o núcleo pode ganhar blocos novos |
| `label` | Nome do bloco no painel |
| `description` | Uma frase sobre para que ele serve, mostrada no painel |
| `guidance` | Opcional. Orientação de uso, em pt-BR: `use` (quando usar), `avoid` (quando não usar, e o que usar no lugar) e `pairsWith` (tipos de bloco que combinam com ele). O MCP entrega aos agentes no catálogo (`blocks_catalog`), para eles escolherem o bloco certo ao montar uma página. Não muda o que o bloco aceita |
| `category` | `comum` (sites pessoais e de empresa), `pessoal` ou `empresa`: o painel só oferece o bloco no tipo certo |
| `fields` | Os campos (abaixo) |
| `plugin` | Opcional. Id de um plugin do núcleo (`blog`, `portfolio`...): com ele desligado, o bloco some do painel e do site |
| `source` | Opcional. Para listar itens de uma coleção do núcleo: `{ collections: ["projects"], default: { collection: "projects", limit: 3, sort: "order" } }`. O componente recebe os itens em `items`. A coleção padrão precisa estar entre as permitidas |
| `interactive` | Opcional. O bloco precisa de JavaScript no navegador. Veja [Bloco com JavaScript](#bloco-com-javascript) |
| `islandWhen` | Opcional, com `interactive`. Função que recebe os campos e os plugins ligados e diz se a ilha monta (ex.: só com um botão ligado). Sem ela, monta sempre |

`defineBlock` confere o `type` e a coleção padrão e lança um erro claro se algo estiver errado, já no build.

**Variações** não são da definição: são do tema, e o tema só declara variações dos blocos que conhece. Num bloco próprio, quando quiser mais de um desenho, use um campo `select` (como o `layout` do exemplo).

## Os campos: `field.*`

Todo campo aceita:

- `label` (obrigatório): o rótulo no painel;
- `help`: um texto de ajuda embaixo do campo;
- `required`: o painel e o backend recusam o bloco sem esse campo.

| Construtor | Opções próprias | O que fica guardado | O que o componente recebe |
|---|---|---|---|
| `field.text` | `localized` (padrão `true`), `multiline`, `maxLength` | Traduzível: um texto por idioma, `{ "pt-BR": "...", "en": "..." }`. Com `localized: false`: um texto só | `string` |
| `field.richText` | `localized` (padrão `true`) | HTML por idioma. O backend tira o que não é seguro antes de gravar | `string` com HTML: mostre com `<Html html={...} />` |
| `field.number` | `min`, `max`, `integer` | Um número | `number` |
| `field.boolean` | `default` | `true` ou `false` | `boolean` (sem valor, o `default`) |
| `field.select` | `options` (`[{ value, label }]`, obrigatório), `default` | O `value` escolhido | O `value`, com o tipo das opções (sem valor, o `default`) |
| `field.image` | — | `{ url, storageId?, alt?, width?, height? }`, com o `alt` por idioma | `{ src, alt, width?, height? }`: mostre com `<Img image={...} />` |
| `field.link` | — | `{ label, href }`, com o `label` por idioma | `{ label, href, external }`. Caminho interno já vem com o prefixo do idioma |
| `field.list` | `of` (os campos de cada item, obrigatório), `min`, `max`, `itemLabel` | Uma lista de objetos com os campos de `of` | Uma lista de objetos já resolvidos |

O que vale saber:

- **No componente, todo campo é opcional**, mesmo os `required`: uma página pode existir num idioma em que um campo traduzível ficou vazio. Trate o `undefined`.
- Um item de lista em que falta um campo obrigatório no idioma some da lista naquele idioma.
- Um link sem rótulo no idioma chega como `undefined`.
- `maxLength` vale para cada idioma de um texto traduzível.
- Não existe `default` em texto e número, nem `placeholder`. Use `help` para dar o exemplo.
- Campo desconhecido é recusado: o backend só aceita os campos da definição.

## O componente

Recebe estas props (`BlockProps<Campos, Item>`):

| Prop | O que é |
|---|---|
| `id` | Id do bloco na página. Passe para o `Section` |
| `variant` | A variação. Num bloco próprio é sempre `"default"` |
| `fields` | Os campos já resolvidos no idioma da página |
| `items` | Os itens da coleção, se o bloco tem `source` (senão, vazio) |
| `headingLevel` | `1` quando o bloco leva o título da página, senão `2`. Use no título da seção |
| `index`, `total` | Posição do bloco na página (a partir de 0) e quantos blocos visíveis ela tem |
| `ctx` | O contexto da página (abaixo) |
| `island` | A ilha já montada, num bloco `interactive` |

O `ctx` traz:

| Campo | O que é |
|---|---|
| `ctx.locale` | O idioma da página (`pt-BR`, `en`) |
| `ctx.t(chave, variáveis?)` | Um texto de interface do núcleo ou do tema, no idioma (ex.: `ctx.t("nav.skip")`) |
| `ctx.href(caminho)` | Caminho interno com o prefixo do idioma: `ctx.href("/blog")` vira `/en/blog` |
| `ctx.formatDate(iso, estilo?)` | Data no idioma; estilo `long`, `short` ou `month` |
| `ctx.site` | O site resolvido: nome, tipo, navegação, redes, pessoa ou empresa, plugins ligados |
| `ctx.path`, `ctx.alternates` | O caminho atual e as versões da página nos outros idiomas |

O núcleo também exporta peças prontas em `@rubrica/core/components`: `Section` (a seção com âncora e as marcações que os temas usam), `SectionHeader` (título e apoio no nível certo), `Heading`, `Img` (imagem responsiva, com `width` e `height`), `Html` (HTML de `richText`) e `LinkButton` (link com cara de botão).

### Regras

- **React puro.** Só props: sem `useState`, `useEffect`, contexto nem busca de dados. O componente roda no build, não no navegador.
- **Nada de texto fixo.** Texto de seção é campo do bloco. Um bloco próprio não acrescenta chaves de interface: se precisar de um rótulo, faça dele um campo.
- **Títulos.** O título da seção usa `headingLevel` (o `SectionHeader` já faz isso); os itens usam `h3`. Nunca ponha um `h1` por conta própria: o núcleo garante um por página.
- **Links internos** por `ctx.href`, ou pelos campos `link`, que já chegam prontos.
- **Acessibilidade.** Imagens com o `alt` do conteúdo (o `Img` usa), alvos de toque de pelo menos 44 px, nada que dependa só de cor.
- **Visual.** O `Section` e as classes que todo tema estiliza (`rb-grid`, `rb-card`, `rb-card__title`, `rb-card__text`) deixam o bloco com a cara do tema. Para estilos próprios, importe um arquivo CSS no componente (`import "./selos.css";`): o build junta ao CSS do site. Comece os seletores pela classe da seção (`.rb-selos ...`), para não vazar para outros blocos, e use os tokens `--rb-*` (veja [Criar um tema](./criar-tema.md#tokens)) no lugar de cor fixa, para o bloco funcionar com qualquer esquema, no modo claro e no escuro.

## Bloco com JavaScript

Quase todo bloco é só HTML. Quando precisar de JavaScript no navegador (um botão de copiar, um filtro), marque `interactive: true` e registre uma **ilha** com o mesmo nome do tipo, na opção `islands` do `astro.config.ts`. Acrescente a linha fora dos trechos entre marcadores `rubrica:`, que o CLI reescreve:

<!-- exemplo: projeto/astro.config.ts -->
```ts
import { defineConfig } from "astro/config";
import rubrica from "@rubrica/core/astro";
import { components as ownComponents } from "./src/blocks";

export default defineConfig({
  site: "https://exemplo.com.br",
  integrations: [
    rubrica({
      // rubrica:tema:inicio
      theme: "@rubrica/theme-padrao",
      // rubrica:tema:fim
      source: process.env.RUBRICA_FIXTURES ? { fixtures: process.env.RUBRICA_FIXTURES } : undefined,
      blocks: ["./src/blocks/index.ts"],
      // Ilhas dos blocos próprios: tipo do bloco → arquivo (export default).
      islands: { cupom: "./src/islands/Cupom.tsx" },
      // rubrica:ejetados:inicio
      blockComponents: {
        ...ownComponents,
      },
      // rubrica:ejetados:fim
    }),
  ],
});
```

A ilha é um componente React comum (pode ter estado) e recebe props serializáveis: `blockId`, `page`, `locale`, `fields` (os campos já resolvidos), `site` e `privacyHref`. O núcleo a monta quando ela aparece na tela e entrega ao componente do bloco em `island`, para ele decidir onde fica:

<!-- exemplo: projeto/src/blocks/cupom.ts -->
```ts
import { defineBlock, field } from "@rubrica/core";

export const cupom = defineBlock({
  type: "cupom",
  label: "Cupom",
  description: "Um código de desconto com botão de copiar.",
  category: "comum",
  interactive: true,
  fields: {
    title: field.text({ label: "Título", maxLength: 140 }),
    code: field.text({ label: "Código", localized: false, required: true, maxLength: 30 }),
    button: field.text({ label: "Texto do botão", required: true, maxLength: 30 }),
  },
});
```

<!-- exemplo: projeto/src/blocks/Cupom.tsx -->
```tsx
import type { BlockProps, ResolvedFields } from "@rubrica/core";
import { Section, SectionHeader } from "@rubrica/core/components";
import type { cupom } from "./cupom";

export default function Cupom({ id, variant, fields, headingLevel, island }: BlockProps<ResolvedFields<typeof cupom.fields>>) {
  return (
    <Section id={id} type="cupom" variant={variant}>
      <SectionHeader title={fields.title} level={headingLevel} />
      <p>
        <code>{fields.code}</code>
      </p>
      {island}
    </Section>
  );
}
```

<!-- exemplo: projeto/src/islands/Cupom.tsx -->
```tsx
import { useState } from "react";

interface Props {
  fields: { code?: string; button?: string };
}

export default function Cupom({ fields }: Props) {
  const [copied, setCopied] = useState(false);
  if (!fields.code) return null;
  return (
    <button type="button" onClick={() => navigator.clipboard.writeText(fields.code!).then(() => setCopied(true))}>
      {copied ? "✓" : fields.button}
    </button>
  );
}
```

Registre o `cupom` em `blocks` e `components` do `src/blocks/index.ts`, como o `selos`. Cada ilha pesa no carregamento da página. Prefira HTML e CSS (`<details>`, `:target`, uma caixa de seleção) sempre que der.

## Onde o bloco aparece

- **Painel.** No editor de páginas, com o formulário gerado dos campos (o `help` embaixo de cada um, o `itemLabel` em cada item de lista) e a prévia ao vivo no tema em uso. Só no tipo de site da `category`, e só com o `plugin` ligado.
- **Site.** Em qualquer tema: o componente do projeto vale por cima do tema. Sem componente registrado, o núcleo usa um genérico.
- **MCP.** O catálogo do MCP (`blocks_catalog`) vem do backend do projeto, então o bloco aparece para o agente como os do núcleo: rótulo, descrição, a `guidance`, os campos com os limites e as variações que o tema declarar para ele. O agente grava com `type` e `fields`; o MCP confere os campos antes, e o backend valida de novo (regras em função, como um `validate`, são conferidas pelo backend já na prévia). Publique o backend (`pnpm dev:convex`) para o MCP ver o bloco novo. Num backend de versão anterior à do catálogo, o MCP mostra só os blocos do núcleo.

## Conferir

- `pnpm check` confere os tipos: campo com nome errado no componente, opção que não existe no `select`.
- O backend recusa campos inválidos com uma mensagem por campo (`Título: até 140 caracteres`), que aparece no painel e no MCP. A função por trás é a `validateBlock`, exportada pelo `@rubrica/core`.
- No navegador, confira o bloco no celular e no desktop, nos modos claro e escuro, com campos vazios e com listas cheias.
- `pnpm test` (o `npx create-rubrica verificar`) confere o `convex/`, o tema e os componentes ejetados; ele não olha os blocos próprios.
- A [bateria de testes de tema](./criar-tema.md#a-bateria-de-testes) roda no monorepo do Rubrica, sobre os sites de demonstração, e também não vê os blocos do seu projeto. Se o bloco serve a todo mundo, proponha que ele entre no núcleo: aí ele passa pela bateria em todos os temas (veja [Contribuindo](../v2/contribuindo.md#adicionar-um-bloco-ao-núcleo)).
