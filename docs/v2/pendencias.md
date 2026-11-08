# Pendências da v2

Lista viva do que falta para a v2 estável, vinda das revisões. Cada item sai daqui quando entra na `v2`.

## Paridade com a v1 (obrigatório antes da v2.0.0; achado no piloto do mmlo)
- **Analytics de projeto migrado**: o `migrar` não liga o plugin `analytics` nem põe a origem na CSP quando a v1 tinha `VITE_UMAMI_*` na Vercel (o CLI não lê as variáveis da Vercel). O relatório aponta para `config --analytics`.

## Contrato (ajustes aditivos)
- **Terminal (ilha)**: o "Press ~" da v1 não existe no núcleo; decidir se vira plugin do tipo pessoal.
- **Menu móvel**: a gaveta por checkbox não fecha ao seguir âncora da mesma página.
- **Lista de temas portados no CLI**: `PORTED_THEMES` é fixa; derivar dos pacotes de tema existentes.
- **Textura no CLI**: o tema declara a textura padrão e o painel troca, mas o `create` e o `config` não têm `--textura` (a v1 tinha). O padrão do tema já vale sem o CLI gravar nada.

## Temas (campos novos do contrato ainda sem uso)
- **Jardim**: o mapa do jardim continua só com as páginas do menu; `ShellProps.collections` já traz os projetos e posts para ele.
- **Grupo do currículo** (`ResumeItem.group`) e **post em destaque** (`PostItem.featured`): nenhum tema agrupa as competências nem destaca post ainda.
- **Categoria nos outros temas**: index, bento, monograph, poster e blueprint mostram; os demais seguem só com as etiquetas.

## Bateria
- **Vitrine só no idioma principal**: as páginas `/vitrine` não existem nos outros idiomas (o seletor de idioma e as traduções dos blocos ficam com as páginas da demo).
- **Lighthouse com textura**: a camada de textura (SVG com `feTurbulence`, fixa) foi medida no poster (grão) e no blueprint (papel), site pessoal, com performance 97 a 100; falta a rodada completa nos sete temas que a usam.

## Resolvido
- Vitrine na bateria (decisão 31): `withShowcase` (`@rubrica/core/data/showcase`) acrescenta às fixtures, sem mudar os arquivos, uma página por bloco (`/vitrine/<tipo>`) com cada variação declarada pelo tema em instâncias cheia, curta, por opção de seleção e vazia (blocos com coleção), e as páginas da receita do tema (`/vitrine/receita/...`). A bateria liga com `RUBRICA_SHOWCASE=1` (`--sem-vitrine` desliga); as páginas passam por todas as checagens, menos o Lighthouse.
- Contrato aditivo da v2.0: `ProjectItem.category` (por idioma, no backend, no painel, no MCP e no `migrar`, que mantém a categoria também nas etiquetas), `PostItem.featured`, `ResumeItem.group` (o `group` das skills da v1), `BlockProps.total`, `ctx.feeds.rss`, `ctx.site.availability` (hero da home com "Mostrar disponibilidade"), `ShellProps.collections` (projetos e posts resumidos), `LocaleLinks` com `compact` (código à vista, nome completo no nome acessível) e textura (`ThemeDefinition.texture`, `appearance.texture`: grão, papel, scanlines, como na v1; o `migrar` leva a da v1).
- Rolagem horizontal na bateria: só o documento conta; o que está dentro de contêiner com `overflow-x` `auto|scroll|hidden|clip` sai da lista de culpados, e texto que estoura a própria caixa aponta para o elemento.
- Fontes de reserva: a Fonts API do Astro já gerava reservas com métricas ajustadas (`optimizedFallbacks` é o padrão); a genérica final agora segue o desenho da família (monoespaçada ou serifada), não o papel.
- Temas usam os utilitários do núcleo (`formatDays`, `safeId`, `resolveFreeHref`, `digits`, `shorten`, `tagFilterCss`), com o mesmo HTML público (comparado o `dist` dos dois sites em 11 temas).
- Os 14 layouts da v1 portados como temas.
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
