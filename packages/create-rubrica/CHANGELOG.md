# create-rubrica

## 2.1.2

### Patch Changes

- 5f3bcc0: Pastas da mídia. As pastas migradas da v1 apareciam na tela de Mídia com a contagem certa, mas abriam vazias ("Nenhuma imagem nesta pasta"): o `migrar` gravava o caminho sem a barra inicial (`portfolio/toca`) e o filtro procura `/portfolio/toca`.

  - **Núcleo:** o filtro de pasta (`media.list`) acha também as imagens gravadas sem a barra, e a lista de pastas junta as duas formas. Migração de dados nova, `media-folder-slash` (`rubrica/media:normalizeFolders`), que grava o caminho normalizado; o `update` a roda no Convex de desenvolvimento, e na produção ela sai com `npx convex run --prod rubrica/media:normalizeFolders`. O modal de escolher imagem ganha a navegação por pastas da tela de Mídia (Todas, Sem pasta e cada pasta com a quantidade, criar pasta) e envia a imagem para a pasta aberta. A pasta raiz aparece como "Sem pasta".
  - **`migrar`:** grava a pasta de cada imagem já no formato da v2 (`/portfolio/toca`), trocando por "-" o que o nome de pasta não aceita.

- 06cb78a: O painel não fica mais preso em "Publicando…". O `status` da publicação devolve até quando presumir o build rodando (`publishingUntil`) e o estado depois dele (`settledStatus`), e o painel decide com o próprio relógio, conferido a cada 10 s: antes, a query só rodava de novo quando algum dado mudava, e o painel aberto não via a janela acabar. A janela sem o aviso de fim de build cai de 15 para 5 minutos, e uma falha depois do clique encerra o "publicando". O aviso de fim de build passa a ser automático: no fim do `astro build`, a integração do núcleo chama `/rubrica/publicacao/concluida` quando o build tem o `RUBRICA_DEPLOY_CALLBACK_SECRET` (pula prévias e nunca falha o build), e o `publicar` grava esse segredo, o mesmo do Convex de produção, nas variáveis da Vercel. Sites já publicados: rode `npx create-rubrica publicar` uma vez para levar o segredo à Vercel.

## 2.1.1

### Patch Changes

- 6af212b: O pacote volta a sair com o código desta versão: a 2.1.0 do `create-rubrica` e a 2.0.1 do `@rubrica/mcp` foram publicadas com o `dist` da versão anterior, sem as mudanças do conversor (assistente de contato, números do case, mosaico, destaques do blog) e dos campos novos no MCP. Agora os dois compilam antes de publicar (`prepublishOnly`).
- 8bc1d06: O `update` grava no `rubrica.json` a versão que acabou de instalar. Antes ele lia o caminho do pacote do cache do Node e registrava a versão anterior (e o `verificar` passava a pedir um `update` que já tinha sido feito).

## 2.1.0

### Minor Changes

