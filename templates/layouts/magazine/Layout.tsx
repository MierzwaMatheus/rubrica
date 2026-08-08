import { Masthead } from "./Masthead";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] font-sans">
      <Masthead />
      <main className={cn("w-full max-w-[1200px] mx-auto px-6 md:px-12 py-10", className)}>
        {children}
      </main>
    </div>
  );
}
