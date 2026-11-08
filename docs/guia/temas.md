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

Quando o tema e a **Aparência** não bastam, há dois caminhos no próprio projeto, do menor para o maior esforço:

1. **Bloco próprio**, para uma seção que o [catálogo](./blocos.md) não tem: uma definição com os campos e um componente React, em `src/blocks/`. Veja [Criar um bloco](./criar-bloco.md).
2. **Componente ejetado**, quando o bloco existe e você quer outra marcação: `npx create-rubrica ejetar <bloco>` copia o componente para `src/overrides/`, e a cópia passa a ser sua. Veja [Ejetar um componente](./criar-tema.md#ejetar-um-componente).

## Criar um tema

Um tema novo é um pacote `@rubrica/theme-<id>`, feito no monorepo do Rubrica a partir do `padrao` e aprovado pela mesma bateria de testes de todos os temas (acessibilidade, SEO, JavaScript por página e Lighthouse). O contrato, a casca, os tokens, as variações, as receitas e o passo a passo estão em [Criar um tema](./criar-tema.md).
