import { Navbar } from "./Navbar";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div
      style={{ fontFamily: "var(--font-mono, monospace)" }}
      className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col"
    >
      <Navbar />
      <main className={cn("flex-1 w-full", className)}>
        <div className="max-w-[1200px] mx-auto px-7 py-6">{children}</div>
      </main>
      <footer className="border-t-2 border-[var(--text)] px-4 py-2.5 flex justify-between text-xs opacity-65">
        <span>UTF-8 · LF · monospace</span>
        <span />
        <span>v1.0.0 · MIT</span>
      </footer>
    </div>
  );
}
