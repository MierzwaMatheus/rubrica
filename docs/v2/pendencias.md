# Pendências da v2

Lista viva do que falta para a v2 estável, vinda das revisões. Cada item sai daqui quando entra na `v2`.

## Paridade com a v1 (obrigatório antes da v2.0.0; achado no piloto do mmlo)
- **Analytics de projeto migrado**: o `migrar` não liga o plugin `analytics` nem põe a origem na CSP quando a v1 tinha `VITE_UMAMI_*` na Vercel (o CLI não lê as variáveis da Vercel). O relatório aponta para `config --analytics`.

## Contrato (ajustes aditivos, antes de portar os outros 12 temas)
- **Terminal (ilha)**: o "Press ~" da v1 não existe no núcleo; decidir se vira plugin do tipo pessoal.
- **Menu móvel**: a gaveta por checkbox não fecha ao seguir âncora da mesma página.
- **Lista de temas portados no CLI**: `PORTED_THEMES` é fixa; derivar dos pacotes de tema existentes.
- **Temas usarem os utilitários do núcleo**: `formatDays`, `safeId`, `resolveFreeHref`, `digits`, `shorten` e `tagFilterCss` já saem de `@rubrica/core/components`; os temas portados ainda têm as cópias (trocar quando os ports em paralelo terminarem).

## Temas
- Portar os 12 layouts restantes (fase 3), depois do contrato estável no fim da fase 2.

## Resolvido
- Logo no Shell: `SiteSettings.logo` (com `dark`) → `ctx.site.logo` e o componente `Logo` do núcleo.
- Alternância de tema em mais de um lugar: `ColorToggleButton` é estático; o tema pode pôr quantos quiser com `ctx.t("theme.toggle")`.
- Variações dos blocos padrão: `CORE_VARIANTS` lista o que os componentes do núcleo desenham.
- Métrica no card de case: `metric` opcional no projeto, mostrada no bloco `cases` padrão.
- RSS do blog: `/rss.xml` no idioma principal e `/<prefixo>/rss.xml` nos idiomas com post traduzido (`seo/rss.ts`), com `<link rel="alternate" type="application/rss+xml">` no `<head>`; título e descrição em `SiteSettings.rss`.
- Analytics (Umami): plugin `analytics` (desligado por padrão); script `defer` marcado com `data-rb-analytics` só quando há endereço https e id (`SiteSettings.analytics` ou `PUBLIC_UMAMI_*`); `config --analytics` libera a origem em `script-src` e `connect-src`; a bateria aceita só esse script em página sem ilha.
- Ícones e metadados do `<head>`: `SiteSettings.icons` (SVG, PNG/ICO, apple-touch-icon, 192, 512, maskable), `manifest.webmanifest` gerado e `theme-color` por modo (`SiteSettings.themeColor`, senão o fundo do esquema).
- Capa padrão de post: `SiteSettings.defaultPostCover`; o post sem capa recebe a padrão já resolvida (`post.cover`, com `post.defaultCover: true`), inclusive no `og:image`.
- `migrar` com os arquivos de tradução da v1 (`src/i18n/translations/*.ts`) como segundo padrão dos textos (banco > arquivo > template); a cópia fica em `.rubrica/migracao/textos-v1.json` para o `migrar dados`.
- Fontes em itálico: `fonts.json` aceita `"italic": ["sans", "display"]` (por papel); o magazine e o monograph pedem.
- Bateria e transições de cor: o axe roda com transições e animações desligadas.
- Modo de cor recomendado: `colorMode` opcional no `defineTheme`; o CLI usa no `create` e no `config --tema`. Bento, chat, desktop, index, magazine e monograph declaram `light`.
- Utilitários exportados em `@rubrica/core/components` e os tipos de item de coleção (`PostItem`, `ProjectItem`…) na raiz do `@rubrica/core`.

## Painel (coleções e negócio)
- **Imagens no corpo dos textos**: o TipTap do painel não tem a extensão de imagem; capa, galeria e imagens das seções do case passam pela biblioteca, mas o corpo de posts e páginas não aceita imagem inline.
- **Prévia ao vivo de posts e cases**: o editor de coleções mostra a prévia do Google, não a página de detalhe renderizada (a prévia do painel só renderiza páginas de blocos).
- **Tradução em lote**: o botão "traduzir" é por campo; traduzir um item inteiro de uma vez (`translation.translateDocument`) ainda não tem tela.
- **Currículos com IA**: a tela lista e gera, mas não abre nem baixa o PDF do currículo gerado.
