import DOMPurify from "dompurify";
import { useMemo } from "react";
import { useParams, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Clock, ArrowLeft, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { usePlaygroundStorage } from "@/hooks/usePlaygroundStorage";
import { Helmet } from "react-helmet-async";

interface Post {
  id: string;
  title: string;
  subtitle: string;
  slug: string;
  content: string;
  tags: string[];
  featured: boolean;
  status: "draft" | "published";
  createdAt: number;
}

export default function BlogPostPreview() {
  const { slug } = useParams();
  const [, setLocation] = useLocation();
  const [posts] = usePlaygroundStorage<Post[]>("pg_blog_posts", []);

  const post = useMemo(() => posts.find(p => p.slug === slug) ?? null, [posts, slug]);

  const readTime = (content: string) => Math.max(1, Math.ceil(content.replace(/<[^>]+>/g, "").split(" ").length / 200));

  if (!post) {
    return (
      <div className="min-h-screen bg-background text-foreground-strong flex items-center justify-center flex-col gap-4">
        <AlertTriangle className="w-12 h-12 text-red-500" />
        <p>Post não encontrado no playground.</p>
        <Button variant="outline" onClick={() => setLocation("/playground/blog/preview")}>Voltar ao Blog Preview</Button>
      </div>
    );
  }

  return (
    <>
      <Helmet><title>{post.title} — Blog Preview — Playground</title></Helmet>
      <div className="min-h-screen bg-background text-foreground-strong">
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-400 text-xs text-center py-2 font-medium">
          Modo Demonstração — Preview real do post do blog
        </div>

        <div className="max-w-3xl mx-auto px-6 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground -ml-2" onClick={() => setLocation("/playground/blog/preview")}>
              <ArrowLeft className="w-4 h-4" />
              Voltar ao Blog
            </Button>

            <header className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {post.tags.map(tag => (
                  <Badge key={tag} className="bg-neon-purple/20 text-neon-purple border-neon-purple/30">{tag}</Badge>
                ))}
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground-strong leading-tight">{post.title}</h1>
              {post.subtitle && <p className="text-xl text-foreground/90 italic">{post.subtitle}</p>}
              <div className="flex items-center gap-4 text-sm text-foreground/42">
                <span>{new Date(post.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: "numeric" })}</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {readTime(post.content)} min de leitura
                </span>
              </div>
            </header>

            <div className="border-t border-foreground/10" />

            {post.content ? (
              <div className="blog-content prose prose-invert prose-headings:text-foreground-strong prose-p:text-foreground/90 prose-a:text-neon-purple prose-strong:text-foreground-strong prose-code:text-neon-lime prose-code:bg-foreground/5 prose-code:rounded prose-code:px-1 max-w-none" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }} />
            ) : (
              <p className="text-foreground/65 italic">Este post não tem conteúdo ainda.</p>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
