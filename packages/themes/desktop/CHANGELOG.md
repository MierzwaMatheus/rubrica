# @rubrica/theme-desktop

## 2.0.1

### Patch Changes

- 7664a0a: Blog: com mais de 10 etiquetas, o filtro fica recolhido em "Filtrar por etiqueta (N)", sem JavaScript, em vez de um paredão de botões acima dos posts. Currículo: a descrição de cada item vira texto rico (HTML sanitizado ao gravar), como na v1; descrições em HTML vindas da v1 aparecem formatadas em todos os temas, não mais com as tags na tela.
- 1f8bc51: Portfólio e case como na v1 (mmlo.com.br).

  - Núcleo: campo opcional `metrics` nos projetos ("Resultados em números": número, rótulo e ícone do Lucide), editável no painel e no MCP; sem `metric`, o primeiro número vai para o card. `CaseMetrics` e `LucideIcon` em `@rubrica/core/components`; o template de case padrão (e os do blueprint, poster e desktop) mostram os números. A rota do case traz o próximo case (`next`) e o tema pode pedir o carrossel das telas (`caseCarousel`): a ilha `carrossel` (capa e galeria, duas por vez, imagem ampliada) chega ao template em `carousel`. Textos novos: `case.metrics`, `case.details`, `case.next`, `case.ctaTitle`, `case.ctaBody`, `case.ctaButton`, `cases.all`, `cases.filter` e `gallery.*`.
  - Padrão: cartões de case da v1 (número, "$ cat case.md", "ver todos" ao lado do título) e a variação `pagina` do bloco `cases` (a receita a usa em `/portfolio`): filtro por categoria sem JavaScript, até 3 etiquetas e "+N", e o botão "$ cat case.md" ou "$ view --details".
  - Cyberpunk: números com ícone sem cartão em volta, telas no carrossel e, no fim, "$ ./contato.sh --projeto" com "Falar sobre um projeto" e o próximo case.
  - Migração: os números do case da v1 viram `metrics` (com o ícone) em vez de uma seção de texto; os textos personalizados do portfólio e do case vão para as chaves novas.

## 2.0.0

### Major Changes

- cbe27f1: Rubrica 2.0.0: os 14 temas da v2. O `padrao` e os 13 layouts da v1 (cyberpunk, brutalist, swiss, bento, magazine, desktop, index, monograph, zine, blueprint, garden, chat e poster) agora são pacotes `@rubrica/theme-<nome>` sobre o contrato de blocos `^1`: casca, componentes de bloco, variações, receitas de página e o esquema, o modo e as fontes recomendados. Todos passam na bateria `testar-tema`.

### Patch Changes

- Updated dependencies [cbe27f1]
  - @rubrica/core@2.0.0
