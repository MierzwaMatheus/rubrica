---
"create-rubrica": patch
"@rubrica/mcp": patch
---

O pacote volta a sair com o código desta versão: a 2.1.0 do `create-rubrica` e a 2.0.1 do `@rubrica/mcp` foram publicadas com o `dist` da versão anterior, sem as mudanças do conversor (assistente de contato, números do case, mosaico, destaques do blog) e dos campos novos no MCP. Agora os dois compilam antes de publicar (`prepublishOnly`).
