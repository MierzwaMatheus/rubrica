# create-rubrica

## 2.0.0

### Major Changes

- cbe27f1: Rubrica 2.0.0: o CLI da v2, com os comandos `create` (`--tipo pessoal|empresa`, `--tema`, idiomas, esquema, modo, plugins), `setup`, `config`, `publicar`, `senha`, `update` (`--dry-run`, migrações de dados, aviso de ejetados), `ejetar`, `verificar`, `testar-tema`, `mcp`, `migrar` (da v1 para a v2, sem gravar no Convex) e `telemetria`. O projeto criado depende de `@rubrica/core` e de um tema, e não traz mais uma cópia do template.

  Quebra em relação à v1: o `update` não mescla arquivos nem gera `.rubrica-new`, e o Node mínimo passa a ser 22.23.
