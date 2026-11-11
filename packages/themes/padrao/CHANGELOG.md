# @rubrica/theme-padrao

## 2.1.0

### Minor Changes

- 1cc4ac6: Blog como o da v1 (mmlo.com.br). Núcleo: as datas dos posts saem no fuso do site (pelo país do idioma principal: `pt-BR` → Brasília), e não mais em UTC, que jogava o post da noite para o dia seguinte; o tempo de leitura arredonda para cima, como na v1; o bloco `posts-recentes` ganha os campos opcionais `showSearch` (busca por texto, uma ilha que filtra os cartões) e `showFeatured` (destaques no topo, nos temas que os desenham); um tema que desenha o próprio `posts-recentes` só recebe a ilha da busca se declarar o tipo em `islandBlocks` (novo, opcional); o template de post recebe `relatedCase` (o case que divide uma etiqueta com o post); textos de interface `blog.search`, `blog.featured`, `blog.readNow`, `blog.rss`, `blog.back`, `blog.authorLine`, `blog.authorCta`, `blog.relatedCase` e outros. Padrão (e cyberpunk, que herda): carrossel "Em destaque", busca e "Filtrar por tags", cartões com 3 etiquetas + "+N" e "Ler mais", botão RSS no título do blog, e o post com "Voltar para o blog", etiquetas, subtítulo, data e leitura com ícones, coluna centrada, cartão do autor e case relacionado. Migração: o blog convertido liga a busca e os destaques e traz os rótulos "Em Destaque" e "Voltar para o Blog" da v1.
- 1ba4dce: Contato numa janela e assistente por assuntos. O bloco `contato` ganha três campos opcionais: `presentation` (`dialog`: só na janela de contato do tema, que passa a mostrar o título, o sobretítulo e o formulário do bloco; em tema sem janela, o bloco fica na página), `eyebrow` (sobretítulo) e `flows` (assuntos do assistente, cada um com as próprias etapas: escolha, texto curto, texto longo e dados de contato, com resumo no fim). Sem eles, o bloco continua igual. O tema padrão (e o cyberpunk) desenha o assistente na janela como o da v1, e o `migrar` leva o assistente da v1 com os quatro fluxos e os textos dele ("Passo 1 de 6", "Próximo").
- 5b7c350: Currículo como o da v1 e páginas com cabeçalho.

  - **Núcleo:** dois tipos novos de item de currículo, `soft-skill` (competências comportamentais) e `volunteer` (voluntariado), no painel, no MCP e no PDF. O bloco `curriculo` padrão agrupa as competências pelo campo **Grupo** e mostra as comportamentais e o voluntariado em seções próprias; sem título no bloco, as seções sobem um nível. O PDF passa a ler descrições em texto rico (antes saíam com as tags) e ganha a chave `sidebar.downloadCV`.
  - **Padrão (e cyberpunk):** variação `pagina` do `hero`, um cabeçalho de página com título e apoio. A receita abre as páginas de currículo, portfólio, blog e depoimentos com ele. O currículo segue a v1: resumo com fio lateral, números, botão de PDF e duas colunas (experiência, com as anteriores recolhidas; formação, cursos e voluntariado; competências por grupo, comportamentais e idiomas). Portfólio e blog em duas colunas, ícones do WhatsApp e do Behance na sidebar e o marcador em V nos princípios.
  - **Cyberpunk:** na página de case com seções, o resumo e o texto longo não aparecem, e a categoria não repete como etiqueta.
  - **`migrar`:** monta o currículo da v1 (cabeçalho, resumo com os números em negrito, números e currículo), converte competências comportamentais e voluntariado para os tipos novos, leva o título das páginas de lista para o cabeçalho, destaca os números do "sobre", mantém a ordem das redes e traz os rótulos da v1 que diferem do padrão da v2 ("Habilidades", "Baixar CV (PDF)", "Contact me").

