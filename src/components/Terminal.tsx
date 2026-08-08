import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { useLocation } from "wouter";
import { X } from "lucide-react";
import { useBlogPosts } from "@/hooks/useBlog";
import { blogRepository } from "@/repositories/instances";
import { useTheme } from "@/contexts/ThemeContext";
import { useTerminal, TerminalLine, TerminalOwnerInfo } from "@/hooks/useTerminal";

interface TerminalProps {
  onClose: () => void;
  ownerInfo?: TerminalOwnerInfo;
}

function LineText({ line }: { line: TerminalLine }) {
  const colorMap: Record<TerminalLine["type"], string> = {
    input: "text-white",
    output: "text-green-400",
    error: "text-red-400",
    nav: "text-yellow-400",
    welcome: "text-cyan-400",
  };
  return (
    <p className={`font-mono text-sm leading-5 whitespace-pre-wrap ${colorMap[line.type]}`}>
      {line.text}
    </p>
  );
}

export function Terminal({ onClose, ownerInfo }: TerminalProps) {
  const [, navigate] = useLocation();
  const { toggleTheme } = useTheme();
  const { posts } = useBlogPosts(blogRepository);

  const slug = ownerInfo?.slug ?? "portfolio";

  const { lines, input, setInput, handleKeyDown } = useTerminal({
    posts,
    onNavigate: navigate,
    onClose,
    onThemeToggle: toggleTheme,
    ownerInfo,
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lines]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 40 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="w-full max-w-2xl bg-[#0d0d0d] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1a1a] border-b border-white/10">
          <span className="w-3 h-3 rounded-full bg-red-500 cursor-pointer" onClick={onClose} />
          <span className="w-3 h-3 rounded-full bg-yellow-400" />
          <span className="w-3 h-3 rounded-full bg-green-500" />
          <span className="flex-1 text-center text-xs text-white/40 font-mono">
            {slug} — terminal
          </span>
          <button onClick={onClose} className="text-white/30 hover:text-white/70 transition-colors">
            <X size={14} />
          </button>
        </div>

        {/* Output area */}
        <div className="h-80 overflow-y-auto px-4 py-3 space-y-0.5">
          {lines.map((line, i) => (
            <LineText key={i} line={line} />
          ))}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="flex items-center gap-2 px-4 py-3 border-t border-white/10 bg-[#111]">
          <span className="font-mono text-sm text-green-400 shrink-0">
            visitor@{slug}:~$
          </span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent font-mono text-sm text-white outline-none caret-green-400"
            autoComplete="off"
            spellCheck={false}
          />
        </div>
      </motion.div>
    </div>
  );
}
