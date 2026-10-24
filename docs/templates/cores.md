# Esquemas de cores

O Rubrica tem **15 esquemas de cores**. Cada esquema tem um **modo claro** e um **modo escuro**, e cada modo define **11 papéis de cor**. Os layouts não têm cor própria: tudo vem do esquema, e por isso qualquer layout funciona com qualquer esquema, nos dois modos.

## Os papéis

| Variável | Papel |
|---|---|
| `--bg` ● | fundo das páginas |
| `--surface` | cartões, painéis, barras |
| `--subtle` | fundos sutis, faixas, hover |
| `--text` ● | texto principal |
| `--text-muted` | texto secundário, legendas |
| `--line` | bordas e divisórias |
| `--primary` ● | identidade: botões, links, blocos de destaque |
| `--on-primary` | texto sobre a primária |
| `--accent` ● | segunda cor de marca |
| `--on-accent` | texto sobre o acento |
| `--accent-2` | terceira cor |

Também existe `--text-strong`, derivado de `--text`, para títulos.

● **As 4 cores dos layouts originais.** Cyberpunk, Brutalism Terminal, Swiss Grid, Bento e Magazine usam só `--bg`, `--text`, `--primary` e `--accent`: é o contrato de 4 cores com que eles foram feitos. Os layouts novos (Desktop Retrô, Índice, Monografia, Zine, Blueprint, Jardim Digital, Conversa e Pôster Cinético) usam o esquema completo.

O esquema fica em `src/index.css`, entre os marcadores `/* rubrica:esquema:inicio */` e `/* rubrica:esquema:fim */`: o modo claro em `:root` e o escuro em `.dark`. A fonte única dos esquemas é `cli/src/themes/schemes.ts`.

### Regras para quem cria ou edita um layout

- Layouts originais: só `var(--bg)`, `var(--text)`, `var(--primary)`, `var(--accent)` e misturas delas (`color-mix()`).
- Layouts novos: só as variáveis do esquema, nunca cores literais (hex, `rgb()`, `hsl()`, `text-white`, `bg-gray-100`…).
- Nenhum layout presume fundo claro ou escuro: texto sobre a primária usa `--on-primary`, sobre o acento usa `--on-accent`.
- O teste `tests/app/colorContract.test.ts` verifica essas regras. Veja também [Criando um layout](./criando-um-layout.md).

## Modo claro, escuro ou automático

O CLI pergunta o modo padrão do site:

- **Claro** ou **Escuro**: o site abre sempre nesse modo.
- **Automático**: segue o modo do sistema de quem visita.

E pergunta se quem visita pode **alternar o modo**. Com a alternância ligada, cada layout mostra um botão de sol/lua na navegação, e a escolha fica guardada no navegador da visita. Tudo isso é gravado como atributos do `<html>` no `index.html` (`data-color-mode`, `data-color-toggle`). Um script curto no próprio `index.html` aplica o modo antes da página aparecer, para não piscar.

O painel admin fica sempre no modo escuro e sem textura.

## Textura

Uma camada sobre a página inteira, que não recebe cliques, configurada no mesmo passo:

| Textura | Sensação |
|---|---|
| Nenhuma | superfícies lisas |
| Grão de filme | ruído fino, analógico |
| Papel | fibras de papel, editorial |
| Scanlines | linhas de monitor CRT |

Fica no atributo `data-texture` do `<html>`; o CSS está no `src/index.css`. Quem pediu ao sistema menos transparência (`prefers-reduced-transparency`) não vê a textura.

## Como escolher ou mudar

1. **Ao criar o projeto**: `npx create-rubrica` pergunta o esquema (com o recomendado do layout marcado), o modo, a alternância e a textura.
2. **Depois, pelo CLI**: `rubrica config` → **Aparência** troca qualquer um desses itens.
3. **Pelo painel admin**: em **Site & Aparência** (`/admin/site-config`), as 4 cores principais (fundo, texto, primária e destaque) de **cada modo** podem ser trocadas sem novo deploy, com indicador de contraste WCAG. Os campos começam com as cores do esquema e só o que for diferente fica salvo; **"Usar as cores do esquema"** desfaz a personalização. Quando o fundo ou o texto de um modo são trocados, as cores de apoio daquele modo (`--surface`, `--subtle`, `--line`, `--text-muted`) passam a ser calculadas a partir deles, e o texto sobre a primária e o acento é escolhido pelo contraste. Cores salvas antes das cores por modo valem nos dois modos até a próxima vez que a aparência for salva.
4. **À mão**: edite os blocos `:root` e `.dark` entre os marcadores em `src/index.css` (o próximo `rubrica config` → Aparência os sobrescreve).

## Os esquemas

### Neon — `neon`

<img src="img/cores/neon.svg" width="100%" />

O visual original do Rubrica: roxo e verde-limão neon sobre grafite. É o esquema de `src/index.css` no repositório.

### Editorial Cream — `editorial-cream`

