# Bento

> _Grid assimétrico com floating dock — moderno, orientado a produto._

![Início do Bento](img/bento/home.jpg)

<sub>Capturas com a paleta **Editorial Cream**. Veja o layout em todas as paletas em [Esquemas de cores](./cores.md#bento).</sub>

## Conceito

Cada página é um **mosaico de cartões** ("bento box") montado num grid de 12 colunas com 14px de espaço entre eles. Os cartões têm cantos bem arredondados (22px), borda fina e um fundo levemente tingido pela cor do texto — sem sombras, para manter o mosaico limpo. A navegação sai do topo e vira uma **dock flutuante** no rodapé, como em um sistema operacional.

A **primária** vira fundo dos cartões mais importantes (com texto na cor do fundo), o **destaque** marca cartões secundários, e o hero da Home combina as duas num gradiente. Os títulos são grandes e compactos (peso 700, 44–76px) e cada página abre com um rótulo em mono no estilo de comando: `$ whoami`, `$ cat resume.md`, `$ ls -la projects/`, `$ cat about.md`, `$ less blog/`.

- **Fontes recomendadas:** Manrope (principal) e JetBrains Mono (mono).
- **Arquivos do template:** `Layout.tsx`, `FloatingDock.tsx` e as 5 páginas em `pages/`.

## Estrutura global

- **Dock flutuante** fixa no rodapé, centralizada: cápsula translúcida com desfoque de fundo e 5 itens (ícone + rótulo). O item ativo fica num bloco na primária.
- As páginas reservam espaço no rodapé para a dock não cobrir o conteúdo.

## Páginas

### Início

![Início](img/bento/home.jpg)

- **Hero** em 8 colunas × 2 linhas com gradiente primária → destaque: "Oi! Eu sou o **Alex**", com o nome numa pílula invertida, cargo e texto "sobre".
- Cartão de **perfil** com avatar de iniciais e botões de GitHub/LinkedIn.
- Cartões de **contato** (e-mail no destaque, WhatsApp) conforme a visibilidade de cada um.
- Serviços em 2×2 numerados "01 / 04"; depoimentos com o primeiro grande na primária e os seguintes pequenos.
- Rodapé com atalhos em pílula para as outras páginas.

### Currículo

![Currículo](img/bento/curriculo.jpg)

- Linha de cartões-resumo: título "Trajetória", **"3+ experiências"** em número grande na primária, certificações e idiomas no destaque.
- Experiências em 3 colunas com até 3 marcadores cada.
- **"Stack técnico"**: habilidades como chips em 3 colunas, com o nível definindo o peso visual (≥ 85 em bloco na primária).
- Soft skills e idiomas ao lado; formação, cursos e voluntariado na última linha.

### Portfólio

![Portfólio](img/bento/portfolio.jpg)

- **Filtro por tag funcional** em pílulas ("Todos" + até 18 tags); clicar de novo na tag ativa limpa o filtro.
- **Grid hierárquico**: o 1º projeto vira destaque (7 colunas × 2 linhas, imagem grande, selo "★ Destaque"), o 2º e o 3º ficam médios, e os demais viram cartões compactos com a inicial.

### Sobre

![Sobre](img/bento/sobre.jpg)

- Cartão "Sobre Mim" com o texto e, ao lado, **"Interesses"** reaproveitando os serviços da Home.
- **"Meu dia-a-dia" como mosaico** de 6 colunas com tamanhos variados, o primeiro item maior e na primária.
- FAQ em 2×2 numerado, a primeira pergunta na primária.

### Blog

![Blog](img/bento/blog.jpg)

- Cartão de título com a contagem de artigos e selo "RSS".
- **Post em destaque** num cartão largo na primária, com imagem à direita e "Ler agora" (abre o post).
- Os demais posts num mosaico de 6 colunas com tamanhos variados (dois deles maiores).

## Limitações conhecidas

- Os grids são fixos (12, 6, 3 e 2 colunas) sem breakpoints: no celular as colunas encolhem, e o título de 76px pode estourar.
- Só o post em destaque tem link; os cartões de projetos e dos demais posts ainda não são clicáveis.
