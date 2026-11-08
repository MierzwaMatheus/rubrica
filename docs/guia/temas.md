# Temas

Um **tema** muda a forma do site sem mudar o conteúdo: cabeçalho, navegação, rodapé e o desenho de cada bloco. As páginas, os textos e as imagens são os mesmos em qualquer tema. O que é de SEO, acessibilidade e idiomas (o `<head>`, o `h1` único da página, os rótulos para leitores de tela) fica no núcleo, então todos os temas ganham a mesma correção quando ela sai.

Cada tema é um pacote (`@rubrica/theme-<nome>`) que o seu projeto instala junto com o `@rubrica/core`. O visual padrão de cada um (esquema de cores, modo e fontes) vem declarado no pacote.

## Os 14 temas

| Tema | Como é | Visual padrão |
|---|---|---|
| `padrao` | Barra lateral com foto, limpo e neutro: serve para qualquer área | Neon, escuro, Chakra Petch |
| `cyberpunk` | Barra lateral com foto de perfil (dev, designer, freelancer) | Neon, escuro, Chakra Petch |
| `brutalist` | Identidade hacker total: monoespaçada, sem bordas arredondadas | Paper Noir, escuro, JetBrains Mono |
| `swiss` | Grade de 12 colunas, tipografia forte, design suíço rigoroso | Paper Noir, claro, Archivo |
| `bento` | Grade assimétrica com dock flutuante: moderno, de produto | Editorial Cream, claro, Manrope |
| `magazine` | Editorial clássico, display serifado, muito respiro | Editorial Cream, claro, IBM Plex Serif |
| `desktop` | Cada seção é uma janela sobre uma área de trabalho retrô | Sorbet, claro, Instrument Sans |
| `index` | Lista densa de museu, imagem que surge no hover: curadoria | Sumi, claro, Instrument Sans |
| `monograph` | O site como livro: folha de rosto, sumário, capitulares, notas na margem | Azulejo, claro, Source Serif 4 |
| `zine` | Colagem: polaroides, fita adesiva, post-its e letra à mão | Riso, claro, Bricolage Grotesque |
| `blueprint` | Folhas técnicas numeradas sobre papel quadriculado | Cianotipia, escuro, IBM Plex Sans |
| `garden` | Notas com estágio de crescimento, backlinks e mapa de ligações | Crepúsculo, escuro, Fraunces |
| `chat` | O site como conversa: cada seção responde a uma pergunta pronta | Alto Contraste, claro, Instrument Sans |
| `poster` | Tipografia gigante do começo ao fim, faixas rolando: impacto | Tropicália, claro, Bricolage Grotesque |