- 1ba4dce: Contato numa janela e assistente por assuntos. O bloco `contato` ganha três campos opcionais: `presentation` (`dialog`: só na janela de contato do tema, que passa a mostrar o título, o sobretítulo e o formulário do bloco; em tema sem janela, o bloco fica na página), `eyebrow` (sobretítulo) e `flows` (assuntos do assistente, cada um com as próprias etapas: escolha, texto curto, texto longo e dados de contato, com resumo no fim). Sem eles, o bloco continua igual. O tema padrão (e o cyberpunk) desenha o assistente na janela como o da v1, e o `migrar` leva o assistente da v1 com os quatro fluxos e os textos dele ("Passo 1 de 6", "Próximo").
- 5b7c350: Currículo como o da v1 e páginas com cabeçalho.

  - **Núcleo:** dois tipos novos de item de currículo, `soft-skill` (competências comportamentais) e `volunteer` (voluntariado), no painel, no MCP e no PDF. O bloco `curriculo` padrão agrupa as competências pelo campo **Grupo** e mostra as comportamentais e o voluntariado em seções próprias; sem título no bloco, as seções sobem um nível. O PDF passa a ler descrições em texto rico (antes saíam com as tags) e ganha a chave `sidebar.downloadCV`.
  - **Padrão (e cyberpunk):** variação `pagina` do `hero`, um cabeçalho de página com título e apoio. A receita abre as páginas de currículo, portfólio, blog e depoimentos com ele. O currículo segue a v1: resumo com fio lateral, números, botão de PDF e duas colunas (experiência, com as anteriores recolhidas; formação, cursos e voluntariado; competências por grupo, comportamentais e idiomas). Portfólio e blog em duas colunas, ícones do WhatsApp e do Behance na sidebar e o marcador em V nos princípios.
  - **Cyberpunk:** na página de case com seções, o resumo e o texto longo não aparecem, e a categoria não repete como etiqueta.
  - **`migrar`:** monta o currículo da v1 (cabeçalho, resumo com os números em negrito, números e currículo), converte competências comportamentais e voluntariado para os tipos novos, leva o título das páginas de lista para o cabeçalho, destaca os números do "sobre", mantém a ordem das redes e traz os rótulos da v1 que diferem do padrão da v2 ("Habilidades", "Baixar CV (PDF)", "Contact me").

- 1f8bc51: Portfólio e case como na v1 (mmlo.com.br).

  - Núcleo: campo opcional `metrics` nos projetos ("Resultados em números": número, rótulo e ícone do Lucide), editável no painel e no MCP; sem `metric`, o primeiro número vai para o card. `CaseMetrics` e `LucideIcon` em `@rubrica/core/components`; o template de case padrão (e os do blueprint, poster e desktop) mostram os números. A rota do case traz o próximo case (`next`) e o tema pode pedir o carrossel das telas (`caseCarousel`): a ilha `carrossel` (capa e galeria, duas por vez, imagem ampliada) chega ao template em `carousel`. Textos novos: `case.metrics`, `case.details`, `case.next`, `case.ctaTitle`, `case.ctaBody`, `case.ctaButton`, `cases.all`, `cases.filter` e `gallery.*`.
  - Padrão: cartões de case da v1 (número, "$ cat case.md", "ver todos" ao lado do título) e a variação `pagina` do bloco `cases` (a receita a usa em `/portfolio`): filtro por categoria sem JavaScript, até 3 etiquetas e "+N", e o botão "$ cat case.md" ou "$ view --details".
  - Cyberpunk: números com ícone sem cartão em volta, telas no carrossel e, no fim, "$ ./contato.sh --projeto" com "Falar sobre um projeto" e o próximo case.
  - Migração: os números do case da v1 viram `metrics` (com o ícone) em vez de uma seção de texto; os textos personalizados do portfólio e do case vão para as chaves novas.

### Patch Changes

