# @rubrica/theme-garden

## 2.0.1

### Patch Changes

- 7664a0a: Blog: com mais de 10 etiquetas, o filtro fica recolhido em "Filtrar por etiqueta (N)", sem JavaScript, em vez de um paredão de botões acima dos posts. Currículo: a descrição de cada item vira texto rico (HTML sanitizado ao gravar), como na v1; descrições em HTML vindas da v1 aparecem formatadas em todos os temas, não mais com as tags na tela.

## 2.0.0

### Major Changes

- cbe27f1: Rubrica 2.0.0: os 14 temas da v2. O `padrao` e os 13 layouts da v1 (cyberpunk, brutalist, swiss, bento, magazine, desktop, index, monograph, zine, blueprint, garden, chat e poster) agora são pacotes `@rubrica/theme-<nome>` sobre o contrato de blocos `^1`: casca, componentes de bloco, variações, receitas de página e o esquema, o modo e as fontes recomendados. Todos passam na bateria `testar-tema`.

### Patch Changes

- Updated dependencies [cbe27f1]
  - @rubrica/core@2.0.0
