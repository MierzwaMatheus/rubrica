import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useI18n } from "@/i18n/context/I18nContext";
import {
  PortfolioRepository,
  Project,
} from "@/repositories/interfaces/PortfolioRepository";

export function usePortfolio(repository: PortfolioRepository) {
  const { locale } = useI18n();

  const {
    data: projectsRaw,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["portfolio", "projects"],
    queryFn: () => repository.list(),
    staleTime: Infinity,
  });

  const projects = useMemo(() => {
    if (!projectsRaw) return [];

    return projectsRaw.map(project => applyLocale(project, locale));
  }, [projectsRaw, locale]);

  return {
    projects,
    isLoading,
    error,
  };
}

export function useProjectBySlug(repository: PortfolioRepository, slug: string | undefined) {
  const { locale } = useI18n();

  const {
    data: projectRaw,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["portfolio", "project", slug],
    queryFn: () => (slug ? repository.getBySlug(slug) : Promise.resolve(null)),
    staleTime: Infinity,
    enabled: !!slug,
  });

  const project = useMemo(() => {
    if (!projectRaw) return null;
    return applyLocale(projectRaw, locale);
  }, [projectRaw, locale]);

  return { project, isLoading, error };
}

function applyLocale(project: Project, locale: string): Project {
  const caseStudyT = project.case_study_translations?.[locale]
    ?? project.case_study_translations?.["pt-BR"];

  return {
    ...project,
    title:
      project.title_translations?.[locale] ||
      project.title_translations?.["pt-BR"] ||
      project.title ||
      "",
    description:
      project.description_translations?.[locale] ||
      project.description_translations?.["pt-BR"] ||
      project.description ||
      "",
    long_description:
      project.long_description_translations?.[locale] ||
      project.long_description_translations?.["pt-BR"] ||
      project.long_description ||
      "",
    case_study: project.case_study
      ? {
          ...project.case_study,
          problem: caseStudyT?.problem ?? project.case_study.problem,
          solution: caseStudyT?.solution ?? project.case_study.solution,
          results: caseStudyT?.results ?? project.case_study.results,
          role: caseStudyT?.role || project.case_study.role,
          context: caseStudyT?.context || project.case_study.context,
          decisions: caseStudyT?.decisions || project.case_study.decisions,
          learnings: caseStudyT?.learnings || project.case_study.learnings,
        }
      : undefined,
    category:
      project.category_translations?.[locale] ||
      project.category_translations?.["pt-BR"] ||
      project.category ||
      undefined,
  };
}
