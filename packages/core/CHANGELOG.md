# @rubrica/core

## 2.1.2

### Patch Changes

- c84b333: Painel: os grupos do menu lateral (Site, Conteúdo, Comercial, Administração) são recolhíveis, como na v1. O Início fica fora dos grupos, sempre à vista; o grupo da tela aberta abre sozinho e o painel lembra no navegador quais grupos ficaram abertos. O cabeçalho de cada grupo é um botão (`aria-expanded`, teclado e foco visível), na barra fixa e na gaveta do celular; grupo sem tela para o papel ou com os plugins desligados continua sumindo.
- 5af5e74: Currículo em abas no painel, como na v1. A tela do currículo separa os itens por tipo (Experiência, Formação, Competências, Comportamentais, Certificações, Idiomas e Voluntariado), com a contagem de cada aba, e lista só o tipo escolhido. A aba fica no endereço (`?aba=`), então recarregar, voltar e sair do editor abrem nela. As setas de ordem mexem só nos itens da aba, sem tirar os outros tipos do lugar; nas competências, a lista se agrupa pelo campo **Grupo**, com um subtítulo por grupo, e a ordem anda dentro do grupo. "Novo item" numa aba já vem com o tipo dela. As listas de coleção ganham a opção interna `tabs` (campo de seleção, abas e agrupamento opcional), que outras coleções podem usar.
- 5f3bcc0: Pastas da mídia. As pastas migradas da v1 apareciam na tela de Mídia com a contagem certa, mas abriam vazias ("Nenhuma imagem nesta pasta"): o `migrar` gravava o caminho sem a barra inicial (`portfolio/toca`) e o filtro procura `/portfolio/toca`.

  - **Núcleo:** o filtro de pasta (`media.list`) acha também as imagens gravadas sem a barra, e a lista de pastas junta as duas formas. Migração de dados nova, `media-folder-slash` (`rubrica/media:normalizeFolders`), que grava o caminho normalizado; o `update` a roda no Convex de desenvolvimento, e na produção ela sai com `npx convex run --prod rubrica/media:normalizeFolders`. O modal de escolher imagem ganha a navegação por pastas da tela de Mídia (Todas, Sem pasta e cada pasta com a quantidade, criar pasta) e envia a imagem para a pasta aberta. A pasta raiz aparece como "Sem pasta".
  - **`migrar`:** grava a pasta de cada imagem já no formato da v2 (`/portfolio/toca`), trocando por "-" o que o nome de pasta não aceita.

- 06cb78a: O painel não fica mais preso em "Publicando…". O `status` da publicação devolve até quando presumir o build rodando (`publishingUntil`) e o estado depois dele (`settledStatus`), e o painel decide com o próprio relógio, conferido a cada 10 s: antes, a query só rodava de novo quando algum dado mudava, e o painel aberto não via a janela acabar. A janela sem o aviso de fim de build cai de 15 para 5 minutos, e uma falha depois do clique encerra o "publicando". O aviso de fim de build passa a ser automático: no fim do `astro build`, a integração do núcleo chama `/rubrica/publicacao/concluida` quando o build tem o `RUBRICA_DEPLOY_CALLBACK_SECRET` (pula prévias e nunca falha o build), e o `publicar` grava esse segredo, o mesmo do Convex de produção, nas variáveis da Vercel. Sites já publicados: rode `npx create-rubrica publicar` uma vez para levar o segredo à Vercel.

## 2.1.1

### Patch Changes

- 052e06f: Astro 7.4.11. Com o núcleo ligado por `link:` (`create --local`), um Astro mais novo no projeto que no núcleo travava o `pnpm check` do projeto (erro interno do TypeScript ao comparar os tipos das duas versões).

## 2.1.0

### Minor Changes

