export interface BlogPost {
  id: number;
  title: string;
  subtitle: string;
  content: string;
  image: string;
  featured: boolean;
  status: string;
  created_at: string;
  published_at: string;
  tags: string[];
  slug: string;
  title_translations?: Record<string, string>;
  subtitle_translations?: Record<string, string>;
  content_translations?: Record<string, string>;
  /** SEO (opcionais): vazios, a página usa título, subtítulo e capa. */
  seo_title?: string;
  seo_title_translations?: Record<string, string>;
  seo_description?: string;
  seo_description_translations?: Record<string, string>;
  og_image?: string;
  /** Palavras por idioma, calculadas no build (o índice do blog não leva o texto). */
  word_count?: Record<string, number>;
  /** Minutos de leitura no idioma da página (preenchido pelos hooks do blog). */
  reading_minutes?: number;
}

export interface BlogRepository {
  list(): Promise<BlogPost[]>;
  getBySlug(slug: string): Promise<BlogPost | null>;
}