- 1cc4ac6: Blog como o da v1 (mmlo.com.br). Núcleo: as datas dos posts saem no fuso do site (pelo país do idioma principal: `pt-BR` → Brasília), e não mais em UTC, que jogava o post da noite para o dia seguinte; o tempo de leitura arredonda para cima, como na v1; o bloco `posts-recentes` ganha os campos opcionais `showSearch` (busca por texto, uma ilha que filtra os cartões) e `showFeatured` (destaques no topo, nos temas que os desenham); um tema que desenha o próprio `posts-recentes` só recebe a ilha da busca se declarar o tipo em `islandBlocks` (novo, opcional); o template de post recebe `relatedCase` (o case que divide uma etiqueta com o post); textos de interface `blog.search`, `blog.featured`, `blog.readNow`, `blog.rss`, `blog.back`, `blog.authorLine`, `blog.authorCta`, `blog.relatedCase` e outros. Padrão (e cyberpunk, que herda): carrossel "Em destaque", busca e "Filtrar por tags", cartões com 3 etiquetas + "+N" e "Ler mais", botão RSS no título do blog, e o post com "Voltar para o blog", etiquetas, subtítulo, data e leitura com ícones, coluna centrada, cartão do autor e case relacionado. Migração: o blog convertido liga a busca e os destaques e traz os rótulos "Em Destaque" e "Voltar para o Blog" da v1.
- 0e3f58f: `migrar`: entende períodos do currículo como "Jan-2025 - atual", "2022 - Nov-2024" e "2015-2017"; instala as dependências do zero (o `node_modules` da v1 podia ter pacotes soltos que quebravam o build da v2); aceita `--help`; e as instruções de export passam a incluir `--prod --include-file-storage`, para trazer o conteúdo de verdade e as imagens. Arquivos e pastas que a pessoa criou na raiz (como `PRD.md` ou `.windsurf/`) não são mais apagados; os títulos de SEO da v1 (com " | nome do site" e o da home nos dois idiomas) são mantidos. Imagens com URL do storage da v1 (como a foto de perfil) passam a apontar para o arquivo importado, o menu segue a ordem da sidebar da v1 (sem depoimentos), o selo do hero volta a ser o `home.greeting` ("whoami") e o telefone mostrado na v1 aparece na sidebar.
- cee8092: Casca, home, Sobre, depoimentos e 404 do padrão e do cyberpunk como os da v1 (mmlo.com.br).

  - **Núcleo:** campo opcional `span` nos itens do dia a dia (`1x1`, `1x2`, `2x1`, `2x2`: o tamanho no mosaico), no painel, no MCP e na coleção resolvida; as etiquetas do depoimento chegam ao tema (`TestimonialItem.tags`); o bloco `depoimentos` ganha o campo opcional `cta` ("Ver todos os depoimentos"); bloco de receita pode vir escondido (`RecipeBlock.visible: false`). Textos novos: `notFound.label`, `notFound.code`, `testimonials.count` e `testimonials.countOne`.
  - **Padrão (e cyberpunk):** rodapé da sidebar com as medidas da v1 no desktop (o "Fale comigo" e o "Baixar CV" cabem na tela) e um X para fechar a gaveta no celular; depoimentos da home com o balão no título, "Ver todos os depoimentos" e o "Deixar meu depoimento" com estrela; ícones nos botões do fechamento; variação `pessoal` do `texto` ("Fora do trabalho": cartão largo, parágrafos iguais, `</>` decorativo); dia a dia em mosaico (3 colunas, células de 200 px, legenda no hover, foco e toque); FAQ num cartão só, com "?" e seta; variação `categorias` dos depoimentos (contagem e grupos por categoria, em colunas); 404 em tela de terminal. A receita já usa as variações novas.
  - **Cyberpunk:** avatar de 80 px e logo à esquerda, como a sidebar do mmlo.com.br.
  - **`migrar`:** leva o `span_size` da v1, o link "Ver todos os depoimentos", a visibilidade (`visible: false`, quando a receita pede) e as variações da receita do tema, e grava o "Deixar meu depoimento" e o "voltar ao início" da v1 nas chaves que os botões usam.

## 2.0.0

### Major Changes

- cbe27f1: Rubrica 2.0.0: o CLI da v2, com os comandos `create` (`--tipo pessoal|empresa`, `--tema`, idiomas, esquema, modo, plugins), `setup`, `config`, `publicar`, `senha`, `update` (`--dry-run`, migrações de dados, aviso de ejetados), `ejetar`, `verificar`, `testar-tema`, `mcp`, `migrar` (da v1 para a v2, sem gravar no Convex) e `telemetria`. O projeto criado depende de `@rubrica/core` e de um tema, e não traz mais uma cópia do template.

  Quebra em relação à v1: o `update` não mescla arquivos nem gera `.rubrica-new`, e o Node mínimo passa a ser 22.23.
