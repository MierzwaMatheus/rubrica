import DOMPurify from "dompurify";
import { PageSkeleton } from "@/components/PageSkeleton";
import { useRoute } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useI18n } from "@/i18n/context/I18nContext";
import { useTranslation } from "@/i18n/hooks/useTranslation";
import { useBlogPost } from "@/hooks/useBlog";
import { blogRepository } from "@/repositories/instances";

export default function BlogPost() {
    const { t } = useTranslation();
    const { isLoading: i18nLoading } = useI18n();
    const [match, params] = useRoute("/blog/:slug");
    const { post, isLoading } = useBlogPost(blogRepository, params?.slug || '');

    if (isLoading || i18nLoading) {
        return <PageSkeleton />;
    }

    if (!post) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                    <h1 className="text-3xl font-bold text-foreground-strong">{t('blog.postNotFound')}</h1>
                    <p className="text-foreground/65">{t('blog.postNotFoundDescription')}</p>
                    <Link href="/blog">
                        <Button variant="outline" className="mt-4">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t('blog.backToBlog')}
                        </Button>
                    </Link>
            </div>
        );
    }

    return (
            <motion.article
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="max-w-4xl mx-auto space-y-8 pb-12"
            >
                <Link href="/blog">
                    <Button variant="ghost" className="text-foreground/65 hover:text-foreground-strong -ml-4">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {t('blog.backToBlog')}
                    </Button>
                </Link>

                <header className="space-y-6">
                    <div className="flex flex-wrap gap-2">
                        {post.tags?.map((tag: string) => (
                            <Badge key={tag} className="bg-neon-purple/10 text-neon-purple hover:bg-neon-purple/20 border-neon-purple/20">
                                {tag}
                            </Badge>
                        ))}
                    </div>

                    <h1 className="text-4xl md:text-5xl font-bold text-foreground-strong leading-tight">
                        {post.title}
                    </h1>

                    {post.subtitle && (
                        <p className="text-xl text-foreground/90 leading-relaxed">
                            {post.subtitle}
                        </p>
                    )}

                    <div className="flex items-center gap-6 text-foreground/65 text-sm border-b border-foreground/10 pb-8">
                        <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4" />
                            <span>{new Date(post.published_at).toLocaleDateString('pt-BR', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric'
                            })}</span>
                        </div>
                        {/* Read time could be calculated based on word count */}
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            <span>{Math.ceil(post.content.split(' ').length / 200)} {t('blog.readTime')}</span>
                        </div>
                    </div>
                </header>

                {post.image && (
                    <div className="relative aspect-video rounded-xl overflow-hidden border border-foreground/10">
                        <img
                            src={post.image}
                            alt={post.title}
                            className="w-full h-full object-cover"
                        />
                    </div>
                )}

                <div
                    className="blog-content"
                    dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(post.content) }}
                />
            </motion.article>
    );
}
