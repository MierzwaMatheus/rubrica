---
"@rubrica/core": minor
---

Orientação de uso nos blocos (`guidance` opcional no `defineBlock`: quando usar, quando não usar e com quais blocos combina), preenchida nos 21 blocos do núcleo; contrato de blocos 1.2.0. `serializeBlock` e a query `rubrica/pages:blockCatalog` entregam o catálogo efetivo (núcleo e blocos do projeto) só com dados, para o MCP. Projetos precisam da reexportação nova em `convex/rubrica/pages.ts` (o `update` do CLI regenera).
