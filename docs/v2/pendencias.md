# Pendências da v2

Lista viva do que falta para a v2 estável, vinda das revisões. Cada item sai daqui quando entra na `v2`.

## Paridade com a v1 (obrigatório antes da v2.0.0; achado no piloto do mmlo)
- **RSS** do blog (`/rss.xml`, por idioma), como a v1 gerava.
- **Analytics (Umami)**: a v1 injetava o script quando configurado; na v2, plugin com o script externo e CSP.
- **Ícones e metadados do `<head>`**: favicon (SVG/ICO), `apple-touch-icon`, `manifest.webmanifest`, `theme-color` a partir das configurações.
- **Capa padrão de post** (quando o post não tem capa): imagem da marca nas configurações.
- **Textos personalizados no código da v1**: o `migrar` deveria usar os arquivos de tradução do projeto v1 como segundo padrão (antes do texto do template).

## Contrato (ajustes aditivos, antes de portar os outros 12 temas)
- **Terminal (ilha)**: o "Press ~" da v1 não existe no núcleo; decidir se vira plugin do tipo pessoal.
- **Menu móvel**: a gaveta por checkbox não fecha ao seguir âncora da mesma página.

- **Fontes em itálico**: a integração pede só `styles: ["normal"]`; `fonts.json` do tema deve poder pedir itálico (o magazine sintetiza hoje).
- **Bateria e transições de cor**: o axe mede cor intermediária quando há `transition` de cor; a bateria deveria desligar transições antes de medir (hoje os temas tiram as transições).

- **Modo de cor padrão no tema**: o tema declara esquema mas não o modo (claro/escuro) recomendado.
- **Utilitários do núcleo exportados**: `formatDays`, `safeId` e o CSS do filtro de etiquetas foram copiados pelos temas; exportar do núcleo.
- **Lista de temas portados no CLI**: `PORTED_THEMES` é fixa; derivar dos pacotes de tema existentes.

## Temas
- Portar os 12 layouts restantes (fase 3), depois do contrato estável no fim da fase 2.

## Resolvido
- Logo no Shell: `SiteSettings.logo` (com `dark`) → `ctx.site.logo` e o componente `Logo` do núcleo.
- Alternância de tema em mais de um lugar: `ColorToggleButton` é estático; o tema pode pôr quantos quiser com `ctx.t("theme.toggle")`.
- Variações dos blocos padrão: `CORE_VARIANTS` lista o que os componentes do núcleo desenham.
- Métrica no card de case: `metric` opcional no projeto, mostrada no bloco `cases` padrão.

## Painel (coleções e negócio)
- **Imagens no corpo dos textos**: o TipTap do painel não tem a extensão de imagem; capa, galeria e imagens das seções do case passam pela biblioteca, mas o corpo de posts e páginas não aceita imagem inline.
- **Prévia ao vivo de posts e cases**: o editor de coleções mostra a prévia do Google, não a página de detalhe renderizada (a prévia do painel só renderiza páginas de blocos).
- **Tradução em lote**: o botão "traduzir" é por campo; traduzir um item inteiro de uma vez (`translation.translateDocument`) ainda não tem tela.
- **Currículos com IA**: a tela lista e gera, mas não abre nem baixa o PDF do currículo gerado.
