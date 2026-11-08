# Pendências da v2

Lista viva do que falta para a v2 estável, vinda das revisões. Cada item sai daqui quando entra na `v2`.

## Contrato (ajustes aditivos, antes de portar os outros 12 temas)
- **Logo no Shell**: `SiteSettings.logo` (imagem, com versão clara/escura) chegando a `ctx.site.logo`; o mmlo usa um lockup SVG no lugar do nome.
- **Métrica no card de case**: campo opcional `metric` no projeto (`{ value, label }` por idioma), como o "~50 skills em produção" da v1.
- **Alternância de tema em mais de um lugar**: o Shell recebe um único `colorToggle`; permitir renderizar o botão estático onde o tema quiser (já é estático, basta expor `ColorToggleButton` com o rótulo pronto no `ctx`).
- **Variação padrão explícita**: `variants` com a primeira como padrão é frágil quando o CSS do núcleo só conhece outra; o núcleo deve publicar a lista de variações que os blocos padrão entendem.
- **Terminal (ilha)**: o "Press ~" da v1 não existe no núcleo; decidir se vira plugin do tipo pessoal.
- **Menu móvel**: a gaveta por checkbox não fecha ao seguir âncora da mesma página.

## Temas
- Portar os 12 layouts restantes (fase 3), depois do contrato estável no fim da fase 2.
