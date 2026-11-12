/**
 * Navegação por pastas da biblioteca de mídia, usada na tela de Mídia e no modal de
 * escolher imagem: "Todas", cada pasta com a quantidade de imagens e o campo de criar
 * pasta. Pasta nova só existe no painel até receber a primeira imagem.
 */
import { useState } from "react";
import { Folder, FolderPlus } from "lucide-react";
import { api } from "../data/api";
import { useQuery } from "../data/backend";
import { cn } from "../lib/utils";
import { Button } from "../ui/button";
import { Input } from "../ui/form";

/** Nome da pasta na lista: "/" é a das imagens sem pasta. */
export const folderLabel = (path: string) => (path === "/" ? "Sem pasta" : path);

/** `value` é a pasta escolhida (`undefined` = todas). */
export function MediaFolderNav({ value, onChange, className }: { value: string | undefined; onChange: (folder: string | undefined) => void; className?: string }) {
  const folders = useQuery(api.media.folders, {});
  const [extra, setExtra] = useState<string[]>([]);
  const [draft, setDraft] = useState("");
  const paths = [...new Set([...(folders ?? []).map((f) => f.path), ...extra])].sort();
  const count = (path: string | undefined) => (path ? (folders?.find((f) => f.path === path)?.count ?? 0) : folders?.reduce((n, f) => n + f.count, 0));

  return (
    <nav aria-label="Pastas" className={cn("space-y-1", className)}>
      {[undefined, ...paths].map((f) => (
        <button
          key={f ?? "all"}
          type="button"
          onClick={() => onChange(f)}
          aria-current={value === f ? "true" : undefined}
          className={cn("flex min-h-9 w-full cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent", value === f && "bg-accent font-medium")}
        >
          <Folder className="size-4 shrink-0" />
          <span className="flex-1 truncate">{f ? folderLabel(f) : "Todas"}</span>
          <span className="text-xs text-muted-foreground">{count(f)}</span>
        </button>
      ))}
      <form
        className="flex gap-1 pt-2"
        onSubmit={(e) => {
          e.preventDefault();
          const path = `/${draft.trim().replace(/^\/+|\/+$/g, "")}`;
          if (path.length > 1) {
            setExtra((x) => [...x, path]);
            onChange(path);
            setDraft("");
          }
        }}
      >
        <Input aria-label="Nova pasta" placeholder="nova pasta" value={draft} onChange={(e) => setDraft(e.target.value)} className="h-8" />
        <Button type="submit" variant="outline" size="icon-sm" aria-label="Criar pasta">
          <FolderPlus />
        </Button>
      </form>
    </nav>
  );
}
