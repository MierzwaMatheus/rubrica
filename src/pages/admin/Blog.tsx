import { useState } from "react";
import { DeleteConfirmDialog } from "@/components/admin/DeleteConfirmDialog";
import { AdminLayout } from "./Dashboard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Search, Filter, Eye, EyeOff, Star, RotateCcw, ShieldAlert } from "lucide-react";
import { ImagePicker } from "@/components/admin/ImagePicker";
import { RichTextEditor } from "@/components/admin/RichTextEditor";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { toast } from "sonner";
import { useTranslateContent } from "@/i18n/hooks/useTranslateContent";
import { getChangedTranslatableFields } from "@/i18n/utils/hasTranslatableChanges";
import { useIsRoot } from "@/hooks/useIsRoot";

type Post = {
  _id: Id<"posts">;
  title: string;
  titleTranslations?: { ptBR: string; enUS?: string };
  subtitle?: string;
  subtitleTranslations?: { ptBR: string; enUS?: string };
  slug: string;
  content?: string;
  contentTranslations?: { ptBR: string; enUS?: string };
  image?: { url: string | null } | null;
  imageId?: Id<"imageMetadata">;
  imageUrl?: string;
  tags: string[];
  featured: boolean;
  status: "draft" | "published";
  readTime?: string;
  publishedAt?: number;
  createdAt: number;
};

