/**
 * Projetos no build: um índice enxuto (portfolio.json), que vai no HTML das páginas que listam
 * projetos, e um arquivo completo por projeto (projects/<_id>.json), lido pela página do case
 * e pelo modal do portfólio.
 *
 * Fora da página do case, as listas só usam as métricas do case e se ele existe, e a descrição
 * longa só aparece no modal (o tamanho dela ainda numera as páginas no layout monograph).
 */

type Raw = Record<string, unknown>;
type Translations = Record<string, unknown> | undefined;

/** Imagens só com a URL: o resto do registro da biblioteca (autor, pasta, tags...) não é usado. */
export function compactImages(images: unknown): string[] | unknown {
  if (!Array.isArray(images)) return images;
  return images
    .map((img) => (typeof img === "string" ? img : (img as { url?: unknown } | null)?.url))
    .filter((url): url is string => typeof url === "string" && url.length > 0);
}

/** Projeto completo, como vai para projects/<_id>.json. */
export function compactProject(project: Raw): Raw {
  return { ...project, images: compactImages(project.images) };
}

const textLength = (value: unknown) => (typeof value === "string" ? value.length : 0);

/** Entrada do índice: case só com as métricas e sem a descrição longa (fica o tamanho dela). */
export function projectIndexEntry(project: Raw): Raw {
  const {
    longDescription,
    longDescriptionTranslations,
    caseStudy,
    caseStudyTranslations,
    imageIds: _imageIds,
    ...rest
  } = compactProject(project);

  const longTr = longDescriptionTranslations as Translations;
  const entry: Raw = {
    ...rest,
    longDescriptionChars: {
      ptBR: textLength(longTr?.ptBR ?? longDescription),
      enUS: textLength(longTr?.enUS ?? longTr?.ptBR ?? longDescription),
    },
  };

  if (caseStudy && typeof caseStudy === "object") {
    entry.caseStudy = { metrics: (caseStudy as { metrics?: unknown }).metrics ?? [] };
  }
  if (caseStudyTranslations && typeof caseStudyTranslations === "object") {
    entry.caseStudyTranslations = Object.fromEntries(
      Object.entries(caseStudyTranslations as Record<string, unknown>).map(([locale, text]) => {
        const metrics = (text as { metrics?: unknown } | null)?.metrics;
        return [locale, metrics === undefined ? {} : { metrics }];
      }),
    );
  }
  return entry;
}
