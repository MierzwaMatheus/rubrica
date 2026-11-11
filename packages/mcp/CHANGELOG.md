# @rubrica/mcp

## 2.0.2

### Patch Changes

- 6af212b: O pacote volta a sair com o código desta versão: a 2.1.0 do `create-rubrica` e a 2.0.1 do `@rubrica/mcp` foram publicadas com o `dist` da versão anterior, sem as mudanças do conversor (assistente de contato, números do case, mosaico, destaques do blog) e dos campos novos no MCP. Agora os dois compilam antes de publicar (`prepublishOnly`).

## 2.0.1

### Patch Changes

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

## 2.0.0

### Major Changes

- cbe27f1: Rubrica 2.0.0: servidor MCP local (`rubrica mcp`) que substitui o script Python da skill `rubrica`. O agente edita páginas, blocos, coleções, textos, mídia e contatos pelo Convex do projeto, com o login de um usuário do painel (`rubrica mcp login`), respeitando o papel dele, e com prévia antes de gravar (`dryRun` ligado por padrão).
