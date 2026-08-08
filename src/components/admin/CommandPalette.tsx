import { useState } from "react";
import { getKeyOriginLabel } from "@/i18n/utils/keyOriginLabel";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Badge } from "@/components/ui/badge";

type CommandPaletteItem = {
  label: string;
  description: string;
  path: string;
};

type ContentGroup = {
  heading: string;
  items: { label: string; path: string; description?: string }[];
};

type SiteText = {
  key: string;
  ptBR?: string;
  enUS?: string;
};

type CommandPaletteProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: CommandPaletteItem[];
  createActions?: CommandPaletteItem[];
  siteTexts?: SiteText[];
  manifest?: Record<string, { file: string; line: number }[]>;
  contentGroups?: ContentGroup[];
  onNavigate: (path: string) => void;
};

export function CommandPalette({
  open,
  onOpenChange,
  items,
  createActions,
  siteTexts,
  manifest,
  contentGroups,
  onNavigate,
}: CommandPaletteProps) {
  const [query, setQuery] = useState("");

  const handleSelect = (path: string) => {
    onNavigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog
      open={open}
      onOpenChange={(value) => {
        onOpenChange(value);
        if (!value) setQuery("");
      }}
      title="Navegar para"
      description="Digite para filtrar páginas do admin"
      showCloseButton={false}
    >
      <CommandInput
        placeholder="Buscar página..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        <CommandEmpty>Nenhuma página encontrada.</CommandEmpty>
        <CommandGroup heading="Páginas">
          {items.map((item) => (
            <CommandItem
              key={item.path}
              value={`${item.label} ${item.description}`}
              onSelect={() => handleSelect(item.path)}
            >
              <span>{item.label}</span>
              <span className="text-muted-foreground ml-2 text-xs">{item.description}</span>
            </CommandItem>
          ))}
        </CommandGroup>
        {createActions && createActions.length > 0 && (
          <CommandGroup heading="Criar">
            {createActions.map((action) => (
              <CommandItem
                key={action.path}
                value={`${action.label} ${action.description}`}
                onSelect={() => handleSelect(action.path)}
              >
                <span>{action.label}</span>
                <span className="text-muted-foreground ml-2 text-xs">{action.description}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {siteTexts && siteTexts.length > 0 && (
          <CommandGroup heading="Textos">
            {siteTexts.map((text) => (
              <CommandItem
                key={text.key}
                value={`${text.key} ${text.ptBR ?? ""} ${text.enUS ?? ""}`}
                onSelect={() => handleSelect("/admin/textos?highlight=" + encodeURIComponent(text.key))}
              >
                <span className="font-mono text-xs">{text.key}</span>
                <span className="text-muted-foreground ml-2 text-xs">
                  {getKeyOriginLabel(text.key, manifest ?? {})}
                </span>
                {!text.enUS && (
                  <Badge variant="outline" className="ml-2 text-xs text-yellow-600 border-yellow-400">
                    Sem tradução EN
                  </Badge>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {query.trim() !== "" &&
          contentGroups?.map((group) => (
            <CommandGroup key={group.heading} heading={group.heading}>
              {group.items.map((item) => (
                <CommandItem
                  key={`${group.heading}-${item.label}`}
                  value={`${item.label} ${item.description ?? ""}`}
                  onSelect={() => handleSelect(item.path)}
                >
                  <span>{item.label}</span>
                  {item.description && (
                    <span className="text-muted-foreground ml-2 text-xs truncate">{item.description}</span>
                  )}
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
      </CommandList>
    </CommandDialog>
  );
}
