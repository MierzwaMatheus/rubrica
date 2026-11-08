---
"create-rubrica": patch
---

`migrar`: entende períodos do currículo como "Jan-2025 - atual", "2022 - Nov-2024" e "2015-2017"; instala as dependências do zero (o `node_modules` da v1 podia ter pacotes soltos que quebravam o build da v2); aceita `--help`; e as instruções de export passam a incluir `--prod --include-file-storage`, para trazer o conteúdo de verdade e as imagens. Arquivos e pastas que a pessoa criou na raiz (como `PRD.md` ou `.windsurf/`) não são mais apagados; os títulos de SEO da v1 (com " | nome do site" e o da home nos dois idiomas) são mantidos. Imagens com URL do storage da v1 (como a foto de perfil) passam a apontar para o arquivo importado, o menu segue a ordem da sidebar da v1 (sem depoimentos), o selo do hero volta a ser o `home.greeting` ("whoami") e o telefone mostrado na v1 aparece na sidebar.
