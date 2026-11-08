# @rubrica/core

## 2.0.0

### Major Changes

- cbe27f1: Rubrica 2.0.0: o núcleo em pacote. Traz o site estático em Astro (integração que injeta as rotas, SEO, sitemap, RSS, `hreflang`, imagens e fontes), o painel em React (editor de páginas com prévia ao vivo, coleções, papéis, LGPD), o backend do Convex reexportado pelo `convex/` do projeto, o catálogo de 17 blocos, os idiomas configuráveis (N idiomas, principal à escolha, conteúdo sem tradução não aparece), os 15 esquemas de cor, as duas linhas de site (pessoal e empresa), os plugins e o contrato de temas (`^1`).

  Segurança, em relação à v1: a proposta com senha não devolve mais o conteúdo sem sessão válida, o limite de tentativas de senha errada passa a bloquear e há um só modelo de contrato padrão.

  Quebra em relação à v1: o projeto deixa de ser uma cópia do template. Use `npx create-rubrica@latest migrar` (veja docs/guia/migrar.md).
