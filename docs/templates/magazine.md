# Magazine

> _Editorial clássico · display serifado · grid assimétrico · áreas de respiro generosas._

![Início do Magazine](img/magazine/home.jpg)

<sub>Capturas com a paleta **Editorial Cream**. Veja o layout em todas as paletas em [Esquemas de cores](./cores.md#magazine).</sub>

## Conceito

O portfólio como uma **revista impressa**. Há um cabeçalho de capa com "Vol. 01 · No. 26" e "Est. MMXX", seções numeradas em algarismos romanos (§ I, § II…) e rótulos editoriais como "Reportagem de Capa", "Dossiê de Capacidades" e "Sumário desta edição". Os títulos são de display (92–124px, peso 500, espaçamento negativo); a sensação serifada vem das fontes recomendadas, e rótulos e metadados usam mono em caixa alta bem espaçada.

A composição é **assimétrica** (`1.4fr 1fr`, `1.2fr 1fr`, `180px 1fr`) e usa muito espaço em branco, com divisórias finas de 0.5px. A **primária** pinta numerais grandes, palavras em itálico nos títulos e capitulares; o **destaque** pinta rótulos de seção, filetes laterais e créditos.

- **Fontes recomendadas:** Bodoni Moda ou IBM Plex Serif (principal) e JetBrains Mono (mono).
- **Arquivos do template:** `Layout.tsx`, `Masthead.tsx` e as 5 páginas em `pages/`.

## Estrutura global

- **Masthead** em três faixas: metadados da edição; o **nome em caixa alta e espaçado** como título da revista; e a navegação centralizada, com o item ativo sublinhado na primária.
- Itens de plugins desligados somem da navegação (no desktop e no menu mobile, que abre de cima).
- O conteúdo fica numa coluna de até 1200px.

## Páginas

### Início

![Início](img/magazine/home.jpg)

- **"↘ Reportagem de Capa"**: o cargo vira a manchete em 124px, com o primeiro depoimento em itálico como "chamada" ao lado.
- **"✦ Dossiê de Capacidades ✦"**: os serviços em 2 colunas, cada um com um numeral grande na primária.
- **"Vozes do Campo"**: um depoimento como citação central em itálico e os demais em 3 colunas.

### Currículo

![Currículo](img/magazine/curriculo.jpg)

- Título "_Curriculum_ Vitæ" e seções numeradas: **§ I Trajetória Profissional**, **§ II Catálogo de Habilidades**, § III Formação, § IV Idiomas, § V Certificações, § VI Voluntariado.
- Experiência em grade `180px 1fr`: período e empresa em itálico à esquerda, cargo e descrição à direita.
- Habilidades em 3 colunas com a **opacidade variando pelo nível**.

### Portfólio

![Portfólio](img/magazine/portfolio.jpg)

- Título "_Obras_ Selecionadas" e uma faixa "Filtrar por tecnologia ↓".
- Projetos como **matérias em zigue-zague**: imagem e texto trocam de lado a cada projeto, com numeral de 64px, rótulo "Edição 0N", título de 44px e descrição em itálico.

### Sobre

![Sobre](img/magazine/sobre.jpg)

- **"↘ Ensaio Pessoal"**: título "Quem faz o _trabalho_, fora do _computador_."
- O dia-a-dia vira um **ensaio em 3 colunas de texto**, abrindo com capitular de 72px na primária.
- FAQ como **"A Entrevista"**: perguntas numeradas "P 01" em 2 colunas, respostas com filete no destaque.

### Blog

![Blog](img/magazine/blog.jpg)

- **"↘ Em Destaque"**: o post em destaque como matéria de capa, título de 96px e subtítulo em itálico.
- **"§ Sumário desta edição"**: os demais posts como um índice de revista (número, título, tags e data).

## Limitações conhecidas

- Só o masthead é responsivo; as páginas usam grades e tamanhos fixos e não se reorganizam no celular.
- O layout ainda não lê imagens: projetos e posts aparecem com blocos de placeholder.
- O filtro do Portfólio é visual, e os itens do sumário do Blog ainda não têm link.
