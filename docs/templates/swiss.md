# Swiss Grid

> _Grid de 12 colunas, tipografia forte, design suíço rigoroso._

![Início do Swiss Grid](img/swiss/home.jpg)

<sub>Capturas com a paleta **Paper Noir**. Veja o layout em todas as paletas em [Esquemas de cores](./cores.md#swiss-grid).</sub>

## Conceito

Inspirado no Estilo Tipográfico Internacional, o layout trata cada página como uma **folha de cartaz** montada sobre um grid de 12 colunas, que fica visível como linhas verticais pontilhadas nos cabeçalhos. A tipografia é pesada (peso 900, espaçamento negativo, títulos de 88–132px) e os rótulos são pequenos, em caixa alta e espaçados.

A cor entra em **blocos sólidos**: a primária e o destaque viram fundo de cards e palavras-chave (com texto na cor do fundo), e a cor do texto também vira fundo em blocos invertidos. Não há cantos arredondados — a única forma circular é o avatar. A numeração editorial é contínua entre as páginas: `.01` na Home até `.16` no Blog, como capítulos de uma mesma publicação.

- **Fonte recomendada:** Archivo — o layout usa só `--font-sans`, sem fonte mono.
- **Arquivos do template:** `Layout.tsx`, `Sidebar.tsx` (navegação), `SwissShared.tsx` (moldura das páginas) e as 5 páginas em `pages/`.

## Estrutura global

- **Navegação** (`SwissNav`): faixa com um "R" invertido, o nome e "Portfolio · 2026"; abaixo, uma barra de 5 colunas iguais numeradas `.01`–`.05`. O item ativo e o hover ficam invertidos. Itens de plugins desligados somem; no celular, vira um menu lateral.
- **Moldura de página** (`SwissShell`), em todas as páginas:
  - **Cantos**: "Rubrica / sobrenome / ano" à esquerda; "Folha 0X / 05" e o capítulo à direita.
  - **Masthead**: "Index — Portfólio Pessoal" sobre o nome com a inicial invertida (ex.: **A.** Rocha) e o cargo atual à direita.
  - **Rodapé** em 4 colunas com contato.

## Páginas

### Início (Folha 01)

![Início](img/swiss/home.jpg)

- Hero em 8 das 12 colunas: **"Oi! Eu sou o Alex."** em 132px, com o nome sobre um bloco na primária; avatar e texto "sobre" nas outras 4.
- Faixa **"Stack Principal"**: as 4 primeiras habilidades do currículo, uma delas em bloco no destaque.
- Capítulo .02: os 4 primeiros serviços em 4 colunas, o primeiro em bloco na primária.
- Capítulo .03 "Vozes": o primeiro depoimento em destaque invertido, os demais em lista ao lado.

### Currículo (Folha 02)

![Currículo](img/swiss/curriculo.jpg)

- Título **"Curriculum Vitæ."** com "Vitæ." sobre o destaque e uma faixa de 3 números grandes (cargos, habilidades, certificações).
- Experiência em linhas de 3 colunas (número, período, cargo/empresa/descrição).
- Habilidades num grid de 6 colunas, ordenadas por nível: **≥ 90 em bloco na primária**, ≥ 80 em bloco invertido, abaixo disso só contorno — o nível vira hierarquia visual.
- Formação, idiomas e soft skills lado a lado; cursos e voluntariado no fim.

### Portfólio (Folha 03)

![Portfólio](img/swiss/portfolio.jpg)

- Título **"6 obras selecionadas."** com o número em bloco na primária.
- Barra `.filtros` com as tags dos projetos (visual).
- Projetos em grid de 2 colunas com imagem 4:3, número grande, título, descrição e tags; o primeiro projeto em bloco no destaque.

### Sobre (Folha 04)

![Sobre](img/swiss/sobre.jpg)

- Título "Quem faz o trabalho, fora do **computador.**" com a última palavra em bloco na primária.
- **Manifesto pessoal**: o texto "sobre" dividido em até 3 parágrafos, o primeiro com capitular.
- Galeria do dia-a-dia em 6 colunas (fotos 4:5) e FAQ em linhas de 3 colunas, a primeira invertida.

### Blog (Folha 05)

![Blog](img/swiss/blog.jpg)

- Título **"Blog — 6 ensaios."** com o número invertido.
- Destaque dividido em imagem (5/12) e um painel na primária com "★ Destaque", data, título de 56px, tags e "Ler agora →".
- Os demais posts em grid de 3 colunas, numerados, um deles em bloco no destaque.

## Limitações conhecidas

- Só a navegação é responsiva; as páginas usam grids e tamanhos fixos e não se reorganizam no celular.
- Filtros do Portfólio, busca do Blog e "Estudo de caso →" são visuais (sem ação).
- Alguns textos são fixos no código: "Portfolio · 2026", "Grid 12 · Helvetica", "Folha X / 05".
