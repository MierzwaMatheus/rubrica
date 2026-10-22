# Cyberpunk

> _Sidebar lateral com foto de perfil — dev, designer, freelancer._

![Home do Cyberpunk](img/cyberpunk/home.jpg)

<sub>Capturas com a paleta **Midnight Blue**. Veja o layout em todas as paletas em [Esquemas de cores](./cores.md#cyberpunk).</sub>

## Conceito

É o visual original do Rubrica: um portfólio escuro com estética de terminal neon. Uma sidebar fixa à esquerda concentra a identidade (foto, nome, cargo) e a navegação, enquanto o conteúdo rola à direita. A linguagem de código aparece nos detalhes: o cargo entre `<code>…</code>`, prompts como `$ cat role.txt` e títulos de seção no formato `/* Sobre mim */`.

A **primária** marca o que é navegação e estrutura: item ativo com brilho, ícones, títulos de seção, filtros ativos. O **destaque** marca o que é conteúdo: cargo, sublinhado do nome, títulos dos serviços, botão "Baixar CV".

- **Fontes recomendadas:** Chakra Petch (principal) e JetBrains Mono (mono).
- **Arquivos do template:** `Layout.tsx` e `Sidebar.tsx`. Este é o único layout **sem pasta `pages/`**: ele usa as páginas do próprio app (`src/pages/`).

## Estrutura global

A sidebar (`w-72`, fixa) tem, de cima para baixo:

1. Foto de perfil redonda com borda na primária e gradiente primária → destaque (a inicial do nome quando não há foto)
2. Nome e cargo em uma caixa `<code>`
3. Navegação com ícones — Currículo, Portfólio, Sobre e Blog somem quando o plugin correspondente está desligado
4. Contato (e-mail e WhatsApp, cada um só se estiver marcado como visível) e redes sociais com URL preenchida
5. Alternância de idioma PT/EN
6. Botão do assistente de contato (plugin `contact-wizard`) e **"Baixar CV"**, que gera um PDF com currículo e projetos

Abaixo de `lg`, a sidebar vira um cabeçalho fixo com mini-avatar e um menu lateral com o mesmo conteúdo.

## Páginas

### Início

![Início](img/cyberpunk/home.jpg)

- Entrada em cascata: cada bloco aparece com fade e leve subida.
- Hero com selo "disponível para novos projetos" (ponto pulsante), `$ whoami`, a saudação na primária e o **primeiro nome** com sublinhado no destaque.
- `$ cat role.txt` seguido do cargo e da frase de apresentação com borda lateral.
- Chips de tecnologias, editáveis em **Textos** (chaves `home.hero.technologies.N.name`); a cor de cada um vem de `home.hero.technologies.N.color`, uma classe do Tailwind.
- Card "Sobre mim", serviços em grade de 2 colunas com ícones alternados (o último ocupa a linha inteira quando a quantidade é ímpar) e depoimentos com foto.
- Com os plugins de depoimentos ligados: link "Ver todos" e botão "Deixar meu depoimento", que abre o assistente.

### Currículo

![Currículo](img/cyberpunk/curriculo.jpg)

- Grade de 3 colunas: Experiência, Formação, Cursos e Voluntariado na coluna principal (2/3); Habilidades, Soft skills e Idiomas na lateral.
- Habilidades com **barras de progresso animadas** de 0 até o nível.
- Descrições de experiência e formação em HTML (sanitizado).
- Itens entram deslizando, com atraso progressivo; seções sem itens não aparecem.

### Portfólio

![Portfólio](img/cyberpunk/portfolio.jpg)

- **Filtro por tags** funcional ("Todos" + tags em ordem alfabética), com animação de reorganização da grade.
- Cards com zoom na imagem ao passar o mouse, até 3 tags (+N) e atalhos para o estudo de caso e para o assistente de contato sobre aquele projeto.
- Diálogo "Detalhes" com carrossel de imagens, todas as tags, descrição e links de demo/código; imagem ampliada navegável com ← →.

### Sobre

![Sobre](img/cyberpunk/sobre.jpg)

- Texto "Sobre mim" editável no admin em **Textos** (chave `about.aboutMe.text`).
- **"Meu dia-a-dia" em grade bento**: cada foto escolhe seu tamanho (1x1, 1x2, 2x1, 2x2) e mostra a descrição ao passar o mouse; no celular, abre com toque.
- FAQ em acordeão.

### Blog

![Blog](img/cyberpunk/blog.jpg)

- Destaques no topo: um card grande quando há um destaque, **carrossel em loop** quando há vários (tags, data e tempo de leitura).
- **Busca** por título, subtítulo ou tags e **filtro por várias tags** com contador.
- Link para o feed RSS no cabeçalho.

## Extras

- **Terminal**: `` ` `` ou `~` abre um terminal com comandos de navegação (`help`, `projects`, `blog`, `open <slug>`, `whoami`…), histórico e autocompletar. Ele é global, então funciona em qualquer layout, mas a dica "Press ~ for terminal" só aparece na sidebar do Cyberpunk.
- É o layout mais completo em interações (filtros, busca, carrosséis, diálogos) e o único com versão mobile dedicada para todas as páginas.
