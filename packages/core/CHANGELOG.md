# @rubrica/core

## 2.0.1

### Patch Changes

- d12800a: Cyberpunk mais perto do layout da v1 (mmlo.com.br): página de case com a capa de fundo, etiquetas em chips, links do projeto como botões, "Voltar ao portfólio" e as seções em cartões com ícone e cor pelo assunto; botão "Fale comigo" na barra do celular; seções "Sobre" em duas colunas. Na casca com sidebar (padrão e cyberpunk), o rodapé mostra o WhatsApp das configurações do site quando a pessoa não tem telefone, o seletor de idioma compacto (PT/EN, em forma de chave com dois idiomas) e o "Fale comigo" só com o plugin de contato ligado. Núcleo: textos de interface `case.back`, `case.myRole` e `case.gallery`.

## 2.0.0

### Major Changes

- cbe27f1: Rubrica 2.0.0: o núcleo em pacote. Traz o site estático em Astro (integração que injeta as rotas, SEO, sitemap, RSS, `hreflang`, imagens e fontes), o painel em React (editor de páginas com prévia ao vivo, coleções, papéis, LGPD), o backend do Convex reexportado pelo `convex/` do projeto, o catálogo de 17 blocos, os idiomas configuráveis (N idiomas, principal à escolha, conteúdo sem tradução não aparece), os 15 esquemas de cor, as duas linhas de site (pessoal e empresa), os plugins e o contrato de temas (`^1`).

  Segurança, em relação à v1: a proposta com senha não devolve mais o conteúdo sem sessão válida, o limite de tentativas de senha errada passa a bloquear e há um só modelo de contrato padrão.

  Quebra em relação à v1: o projeto deixa de ser uma cópia do template. Use `npx create-rubrica@latest migrar` (veja docs/guia/migrar.md).
