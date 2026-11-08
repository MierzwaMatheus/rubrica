/**
 * Texto rico leve (TipTap), saindo HTML. Carregado só quando um campo `richText`
 * aparece. O backend sanitiza o HTML ao salvar (`lib/sanitize`).
 */
import { useEffect } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { Bold, Heading2, Heading3, Italic, Link2, List, ListOrdered, Quote, Redo2, Undo2 } from "lucide-react";
import { cn } from "../lib/utils";

export default function RichText({ id, value, onChange, lang }: { id: string; value: string; onChange: (html: string) => void; lang?: string }) {
  const editor = useEditor({
    extensions: [StarterKit.configure({ heading: { levels: [2, 3] }, link: { openOnClick: false, autolink: true } })],
    content: value,
    editorProps: {
      attributes: { id, lang: lang ?? "", class: "rb-admin-prose min-h-28 px-3 py-2 text-sm", role: "textbox", "aria-multiline": "true" },
    },
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    immediatelyRender: true,
  });

  // Valor de fora (troca de bloco, desfazer pelo painel) sem perder o cursor ao digitar.
  useEffect(() => {
    if (editor && value !== editor.getHTML() && !editor.isFocused) editor.commands.setContent(value || "", { emitUpdate: false });
  }, [editor, value]);

  const state = useEditorState({
    editor,
    selector: ({ editor: e }) =>
      e
        ? {
            bold: e.isActive("bold"),
            italic: e.isActive("italic"),
            h2: e.isActive("heading", { level: 2 }),
            h3: e.isActive("heading", { level: 3 }),
            ul: e.isActive("bulletList"),
            ol: e.isActive("orderedList"),
            quote: e.isActive("blockquote"),
            link: e.isActive("link"),
          }
        : null,
  });

  if (!editor) return null;
  const tool = (label: string, active: boolean | undefined, run: () => void, Icon: typeof Bold) => (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={!!active}
      onClick={run}
      className={cn("inline-flex size-8 cursor-pointer items-center justify-center rounded hover:bg-accent", active && "bg-accent text-primary")}
    >
      <Icon className="size-4" />
    </button>
  );
  return (
    <div className="rounded-md border bg-card focus-within:ring-[3px] focus-within:ring-ring/40">
      <div className="flex flex-wrap gap-0.5 border-b p-1" role="toolbar" aria-label="Formatação">
        {tool("Negrito", state?.bold, () => editor.chain().focus().toggleBold().run(), Bold)}
        {tool("Itálico", state?.italic, () => editor.chain().focus().toggleItalic().run(), Italic)}
        {tool("Subtítulo", state?.h2, () => editor.chain().focus().toggleHeading({ level: 2 }).run(), Heading2)}
        {tool("Subtítulo menor", state?.h3, () => editor.chain().focus().toggleHeading({ level: 3 }).run(), Heading3)}
        {tool("Lista", state?.ul, () => editor.chain().focus().toggleBulletList().run(), List)}
        {tool("Lista numerada", state?.ol, () => editor.chain().focus().toggleOrderedList().run(), ListOrdered)}
        {tool("Citação", state?.quote, () => editor.chain().focus().toggleBlockquote().run(), Quote)}
        {tool("Link", state?.link, () => {
          const current = editor.getAttributes("link").href as string | undefined;
          const href = window.prompt("Endereço do link (vazio remove)", current ?? "https://");
          if (href === null) return;
          if (!href) editor.chain().focus().unsetLink().run();
          else editor.chain().focus().extendMarkRange("link").setLink({ href }).run();
        }, Link2)}
        <span className="mx-1 w-px bg-border" />
        {tool("Desfazer", false, () => editor.chain().focus().undo().run(), Undo2)}
        {tool("Refazer", false, () => editor.chain().focus().redo().run(), Redo2)}
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}
