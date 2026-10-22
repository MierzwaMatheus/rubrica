import * as React from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";

const AVAILABLE_TAGS = [
    "React", "Next.js", "TypeScript", "JavaScript", "TailwindCSS", "Styled-Components", "Bootstrap",
    "HTML5", "CSS3", "Vite", "Framer Motion", "GSAP", "Node.js", "Express", "Supabase", "Firebase",
    "Prisma", "REST API", "GraphQL", "WebSockets", "PostgreSQL", "MongoDB", "SQLite", "Redis",
    "NoSQL", "Git", "GitHub", "Figma", "Notion API", "Docker", "Visual Studio Code", "Cursor",
    "ESLint / Prettier", "Husky", "Vercel", "Jest", "Cypress", "React Testing Library",
    "React Native", "Expo", "OpenAI API", "Gemini API", "LangChain", "JSON Schema", "Chatbot Frameworks"
];

interface ProjectTagsInputProps {
    selectedTags: string[];
    onChange: (tags: string[]) => void;
}

export function ProjectTagsInput({ selectedTags, onChange }: ProjectTagsInputProps) {
    const [open, setOpen] = React.useState(false);

    const handleSelect = (currentValue: string) => {
        if (selectedTags.includes(currentValue)) {
            onChange(selectedTags.filter((tag) => tag !== currentValue));
        } else {
            onChange([...selectedTags, currentValue]);
        }
    };

    const handleRemove = (tagToRemove: string) => {
        onChange(selectedTags.filter((tag) => tag !== tagToRemove));
    };

    return (
        <div className="space-y-2">
            <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-foreground/5 text-foreground/90 border-foreground/10 flex items-center gap-1">
                        {tag}
                        <button
                            type="button"
                            onClick={() => handleRemove(tag)}
                            className="ml-1 ring-offset-background rounded-full outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                        >
                            <X className="h-3 w-3 text-foreground/65 hover:text-foreground-strong" />
                            <span className="sr-only">Remove {tag}</span>
                        </button>
                    </Badge>
                ))}
            </div>
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={open}
                        className="w-full justify-between bg-foreground/5 border-foreground/10 text-foreground/90 hover:bg-foreground/10 hover:text-foreground-strong"
                    >
                        Selecionar tags...
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-full p-0 bg-background border-foreground/10">
                    <Command className="bg-background text-foreground/90">
                        <CommandInput placeholder="Buscar tag..." className="text-foreground-strong" />
                        <CommandList>
                            <CommandEmpty>Nenhuma tag encontrada.</CommandEmpty>
                            <CommandGroup className="max-h-60 overflow-auto">
                                {AVAILABLE_TAGS.map((tag) => (
                                    <CommandItem
                                        key={tag}
                                        value={tag}
                                        onSelect={() => handleSelect(tag)}
                                        className="text-foreground/90 hover:bg-foreground/10 hover:text-foreground-strong aria-selected:bg-foreground/10 aria-selected:text-foreground-strong cursor-pointer"
                                    >
                                        <Check
                                            className={cn(
                                                "mr-2 h-4 w-4",
                                                selectedTags.includes(tag) ? "opacity-100" : "opacity-0"
                                            )}
                                        />
                                        {tag}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
