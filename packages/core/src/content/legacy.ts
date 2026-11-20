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

/** Título que cabe no campo do bloco `texto` (até 140 caracteres em todos os idiomas). */
const TITLE_MAX = 140;

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/**
 * Uma seção vira um bloco `texto` (título, corpo, imagem depois do texto). Título longo demais
 * para o campo vai para o começo do corpo, como `<h2>`; idioma sem corpo fica sem o texto.
 */
export function sectionToBlock(section: CaseSection, index: number): BlockInstance {
  const title = section.title ?? {};
  const long = Object.values(title).some((t) => typeof t === "string" && t.length > TITLE_MAX);
  const fields: Record<string, unknown> = {};
  if (long) {
    const body: Localized<string> = {};
    for (const locale of new Set([...Object.keys(title), ...Object.keys(section.body ?? {})])) {
      const t = title[locale as keyof typeof title]?.trim();
      const b = section.body?.[locale as keyof typeof section.body] ?? "";
      body[locale as keyof typeof body] = `${t ? `<h2>${escapeHtml(t)}</h2>` : ""}${b}`;
    }
    fields.body = body;
  } else {
    fields.title = title;
    fields.body = section.body;
  }
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
  // Seção sem corpo em nenhum idioma não aparecia no site: fica de fora (o `texto` exige corpo).
  (project.sections ?? []).forEach((s, i) => {
    if (hasText(s.body)) out.push(sectionToBlock(s, i));
  });
  return out;
}

/** O projeto ainda guarda o corpo no formato antigo (precisa da migração)? */
export function needsSectionsMigration(project: Pick<RawProject, "blocks" | "content" | "sections">): boolean {
  return !project.blocks && ((project.sections?.length ?? 0) > 0 || hasText(project.content));
}
