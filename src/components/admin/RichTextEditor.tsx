import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Typography from '@tiptap/extension-typography';
import { useEffect, useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { 
  Bold, 
  Italic, 
  Underline as UnderlineIcon,
  List, 
  ListOrdered, 
  Quote, 
  Undo, 
  Redo, 
  Code,
  Code2,
  Eye,
  Link as LinkIcon,
  Image as ImageIcon,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Type,
  Minus,
  Heading1,
  Heading2,
  Heading3
} from "lucide-react";

interface RichTextEditorProps {
  content: string;
  onChange: (content: string) => void;
}

export function RichTextEditor({ content, onChange }: RichTextEditorProps) {
  const [showCodeView, setShowCodeView] = useState(false);
  const [codeContent, setCodeContent] = useState(content);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [imageDialogOpen, setImageDialogOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkText, setLinkText] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  
  const onChangeRef = useRef(onChange);
  const isUpdatingFromProps = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // Atualizar ref quando onChange mudar
  useEffect(() => {
    onChangeRef.current = onChange;
  }, [onChange]);

  // Função debounced para onChange
  const debouncedOnChange = useCallback((html: string) => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    debounceTimerRef.current = setTimeout(() => {
      onChangeRef.current(html);
    }, 150); // Debounce de 150ms
  }, []);
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'text-neon-purple underline cursor-pointer',
        },
      }),
      Image.configure({
        inline: true,
        HTMLAttributes: {
          class: 'max-w-full h-auto rounded-lg',
        },
      }),
      Underline,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Color,
      TextStyle,
      Typography,
    ],
    content,
    onUpdate: ({ editor }) => {
      if (isUpdatingFromProps.current) {
        return; // Ignorar updates que vêm de setContent
      }
      const html = editor.getHTML();
      debouncedOnChange(html);
      if (!showCodeView) {
        setCodeContent(html);
      }
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none min-h-[150px] p-4 focus:outline-none text-foreground/90 tiptap',
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    
    const currentHtml = editor.getHTML();
    // Só atualizar se o conteúdo realmente mudou e não foi uma mudança interna
    if (content !== currentHtml && !isUpdatingFromProps.current) {
      isUpdatingFromProps.current = true;
      editor.commands.setContent(content);
      setCodeContent(content);
      // Reset flag após um pequeno delay
      setTimeout(() => {
        isUpdatingFromProps.current = false;
      }, 0);
    }
  }, [content, editor]);

  // Cleanup do debounce timer
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const toggleCodeView = useCallback(() => {
    if (!editor) return;
    
    if (showCodeView) {
      // Sair do modo código - atualizar o editor com o conteúdo do textarea
      isUpdatingFromProps.current = true;
      editor.commands.setContent(codeContent);
      onChangeRef.current(codeContent);
      setTimeout(() => {
        isUpdatingFromProps.current = false;
      }, 0);
    } else {
      // Entrar no modo código - atualizar o textarea com o HTML atual
      setCodeContent(editor.getHTML());
    }
    setShowCodeView(!showCodeView);
  }, [editor, showCodeView, codeContent]);

  const handleSetLink = useCallback(() => {
    if (!editor) return;
    
    if (linkUrl) {
      if (linkText) {
        // Se há texto selecionado, substituir por link
        editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkText}</a>`).run();
      } else {
        // Usar texto selecionado ou criar link
        const { from, to } = editor.state.selection;
        const selectedText = editor.state.doc.textBetween(from, to);
        if (selectedText) {
          editor.chain().focus().setLink({ href: linkUrl }).run();
        } else {
          editor.chain().focus().insertContent(`<a href="${linkUrl}">${linkUrl}</a>`).run();
        }
      }
    } else {
      editor.chain().focus().unsetLink().run();
    }
    
    setLinkDialogOpen(false);
    setLinkUrl('');
    setLinkText('');
  }, [editor, linkUrl, linkText]);

  const handleSetImage = useCallback(() => {
    if (!editor || !imageUrl) return;
    editor.chain().focus().setImage({ src: imageUrl }).run();
    setImageDialogOpen(false);
    setImageUrl('');
  }, [editor, imageUrl]);

  const openLinkDialog = useCallback(() => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to);
    const linkAttrs = editor.getAttributes('link');
    
    setLinkText(selectedText || '');
    setLinkUrl(linkAttrs.href || '');
    setLinkDialogOpen(true);
  }, [editor]);

  const openImageDialog = useCallback(() => {
    setImageUrl('');
    setImageDialogOpen(true);
  }, []);

  // Handlers memoizados para toolbar
  const handleHeading1 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 1 }).run(), [editor]);
  const handleHeading2 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 2 }).run(), [editor]);
  const handleHeading3 = useCallback(() => editor?.chain().focus().toggleHeading({ level: 3 }).run(), [editor]);
  const handleBold = useCallback(() => editor?.chain().focus().toggleBold().run(), [editor]);
  const handleItalic = useCallback(() => editor?.chain().focus().toggleItalic().run(), [editor]);
  const handleUnderline = useCallback(() => editor?.chain().focus().toggleUnderline().run(), [editor]);
  const handleBulletList = useCallback(() => editor?.chain().focus().toggleBulletList().run(), [editor]);
  const handleOrderedList = useCallback(() => editor?.chain().focus().toggleOrderedList().run(), [editor]);
  const handleBlockquote = useCallback(() => editor?.chain().focus().toggleBlockquote().run(), [editor]);
  const handleCodeBlock = useCallback(() => editor?.chain().focus().toggleCodeBlock().run(), [editor]);
  const handleHorizontalRule = useCallback(() => editor?.chain().focus().setHorizontalRule().run(), [editor]);
  const handleAlignLeft = useCallback(() => editor?.chain().focus().setTextAlign('left').run(), [editor]);
  const handleAlignCenter = useCallback(() => editor?.chain().focus().setTextAlign('center').run(), [editor]);
  const handleAlignRight = useCallback(() => editor?.chain().focus().setTextAlign('right').run(), [editor]);
  const handleUndo = useCallback(() => editor?.chain().focus().undo().run(), [editor]);
  const handleRedo = useCallback(() => editor?.chain().focus().redo().run(), [editor]);

  if (!editor) {
    return null;
  }

  return (
    <div className="border border-foreground/10 rounded-md bg-foreground/5 flex flex-col">
      <style>{`
        .tiptap ul {
          list-style-type: disc;
          list-style-position: outside;
          margin-left: 1.5rem;
          padding-left: 0;
        }
        .tiptap ul li {
          padding-left: 0.5rem;
          margin-left: 0;
          display: list-item;
        }
        .tiptap ol {
          list-style-type: decimal;
          list-style-position: outside;
          margin-left: 1.5rem;
          padding-left: 0;
        }
        .tiptap ol li {
          padding-left: 0.5rem;
          margin-left: 0;
          display: list-item;
        }
        .tiptap h1 {
          font-size: 2em;
          font-weight: bold;
          margin-top: 0.67em;
          margin-bottom: 0.67em;
        }
        .tiptap h2 {
          font-size: 1.5em;
          font-weight: bold;
          margin-top: 0.83em;
          margin-bottom: 0.83em;
        }
        .tiptap h3 {
          font-size: 1.17em;
          font-weight: bold;
          margin-top: 1em;
          margin-bottom: 1em;
        }
        .tiptap img {
          max-width: 100%;
          height: auto;
          border-radius: 0.5rem;
          margin: 1rem 0;
        }
        .tiptap a {
          color: rgb(168, 85, 247);
          text-decoration: underline;
          cursor: pointer;
          word-break: break-all;
          overflow-wrap: break-word;
        }
        .tiptap a:hover {
          opacity: 0.8;
        }
        .tiptap {
          word-wrap: break-word;
          overflow-wrap: break-word;
        }
        .tiptap * {
          max-width: 100%;
        }
      `}</style>
      <div className="flex flex-wrap gap-1 p-2 border-b border-foreground/10 bg-background sticky top-0 z-20 shrink-0">
        {/* Cabeçalhos */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleHeading1}
          className={editor.isActive('heading', { level: 1 }) ? 'bg-neon-purple/20 text-neon-purple' : 'text-foreground/65'}
          title="Título 1"
        >
          <Heading1 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleHeading2}
          className={editor.isActive('heading', { level: 2 }) ? 'bg-neon-purple/20 text-neon-purple' : 'text-foreground/65'}
          title="Título 2"
        >
          <Heading2 className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleHeading3}
          className={editor.isActive('heading', { level: 3 }) ? 'bg-neon-purple/20 text-neon-purple' : 'text-foreground/65'}
          title="Título 3"
        >
          <Heading3 className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-foreground/10 mx-1" />
        
        {/* Formatação de texto */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBold}
          className={editor.isActive('bold') ? 'bg-neon-purple/20 text-neon-purple' : 'text-foreground/65'}
          title="Negrito"
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleItalic}
          className={editor.isActive('italic') ? 'bg-neon-purple/20 text-neon-purple' : 'text-foreground/65'}
          title="Itálico"
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleUnderline}
          className={editor.isActive('underline') ? 'bg-neon-purple/20 text-neon-purple' : 'text-foreground/65'}
          title="Sublinhado"
        >
          <UnderlineIcon className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-foreground/10 mx-1" />
        
        {/* Listas */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBulletList}
          className={editor.isActive('bulletList') ? 'bg-neon-purple/20 text-neon-purple' : 'text-foreground/65'}
          title="Lista com marcadores"
        >
          <List className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleOrderedList}
          className={editor.isActive('orderedList') ? 'bg-neon-purple/20 text-neon-purple' : 'text-foreground/65'}
          title="Lista numerada"
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleBlockquote}
          className={editor.isActive('blockquote') ? 'bg-neon-purple/20 text-neon-purple' : 'text-foreground/65'}
          title="Citação"
        >
          <Quote className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleCodeBlock}
          className={editor.isActive('codeBlock') ? 'bg-neon-purple/20 text-neon-purple' : 'text-foreground/65'}
          title="Bloco de código"
        >
          <Code className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleHorizontalRule}
          title="Linha horizontal"
        >
          <Minus className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-foreground/10 mx-1" />
        
        {/* Links e imagens */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={openLinkDialog}
          className={editor.isActive('link') ? 'bg-neon-purple/20 text-neon-purple' : 'text-foreground/65'}
          title="Inserir link"
        >
          <LinkIcon className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={openImageDialog}
          title="Inserir imagem"
        >
          <ImageIcon className="w-4 h-4" />
        </Button>
        
        <div className="w-px h-6 bg-foreground/10 mx-1" />
        
        {/* Alinhamento */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAlignLeft}
          className={editor.isActive({ textAlign: 'left' }) ? 'bg-neon-purple/20 text-neon-purple' : 'text-foreground/65'}
          title="Alinhar à esquerda"
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAlignCenter}
          className={editor.isActive({ textAlign: 'center' }) ? 'bg-neon-purple/20 text-neon-purple' : 'text-foreground/65'}
          title="Centralizar"
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleAlignRight}
          className={editor.isActive({ textAlign: 'right' }) ? 'bg-neon-purple/20 text-neon-purple' : 'text-foreground/65'}
          title="Alinhar à direita"
        >
          <AlignRight className="w-4 h-4" />
        </Button>
        
        <div className="flex-1" />
        
        {/* Outros */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={toggleCodeView}
          className={showCodeView ? 'bg-neon-purple/20 text-neon-purple' : 'text-foreground/65'}
          title={showCodeView ? 'Ver visualização' : 'Ver código HTML'}
        >
          {showCodeView ? <Eye className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleUndo}
          disabled={!editor.can().undo()}
          className="text-foreground/65"
          title="Desfazer"
        >
          <Undo className="w-4 h-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleRedo}
          disabled={!editor.can().redo()}
          className="text-foreground/65"
          title="Refazer"
        >
          <Redo className="w-4 h-4" />
        </Button>
      </div>
      <div className="overflow-y-auto max-h-[400px] flex-1">
        {showCodeView ? (
          <textarea
            value={codeContent}
            onChange={(e) => setCodeContent(e.target.value)}
            className="w-full min-h-[150px] p-4 bg-black/20 text-foreground/90 font-mono text-sm border-0 focus:outline-none focus:ring-2 focus:ring-neon-purple/50"
            style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}
            placeholder="Edite o HTML aqui..."
          />
        ) : (
          <EditorContent editor={editor} />
        )}
      </div>
      
      {/* Dialog para inserir link */}
      <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
        <DialogContent className="bg-background border-foreground/10">
          <DialogHeader>
            <DialogTitle className="text-foreground-strong">Inserir Link</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="link-text" className="text-foreground-strong">Texto do Link (opcional)</Label>
              <Input
                id="link-text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Digite o texto do link"
                className="bg-foreground/5 border-foreground/10 text-foreground-strong"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link-url" className="text-foreground-strong">URL *</Label>
              <Input
                id="link-url"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://exemplo.com"
                className="bg-foreground/5 border-foreground/10 text-foreground-strong"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSetLink();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setLinkDialogOpen(false)} className="text-foreground/65">
              Cancelar
            </Button>
            <Button type="button" onClick={handleSetLink} className="bg-neon-purple hover:bg-neon-purple/90 text-white">
              Inserir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para inserir imagem */}
      <Dialog open={imageDialogOpen} onOpenChange={setImageDialogOpen}>
        <DialogContent className="bg-background border-foreground/10">
          <DialogHeader>
            <DialogTitle className="text-foreground-strong">Inserir Imagem</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="image-url" className="text-foreground-strong">URL da Imagem *</Label>
              <Input
                id="image-url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="bg-foreground/5 border-foreground/10 text-foreground-strong"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleSetImage();
                  }
                }}
              />
            </div>
            {imageUrl && (
              <div className="mt-4">
                <img src={imageUrl} alt="Preview" className="max-w-full h-auto rounded-lg border border-foreground/10" onError={(e) => {
                  e.currentTarget.style.display = 'none';
                }} />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setImageDialogOpen(false)} className="text-foreground/65">
              Cancelar
            </Button>
            <Button type="button" onClick={handleSetImage} className="bg-neon-purple hover:bg-neon-purple/90 text-white" disabled={!imageUrl}>
              Inserir
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
