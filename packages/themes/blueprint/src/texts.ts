/**
 * Textos de interface do tema Blueprint (prefixo `blueprint.`), nos três idiomas de
 * partida: os rótulos das folhas, as cotas ("3 pranchas"), o carimbo e os cabeçalhos das
 * tabelas. Plural: a chave termina em `.one` (n = 1) ou `.other`. O site pode trocar
 * qualquer um em "Textos".
 */
type Tr = { pt: string; en: string; es: string };
const tr = (pt: string, en: string, es: string): Tr => ({ pt, en, es });

export const BLUEPRINT_TEXTS: Record<string, Tr> = {
  "blueprint.nav": tr("Navegação principal", "Main navigation", "Navegación principal"),
  "blueprint.sheet": tr("Folha", "Sheet", "Hoja"),
  "blueprint.end": tr("Fim do conjunto", "End of set", "Fin del conjunto"),
  "blueprint.madeWith": tr("Desenhado com o Rubrica", "Drawn with Rubrica", "Dibujado con Rubrica"),

  // Etiqueta da folha, por tipo de bloco.
  "blueprint.sheet.hero": tr("Apresentação", "Presentation", "Presentación"),
  "blueprint.sheet.page": tr("Ficha técnica", "Technical sheet", "Ficha técnica"),
  "blueprint.sheet.texto": tr("Memorial descritivo", "Descriptive memorial", "Memoria descriptiva"),
  "blueprint.sheet.numeros": tr("Especificações", "Specifications", "Especificaciones"),
  "blueprint.sheet.lista-itens": tr("Normas", "Standards", "Normas"),
  "blueprint.sheet.cases": tr("Pranchas", "Plates", "Láminas"),
  "blueprint.sheet.servicos": tr("Detalhes", "Details", "Detalles"),
  "blueprint.sheet.depoimentos": tr("Pareceres", "Reviews", "Dictámenes"),
  "blueprint.sheet.faq": tr("Notas gerais", "General notes", "Notas generales"),
  "blueprint.sheet.posts-recentes": tr("Registro de revisões", "Revision log", "Registro de revisiones"),
  "blueprint.sheet.cta": tr("Ordem de serviço", "Work order", "Orden de servicio"),
  "blueprint.sheet.contato": tr("Canais de contato", "Contact channels", "Canales de contacto"),
  "blueprint.sheet.galeria": tr("Cronograma", "Schedule", "Cronograma"),
  "blueprint.sheet.curriculo": tr("Ficha técnica", "Technical sheet", "Ficha técnica"),
  "blueprint.sheet.precos": tr("Tabela de preços", "Price schedule", "Tabla de precios"),
  "blueprint.sheet.equipe": tr("Equipe técnica", "Technical team", "Equipo técnico"),
  "blueprint.sheet.localizacao": tr("Implantação", "Site plan", "Implantación"),
  "blueprint.sheet.logos-clientes": tr("Referências", "References", "Referencias"),
  "blueprint.sheet.generic": tr("Anexo", "Appendix", "Anexo"),

  // Cotas (medidas reais da folha).
  "blueprint.characters.one": tr("{n} caractere", "{n} character", "{n} carácter"),
  "blueprint.characters.other": tr("{n} caracteres", "{n} characters", "{n} caracteres"),
  "blueprint.plates.one": tr("{n} prancha", "{n} plate", "{n} lámina"),
  "blueprint.plates.other": tr("{n} pranchas", "{n} plates", "{n} láminas"),
  "blueprint.paragraphs.one": tr("{n} parágrafo · {w} palavras", "{n} paragraph · {w} words", "{n} párrafo · {w} palabras"),
  "blueprint.paragraphs.other": tr("{n} parágrafos · {w} palavras", "{n} paragraphs · {w} words", "{n} párrafos · {w} palabras"),
  "blueprint.details.one": tr("{n} detalhe", "{n} detail", "{n} detalle"),
  "blueprint.details.other": tr("{n} detalhes", "{n} details", "{n} detalles"),
  "blueprint.opinions.one": tr("{n} parecer", "{n} review", "{n} dictamen"),
  "blueprint.opinions.other": tr("{n} pareceres", "{n} reviews", "{n} dictámenes"),
  "blueprint.standards.one": tr("{n} norma", "{n} standard", "{n} norma"),
  "blueprint.standards.other": tr("{n} normas", "{n} standards", "{n} normas"),
  "blueprint.notes.one": tr("{n} nota", "{n} note", "{n} nota"),
  "blueprint.notes.other": tr("{n} notas", "{n} notes", "{n} notas"),
  "blueprint.revisions.one": tr("{n} revisão", "{n} revision", "{n} revisión"),
  "blueprint.revisions.other": tr("{n} revisões", "{n} revisions", "{n} revisiones"),
  "blueprint.steps.one": tr("{n} etapa", "{n} step", "{n} etapa"),
  "blueprint.steps.other": tr("{n} etapas", "{n} steps", "{n} etapas"),
  "blueprint.positions.one": tr("{n} experiência", "{n} position", "{n} experiencia"),
  "blueprint.positions.other": tr("{n} experiências", "{n} positions", "{n} experiencias"),
  "blueprint.years.one": tr("{n} ano", "{n} year", "{n} año"),
  "blueprint.years.other": tr("{n} anos", "{n} years", "{n} años"),

  // Apresentação e pranchas.
  "blueprint.hello": tr("Oi! Eu sou", "Hi! I am", "¡Hola! Soy"),
  "blueprint.plate": tr("Prancha", "Plate", "Lámina"),
  "blueprint.viewPlate": tr("Ver prancha", "View plate", "Ver lámina"),
  "blueprint.rev": tr("Rev.", "Rev.", "Rev."),

  // Carimbo.
  "blueprint.stampLabel": tr("Carimbo da folha", "Title block", "Cajetín de la hoja"),
  "blueprint.project": tr("Projeto", "Project", "Proyecto"),
  "blueprint.client": tr("Cliente", "Client", "Cliente"),
  "blueprint.toBeDefined": tr("a definir", "to be defined", "por definir"),
  "blueprint.scale": tr("Escala", "Scale", "Escala"),
  "blueprint.date": tr("Data", "Date", "Fecha"),
  "blueprint.drawn": tr("Desenho", "Drawn by", "Dibujo"),
  "blueprint.year": tr("Ano", "Year", "Año"),
  "blueprint.role": tr("Papel", "Role", "Rol"),

  // Tabelas (blog e currículo).
  "blueprint.revCol": tr("Rev.", "Rev.", "Rev."),
  "blueprint.titleCol": tr("Título", "Title", "Título"),
  "blueprint.readingCol": tr("Leitura", "Reading", "Lectura"),
  "blueprint.featured": tr("Destaque", "Featured", "Destacado"),
  "blueprint.course": tr("Curso", "Course", "Curso"),
  "blueprint.institution": tr("Instituição", "Institution", "Institución"),
  "blueprint.language": tr("Idioma", "Language", "Idioma"),
  "blueprint.level": tr("Nível", "Level", "Nivel"),
  "blueprint.timeline": tr("Linha do tempo", "Timeline", "Línea de tiempo"),

  // Páginas de leitura (post, case e 404).
  "blueprint.post": tr("Memorial", "Memorial", "Memoria"),
  "blueprint.notFound": tr("Folha não localizada", "Sheet not found", "Hoja no localizada"),
};