- 1cc4ac6: Blog como o da v1 (mmlo.com.br). Núcleo: as datas dos posts saem no fuso do site (pelo país do idioma principal: `pt-BR` → Brasília), e não mais em UTC, que jogava o post da noite para o dia seguinte; o tempo de leitura arredonda para cima, como na v1; o bloco `posts-recentes` ganha os campos opcionais `showSearch` (busca por texto, uma ilha que filtra os cartões) e `showFeatured` (destaques no topo, nos temas que os desenham); um tema que desenha o próprio `posts-recentes` só recebe a ilha da busca se declarar o tipo em `islandBlocks` (novo, opcional); o template de post recebe `relatedCase` (o case que divide uma etiqueta com o post); textos de interface `blog.search`, `blog.featured`, `blog.readNow`, `blog.rss`, `blog.back`, `blog.authorLine`, `blog.authorCta`, `blog.relatedCase` e outros. Padrão (e cyberpunk, que herda): carrossel "Em destaque", busca e "Filtrar por tags", cartões com 3 etiquetas + "+N" e "Ler mais", botão RSS no título do blog, e o post com "Voltar para o blog", etiquetas, subtítulo, data e leitura com ícones, coluna centrada, cartão do autor e case relacionado. Migração: o blog convertido liga a busca e os destaques e traz os rótulos "Em Destaque" e "Voltar para o Blog" da v1.
- e438d7a: Janela de contato: com `contactDialog: true` no tema, o núcleo põe em toda página uma janela (`popover` do HTML) com o formulário do bloco de contato, e o id chega em `ctx.site.contactDialog` para a casca abrir com um botão, sem JavaScript. O formulário só carrega quando a janela abre. O padrão e o cyberpunk passam a abrir o "Fale comigo" nessa janela, como o assistente da v1. A bateria de temas abre a janela antes de conferir a hidratação e o axe. Links para o contato (`contato:`, `#contato`) nos botões dos blocos abrem a janela (`ResolvedLink.dialog`, que o `LinkButton` já desenha como botão), e a janela existe mesmo sem uma seção de contato, com o assistente padrão. Texto novo: `common.close`.
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

- 7664a0a: Blog: com mais de 10 etiquetas, o filtro fica recolhido em "Filtrar por etiqueta (N)", sem JavaScript, em vez de um paredão de botões acima dos posts. Currículo: a descrição de cada item vira texto rico (HTML sanitizado ao gravar), como na v1; descrições em HTML vindas da v1 aparecem formatadas em todos os temas, não mais com as tags na tela.
- 0e3f58f: Cyberpunk mais perto do layout da v1 (mmlo.com.br): página de case com a capa de fundo, etiquetas em chips, links do projeto como botões, "Voltar ao portfólio" e as seções em cartões com ícone e cor pelo assunto; botão "Fale comigo" na barra do celular; seções "Sobre" em duas colunas. Na casca com sidebar (padrão e cyberpunk), o rodapé mostra o WhatsApp das configurações do site quando a pessoa não tem telefone, o seletor de idioma compacto (PT/EN, em forma de chave com dois idiomas) e o "Fale comigo" só com o plugin de contato ligado. Núcleo: textos de interface `case.back`, `case.myRole` e `case.gallery`.

## 2.0.0

### Major Changes

- cbe27f1: Rubrica 2.0.0: o núcleo em pacote. Traz o site estático em Astro (integração que injeta as rotas, SEO, sitemap, RSS, `hreflang`, imagens e fontes), o painel em React (editor de páginas com prévia ao vivo, coleções, papéis, LGPD), o backend do Convex reexportado pelo `convex/` do projeto, o catálogo de 17 blocos, os idiomas configuráveis (N idiomas, principal à escolha, conteúdo sem tradução não aparece), os 15 esquemas de cor, as duas linhas de site (pessoal e empresa), os plugins e o contrato de temas (`^1`).

  Segurança, em relação à v1: a proposta com senha não devolve mais o conteúdo sem sessão válida, o limite de tentativas de senha errada passa a bloquear e há um só modelo de contrato padrão.

  Quebra em relação à v1: o projeto deixa de ser uma cópia do template. Use `npx create-rubrica@latest migrar` (veja docs/guia/migrar.md).