<img src="img/cores/editorial-cream.svg" width="100%" />

Papel creme e tinta quase preta, com roxo e vermelho como cores de marca. Refinado e atemporal, feito para blogs e portfólios com muito texto.

### Paper Noir — `paper-noir`

<img src="img/cores/paper-noir.svg" width="100%" />

Off-white e preto puro com vermelho e azul primários. Contraste máximo e identidade editorial forte, na linha do design suíço.

### Midnight Blue — `midnight-blue`

<img src="img/cores/midnight-blue.svg" width="100%" />

Azul-noite profundo com ciano e amarelo. Tech e premium, para devs e designers que preferem o escuro.

### Solar Warm — `solar-warm`

<img src="img/cores/solar-warm.svg" width="100%" />

Marrom quase preto com laranja e amarelo. Energia e calor, para marcas pessoais vibrantes.

### Riso — `riso`

<img src="img/cores/riso.svg" width="100%" />

Rosa fluorescente e azul de impressão risográfica sobre papel, com amarelo de apoio. Feito para o Zine.

### Cianotipia — `cianotipia`

<img src="img/cores/cianotipia.svg" width="100%" />

Azul-da-prússia e branco giz, como cópia heliográfica de projeto. Feito para o Blueprint.

### Tropicália — `tropicalia`

<img src="img/cores/tropicalia.svg" width="100%" />

Verde-mata, amarelo-ouro e rosa-buganvília, na linha dos jardins de Burle Marx. Feito para o Pôster Cinético.

### Azulejo — `azulejo`

<img src="img/cores/azulejo.svg" width="100%" />

Azul-cobalto sobre branco, com terracota e ocre. Feito para a Monografia.

### Sumi — `sumi`

<img src="img/cores/sumi.svg" width="100%" />

Tinta preta, papel washi e um único vermelho de carimbo. Feito para o Índice.

### Fósforo — `fosforo`

<img src="img/cores/fosforo.svg" width="100%" />

Verde de monitor CRT e âmbar no escuro; no claro, papel de formulário contínuo.

### Crepúsculo — `crepusculo`

<img src="img/cores/crepusculo.svg" width="100%" />

Roxo profundo indo para o laranja de fim de tarde. Feito para o Jardim Digital.

### Concreto — `concreto`

<img src="img/cores/concreto.svg" width="100%" />

Cinzas frios e um amarelo de sinalização de obra.

### Sorbet — `sorbet`

<img src="img/cores/sorbet.svg" width="100%" />

Lilás, menta e pêssego em tons Y2K. Feito para o Desktop Retrô.

### Alto Contraste — `alto-contraste`

<img src="img/cores/alto-contraste.svg" width="100%" />

Contraste nível AAA nos dois modos, pensado para baixa visão. Feito para a Conversa e bom com qualquer layout.

## Na prática: os layouts originais em cada paleta

Mesma página, mesmo conteúdo: só as 4 cores mudam. Capturas no modo nativo de cada paleta original (Editorial Cream e Paper Noir no claro, Midnight Blue e Solar Warm no escuro).

### Cyberpunk

| Editorial Cream | Paper Noir |
|---|---|
| ![](img/cores/cyberpunk-editorial-cream.jpg) | ![](img/cores/cyberpunk-paper-noir.jpg) |
| **Midnight Blue** | **Solar Warm** |
| ![](img/cores/cyberpunk-midnight-blue.jpg) | ![](img/cores/cyberpunk-solar-warm.jpg) |

### Brutalism Terminal

| Editorial Cream | Paper Noir |
|---|---|
| ![](img/cores/brutalist-editorial-cream.jpg) | ![](img/cores/brutalist-paper-noir.jpg) |
| **Midnight Blue** | **Solar Warm** |
| ![](img/cores/brutalist-midnight-blue.jpg) | ![](img/cores/brutalist-solar-warm.jpg) |

### Swiss Grid

| Editorial Cream | Paper Noir |
|---|---|
| ![](img/cores/swiss-editorial-cream.jpg) | ![](img/cores/swiss-paper-noir.jpg) |
| **Midnight Blue** | **Solar Warm** |
| ![](img/cores/swiss-midnight-blue.jpg) | ![](img/cores/swiss-solar-warm.jpg) |

### Bento

| Editorial Cream | Paper Noir |
|---|---|
| ![](img/cores/bento-editorial-cream.jpg) | ![](img/cores/bento-paper-noir.jpg) |
| **Midnight Blue** | **Solar Warm** |
| ![](img/cores/bento-midnight-blue.jpg) | ![](img/cores/bento-solar-warm.jpg) |

### Magazine

| Editorial Cream | Paper Noir |
|---|---|
| ![](img/cores/magazine-editorial-cream.jpg) | ![](img/cores/magazine-paper-noir.jpg) |
| **Midnight Blue** | **Solar Warm** |
| ![](img/cores/magazine-midnight-blue.jpg) | ![](img/cores/magazine-solar-warm.jpg) |
