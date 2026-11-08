# create-rubrica

## 2.0.1

### Patch Changes

- 3e45add: `migrar`: entende períodos do currículo como "Jan-2025 - atual", "2022 - Nov-2024" e "2015-2017"; instala as dependências do zero (o `node_modules` da v1 podia ter pacotes soltos que quebravam o build da v2); aceita `--help`; e as instruções de export passam a incluir `--prod --include-file-storage`, para trazer o conteúdo de verdade e as imagens. Arquivos e pastas que a pessoa criou na raiz (como `PRD.md` ou `.windsurf/`) não são mais apagados; os títulos de SEO da v1 (com " | nome do site" e o da home nos dois idiomas) são mantidos. Imagens com URL do storage da v1 (como a foto de perfil) passam a apontar para o arquivo importado, o menu segue a ordem da sidebar da v1 (sem depoimentos), o selo do hero volta a ser o `home.greeting` ("whoami") e o telefone mostrado na v1 aparece na sidebar.

## 2.0.0

### Major Changes

- cbe27f1: Rubrica 2.0.0: o CLI da v2, com os comandos `create` (`--tipo pessoal|empresa`, `--tema`, idiomas, esquema, modo, plugins), `setup`, `config`, `publicar`, `senha`, `update` (`--dry-run`, migrações de dados, aviso de ejetados), `ejetar`, `verificar`, `testar-tema`, `mcp`, `migrar` (da v1 para a v2, sem gravar no Convex) e `telemetria`. O projeto criado depende de `@rubrica/core` e de um tema, e não traz mais uma cópia do template.

  Quebra em relação à v1: o `update` não mescla arquivos nem gera `.rubrica-new`, e o Node mínimo passa a ser 22.23.
