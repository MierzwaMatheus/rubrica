/** Textos de interface do Pôster (prefixo `poster.`), nos três idiomas de partida. O site pode trocar em "Textos". */
type Tr = { pt: string; en: string; es: string };
const tr = (pt: string, en: string, es: string): Tr => ({ pt, en, es });

export const POSTER_TEXTS: Record<string, Tr> = {
  "poster.inNumbers": tr("Em números", "In numbers", "En números"),
  "poster.projects": tr("Projetos", "Projects", "Proyectos"),
  "poster.posts": tr("Textos", "Posts", "Textos"),
  "poster.total": tr("{label}: {n}", "{label}: {n}", "{label}: {n}"),
  "poster.featured": tr("Destaque", "Featured", "Destacado"),
  "poster.latest": tr("Mais recente", "Latest", "Más reciente"),
  "poster.pauseTicker": tr("Pausar a faixa de projetos", "Pause the projects ticker", "Pausar la cinta de proyectos"),
};