export default function AdminBlog() {
  const isRoot = useIsRoot();
  const [includeDeleted, setIncludeDeleted] = useState(false);
  const postsData = useQuery(api.posts.listAdmin, { limit: 100, includeDeleted: isRoot && includeDeleted }) as Post[] | undefined;
  const createPost = useMutation(api.posts.create);
  const updatePost = useMutation(api.posts.update);
  const publishPost = useMutation(api.posts.publish);
  const unpublishPost = useMutation(api.posts.unpublish);
  const removePost = useMutation(api.posts.remove);
  const permanentDeletePost = useMutation(api.posts.permanentDelete);
  const restorePost = useMutation(api.posts.restore);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ id: Id<"posts">; name: string } | null>(null);
  const [content, setContent] = useState("");
  const [previewImage, setPreviewImage] = useState<string>("");
  const [previewImageId, setPreviewImageId] = useState<Id<"imageMetadata"> | undefined>(undefined);
  const [isPublished, setIsPublished] = useState(false);
  const [isFeatured, setIsFeatured] = useState(false);

  const pickedImageQuery = useQuery(api.images.getById, previewImageId ? { id: previewImageId } : "skip");
  const coverImageUrl = pickedImageQuery?.url ?? previewImage ?? null;

  const { translateFields, isTranslating } = useTranslateContent();
  const posts = postsData ?? [];
  const isLoading = postsData === undefined;

  const handleOpenDialog = (post: Post | null = null) => {
    setEditingPost(post);
    if (post) {
      setPreviewImage(post.image?.url || post.imageUrl || "");
      setPreviewImageId(post.imageId);
      const contentPT = post.contentTranslations?.ptBR || post.content || "";
      setContent(contentPT);
      setIsPublished(post.status === "published");
      setIsFeatured(post.featured);
    } else {
      setPreviewImage("");
      setPreviewImageId(undefined);
      setContent("");
      setIsPublished(false);
      setIsFeatured(false);
    }
    setIsDialogOpen(true);
  };

  const getPostField = (post: Post, field: "title" | "subtitle"): string => {
    const t = (post as any)[`${field}Translations`];
    if (t?.ptBR) return t.ptBR;
    return ((post as any)[field] as string) || '';
  };

  const slugify = (text: string) => {
    return text
      .toString()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleImagePicked = (id: string | string[]) => {
    const picked = Array.isArray(id) ? id[0] : id;
    setPreviewImageId(picked as Id<"imageMetadata">);
    setPreviewImage("");
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);

    const titlePT = formData.get("title") as string;
    const subtitlePT = (formData.get("subtitle") as string) || '';
    const tagsStr = (formData.get("tags") as string) || '';
    const status = isPublished ? "published" : "draft";
    const contentPT = content || '';

    const tags = tagsStr.split(",").map(t => t.trim()).filter(t => t);
    const slug = slugify(titlePT);

    try {
      const allBlogFields: Record<string, string> = { title: titlePT };
      if (subtitlePT) allBlogFields.subtitle = subtitlePT;
      if (contentPT) allBlogFields.content = contentPT;

      const changedBlog = editingPost
        ? getChangedTranslatableFields(allBlogFields, {
            title: editingPost.titleTranslations,
            subtitle: editingPost.subtitleTranslations,
            content: editingPost.contentTranslations,
          })
        : allBlogFields;

      let partialBlog: Record<string, string> = {};
      if (Object.keys(changedBlog).length > 0) {
        const toastId = toast.loading('Traduzindo conteúdo...');
        partialBlog = await translateFields(changedBlog);
        toast.dismiss(toastId);
      }

      const translated = {
        title: partialBlog.title ?? editingPost?.titleTranslations?.enUS ?? titlePT,
        subtitle: partialBlog.subtitle ?? editingPost?.subtitleTranslations?.enUS ?? subtitlePT,
        content: partialBlog.content ?? editingPost?.contentTranslations?.enUS ?? contentPT,
      };

      const baseData = {
        title: titlePT,
        titleTranslations: { ptBR: titlePT, enUS: translated.title },
        subtitle: subtitlePT || undefined,
        subtitleTranslations: subtitlePT ? { ptBR: subtitlePT, enUS: translated.subtitle ?? subtitlePT } : undefined,
        slug,
        content: contentPT,
        contentTranslations: contentPT ? { ptBR: contentPT, enUS: translated.content ?? contentPT } : undefined,
        imageId: previewImageId,
        imageUrl: !previewImageId && previewImage ? previewImage : undefined,
        tags,
        featured: isFeatured,
        readTime: undefined as string | undefined,
      };

      if (editingPost) {
        await updatePost({
          id: editingPost._id,
          ...baseData,
        });
        // Sync publish state if it changed
        if (status === "published" && editingPost.status !== "published") {
          await publishPost({ id: editingPost._id });
        } else if (status === "draft" && editingPost.status === "published") {
          await unpublishPost({ id: editingPost._id });
        }
        toast.success("Post atualizado com sucesso!");
      } else {
        await createPost({
          ...baseData,
          status,
        });
        toast.success("Post criado com sucesso!");
      }

      setIsDialogOpen(false);
      setEditingPost(null);
      setContent("");
      setPreviewImage("");
      setPreviewImageId(undefined);
      setIsPublished(false);
      setIsFeatured(false);
    } catch (error: any) {
      console.error('Error saving post:', error);
      toast.error(error?.message || "Erro ao salvar post");
    }
  };

  const handleDelete = (id: Id<"posts">, name: string) => {
    setDeleteTarget({ id, name });
  };

  const handleRestore = async (id: Id<"posts">) => {
    try {
      await restorePost({ id });
      toast.success('Post restaurado com sucesso');
    } catch (error) {
      toast.error('Erro ao restaurar post');
    }
  };

  const toggleStatus = async (post: Post) => {
    try {
      if (post.status === "published") {
        await unpublishPost({ id: post._id });
        toast.success("Post despublicado");
      } else {
        await publishPost({ id: post._id });
        toast.success("Post publicado");
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error("Erro ao atualizar status");
    }
  };

  const toggleFeatured = async (post: Post) => {
    try {
      await updatePost({
        id: post._id,
        title: post.title,
        titleTranslations: post.titleTranslations ?? { ptBR: post.title, enUS: post.title },
        subtitle: post.subtitle,
        subtitleTranslations: post.subtitleTranslations,
        slug: post.slug,
        content: post.content,
        contentTranslations: post.contentTranslations,
        imageId: post.imageId,
        imageUrl: post.imageUrl,
        tags: post.tags,
        featured: !post.featured,
        readTime: post.readTime,
      });
      toast.success(`Destaque ${!post.featured ? 'adicionado' : 'removido'}`);
    } catch (error) {
      console.error('Error updating featured:', error);
      toast.error("Erro ao atualizar destaque");
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground-strong">Blog</h1>
            <p className="text-foreground/65">Gerencie seus artigos e publicações</p>
          </div>
          <div className="flex gap-2 items-center">
            {isRoot && (
              <button
                onClick={() => setIncludeDeleted(!includeDeleted)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                  includeDeleted
                    ? 'border-red-500/50 bg-red-500/10 text-red-400'
                    : 'border-foreground/10 bg-foreground/5 text-foreground/65 hover:text-foreground-strong'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {includeDeleted ? 'Ocultar deletados' : 'Ver deletados'}
              </button>
            )}
            <Button className="bg-neon-purple hover:bg-neon-purple/90 text-white" onClick={() => handleOpenDialog()}>
              <Plus className="w-4 h-4 mr-2" />
              Novo Artigo
            </Button>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="bg-background border-foreground/10 max-w-4xl max-h-[90vh] flex flex-col overflow-hidden p-0">
            <DialogHeader className="px-6 pt-6 pb-4 shrink-0">
              <DialogTitle className="text-foreground-strong">
                {editingPost ? "Editar Artigo" : "Novo Artigo"}
              </DialogTitle>
              <VisuallyHidden>
                <h2>Formulário de artigo</h2>
              </VisuallyHidden>
            </DialogHeader>
            <form onSubmit={handleSave} className="flex flex-col flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-4">
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="title" className="text-foreground-strong">Título</Label>
                        <Input name="title" id="title" defaultValue={editingPost ? getPostField(editingPost, 'title') : ''} className="bg-foreground/5 border-foreground/10 text-foreground-strong" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }} required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="subtitle" className="text-foreground-strong">Subtítulo</Label>
                        <Input name="subtitle" id="subtitle" defaultValue={editingPost ? getPostField(editingPost, 'subtitle') : ''} className="bg-foreground/5 border-foreground/10 text-foreground-strong" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }} />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="tags" className="text-foreground-strong">Tags (separadas por vírgula)</Label>
                        <Input name="tags" id="tags" defaultValue={editingPost?.tags?.join(", ")} className="bg-foreground/5 border-foreground/10 text-foreground-strong" style={{ wordBreak: 'break-all', overflowWrap: 'break-word' }} />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-foreground-strong">Imagem de Destaque</Label>
                        <div className="border border-foreground/10 rounded-lg p-4 bg-foreground/5 flex flex-col items-center justify-center min-h-[200px] relative overflow-hidden">
                          {coverImageUrl ? (
                            <>
                              <img src={coverImageUrl} alt="Preview" className="max-h-[180px] rounded object-cover w-full" />
                              <div className="absolute bottom-2 right-2">
                                <ImagePicker onSelect={handleImagePicked} />
                              </div>
                            </>
                          ) : (
                            <div className="text-center">
                              <ImagePicker onSelect={handleImagePicked} />
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-6 pt-4">
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="featured"
                            checked={isFeatured}
                            onCheckedChange={setIsFeatured}
                          />
                          <Label htmlFor="featured" className="text-foreground-strong">Destacar Post</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Switch
                            id="status"
                            checked={isPublished}
                            onCheckedChange={setIsPublished}
                          />
                          <Label htmlFor="status" className="text-foreground-strong">Publicado</Label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-foreground-strong">Conteúdo</Label>
                    <RichTextEditor content={content} onChange={setContent} />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 pb-6 px-6 border-t border-foreground/10 shrink-0 mt-auto">
                <Button type="button" variant="ghost" onClick={() => setIsDialogOpen(false)} className="text-foreground/65">Cancelar</Button>
                <Button type="submit" disabled={isTranslating} className="bg-neon-purple hover:bg-neon-purple/90 text-white">{isTranslating ? 'Traduzindo...' : 'Salvar Artigo'}</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        <div className="flex gap-4 items-center bg-card border border-foreground/10 p-4 rounded-lg">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground/42" />
            <Input placeholder="Buscar artigos..." className="pl-10 bg-foreground/5 border-foreground/10 text-foreground-strong" />
          </div>
          <Button variant="outline" className="border-foreground/10 text-foreground/90">
            <Filter className="w-4 h-4 mr-2" />
            Filtros
          </Button>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            <div className="text-center text-foreground/65 py-10">Carregando posts...</div>
          ) : posts.length === 0 ? (
            <div className="text-center text-foreground/65 py-10">Nenhum post encontrado.</div>
          ) : (
            posts.map((post) => {
              const imageSrc = post.image?.url || post.imageUrl || "https://via.placeholder.com/300x200";
              const publishedDate = post.publishedAt
                ? new Date(post.publishedAt).toISOString().slice(0, 10)
                : '';
              const isDeleted = !!(post as any).deletedAt;
              return (
                <Card key={post._id} className={`bg-card hover:border-neon-purple/30 transition-colors ${isDeleted ? 'opacity-60 border-red-500/30' : 'border-foreground/10'}`}>
                  <div className="flex flex-col md:flex-row gap-4 p-4">
                    <img src={imageSrc} alt={post.title} className="w-full md:w-48 h-32 object-cover rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="text-xl font-bold text-foreground-strong flex items-center gap-2">
                            {post.title}
                            {post.featured && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
                          </h3>
                          <p className="text-foreground/65 text-sm">{post.subtitle}</p>
                          {isDeleted && (
                            <div className="flex items-center gap-1.5 text-xs text-red-400 bg-red-500/10 border border-red-500/20 rounded px-2 py-0.5 w-fit mt-1">
                              <ShieldAlert className="w-3 h-3" />
                              Deletado
                            </div>
                          )}
                        </div>
                        <div className="flex gap-2">
                          {!isDeleted && (
                            <>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => toggleFeatured(post)}
                                      className={post.featured ? "text-yellow-400" : "text-foreground/42"}
                                    >
                                      <Star className={`w-4 h-4 ${post.featured ? "fill-yellow-400" : ""}`} />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{post.featured ? "Remover destaque" : "Destacar post"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="ghost"
                                      onClick={() => toggleStatus(post)}
                                      className={post.status === "published" ? "text-green-400" : "text-foreground/42"}
                                    >
                                      {post.status === "published" ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <p>{post.status === "published" ? "Despublicar" : "Publicar"}</p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>

                              <Button size="icon" variant="ghost" onClick={() => handleOpenDialog(post)}>
                                <Pencil className="w-4 h-4 text-blue-400" />
                              </Button>
                            </>
                          )}
                          {isDeleted ? (
                            <button
                              onClick={() => handleRestore(post._id)}
                              className="p-1.5 text-green-400 hover:bg-green-400/10 rounded transition-colors"
                              title="Restaurar"
                            >
                              <RotateCcw className="w-4 h-4" />
                            </button>
                          ) : (
                            <Button size="icon" variant="ghost" onClick={() => handleDelete(post._id, post.title)}>
                              <Trash2 className="w-4 h-4 text-red-400" />
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-2">
                        {post.tags?.map((tag: string) => (
                          <Badge key={tag} variant="secondary" className="bg-foreground/5 text-foreground/90 border-foreground/10">{tag}</Badge>
                        ))}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-foreground/42 mt-auto pt-2">
                        <span>{publishedDate}</span>
                        <span className={`flex items-center gap-1 ${post.status === "published" ? "text-green-400" : "text-foreground/42"}`}>
                          {post.status === "published" ? "Publicado" : "Rascunho"}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
      <DeleteConfirmDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        itemName={deleteTarget?.name}
        onConfirm={async () => {
          await removePost({ id: deleteTarget!.id });
          toast.success('Post excluído');
        }}
        onPermanentDelete={isRoot ? async () => {
          await permanentDeletePost({ id: deleteTarget!.id });
          toast.success('Post excluído permanentemente');
        } : undefined}
      />
    </AdminLayout>
  );
}
