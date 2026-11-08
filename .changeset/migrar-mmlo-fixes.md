---
"create-rubrica": patch
---

`migrar`: entende períodos do currículo como "Jan-2025 - atual", "2022 - Nov-2024" e "2015-2017"; instala as dependências do zero (o `node_modules` da v1 podia ter pacotes soltos que quebravam o build da v2); aceita `--help`; e as instruções de export passam a incluir `--prod --include-file-storage`, para trazer o conteúdo de verdade e as imagens.
