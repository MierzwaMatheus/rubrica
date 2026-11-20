---
"@rubrica/core": minor
"@rubrica/mcp": minor
"create-rubrica": minor
"@rubrica/theme-bento": minor
"@rubrica/theme-blueprint": minor
"@rubrica/theme-brutalist": minor
"@rubrica/theme-chat": minor
"@rubrica/theme-cyberpunk": minor
"@rubrica/theme-desktop": minor
"@rubrica/theme-garden": minor
"@rubrica/theme-index": minor
"@rubrica/theme-magazine": minor
"@rubrica/theme-monograph": minor
"@rubrica/theme-padrao": minor
"@rubrica/theme-poster": minor
"@rubrica/theme-swiss": minor
"@rubrica/theme-zine": minor
---

O corpo do case passa a ser feito de blocos, e o case pode ter a cara do cliente (contrato de blocos 1.4). Blocos novos de marca e mídia: antes e depois, paleta de cores, tipografia, variações de marca e imagens, mais capítulos no vídeo do YouTube e do Vimeo. O bloco ganha `contexts` (página, case ou os dois) e o campo `color`. O projeto ganha `blocks` e `brand`: cores (claro e escuro) e fonte de título do cliente só dentro do case, com contraste mínimo conferido. O template de case recebe `blocks` e `brand`, e os 14 temas ganham o template e o CSS do case em blocos. No painel, editor de blocos e prévia do case no projeto, e "Cara do cliente". No MCP, as ferramentas `block_*` aceitam `project`, `blocks_catalog` filtra por `context` e a marca é validada. O `create-rubrica` converte os cases da v1 em blocos e o `update` lista a migração `projects-sections-to-blocks` (`rubrica/collections:migrateSectionsToBlocks`; na produção, `npx convex run --prod` depois de publicar o backend). `sections` e `content` ficam obsoletos: temas de terceiros devem ler `blocks` no template de case.
