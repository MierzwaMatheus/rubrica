/**
 * Corpo do case antes da 2.3.0 (`content` + `sections`) convertido em blocos `texto`.
 * Uma função só para a migração de dados (`projects-sections-to-blocks`) e para o render,
 * que usa a conversão como reserva enquanto o projeto não foi migrado.
 */
import type { BlockInstance, CaseSection, RawProject } from "./types";
import type { Localized } from "../i18n";

/** Id estável e previsível: a mesma entrada gera os mesmos ids (migração idempotente). */
function legacyId(index: number): string {
  return `secao-${index + 1}`;
}

function hasText(v: Localized<string> | undefined): v is Localized<string> {
  return !!v && Object.values(v).some((s) => typeof s === "string" && s.trim().length > 0);
}

/** Uma seção vira um bloco `texto` (título, corpo, imagem depois do texto). */
export function sectionToBlock(section: CaseSection, index: number): BlockInstance {
  const fields: Record<string, unknown> = { title: section.title, body: section.body };
  if (section.image) fields.image = section.image;
  return { id: legacyId(index), type: "texto", visible: true, fields };
}

/**
 * Blocos do corpo do case a partir do formato antigo: `content` (se houver) vira o primeiro
 * `texto`, sem título; cada seção vira um `texto`. Projeto que já tem `blocks` devolve os
 * próprios blocos, sem tocar em nada.
 */
export function sectionsToBlocks(project: Pick<RawProject, "blocks" | "content" | "sections">): BlockInstance[] {
  if (project.blocks) return project.blocks;
  const out: BlockInstance[] = [];
  if (hasText(project.content)) out.push({ id: "conteudo", type: "texto", visible: true, fields: { body: project.content } });
  (project.sections ?? []).forEach((s, i) => out.push(sectionToBlock(s, i)));
  return out;
}

/** O projeto ainda guarda o corpo no formato antigo (precisa da migração)? */
export function needsSectionsMigration(project: Pick<RawProject, "blocks" | "content" | "sections">): boolean {
  return !project.blocks && ((project.sections?.length ?? 0) > 0 || hasText(project.content));
}
