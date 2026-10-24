import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";

interface LayoutProps {
  children: React.ReactNode;
  className?: string;
}

export function Layout({ children, className }: LayoutProps) {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row">
      <Sidebar />
      <main className={cn(
        "flex-1 w-full lg:pl-72 pt-16 lg:pt-0 min-h-screen transition-all duration-300",
        className
      )}>
        <div className="container mx-auto py-8 px-4 md:px-8 lg:px-12 max-w-6xl">
          {children}
        </div>
      </main>
    </div>
  );
}
