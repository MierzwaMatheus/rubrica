/**
 * Textos de interface do tema Jardim Digital (prefixo `garden.`), nos três idiomas de
 * partida. São os rótulos do vocabulário do jardim (estágios, canteiros, livro de visitas)
 * e da casca (mapa, legenda, "ligada a"). Títulos de seção ficam nos campos dos blocos.
 * O site pode trocar qualquer um em "Textos".
 */
type Tr = { pt: string; en: string; es: string };
const tr = (pt: string, en: string, es: string): Tr => ({ pt, en, es });

export const GARDEN_TEXTS: Record<string, Tr> = {
  "garden.garden": tr("jardim", "garden", "jardín"),
  "garden.title": tr("Jardim digital", "Digital garden", "Jardín digital"),
  "garden.of": tr("Jardim de {name}", "{name}'s garden", "Jardín de {name}"),
  "garden.nav": tr("Navegação do jardim", "Garden navigation", "Navegación del jardín"),
  "garden.legend": tr("Legenda dos estágios", "Growth stages", "Leyenda de las etapas"),
  "garden.map": tr("Mapa do jardim", "Garden map", "Mapa del jardín"),
  "garden.mapAria": tr(
    "Mapa do jardim: {pages} páginas ligadas entre si. Você está em {here}.",
    "Garden map: {pages} pages linked together. You are at {here}.",
    "Mapa del jardín: {pages} páginas enlazadas entre sí. Estás en {here}.",
  ),
  "garden.stage.seed": tr("semente", "seed", "semilla"),
  "garden.stage.sprout": tr("broto", "sprout", "brote"),
  "garden.stage.tree": tr("árvore", "tree", "árbol"),
  "garden.page": tr("página", "page", "página"),
  "garden.hello": tr("Oi! Eu sou {name}.", "Hi! I'm {name}.", "¡Hola! Soy {name}."),
  "garden.org.hello": tr("Olá! Aqui é {name}.", "Hi! We're {name}.", "¡Hola! Somos {name}."),
  "garden.linkedTo": tr("Ligada a", "Linked to", "Enlazada con"),
  "garden.readCase": tr("ler case", "read case", "leer caso"),
  "garden.bed": tr("canteiro", "bed", "bancal"),
  "garden.visit": tr("visita", "visit", "visita"),
  "garden.growing": tr("em crescimento", "growing", "en crecimiento"),
  "garden.timeline": tr("Linha do tempo do jardim", "Garden timeline", "Línea de tiempo del jardín"),
  "garden.skillBeds": tr("Canteiros de habilidades", "Skill beds", "Bancales de habilidades"),
  "garden.filterBeds": tr("Filtrar por canteiro", "Filter by bed", "Filtrar por bancal"),
  "garden.all": tr("Todos", "All", "Todos"),
  "garden.stageGroup.tree": tr("Árvores: as notas em destaque", "Trees: featured notes", "Árboles: las notas destacadas"),
  "garden.stageGroup.seed": tr("Sementes: plantadas nos últimos {days} dias", "Seeds: planted in the last {days} days", "Semillas: plantadas en los últimos {days} días"),
  "garden.stageGroup.sprout": tr("Brotos: notas crescendo", "Sprouts: growing notes", "Brotes: notas creciendo"),
};