- cee8092: Casca, home, Sobre, depoimentos e 404 do padrão e do cyberpunk como os da v1 (mmlo.com.br).

  - **Núcleo:** campo opcional `span` nos itens do dia a dia (`1x1`, `1x2`, `2x1`, `2x2`: o tamanho no mosaico), no painel, no MCP e na coleção resolvida; as etiquetas do depoimento chegam ao tema (`TestimonialItem.tags`); o bloco `depoimentos` ganha o campo opcional `cta` ("Ver todos os depoimentos"); bloco de receita pode vir escondido (`RecipeBlock.visible: false`). Textos novos: `notFound.label`, `notFound.code`, `testimonials.count` e `testimonials.countOne`.
  - **Padrão (e cyberpunk):** rodapé da sidebar com as medidas da v1 no desktop (o "Fale comigo" e o "Baixar CV" cabem na tela) e um X para fechar a gaveta no celular; depoimentos da home com o balão no título, "Ver todos os depoimentos" e o "Deixar meu depoimento" com estrela; ícones nos botões do fechamento; variação `pessoal` do `texto` ("Fora do trabalho": cartão largo, parágrafos iguais, `</>` decorativo); dia a dia em mosaico (3 colunas, células de 200 px, legenda no hover, foco e toque); FAQ num cartão só, com "?" e seta; variação `categorias` dos depoimentos (contagem e grupos por categoria, em colunas); 404 em tela de terminal. A receita já usa as variações novas.
  - **Cyberpunk:** avatar de 80 px e logo à esquerda, como a sidebar do mmlo.com.br.
  - **`migrar`:** leva o `span_size` da v1, o link "Ver todos os depoimentos", a visibilidade (`visible: false`, quando a receita pede) e as variações da receita do tema, e grava o "Deixar meu depoimento" e o "voltar ao início" da v1 nas chaves que os botões usam.

- 1f8bc51: Portfólio e case como na v1 (mmlo.com.br).

  - Núcleo: campo opcional `metrics` nos projetos ("Resultados em números": número, rótulo e ícone do Lucide), editável no painel e no MCP; sem `metric`, o primeiro número vai para o card. `CaseMetrics` e `LucideIcon` em `@rubrica/core/components`; o template de case padrão (e os do blueprint, poster e desktop) mostram os números. A rota do case traz o próximo case (`next`) e o tema pode pedir o carrossel das telas (`caseCarousel`): a ilha `carrossel` (capa e galeria, duas por vez, imagem ampliada) chega ao template em `carousel`. Textos novos: `case.metrics`, `case.details`, `case.next`, `case.ctaTitle`, `case.ctaBody`, `case.ctaButton`, `cases.all`, `cases.filter` e `gallery.*`.
  - Padrão: cartões de case da v1 (número, "$ cat case.md", "ver todos" ao lado do título) e a variação `pagina` do bloco `cases` (a receita a usa em `/portfolio`): filtro por categoria sem JavaScript, até 3 etiquetas e "+N", e o botão "$ cat case.md" ou "$ view --details".
  - Cyberpunk: números com ícone sem cartão em volta, telas no carrossel e, no fim, "$ ./contato.sh --projeto" com "Falar sobre um projeto" e o próximo case.
  - Migração: os números do case da v1 viram `metrics` (com o ícone) em vez de uma seção de texto; os textos personalizados do portfólio e do case vão para as chaves novas.

### Patch Changes

- e438d7a: Janela de contato: com `contactDialog: true` no tema, o núcleo põe em toda página uma janela (`popover` do HTML) com o formulário do bloco de contato, e o id chega em `ctx.site.contactDialog` para a casca abrir com um botão, sem JavaScript. O formulário só carrega quando a janela abre. O padrão e o cyberpunk passam a abrir o "Fale comigo" nessa janela, como o assistente da v1. A bateria de temas abre a janela antes de conferir a hidratação e o axe. Links para o contato (`contato:`, `#contato`) nos botões dos blocos abrem a janela (`ResolvedLink.dialog`, que o `LinkButton` já desenha como botão), e a janela existe mesmo sem uma seção de contato, com o assistente padrão. Texto novo: `common.close`.
- 0e3f58f: Cyberpunk mais perto do layout da v1 (mmlo.com.br): página de case com a capa de fundo, etiquetas em chips, links do projeto como botões, "Voltar ao portfólio" e as seções em cartões com ícone e cor pelo assunto; botão "Fale comigo" na barra do celular; seções "Sobre" em duas colunas. Na casca com sidebar (padrão e cyberpunk), o rodapé mostra o WhatsApp das configurações do site quando a pessoa não tem telefone, o seletor de idioma compacto (PT/EN, em forma de chave com dois idiomas) e o "Fale comigo" só com o plugin de contato ligado. Núcleo: textos de interface `case.back`, `case.myRole` e `case.gallery`.
- f4e6676: Sidebar: a chave de idioma (PT/EN) agora troca o idioma ao ser clicada, sem JavaScript; antes só os códigos eram clicáveis.

## 2.0.0

### Major Changes

- cbe27f1: Rubrica 2.0.0: os 14 temas da v2. O `padrao` e os 13 layouts da v1 (cyberpunk, brutalist, swiss, bento, magazine, desktop, index, monograph, zine, blueprint, garden, chat e poster) agora são pacotes `@rubrica/theme-<nome>` sobre o contrato de blocos `^1`: casca, componentes de bloco, variações, receitas de página e o esquema, o modo e as fontes recomendados. Todos passam na bateria `testar-tema`.

### Patch Changes

- Updated dependencies [cbe27f1]
  - @rubrica/core@2.0.0
