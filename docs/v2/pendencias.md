# Pendências da v2

Lista viva do que falta para a v2 estável, vinda das revisões. Cada item sai daqui quando entra na `v2`.

## Contrato (ajustes aditivos, antes de portar os outros 12 temas)
- **Logo no Shell**: `SiteSettings.logo` (imagem, com versão clara/escura) chegando a `ctx.site.logo`; o mmlo usa um lockup SVG no lugar do nome.
- **Alternância de tema em mais de um lugar**: o Shell recebe um único `colorToggle`; permitir renderizar o botão estático onde o tema quiser (já é estático, basta expor `ColorToggleButton` com o rótulo pronto no `ctx`).
- **Variação padrão explícita**: `variants` com a primeira como padrão é frágil quando o CSS do núcleo só conhece outra; o núcleo deve publicar a lista de variações que os blocos padrão entendem.
- **Terminal (ilha)**: o "Press ~" da v1 não existe no núcleo; decidir se vira plugin do tipo pessoal.
- **Menu móvel**: a gaveta por checkbox não fecha ao seguir âncora da mesma página.

## Temas
- Portar os 12 layouts restantes (fase 3), depois do contrato estável no fim da fase 2.

## Painel (coleções e negócio)
- **Imagens no corpo dos textos**: o TipTap do painel não tem a extensão de imagem; capa, galeria e imagens das seções do case passam pela biblioteca, mas o corpo de posts e páginas não aceita imagem inline.
- **Prévia ao vivo de posts e cases**: o editor de coleções mostra a prévia do Google, não a página de detalhe renderizada (a prévia do painel só renderiza páginas de blocos).
- **Tradução em lote**: o botão "traduzir" é por campo; traduzir um item inteiro de uma vez (`translation.translateDocument`) ainda não tem tela.
- **Currículos com IA**: a tela lista e gera, mas não abre nem baixa o PDF do currículo gerado.
