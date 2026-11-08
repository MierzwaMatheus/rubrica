# Pendências da v2

Lista viva do que falta para a v2 estável, vinda das revisões. Cada item sai daqui quando entra na `v2`.

## Contrato (ajustes aditivos, antes de portar os outros 12 temas)
- **Métrica no card de case**: campo opcional `metric` no projeto (`{ value, label }` por idioma), como o "~50 skills em produção" da v1.
- **Terminal (ilha)**: o "Press ~" da v1 não existe no núcleo; decidir se vira plugin do tipo pessoal.
- **Menu móvel**: a gaveta por checkbox não fecha ao seguir âncora da mesma página.

- **Fontes em itálico**: a integração pede só `styles: ["normal"]`; `fonts.json` do tema deve poder pedir itálico (o magazine sintetiza hoje).
- **Bateria e transições de cor**: o axe mede cor intermediária quando há `transition` de cor; a bateria deveria desligar transições antes de medir (hoje os temas tiram as transições).

## Temas
- Portar os 12 layouts restantes (fase 3), depois do contrato estável no fim da fase 2.

## Resolvido
- Logo no Shell: `SiteSettings.logo` (com `dark`) → `ctx.site.logo` e o componente `Logo` do núcleo.
- Alternância de tema em mais de um lugar: `ColorToggleButton` é estático; o tema pode pôr quantos quiser com `ctx.t("theme.toggle")`.
- Variações dos blocos padrão: `CORE_VARIANTS` lista o que os componentes do núcleo desenham.