Veja todos funcionando no [combinador](https://userubrica.vercel.app/#combinador). Alguns temas mudam a navegação inteira (`desktop`, `chat`, `garden`): vale abrir o preview e clicar antes de escolher.

## Escolher e trocar

Na criação: `npx create-rubrica@latest meu-site --tema zine`. Depois, a qualquer momento:

```bash
npx create-rubrica config --tema monograph
```

O comando troca a dependência do pacote e o trecho do `astro.config.ts`, roda a instalação e grava as mudanças de aparência no Convex de desenvolvimento. Se você nunca mudou o esquema, o modo e as fontes, eles passam a seguir o tema novo; o que você escolheu fica como está. O conteúdo não muda.

Para o site **publicado**, a troca só chega com `npx create-rubrica config --tema ... --producao` (que pede confirmação) e um novo `publicar`.

Se você ejetou componentes do tema antigo, o comando avisa: confira se ainda fazem sentido no novo.

## Esquemas de cor

O esquema é a paleta, e **qualquer esquema funciona com qualquer tema**. Cada um tem versão clara e escura, com 11 papéis de cor (fundo, cartão, texto, texto secundário, borda, cor primária, acento e mais).

| Esquema | Como é |
|---|---|
| `neon` | O visual original do Rubrica: roxo e lima sobre grafite |
| `editorial-cream` | Refinado e atemporal: blogs e portfólios literários |
| `paper-noir` | Contraste máximo, identidade editorial forte |
| `midnight-blue` | Tech e premium |
| `solar-warm` | Energia e criatividade |
| `riso` | Rosa fluorescente e azul de impressão riso sobre papel |
| `cianotipia` | Azul-da-prússia e branco giz |
| `tropicalia` | Verde-mata, amarelo-ouro e rosa-buganvília |
| `azulejo` | Azul-cobalto sobre branco, com terracota |
| `sumi` | Tinta preta, papel washi e um único vermelho de carimbo |
| `fosforo` | Verde de monitor CRT e âmbar |
| `crepusculo` | Roxo profundo indo para o laranja de fim de tarde |
| `concreto` | Cinzas frios e um amarelo de sinalização |
| `sorbet` | Lilás, menta e pêssego em tons Y2K |
| `alto-contraste` | Contraste AAA nos dois modos, pensado para baixa visão |

Todos passam o contraste AA para texto (4,5:1) nos dois modos.

```bash
npx create-rubrica config --esquema azulejo --modo claro
```

O **modo** é `claro`, `escuro` ou `automatico` (segue o sistema de quem visita). Com a alternância ligada, o site mostra um botão para a pessoa trocar de modo. No painel, a tela **Aparência** faz as mesmas escolhas e mais uma: ajustar tokens individuais (uma cor, o raio das bordas), que valem por cima do esquema.

A ordem de precedência é sempre: **tokens do tema, depois o esquema, depois os ajustes do painel**.

## Fontes

Cada tema traz as suas fontes (um papel de texto, um de código e um de título). Na tela **Aparência** do painel você troca a fonte de texto e a de código por qualquer família do catálogo (Inter, Chakra Petch, Playfair Display, Space Grotesk, DM Sans, Bodoni Moda, IBM Plex Serif, Manrope, Archivo, Instrument Sans, IBM Plex Sans, Fraunces, Source Serif 4, Bricolage Grotesque, JetBrains Mono, Fira Code, Space Mono, IBM Plex Mono). As fontes são baixadas **no build** e servidas pelo próprio site: o navegador de quem visita nunca fala com o Google Fonts.

## Blocos próprios e componentes ejetados

Do menor para o maior esforço (prefira sempre o menor):

1. **Configuração e tokens**, pelo painel ou pelo `config`.
2. **Bloco próprio**, para uma seção que o catálogo não tem.
3. **Componente ejetado**, quando o bloco existe mas você quer outra marcação.

### Bloco próprio

Fica em `src/blocks/`: uma definição (os campos, com `defineBlock`) e um componente React puro. Registre os dois em `src/blocks/index.ts`:

```ts
import { defineBlock, field } from "@rubrica/core";

export const blocks = [defineBlock({ type: "selo", label: "Selo", /* campos... */ })];
export const components = { selo: "./src/blocks/Selo.tsx" };
```

O bloco aparece no editor de páginas como os do núcleo, com formulário e prévia.

### Ejetar um componente

```bash
npx create-rubrica ejetar hero     # copia o componente do bloco hero
npx create-rubrica ejetar --listar # mostra o que já foi ejetado
```

O comando copia só aquele componente (do tema, ou do núcleo se o tema não tem) para `src/overrides/` e passa a usar a cópia. A partir daí o componente é **seu**: o `update` não mexe nele, mas avisa quando o original mudou desde a cópia, para você trazer a correção. `--forcar` copia de novo por cima.

### Regras dos componentes

Componentes de bloco e de tema são **React puro**: só props, sem estado, efeitos, contexto nem busca de dados. O Astro os transforma em HTML estático; o que precisa de JavaScript é uma ilha do núcleo. Além disso:

- nada de texto fixo no componente: ou é campo do bloco, ou é texto de interface (`ctx.t("chave")`);
- links internos por `ctx.href("/caminho")`, que já leva o prefixo do idioma;
- o título do primeiro bloco é o `h1` da página; os outros usam `h2`, e itens usam `h3`.

`npx create-rubrica verificar` confere os ejetados.

## Criar um tema

Um tema é um pacote que exporta, por padrão, `defineTheme({...})`, e a folha de estilo em `./styles.css`. Ele fornece:

- **tokens** (cores, tipografia, espaçamento, raio) e o esquema e o modo padrão;
- a **casca**: cabeçalho, navegação e rodapé (ou a "área de trabalho" do `desktop`);
- um **componente por tipo de bloco**, só os que quiser trocar; os outros herdam a versão do núcleo;
- **variações** com nome por bloco (por exemplo, `cases: ["grade", "lista"]`);
- **receitas**: a lista padrão de blocos de cada página, usada ao criar um site e ao migrar;
- opcionalmente, templates de post, de case e de 404.

O contrato tem versão própria: o pacote declara `"rubrica": { "contract": "^1" }`. Bloco novo no núcleo é uma versão menor (o tema herda o padrão); mudar ou remover campo é uma versão maior, sempre com migração de dados.

O modo mais curto de começar é copiar `packages/themes/padrao` do [repositório](https://github.com/MierzwaMatheus/rubrica) e trocar o que quiser. O guia do monorepo, com as regras completas, está em [`docs/v2/contribuindo.md`](https://github.com/MierzwaMatheus/rubrica/blob/main/docs/v2/contribuindo.md).

### A bateria de testes

Todo tema passa pela mesma bateria antes de entrar. Ela constrói os sites de demonstração (pessoal e empresa) com o tema, em todos os blocos e variações, e confere:

- acessibilidade com o axe, sem violações;
- um `h1` por página e o `<head>` completo (título, descrição, canonical, idiomas, dados estruturados);
- limite de JavaScript por página (120 KB comprimido nas páginas com ilha; página sem ilha não leva JavaScript);
- ilhas hidratando sem erro;
- Lighthouse: performance 90 ou mais, acessibilidade e SEO 95 ou mais.

```bash
pnpm testar-tema meu-tema              # no monorepo
npx create-rubrica testar-tema meu-tema
```

Opções úteis: `--site pessoal`, `--sem-lighthouse`, `--so-lighthouse`, `--json relatorio.json` e `--todos`. A lista completa está em [Comandos do CLI](./cli.md#testar-tema). Falhou algo, o tema não sai. A mesma bateria vale para temas de terceiros.
