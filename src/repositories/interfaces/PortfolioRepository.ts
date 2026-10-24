export interface CaseStudyMetric {
  label: string;
  value: string;
  icon?: string;
}

export interface CaseStudyTestimonial {
  text: string;
  author: string;
  role?: string;
}

export interface CaseStudyText {
  problem?: string;
  solution?: string;
  results?: string;
  role?: string;
  context?: string;
  decisions?: string;
  learnings?: string;
}

export interface CaseStudy {
  problem: string;
  solution: string;
  results: string;
  /** Meu papel: cargo, time, escopo. */
  role?: string;
  /** Antes: o estado inicial, medido. */
  context?: string;
  /** Decisões, trade-offs e caminhos descartados. */
  decisions?: string;
  learnings?: string;
  metrics: CaseStudyMetric[];
  testimonial?: CaseStudyTestimonial;
}

export interface Project {
  id: number;
  title: string;
  description: string;
  long_description: string;
  tags: string[];
  images: string[];
  demo_link: string;
  github_link: string;
  slug?: string;
  case_study?: CaseStudy;
  case_study_translations?: Record<string, CaseStudyText>;
  /** Categoria livre usada nos filtros do portfólio. */
  category?: string;
  category_translations?: Record<string, string>;
  title_translations?: Record<string, string>;
  description_translations?: Record<string, string>;
  long_description_translations?: Record<string, string>;
  order_index?: number;
}

export interface PortfolioRepository {
  list(): Promise<Project[]>;
  getBySlug(slug: string): Promise<Project | null>;
}
