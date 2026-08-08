import { useState, useCallback } from "react";
import { BlogPost } from "@/repositories/interfaces/BlogRepository";

export type LineType = "input" | "output" | "error" | "nav" | "welcome";

export interface TerminalLine {
  type: LineType;
  text: string;
}

export interface TerminalOwnerInfo {
  name: string;
  slug: string;
  role: string;
  email?: string;
  githubUrl?: string;
  linkedinUrl?: string;
}

const COMMANDS = [
  "help",
  "home",
  "projects",
  "about",
  "resume",
  "curriculo",
  "blog",
  "posts",
  "open",
  "contact",
  "ls",
  "whoami",
  "theme",
  "clear",
  "exit",
  "quit",
];

function buildWelcomeLines(slug: string): TerminalLine[] {
  return [
    { type: "welcome", text: `Welcome to ${slug} terminal v1.0` },
    { type: "welcome", text: "Type 'help' to see available commands." },
    { type: "welcome", text: "─────────────────────────────────────────" },
  ];
}

interface UseTerminalOptions {
  posts: BlogPost[];
  onNavigate: (path: string) => void;
  onClose: () => void;
  onThemeToggle?: () => void;
  ownerInfo?: TerminalOwnerInfo;
}

export function useTerminal({
  posts,
  onNavigate,
  onClose,
  onThemeToggle,
  ownerInfo,
}: UseTerminalOptions) {
  const slug = ownerInfo?.slug ?? "portfolio";
  const welcomeLines = buildWelcomeLines(slug);

  const [lines, setLines] = useState<TerminalLine[]>(welcomeLines);
  const [input, setInput] = useState("");
  const [cmdHistory, setCmdHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addLine = useCallback((line: TerminalLine) => {
    setLines(prev => [...prev, line]);
  }, []);

  const navigate = useCallback(
    (path: string, label: string) => {
      addLine({ type: "nav", text: `→ navigating to ${label}...` });
      setTimeout(() => {
        onNavigate(path);
        onClose();
      }, 300);
    },
    [addLine, onNavigate, onClose]
  );

  const processCommand = useCallback(
    (raw: string) => {
      const trimmed = raw.trim();
      if (!trimmed) return;

      addLine({ type: "input", text: `visitor@${slug}:~$ ${trimmed}` });

      const [cmd, ...args] = trimmed.toLowerCase().split(/\s+/);

      switch (cmd) {
        case "help":
          [
            "Available commands:",
            "  home          → Go to home page",
            "  projects      → Go to portfolio",
            "  about         → Go to about page",
            "  resume        → Go to resume / curriculum",
            "  blog          → Go to blog",
            "  posts         → List all published posts",
            "  open <slug>   → Navigate to a blog post",
            "  contact       → Show contact info",
            "  ls            → List available pages",
            "  whoami        → Who is this?",
            "  theme         → Toggle dark/light mode",
            "  clear         → Clear terminal",
            "  exit          → Close terminal",
          ].forEach(t => addLine({ type: "output", text: t }));
          break;

        case "home":
          navigate("/", "/");
          break;

        case "projects":
          navigate("/portfolio", "/portfolio");
          break;

        case "about":
          navigate("/sobre", "/sobre");
          break;

        case "resume":
        case "curriculo":
          navigate("/curriculo", "/curriculo");
          break;

        case "blog":
          navigate("/blog", "/blog");
          break;

        case "posts":
          if (posts.length === 0) {
            addLine({ type: "output", text: "No published posts found." });
          } else {
            addLine({ type: "output", text: "Published posts:" });
            posts.forEach(p =>
              addLine({ type: "output", text: `  ${p.slug.padEnd(32)} ${p.title}` })
            );
          }
          break;

        case "open": {
          const slug = args[0];
          if (!slug) {
            addLine({ type: "error", text: "usage: open <slug>" });
            break;
          }
          const found = posts.find(p => p.slug === slug);
          if (!found) {
            addLine({ type: "error", text: `post not found: ${slug}` });
          } else {
            navigate(`/blog/${slug}`, `/blog/${slug}`);
          }
          break;
        }

        case "contact": {
          const lines: string[] = ["Contact:"];
          if (ownerInfo?.email) lines.push(`  email    ${ownerInfo.email}`);
          if (ownerInfo?.githubUrl) {
            const github = ownerInfo.githubUrl.replace(/^https?:\/\//, "");
            lines.push(`  github   ${github}`);
          }
          if (ownerInfo?.linkedinUrl) {
            const linkedin = ownerInfo.linkedinUrl.replace(/^https?:\/\//, "");
            lines.push(`  linkedin ${linkedin}`);
          }
          if (lines.length === 1) lines.push("  No contact info configured.");
          lines.forEach(t => addLine({ type: "output", text: t }));
          break;
        }

        case "ls":
          [
            "Pages:",
            "  /             home",
            "  /portfolio    projects",
            "  /sobre        about",
            "  /curriculo    resume",
            "  /blog         blog",
          ].forEach(t => addLine({ type: "output", text: t }));
          break;

        case "whoami":
          addLine({
            type: "output",
            text: ownerInfo
              ? `${ownerInfo.name} — ${ownerInfo.role}`
              : "portfolio owner — software developer",
          });
          break;

        case "theme":
          if (onThemeToggle) {
            onThemeToggle();
            addLine({ type: "output", text: "Theme toggled." });
          } else {
            addLine({ type: "error", text: "Theme switching is not enabled." });
          }
          break;

        case "clear":
          setLines(buildWelcomeLines(slug));
          return;

        case "exit":
        case "quit":
          onClose();
          return;

        default:
          addLine({ type: "error", text: `command not found: ${cmd}` });
      }
    },
    [addLine, navigate, posts, onClose, onThemeToggle, ownerInfo, slug]
  );

  const submit = useCallback(() => {
    const trimmed = input.trim();
    processCommand(input);
    if (trimmed) {
      setCmdHistory(prev => [trimmed, ...prev]);
    }
    setInput("");
    setHistoryIndex(-1);
  }, [input, processCommand]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        submit();
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHistoryIndex(prev => {
          const next = Math.min(prev + 1, cmdHistory.length - 1);
          if (next >= 0) setInput(cmdHistory[next]);
          return next;
        });
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setHistoryIndex(prev => {
          const next = Math.max(prev - 1, -1);
          setInput(next === -1 ? "" : cmdHistory[next]);
          return next;
        });
      } else if (e.key === "Tab") {
        e.preventDefault();
        const partial = input.trim().toLowerCase();
        const match = COMMANDS.find(c => c.startsWith(partial) && c !== partial);
        if (match) setInput(match);
      } else if (e.key === "Escape") {
        onClose();
      }
    },
    [submit, cmdHistory, input, onClose]
  );

  return { lines, input, setInput, handleKeyDown };
}
