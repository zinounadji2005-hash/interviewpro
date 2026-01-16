import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Bot } from "lucide-react";
import { Link } from "wouter";

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
}

export function DashboardLayout({ children, title }: DashboardLayoutProps) {
  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  return (
    <SidebarProvider style={sidebarStyle as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between h-14 px-4 border-b border-border bg-background/95 backdrop-blur">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              {title && <h1 className="font-semibold text-lg">{title}</h1>}
            </div>
            <ThemeToggle />
          </header>
          <main className="flex-1 overflow-auto bg-muted/30">
            <div className="min-h-full flex flex-col">
              <div className="flex-1">
                {children}
              </div>
              <footer className="px-6 py-4 border-t border-border/50 bg-background/50">
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Bot className="h-3.5 w-3.5" />
                    <span>AI feedback is advisory. You remain responsible for your career decisions.</span>
                    <Link href="/ai-disclaimer" className="text-primary hover:underline ml-1" data-testid="link-ai-disclaimer-footer">
                      Learn more
                    </Link>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link href="/terms" className="hover:text-foreground transition-colors" data-testid="link-terms-footer">Terms</Link>
                    <Link href="/privacy" className="hover:text-foreground transition-colors" data-testid="link-privacy-footer">Privacy</Link>
                  </div>
                </div>
              </footer>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
