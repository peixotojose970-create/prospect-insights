import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  Flame,
  Kanban,
  LayoutDashboard,
  Moon,
  Search,
  Settings,
  Sun,
  Target,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { LeadWorkspace } from "@/components/prospector/LeadPanel";
import { ProspectorProvider, useProspector } from "@/features/prospector/store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/prospeccao", label: "Prospecção", icon: Search },
  { to: "/oportunidades", label: "Oportunidades", icon: Flame },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/follow-ups", label: "Follow-ups", icon: Bell },
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;

const mobileNav = nav.filter((n) => n.to !== "/configuracoes");

export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return { dark, setDark };
}

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ProspectorProvider>
      <ShellInner>{children}</ShellInner>
    </ProspectorProvider>
  );
}

function ShellInner({ children }: { children: React.ReactNode }) {
  const { dark, setDark } = useTheme();
  const { leads } = useProspector();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const alerts = leads.filter((l) => l.saved && l.status === "interessado").length;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        const input = document.querySelector<HTMLInputElement>("[data-global-search]");
        if (input) input.focus();
        else window.location.assign("/prospeccao");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b border-border bg-card px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground">
            <Target className="size-4" aria-hidden />
          </span>
          <span className="truncate text-sm font-semibold tracking-tight text-foreground">PROSPECTOR</span>
        </Link>
        <span className="ml-2 hidden rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground md:inline">
          Protótipo com dados de demonstração
        </span>
        <div className="ml-auto flex shrink-0 items-center gap-1">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={() => setDark(!dark)} aria-label="Alternar tema">
                {dark ? <Moon className="size-4" /> : <Sun className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent>Tema {dark ? "escuro" : "claro"}</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Notificações" className="relative">
                <Bell className="size-4" />
                {alerts > 0 ? (
                  <span className="absolute top-1.5 right-1.5 size-1.5 rounded-full bg-danger" aria-hidden />
                ) : null}
              </Button>
            </TooltipTrigger>
            <TooltipContent>{alerts} leads interessados</TooltipContent>
          </Tooltip>
          <span className="ml-1 grid size-8 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground">
            JP
          </span>
        </div>
      </header>

      <div className="flex">
        <aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 border-r border-border bg-card md:block md:w-16 lg:w-56">
          <nav className="flex flex-col gap-1 p-2">
            {nav.map((item) => {
              const active = pathname === item.to;
              return (
                <Tooltip key={item.to}>
                  <TooltipTrigger asChild>
                    <Link
                      to={item.to}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                        active
                          ? "bg-primary/10 text-primary"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon className="size-4 shrink-0" aria-hidden />
                      <span className="hidden truncate lg:inline">{item.label}</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="lg:hidden">
                    {item.label}
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </nav>
          <div className="hidden px-4 pt-4 text-xs text-muted-foreground lg:block">
            <p className="font-medium text-foreground">Atalhos</p>
            <p className="mt-1">Ctrl + K — buscar</p>
            <p>Esc — fechar</p>
          </div>
        </aside>

        <main className="min-w-0 flex-1 px-4 pt-5 pb-24 sm:px-6 md:pb-8">
          <div className="mx-auto max-w-7xl space-y-6">{children}</div>
        </main>
      </div>

      <nav className="fixed bottom-0 z-30 flex w-full items-stretch border-t border-border bg-card md:hidden">
        {mobileNav.map((item) => {
          const active = pathname === item.to;
          return (
            <Link
              key={item.to}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center gap-1 py-2 text-[10px] font-medium",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <item.icon className="size-4" aria-hidden />
              <span className="truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <LeadWorkspace />
    </div>
  );
}
