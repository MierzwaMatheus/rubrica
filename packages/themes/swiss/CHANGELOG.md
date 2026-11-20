# @rubrica/theme-swiss

## 2.1.0

### Minor Changes

- 2ba484f: O corpo do case passa a ser feito de blocos, e o case pode ter a cara do cliente (contrato de blocos 1.4). Blocos novos de marca e mídia: antes e depois, paleta de cores, tipografia, variações de marca e imagens, mais capítulos no vídeo do YouTube e do Vimeo. O bloco ganha `contexts` (página, case ou os dois) e o campo `color`. O projeto ganha `blocks` e `brand`: cores (claro e escuro) e fonte de título do cliente só dentro do case, com contraste mínimo conferido. O template de case recebe `blocks` e `brand`, e os 14 temas ganham o template e o CSS do case em blocos. No painel, editor de blocos e prévia do case no projeto, e "Cara do cliente". No MCP, as ferramentas `block_*` aceitam `project`, `blocks_catalog` filtra por `context` e a marca é validada. O `create-rubrica` converte os cases da v1 em blocos e o `update` lista a migração `projects-sections-to-blocks` (`rubrica/collections:migrateSectionsToBlocks`; na produção, `npx convex run --prod` depois de publicar o backend). `sections` e `content` ficam obsoletos: temas de terceiros devem ler `blocks` no template de case.

## 2.0.1

### Patch Changes

- 7664a0a: Blog: com mais de 10 etiquetas, o filtro fica recolhido em "Filtrar por etiqueta (N)", sem JavaScript, em vez de um paredão de botões acima dos posts. Currículo: a descrição de cada item vira texto rico (HTML sanitizado ao gravar), como na v1; descrições em HTML vindas da v1 aparecem formatadas em todos os temas, não mais com as tags na tela.

## 2.0.0

### Major Changes

- cbe27f1: Rubrica 2.0.0: os 14 temas da v2. O `padrao` e os 13 layouts da v1 (cyberpunk, brutalist, swiss, bento, magazine, desktop, index, monograph, zine, blueprint, garden, chat e poster) agora são pacotes `@rubrica/theme-<nome>` sobre o contrato de blocos `^1`: casca, componentes de bloco, variações, receitas de página e o esquema, o modo e as fontes recomendados. Todos passam na bateria `testar-tema`.

### Patch Changes

- Updated dependencies [cbe27f1]
  - @rubrica/core@2.0.0
