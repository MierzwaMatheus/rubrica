import { SwissNav } from "./Sidebar";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)] flex flex-col font-sans">
      <SwissNav />
      <main className={cn("flex-1 w-full", className)}>
        {children}
      </main>
    </div>
  );
}
