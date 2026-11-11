---
"@rubrica/core": minor
"@rubrica/mcp": patch
"@rubrica/theme-padrao": minor
"@rubrica/theme-cyberpunk": patch
"create-rubrica": patch
---

Casca, home, Sobre, depoimentos e 404 do padrão e do cyberpunk como os da v1 (mmlo.com.br).

- **Núcleo:** campo opcional `span` nos itens do dia a dia (`1x1`, `1x2`, `2x1`, `2x2`: o tamanho no mosaico), no painel, no MCP e na coleção resolvida; as etiquetas do depoimento chegam ao tema (`TestimonialItem.tags`); o bloco `depoimentos` ganha o campo opcional `cta` ("Ver todos os depoimentos"); bloco de receita pode vir escondido (`RecipeBlock.visible: false`). Textos novos: `notFound.label`, `notFound.code`, `testimonials.count` e `testimonials.countOne`.
- **Padrão (e cyberpunk):** rodapé da sidebar com as medidas da v1 no desktop (o "Fale comigo" e o "Baixar CV" cabem na tela) e um X para fechar a gaveta no celular; depoimentos da home com o balão no título, "Ver todos os depoimentos" e o "Deixar meu depoimento" com estrela; ícones nos botões do fechamento; variação `pessoal` do `texto` ("Fora do trabalho": cartão largo, parágrafos iguais, `</>` decorativo); dia a dia em mosaico (3 colunas, células de 200 px, legenda no hover, foco e toque); FAQ num cartão só, com "?" e seta; variação `categorias` dos depoimentos (contagem e grupos por categoria, em colunas); 404 em tela de terminal. A receita já usa as variações novas.
- **Cyberpunk:** avatar de 80 px e logo à esquerda, como a sidebar do mmlo.com.br.
- **`migrar`:** leva o `span_size` da v1, o link "Ver todos os depoimentos", a visibilidade (`visible: false`, quando a receita pede) e as variações da receita do tema, e grava o "Deixar meu depoimento" e o "voltar ao início" da v1 nas chaves que os botões usam.
