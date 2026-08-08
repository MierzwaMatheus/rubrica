import { useRef } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { TemplateContentPreview } from "./TemplateContentPreview";
import { TemplateSyntaxGuide } from "./TemplateSyntaxGuide";

interface Variable {
  key: string;
  label: string;
}

interface Props {
  content: string;
  onChange: (value: string) => void;
  variables: Variable[];
}

function insertAtCursor(
  textarea: HTMLTextAreaElement,
  variable: string,
  currentValue: string,
): { newValue: string; newCursorPos: number } {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = `{{${variable}}}`;
  const newValue = currentValue.slice(0, start) + text + currentValue.slice(end);
  return { newValue, newCursorPos: start + text.length };
}

export function TemplateEditor({ content, onChange, variables }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function insertVariable(variable: string) {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { newValue, newCursorPos } = insertAtCursor(textarea, variable, content);
    onChange(newValue);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  }

  const syntaxAndToolbar = (
    <div className="space-y-2 shrink-0">
      <TemplateSyntaxGuide />
      {variables.length > 0 && (
        <div className="flex flex-wrap gap-1.5 p-3 bg-white/5 rounded-md border border-white/10">
          <span className="text-xs text-gray-500 w-full mb-1">
            Clique para inserir variável na posição do cursor:
          </span>
          {variables.map((v) => (
            <button
              key={v.key}
              type="button"
              onClick={() => insertVariable(v.key)}
              className="text-xs px-2 py-1 rounded bg-primary/20 text-primary border border-primary/30 hover:bg-primary/30 transition-colors font-mono"
            >
              {`{{${v.key}}}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col">
      {/* Mobile: abas */}
      <div className="md:hidden flex flex-col h-full">
        <Tabs defaultValue="editor" className="flex flex-col h-full">
          <TabsList className="mb-3 bg-white/5 border border-white/10 shrink-0">
            <TabsTrigger value="editor">Editor</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
          </TabsList>
          <TabsContent value="editor" className="flex flex-col flex-1 space-y-2 overflow-y-auto">
            {syntaxAndToolbar}
            <Textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => onChange(e.target.value)}
              placeholder="Digite o conteúdo do template."
              className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-mono text-sm flex-1 resize-none"
            />
          </TabsContent>
          <TabsContent value="preview" className="flex-1 overflow-y-auto" data-testid="preview-pane">
            <div className="rounded-md border border-white/10 bg-white/5 p-4 min-h-full">
              {content.trim() ? (
                <TemplateContentPreview content={content} />
              ) : (
                <p className="text-gray-500 text-sm italic">O preview aparecerá aqui conforme você digita.</p>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Desktop: side-by-side com scroll independente */}
      <div className="hidden md:grid md:grid-cols-2 md:gap-4 h-full">
        {/* Coluna editor */}
        <div data-testid="editor-pane" className="flex flex-col h-full overflow-hidden">
          {syntaxAndToolbar}
          <Textarea
            ref={textareaRef}
            value={content}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Digite o conteúdo do template. Use as variáveis acima para inserir dados da proposta."
            className="bg-white/5 border-white/10 text-white placeholder:text-gray-500 font-mono text-sm flex-1 resize-none mt-2"
          />
        </div>

        {/* Coluna preview */}
        <div className="flex flex-col h-full overflow-hidden">
          <p className="text-xs text-gray-500 mb-2 shrink-0">Preview</p>
          <div
            data-testid="preview-pane"
            className="flex-1 overflow-y-auto rounded-md border border-white/10 bg-white/5 p-4"
          >
            {content.trim() ? (
              <TemplateContentPreview content={content} />
            ) : (
              <p className="text-gray-500 text-sm italic">O preview aparecerá aqui conforme você digita.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
