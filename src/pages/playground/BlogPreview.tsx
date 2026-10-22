import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Link, useLocation } from "wouter";
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

export default function BlogPreview() {
  const [, setLocation] = useLocation();
  const [posts] = usePlaygroundStorage<Post[]>("pg_blog_posts", []);
  const [searchTerm, setSearchTerm] = useState("");

  const publishedPosts = useMemo(() => posts.filter(p => p.status === "published"), [posts]);
  const featuredPosts = useMemo(() => publishedPosts.filter(p => p.featured), [publishedPosts]);

  const filteredPosts = useMemo(() => publishedPosts.filter(p => {
    const q = searchTerm.toLowerCase();
    return p.title.toLowerCase().includes(q) || p.subtitle?.toLowerCase().includes(q) || p.tags.some(t => t.toLowerCase().includes(q));
  }), [publishedPosts, searchTerm]);

  const readTime = (content: string) => Math.max(1, Math.ceil(content.replace(/<[^>]+>/g, "").split(" ").length / 200));

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <>
      <Helmet><title>Blog Preview — Playground</title></Helmet>
      <div className="min-h-screen bg-background text-foreground-strong">
        <div className="bg-yellow-500/10 border-b border-yellow-500/20 text-yellow-400 text-xs text-center py-2 font-medium">
          Modo Demonstração — Preview real do blog com seus posts do playground
        </div>

        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="mb-6">
            <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground" onClick={() => setLocation("/playground/blog")}>
              <ArrowLeft className="w-4 h-4" />
              Voltar ao playground
            </Button>
          </div>

          <motion.div variants={container} initial="hidden" animate="show" className="space-y-12 pb-12">
            <motion.header variants={item} className="space-y-4">
              <h1 className="text-3xl font-bold text-foreground-strong">Blog</h1>
              <p className="text-foreground/65">Artigos sobre desenvolvimento web, React, TypeScript e tecnologia.</p>
            </motion.header>

            {featuredPosts.length > 0 && (
              <motion.section variants={item} className="space-y-6">
                <h2 className="text-xl font-bold text-foreground-strong">Em Destaque</h2>
                <Link href={`/playground/blog/preview/${featuredPosts[0].slug}`}>
                  <div className="relative rounded-2xl overflow-hidden group cursor-pointer border border-foreground/5 shadow-2xl h-[400px] bg-gradient-to-br from-neon-purple/20 to-neon-lime/10">
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-10" />
                    <div className="absolute bottom-0 left-0 right-0 p-8 z-20">
                      <div className="flex flex-wrap gap-2 mb-4">
                        {featuredPosts[0].tags.map(tag => (
                          <Badge key={tag} className="bg-foreground/10 text-foreground-strong border-none backdrop-blur-sm">{tag}</Badge>
                        ))}
                      </div>
                      <h3 className="text-2xl md:text-4xl font-bold text-foreground-strong mb-4 leading-tight max-w-4xl">{featuredPosts[0].title}</h3>
                      {featuredPosts[0].subtitle && (
                        <p className="text-foreground/90 text-lg mb-6 max-w-3xl line-clamp-2">{featuredPosts[0].subtitle}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm text-foreground/65 gap-4">
                          <span>{new Date(featuredPosts[0].createdAt).toLocaleDateString("pt-BR")}</span>
                          <span className="flex items-center gap-1"><Clock className="w-4 h-4" />{readTime(featuredPosts[0].content)} min de leitura</span>
                        </div>
                        <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white">Ler Agora</Button>
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.section>
            )}

            <motion.div variants={item} className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/42" />
                <Input
                  placeholder="Buscar artigos..."
                  className="pl-10 bg-foreground/5 border-foreground/10 text-foreground-strong placeholder:text-foreground/42 focus:border-neon-purple/50"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </motion.div>

            {filteredPosts.length === 0 ? (
              <motion.div variants={item} className="text-center py-16 text-foreground/65">
                {publishedPosts.length === 0
                  ? "Nenhum post publicado no playground ainda. Volte ao playground, crie um post e publique-o."
                  : "Nenhum post encontrado com os filtros aplicados."}
              </motion.div>
            ) : (
              <motion.div variants={container} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredPosts.map(post => (
                  <motion.article key={post.id} variants={item}>
                    <Link href={`/playground/blog/preview/${post.slug}`}>
                      <div className="group bg-foreground/5 rounded-xl border border-foreground/10 overflow-hidden hover:border-neon-purple/30 transition-all duration-300 cursor-pointer h-full">
                        <div className="h-48 bg-gradient-to-br from-neon-purple/10 to-neon-lime/5 flex items-center justify-center">
                          <span className="text-4xl font-bold text-foreground-strong/10">{post.title.slice(0, 2).toUpperCase()}</span>
                        </div>
                        <div className="p-6 space-y-3">
                          <div className="flex items-center gap-2 text-xs text-foreground/42">
                            <span>{new Date(post.createdAt).toLocaleDateString("pt-BR")}</span>
                            <span>·</span>
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{readTime(post.content)} min</span>
                          </div>
                          <h3 className="text-lg font-bold text-foreground-strong group-hover:text-neon-purple transition-colors leading-tight">{post.title}</h3>
                          {post.subtitle && <p className="text-sm text-foreground/65 line-clamp-2">{post.subtitle}</p>}
                          <div className="flex flex-wrap gap-1 pt-1">
                            {post.tags.slice(0, 3).map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs border-foreground/10 text-foreground/65">{tag}</Badge>
                            ))}
                            {post.tags.length > 3 && <Badge variant="outline" className="text-xs border-foreground/10 text-foreground/65">+{post.tags.length - 3}</Badge>}
                          </div>
                          <p className="text-neon-purple text-sm font-medium group-hover:underline">Ler Mais →</p>
                        </div>
                      </div>
                    </Link>
                  </motion.article>
                ))}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
}
