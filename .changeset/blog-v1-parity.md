---
"@rubrica/core": minor
"@rubrica/theme-padrao": minor
"@rubrica/theme-cyberpunk": patch
"create-rubrica": patch
---

Blog como o da v1 (mmlo.com.br). Núcleo: as datas dos posts saem no fuso do site (pelo país do idioma principal: `pt-BR` → Brasília), e não mais em UTC, que jogava o post da noite para o dia seguinte; o tempo de leitura arredonda para cima, como na v1; o bloco `posts-recentes` ganha os campos opcionais `showSearch` (busca por texto, uma ilha que filtra os cartões) e `showFeatured` (destaques no topo, nos temas que os desenham); um tema que desenha o próprio `posts-recentes` só recebe a ilha da busca se declarar o tipo em `islandBlocks` (novo, opcional); o template de post recebe `relatedCase` (o case que divide uma etiqueta com o post); textos de interface `blog.search`, `blog.featured`, `blog.readNow`, `blog.rss`, `blog.back`, `blog.authorLine`, `blog.authorCta`, `blog.relatedCase` e outros. Padrão (e cyberpunk, que herda): carrossel "Em destaque", busca e "Filtrar por tags", cartões com 3 etiquetas + "+N" e "Ler mais", botão RSS no título do blog, e o post com "Voltar para o blog", etiquetas, subtítulo, data e leitura com ícones, coluna centrada, cartão do autor e case relacionado. Migração: o blog convertido liga a busca e os destaques e traz os rótulos "Em Destaque" e "Voltar para o Blog" da v1.
