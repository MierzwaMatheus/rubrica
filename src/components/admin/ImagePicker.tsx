import { useState, useEffect, useRef, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Image as ImageIcon,
  Upload,
  Check,
  Trash2,
  Loader2,
  Search,
  FolderPlus,
  Folder,
  Edit2,
  X,
  ChevronRight,
  Home,
  Move,
  Maximize2,
  Info
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { toast } from "sonner";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";

interface ImagePickerProps {
  onSelect: (url: string | string[]) => void;
  trigger?: React.ReactNode;
  multiple?: boolean;
}

interface ImageFolder {
  _id: Id<"imageFolders">;
  name: string;
  parentId?: Id<"imageFolders"> | null;
  createdAt: number;
  path?: string;
}

interface ImageMetadata {
  _id: Id<"imageMetadata">;
  _creationTime: number;
  storageId: string;
  displayName: string;
  description?: string;
  altText?: string;
  width?: number;
  height?: number;
  fileSize: number;
  mimeType: string;
  folderId?: Id<"imageFolders"> | null;
  tags?: string[];
  url: string;
}

export function ImagePicker({ onSelect, trigger, multiple: initialMultiple = false }: ImagePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [multipleMode, setMultipleMode] = useState(initialMultiple);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [currentFolderId, setCurrentFolderId] = useState<Id<"imageFolders"> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [editingImage, setEditingImage] = useState<ImageMetadata | null>(null);
  const [viewingImage, setViewingImage] = useState<ImageMetadata | null>(null);
  const [movingImage, setMovingImage] = useState<ImageMetadata | null>(null);
  const [movingImages, setMovingImages] = useState<ImageMetadata[]>([]);
  const [isMoving, setIsMoving] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convex mutations (defined once)
  const generateUploadUrl = useMutation(api.images.generateUploadUrl);
  const createImage = useMutation(api.images.create);
  const updateImage = useMutation(api.images.update);
  const removeImage = useMutation(api.images.remove);
  const createFolder = useMutation(api.imageFolders.create);
  const removeFolder = useMutation(api.imageFolders.remove);

  // Convex queries
  // For search, we fetch the unfiltered list (folderId: undefined) and filter client-side.
  const isSearching = !!searchQuery.trim();
  const imagesQueryArgs = isSearching
    ? {}
    : { folderId: currentFolderId ?? undefined };
  const imagesData = useQuery(api.images.list, imagesQueryArgs as any) as ImageMetadata[] | undefined;
  const allFoldersData = useQuery(api.imageFolders.tree, {}) as ImageFolder[] | undefined;

  const isLoading = imagesData === undefined || allFoldersData === undefined;

  const allFolders: ImageFolder[] = allFoldersData ?? [];

  // Build folder path map (for breadcrumbs and move dialog)
  const folderById = useMemo(() => {
    const map = new Map<string, ImageFolder>();
    for (const f of allFolders) map.set(f._id as string, f);
    return map;
  }, [allFolders]);

  const folderPath = useMemo(() => {
    const cache = new Map<string, string>();
    const compute = (id: string): string => {
      if (cache.has(id)) return cache.get(id)!;
      const f = folderById.get(id);
      if (!f) return "";
      const parent = f.parentId ? compute(f.parentId as string) : "";
      const p = parent ? `${parent}/${f.name}` : f.name;
      cache.set(id, p);
      return p;
    };
    const result = new Map<string, string>();
    for (const f of allFolders) result.set(f._id as string, compute(f._id as string));
    return result;
  }, [allFolders, folderById]);

  // Folders shown in current view (children of currentFolderId)
  const visibleFolders = useMemo(() => {
    if (isSearching) return [];
    return allFolders
      .filter((f) => (f.parentId ?? null) === (currentFolderId ?? null))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [allFolders, currentFolderId, isSearching]);

  // Current folder
  const currentFolder: ImageFolder | null = currentFolderId
    ? folderById.get(currentFolderId as string) ?? null
    : null;

  // Breadcrumbs
  const breadcrumbs: ImageFolder[] = useMemo(() => {
    if (!currentFolderId) return [];
    const list: ImageFolder[] = [];
    let cur: ImageFolder | undefined = folderById.get(currentFolderId as string);
    while (cur) {
      list.unshift(cur);
      cur = cur.parentId ? folderById.get(cur.parentId as string) : undefined;
    }
    return list;
  }, [currentFolderId, folderById]);

  // Filtered images
  const images: ImageMetadata[] = useMemo(() => {
    if (!imagesData) return [];
    if (isSearching) {
      const q = searchQuery.trim().toLowerCase();
      return imagesData.filter((img) =>
        (img.displayName || "").toLowerCase().includes(q)
      );
    }
    return imagesData;
  }, [imagesData, isSearching, searchQuery]);

  // Atualizar modo multiple quando a prop mudar
  useEffect(() => {
    setMultipleMode(initialMultiple);
  }, [initialMultiple]);

  // Reset selection when dialog opens
  useEffect(() => {
    if (isOpen) {
      setSelectedImages([]);
      setSelectedImage(null);
      setSearchQuery("");
    }
  }, [isOpen]);

  const handleSelect = (image: ImageMetadata) => {
    if (multipleMode) {
      setSelectedImages((prev) => {
        if (prev.includes(image._id)) {
          return prev.filter((id) => id !== image._id);
        } else {
          return [...prev, image._id];
        }
      });
    } else {
      setSelectedImage(image.url);
      onSelect(image._id);
      setIsOpen(false);
    }
  };

  const handleConfirmSelection = () => {
    if (multipleMode && selectedImages.length > 0) {
      onSelect(selectedImages);
      setIsOpen(false);
    }
  };

  const formatFileSize = (bytes: number | null | undefined) => {
    if (!bytes) return "N/A";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const getImageDimensions = (file: File): Promise<{ width: number; height: number } | null> =>
    new Promise((resolve) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const dims = { width: img.naturalWidth, height: img.naturalHeight };
        URL.revokeObjectURL(url);
        resolve(dims);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        resolve(null);
      };
      img.src = url;
    });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    setIsUploading(true);
    try {
      const uploadPromises = Array.from(files).map(async (file) => {
        if (file.size > 2 * 1024 * 1024) {
          throw new Error(`A imagem ${file.name} deve ter no máximo 2MB.`);
        }

        if (!file.type.startsWith("image/")) {
          throw new Error(`O arquivo ${file.name} não é uma imagem válida.`);
        }

        const dims = await getImageDimensions(file);

        const uploadUrl = await generateUploadUrl({});
        const result = await fetch(uploadUrl, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        if (!result.ok) throw new Error(`Falha no upload de ${file.name}`);
        const { storageId } = await result.json();

        await createImage({
          storageId,
          displayName: file.name,
          folderId: currentFolderId ?? undefined,
          fileSize: file.size,
          mimeType: file.type,
          width: dims?.width,
          height: dims?.height,
        });
      });

      await Promise.all(uploadPromises);
      toast.success("Upload concluído com sucesso.");
    } catch (error: any) {
      console.error("Error uploading images:", error);
      toast.error(`Erro ao fazer upload: ${error.message ?? error}`);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (e: React.MouseEvent, image: ImageMetadata) => {
    e.stopPropagation();
    if (!confirm("Tem certeza que deseja excluir esta imagem?")) return;

    try {
      await removeImage({ id: image._id });
      if (selectedImage === image.url) {
        setSelectedImage(null);
      }
      if (multipleMode) {
        setSelectedImages((prev) => prev.filter((id) => id !== image._id));
      }
      toast.success("Imagem excluída.");
    } catch (error: any) {
      console.error("Error deleting image:", error);
      toast.error(`Erro ao excluir imagem: ${error.message ?? error}`);
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;

    try {
      await createFolder({
        name: newFolderName.trim(),
        parentId: currentFolderId ?? undefined,
      });

      setNewFolderName("");
      setShowCreateFolder(false);
      toast.success("Pasta criada.");
    } catch (error: any) {
      console.error("Error creating folder:", error);
      toast.error(`Erro ao criar pasta: ${error.message ?? error}`);
    }
  };

  const handleFolderClick = (folder: ImageFolder) => {
    setCurrentFolderId(folder._id);
    setSearchQuery("");
  };

  const handleDeleteFolder = async (e: React.MouseEvent, folder: ImageFolder) => {
    e.stopPropagation();
    if (
      !confirm(
        `Tem certeza que deseja excluir a pasta "${folder.name}"?\n\nTodas as imagens dentro dela serão movidas para a raiz.`
      )
    )
      return;

    try {
      setIsProcessing(true);

      // Move images in this folder to root before removing the folder
      const imagesInFolder = (imagesData ?? []).filter((img) => img.folderId === folder._id);
      // Also need to fetch images for this folder if not currently loaded — fall back to allFolders not needed.
      // Since list query is scoped, we may not have these. We'll attempt update on each known one.
      await Promise.all(
        imagesInFolder.map((img) =>
          updateImage({ id: img._id, folderId: undefined })
        )
      );

      await removeFolder({ id: folder._id });

      if (currentFolderId === folder._id) {
        setCurrentFolderId(null);
      }
      toast.success("Pasta excluída.");
    } catch (error: any) {
      console.error("Error deleting folder:", error);
      toast.error(`Erro ao excluir pasta: ${error.message ?? error}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBreadcrumbClick = (folder: ImageFolder | null) => {
    setCurrentFolderId(folder?._id ?? null);
    setSearchQuery("");
  };

  const handleUpdateImageMetadata = async (updates: Partial<ImageMetadata>) => {
    if (!editingImage) return;

    try {
      await updateImage({
        id: editingImage._id,
        displayName: updates.displayName,
        description: updates.description,
        altText: updates.altText,
      });

      setEditingImage(null);
      toast.success("Imagem atualizada.");
    } catch (error: any) {
      console.error("Error updating image:", error);
      toast.error(`Erro ao atualizar imagem: ${error.message ?? error}`);
    }
  };

  const handleMoveImage = async (targetFolderId: Id<"imageFolders"> | null) => {
    if (!movingImage) return;

    try {
      setIsMoving(true);
      await updateImage({
        id: movingImage._id,
        folderId: targetFolderId ?? undefined,
      });
      setMovingImage(null);
      toast.success("Imagem movida.");
    } catch (error: any) {
      console.error("Error moving image:", error);
      toast.error(`Erro ao mover imagem: ${error.message ?? error}`);
    } finally {
      setIsMoving(false);
    }
  };

  const handleMoveMultipleImages = async (targetFolderId: Id<"imageFolders"> | null) => {
    if (movingImages.length === 0) return;

    try {
      setIsMoving(true);
      await Promise.all(
        movingImages.map((img) =>
          updateImage({ id: img._id, folderId: targetFolderId ?? undefined })
        )
      );

      setMovingImages([]);
      setSelectedImages([]);
      toast.success("Imagens movidas.");
    } catch (error: any) {
      console.error("Error moving images:", error);
      toast.error(`Erro ao mover imagens: ${error.message ?? error}`);
    } finally {
      setIsMoving(false);
    }
  };

  const sortedAllFolders = useMemo(
    () =>
      [...allFolders].sort((a, b) =>
        (folderPath.get(a._id as string) ?? a.name).localeCompare(
          folderPath.get(b._id as string) ?? b.name
        )
      ),
    [allFolders, folderPath]
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" className="border-foreground/10 hover:bg-foreground/5">
            <ImageIcon className="w-4 h-4 mr-2" />
            Selecionar Imagem
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="bg-background border-foreground/10 max-w-7xl max-h-[95vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-foreground-strong">Galeria de Imagens</DialogTitle>
          <VisuallyHidden>
            <h2>Selecione uma imagem da galeria</h2>
          </VisuallyHidden>
        </DialogHeader>

        <div className="flex flex-col gap-4 flex-1 min-h-0">
          {/* Barra de busca e ações */}
          <div className="flex gap-2 items-center flex-wrap">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-foreground/65" />
              <Input
                type="text"
                placeholder="Buscar imagens..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-background/50 border-foreground/10"
              />
            </div>

            {/* Toggle modo múltiplo */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-foreground/5 rounded-lg border border-foreground/10">
              <Switch
                checked={multipleMode}
                onCheckedChange={(checked) => {
                  setMultipleMode(checked);
                  if (!checked) {
                    setSelectedImages([]);
                  }
                }}
                id="multiple-mode"
              />
              <label htmlFor="multiple-mode" className="text-sm text-foreground/90 cursor-pointer">
                Seleção Múltipla
              </label>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCreateFolder(!showCreateFolder)}
              className="border-foreground/10"
            >
              <FolderPlus className="w-4 h-4 mr-2" />
              Nova Pasta
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              multiple
              onChange={handleFileChange}
            />
            <Button
              className="bg-neon-purple hover:bg-neon-purple/90 text-white"
              onClick={handleUploadClick}
              disabled={isUploading}
              size="sm"
            >
              {isUploading ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Upload className="w-4 h-4 mr-2" />
              )}
              {isUploading ? "Enviando..." : "Upload"}
            </Button>
            {multipleMode && selectedImages.length > 0 && (
              <>
                <Button
                  className="bg-purple-600 hover:bg-purple-700 text-white"
                  onClick={() => {
                    const selectedImageObjects = images.filter((img) =>
                      selectedImages.includes(img._id)
                    );
                    setMovingImages(selectedImageObjects);
                  }}
                  size="sm"
                >
                  <Move className="w-4 h-4 mr-2" />
                  Mover ({selectedImages.length})
                </Button>
                <Button
                  className="bg-red-600 hover:bg-red-700 text-white"
                  onClick={async () => {
                    if (
                      !confirm(
                        `Tem certeza que deseja excluir ${selectedImages.length} imagem(ns)?`
                      )
                    )
                      return;

                    const selectedImageObjects = images.filter((img) =>
                      selectedImages.includes(img._id)
                    );
                    setIsProcessing(true);
                    try {
                      await Promise.all(
                        selectedImageObjects.map((img) => removeImage({ id: img._id }))
                      );
                      setSelectedImages([]);
                      toast.success("Imagens excluídas.");
                    } catch (error: any) {
                      console.error("Error deleting images:", error);
                      toast.error(`Erro ao excluir imagens: ${error.message ?? error}`);
                    } finally {
                      setIsProcessing(false);
                    }
                  }}
                  size="sm"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Excluir ({selectedImages.length})
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700 text-white"
                  onClick={handleConfirmSelection}
                  size="sm"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Confirmar ({selectedImages.length})
                </Button>
              </>
            )}
          </div>

          {/* Criar pasta */}
          {showCreateFolder && (
            <div className="flex gap-2 items-center p-3 bg-foreground/5 rounded-lg">
              <Input
                placeholder="Nome da pasta"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCreateFolder();
                  if (e.key === "Escape") setShowCreateFolder(false);
                }}
                className="flex-1 bg-background/50 border-foreground/10"
                autoFocus
              />
              <Button onClick={handleCreateFolder} size="sm">
                Criar
              </Button>
              <Button variant="outline" onClick={() => setShowCreateFolder(false)} size="sm">
                Cancelar
              </Button>
            </div>
          )}

          {/* Breadcrumbs */}
          {currentFolder && (
            <div className="flex items-center gap-1 text-sm text-foreground/65 flex-wrap">
              <button
                onClick={() => handleBreadcrumbClick(null)}
                className="hover:text-foreground-strong transition-colors flex items-center gap-1"
              >
                <Home className="w-4 h-4" />
                <span>Raiz</span>
              </button>
              {breadcrumbs.map((crumb) => (
                <div key={crumb._id} className="flex items-center gap-1">
                  <ChevronRight className="w-4 h-4" />
                  <button
                    onClick={() => handleBreadcrumbClick(crumb)}
                    className="hover:text-foreground-strong transition-colors"
                  >
                    {crumb.name}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Conteúdo: pastas e imagens */}
          <div className="flex-1 overflow-y-auto min-h-0">
            {isLoading || isProcessing ? (
              <div className="flex justify-center py-10">
                <Loader2 className="w-8 h-8 text-neon-purple animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Pastas */}
                {!isSearching &&
                  visibleFolders.map((folder) => (
                    <div
                      key={folder._id}
                      className="relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 border-transparent hover:border-foreground/20 transition-all group bg-foreground/5 flex flex-col items-center justify-center"
                      onClick={() => handleFolderClick(folder)}
                    >
                      <Folder className="w-12 h-12 text-neon-purple mb-2" />
                      <span className="text-sm text-center px-2 truncate w-full">
                        {folder.name}
                      </span>
                      <button
                        className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        onClick={(e) => handleDeleteFolder(e, folder)}
                        title="Excluir pasta (imagens serão movidas para a raiz)"
                      >
                        <Trash2 className="w-3 h-3 text-foreground-strong" />
                      </button>
                    </div>
                  ))}

                {/* Imagens */}
                {images.map((img) => {
                  const isSelected = multipleMode
                    ? selectedImages.includes(img._id)
                    : selectedImage === img.url;
                  const folderName = img.folderId
                    ? folderById.get(img.folderId as string)?.name
                    : null;

                  return (
                    <div
                      key={img._id}
                      className={cn(
                        "relative rounded-lg overflow-hidden cursor-pointer border-2 transition-all group bg-foreground/5",
                        isSelected
                          ? "border-neon-purple"
                          : "border-transparent hover:border-foreground/20"
                      )}
                      onClick={() => handleSelect(img)}
                    >
                      {/* Imagem */}
                      <div className="aspect-square relative">
                        <img
                          src={img.url}
                          alt={img.displayName || "imagem"}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute inset-0 bg-neon-purple/30 flex items-center justify-center">
                            <div className="bg-neon-purple rounded-full p-2 shadow-lg">
                              <Check className="w-5 h-5 text-foreground-strong" />
                            </div>
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="grid grid-cols-2 gap-2">
                            <button
                              className="p-1.5 bg-blue-500/90 rounded hover:bg-blue-600 shadow-lg flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                setViewingImage(img);
                              }}
                              title="Ver detalhes"
                            >
                              <Maximize2 className="w-3.5 h-3.5 text-foreground-strong" />
                            </button>
                            <button
                              className="p-1.5 bg-blue-500/90 rounded hover:bg-blue-600 shadow-lg flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingImage(img);
                              }}
                              title="Editar"
                            >
                              <Edit2 className="w-3.5 h-3.5 text-foreground-strong" />
                            </button>
                            <button
                              className="p-1.5 bg-purple-500/90 rounded hover:bg-purple-600 shadow-lg flex items-center justify-center"
                              onClick={(e) => {
                                e.stopPropagation();
                                setMovingImage(img);
                              }}
                              title="Mover"
                            >
                              <Move className="w-3.5 h-3.5 text-foreground-strong" />
                            </button>
                            <button
                              className="p-1.5 bg-red-500/90 rounded hover:bg-red-600 shadow-lg flex items-center justify-center"
                              onClick={(e) => handleDelete(e, img)}
                              title="Excluir"
                            >
                              <Trash2 className="w-3.5 h-3.5 text-foreground-strong" />
                            </button>
                          </div>
                        </div>
                        {img.tags && img.tags.length > 0 && (
                          <div className="absolute bottom-2 left-2 flex gap-1 flex-wrap">
                            {img.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-black/80 text-white px-2 py-1 rounded-md font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Informações */}
                      <div className="p-4 space-y-2 bg-foreground/5">
                        <div className="text-base font-semibold text-foreground-strong truncate">
                          {img.displayName}
                        </div>
                        <div className="flex items-center justify-between text-sm text-foreground/90">
                          {img.width && img.height && (
                            <span className="flex items-center gap-1">
                              <Info className="w-4 h-4" />
                              {img.width} × {img.height} px
                            </span>
                          )}
                          {img.fileSize && (
                            <span className="font-medium">{formatFileSize(img.fileSize)}</span>
                          )}
                        </div>
                        {folderName && (
                          <div className="flex items-center gap-2 text-sm text-foreground/65">
                            <Folder className="w-4 h-4" />
                            <span className="truncate">{folderName}</span>
                          </div>
                        )}
                        {img.description && (
                          <div className="text-sm text-foreground/65 line-clamp-2">
                            {img.description}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Mensagem vazia */}
                {!isSearching && visibleFolders.length === 0 && images.length === 0 && (
                  <div className="col-span-full text-center text-foreground/65 py-10">
                    Nenhuma imagem ou pasta encontrada.
                  </div>
                )}
                {isSearching && images.length === 0 && (
                  <div className="col-span-full text-center text-foreground/65 py-10">
                    Nenhuma imagem encontrada para "{searchQuery}".
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dialog de visualização detalhada */}
        {viewingImage && (
          <Dialog open={!!viewingImage} onOpenChange={() => setViewingImage(null)}>
            <DialogContent className="bg-background border-foreground/10 max-w-6xl max-h-[95vh] flex flex-col">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle className="text-foreground-strong text-xl">
                  {viewingImage.displayName}
                </DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid md:grid-cols-2 gap-6 py-4">
                  {/* Preview da imagem */}
                  <div className="space-y-4 flex flex-col">
                    <div className="relative aspect-square rounded-lg overflow-hidden border border-foreground/10 bg-black/20 flex-shrink-0">
                      <img
                        src={viewingImage.url}
                        alt={viewingImage.displayName}
                        className="w-full h-full object-contain"
                      />
                    </div>

                    {/* Ações rápidas */}
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        className="w-full border-foreground/10 justify-start"
                        onClick={() => {
                          setViewingImage(null);
                          setEditingImage(viewingImage);
                        }}
                      >
                        <Edit2 className="w-4 h-4 mr-2" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-foreground/10 justify-start"
                        onClick={() => {
                          setViewingImage(null);
                          setMovingImage(viewingImage);
                        }}
                      >
                        <Move className="w-4 h-4 mr-2" />
                        Mover
                      </Button>
                      <Button
                        variant="outline"
                        className="w-full border-red-500/50 text-red-400 hover:bg-red-500/10 justify-start"
                        onClick={() => {
                          if (confirm("Tem certeza que deseja excluir esta imagem?")) {
                            handleDelete(
                              { stopPropagation: () => {} } as any,
                              viewingImage
                            );
                            setViewingImage(null);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Excluir
                      </Button>
                    </div>
                  </div>

                  {/* Informações detalhadas */}
                  <div className="space-y-4 flex flex-col min-h-0">
                    <div className="space-y-3 flex-shrink-0">
                      <h3 className="text-lg font-semibold text-foreground-strong flex items-center gap-2">
                        <Info className="w-5 h-5" />
                        Informações
                      </h3>
                    </div>

                    <div className="space-y-2 text-sm overflow-y-auto flex-1 min-h-0">
                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 border-b border-foreground/10">
                        <span className="text-foreground/65 flex-shrink-0">Nome de Exibição:</span>
                        <span className="text-foreground-strong font-medium break-words text-right">
                          {viewingImage.displayName || "Não definido"}
                        </span>
                      </div>

                      {viewingImage.folderId && (
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 border-b border-foreground/10">
                          <span className="text-foreground/65 flex-shrink-0">Pasta:</span>
                          <span className="text-foreground-strong flex items-center gap-1 justify-end">
                            <Folder className="w-4 h-4" />
                            {folderById.get(viewingImage.folderId as string)?.name ?? "—"}
                          </span>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 border-b border-foreground/10">
                        <span className="text-foreground/65 flex-shrink-0">Dimensões:</span>
                        <span className="text-foreground-strong text-right">
                          {viewingImage.width && viewingImage.height
                            ? `${viewingImage.width} × ${viewingImage.height} px`
                            : "N/A"}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 border-b border-foreground/10">
                        <span className="text-foreground/65 flex-shrink-0">Tamanho do Arquivo:</span>
                        <span className="text-foreground-strong text-right">
                          {formatFileSize(viewingImage.fileSize)}
                        </span>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 border-b border-foreground/10">
                        <span className="text-foreground/65 flex-shrink-0">Tipo MIME:</span>
                        <span className="text-foreground-strong text-right">
                          {viewingImage.mimeType || "N/A"}
                        </span>
                      </div>

                      {viewingImage.description && (
                        <div className="py-2 border-b border-foreground/10">
                          <span className="text-foreground/65 block mb-1">Descrição:</span>
                          <span className="text-foreground-strong break-words">{viewingImage.description}</span>
                        </div>
                      )}

                      {viewingImage.altText && (
                        <div className="py-2 border-b border-foreground/10">
                          <span className="text-foreground/65 block mb-1">Texto Alternativo:</span>
                          <span className="text-foreground-strong break-words">{viewingImage.altText}</span>
                        </div>
                      )}

                      {viewingImage.tags && viewingImage.tags.length > 0 && (
                        <div className="py-2">
                          <span className="text-foreground/65 block mb-2">Tags:</span>
                          <div className="flex flex-wrap gap-2">
                            {viewingImage.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-1 bg-neon-purple/20 text-neon-purple rounded text-xs"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-2 py-2 text-xs text-foreground/42">
                        <span>Data de Criação:</span>
                        <span className="text-right">
                          {viewingImage._creationTime
                            ? new Date(viewingImage._creationTime).toLocaleString("pt-BR")
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Dialog de edição de imagem */}
        {editingImage && (
          <Dialog open={!!editingImage} onOpenChange={() => setEditingImage(null)}>
            <DialogContent className="bg-background border-foreground/10 max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Imagem</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-foreground/65 mb-1 block">Nome de Exibição</label>
                  <Input
                    value={editingImage.displayName || ""}
                    onChange={(e) =>
                      setEditingImage({ ...editingImage, displayName: e.target.value })
                    }
                    className="bg-background/50 border-foreground/10"
                  />
                </div>
                <div>
                  <label className="text-sm text-foreground/65 mb-1 block">Descrição</label>
                  <Input
                    value={editingImage.description || ""}
                    onChange={(e) =>
                      setEditingImage({ ...editingImage, description: e.target.value })
                    }
                    className="bg-background/50 border-foreground/10"
                  />
                </div>
                <div>
                  <label className="text-sm text-foreground/65 mb-1 block">
                    Texto Alternativo (Alt)
                  </label>
                  <Input
                    value={editingImage.altText || ""}
                    onChange={(e) =>
                      setEditingImage({ ...editingImage, altText: e.target.value })
                    }
                    className="bg-background/50 border-foreground/10"
                  />
                </div>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" onClick={() => setEditingImage(null)}>
                    Cancelar
                  </Button>
                  <Button onClick={() => handleUpdateImageMetadata(editingImage)}>Salvar</Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Dialog de mover imagem única */}
        {movingImage && (
          <Dialog open={!!movingImage} onOpenChange={() => setMovingImage(null)}>
            <DialogContent className="bg-background border-foreground/10 max-w-2xl">
              <DialogHeader>
                <DialogTitle>Mover Imagem</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-foreground/65">
                  Movendo:{" "}
                  <span className="text-foreground-strong font-medium">{movingImage.displayName}</span>
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  <button
                    onClick={() => handleMoveImage(null)}
                    disabled={isMoving}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border-2 transition-all",
                      !movingImage.folderId
                        ? "border-neon-purple bg-neon-purple/10"
                        : "border-foreground/10 hover:border-foreground/20 bg-foreground/5",
                      isMoving && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-neon-purple" />
                      <span className="font-medium">Raiz (pasta principal)</span>
                    </div>
                  </button>

                  {sortedAllFolders.map((folder) => (
                    <button
                      key={folder._id}
                      onClick={() => handleMoveImage(folder._id)}
                      disabled={isMoving}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border-2 transition-all",
                        movingImage.folderId === folder._id
                          ? "border-neon-purple bg-neon-purple/10"
                          : "border-foreground/10 hover:border-foreground/20 bg-foreground/5",
                        isMoving && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-neon-purple" />
                        <div className="flex-1">
                          <div className="font-medium">{folder.name}</div>
                          <div className="text-xs text-foreground/65 truncate">
                            {folderPath.get(folder._id as string)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}

                  {sortedAllFolders.length === 0 && (
                    <div className="text-center text-foreground/65 py-8">
                      Nenhuma pasta disponível. Crie uma pasta primeiro.
                    </div>
                  )}
                </div>

                <div className="flex gap-2 justify-end pt-4 border-t border-foreground/10">
                  <Button
                    variant="outline"
                    onClick={() => setMovingImage(null)}
                    disabled={isMoving}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}

        {/* Dialog de mover múltiplas imagens */}
        {movingImages.length > 0 && (
          <Dialog
            open={movingImages.length > 0}
            onOpenChange={() => setMovingImages([])}
          >
            <DialogContent className="bg-background border-foreground/10 max-w-2xl">
              <DialogHeader>
                <DialogTitle>Mover {movingImages.length} Imagem(ns)</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="text-sm text-foreground/65">
                  Movendo{" "}
                  <span className="text-foreground-strong font-medium">{movingImages.length}</span>{" "}
                  imagem(ns) selecionada(s)
                </div>

                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  <button
                    onClick={() => handleMoveMultipleImages(null)}
                    disabled={isMoving}
                    className={cn(
                      "w-full text-left p-3 rounded-lg border-2 transition-all",
                      "border-foreground/10 hover:border-foreground/20 bg-foreground/5",
                      isMoving && "opacity-50 cursor-not-allowed"
                    )}
                  >
                    <div className="flex items-center gap-2">
                      <Home className="w-4 h-4 text-neon-purple" />
                      <span className="font-medium">Raiz (pasta principal)</span>
                    </div>
                  </button>

                  {sortedAllFolders.map((folder) => (
                    <button
                      key={folder._id}
                      onClick={() => handleMoveMultipleImages(folder._id)}
                      disabled={isMoving}
                      className={cn(
                        "w-full text-left p-3 rounded-lg border-2 transition-all",
                        "border-foreground/10 hover:border-foreground/20 bg-foreground/5",
                        isMoving && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-2">
                        <Folder className="w-4 h-4 text-neon-purple" />
                        <div className="flex-1">
                          <div className="font-medium">{folder.name}</div>
                          <div className="text-xs text-foreground/65 truncate">
                            {folderPath.get(folder._id as string)}
                          </div>
                        </div>
                      </div>
                    </button>
                  ))}

                  {sortedAllFolders.length === 0 && (
                    <div className="text-center text-foreground/65 py-8">
                      Nenhuma pasta disponível. Crie uma pasta primeiro.
                    </div>
                  )}
                </div>

                {isMoving && (
                  <div className="flex items-center justify-center gap-2 text-sm text-foreground/65">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Movendo imagens...</span>
                  </div>
                )}

                <div className="flex gap-2 justify-end pt-4 border-t border-foreground/10">
                  <Button
                    variant="outline"
                    onClick={() => setMovingImages([])}
                    disabled={isMoving}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}
