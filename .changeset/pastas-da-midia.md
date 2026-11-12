---
"@rubrica/core": patch
"create-rubrica": patch
---

Pastas da mídia. As pastas migradas da v1 apareciam na tela de Mídia com a contagem certa, mas abriam vazias ("Nenhuma imagem nesta pasta"): o `migrar` gravava o caminho sem a barra inicial (`portfolio/toca`) e o filtro procura `/portfolio/toca`.

- **Núcleo:** o filtro de pasta (`media.list`) acha também as imagens gravadas sem a barra, e a lista de pastas junta as duas formas. Migração de dados nova, `media-folder-slash` (`rubrica/media:normalizeFolders`), que grava o caminho normalizado; o `update` a roda no Convex de desenvolvimento, e na produção ela sai com `npx convex run --prod rubrica/media:normalizeFolders`. O modal de escolher imagem ganha a navegação por pastas da tela de Mídia (Todas, Sem pasta e cada pasta com a quantidade, criar pasta) e envia a imagem para a pasta aberta. A pasta raiz aparece como "Sem pasta".
- **`migrar`:** grava a pasta de cada imagem já no formato da v2 (`/portfolio/toca`), trocando por "-" o que o nome de pasta não aceita.
