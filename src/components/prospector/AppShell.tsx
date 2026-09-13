import { useEffect, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Flame, Kanban, LayoutDashboard, Mail, Moon, MoreVertical, Search, Settings, Sun, Target, Users, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InstallAppMenuItem, InstallAppStrip } from "@/components/prospector/InstallApp";
import { LeadWorkspace } from "@/components/prospector/LeadPanel";
import { ProspectorProvider, useProspector } from "@/features/prospector/store";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/prospeccao", label: "Prospecção", icon: Search },
  { to: "/us-contact", label: "EUA", icon: Mail },
  { to: "/rapido", label: "Modo rápido", icon: Zap },
  { to: "/oportunidades", label: "Oportunidades", icon: Flame },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/follow-ups", label: "Follow-ups", icon: Bell },
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/configuracoes", label: "Configurações", icon: Settings },
] as const;
const mobileNav = [
  { to: "/prospeccao", label: "Buscar", icon: Search },
  { to: "/oportunidades", label: "Oportun.", icon: Flame },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/follow-ups", label: "Follow-up", icon: Bell },
  { to: "/", label: "Painel", icon: LayoutDashboard },
] as const;
export function useTheme() { const [dark, setDark] = useState(false); useEffect(() => { document.documentElement.classList.toggle("dark", dark); }, [dark]); return { dark, setDark }; }
export function AppShell({ children }: { children: React.ReactNode }) { return <ProspectorProvider><ShellInner>{children}</ShellInner></ProspectorProvider>; }
function ShellInner({ children }: { children: React.ReactNode }) {
  const { dark, setDark } = useTheme(); const { leads } = useProspector(); const pathname = useRouterState({ select: (s) => s.location.pathname }); const alerts = leads.filter((l) => l.status === "interessado").length;
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); const input = document.querySelector<HTMLInputElement>("[data-global-search]"); if (input) input.focus(); else window.location.assign("/prospeccao"); } }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, []);
  return <div className="min-h-screen bg-background">
    <InstallAppStrip />
    <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-card px-3 sm:px-4">
      <Link to="/" className="flex min-w-0 items-center gap-2"><span className="grid size-7 shrink-0 place-items-center rounded-md bg-primary text-primary-foreground"><Target className="size-4" /></span><span className="truncate text-sm font-semibold tracking-tight text-foreground">PROSPECTOR</span></Link>
      <span className="ml-2 hidden rounded-md border border-border px-2 py-0.5 text-xs text-muted-foreground lg:inline">Dados oficiais do Google Maps</span>
      <div className="ml-auto flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" className="hidden size-10 md:inline-flex" onClick={() => setDark(!dark)} aria-label="Alternar tema">{dark ? <Moon className="size-4" /> : <Sun className="size-4" />}</Button>
        <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" aria-label="Notificações" className="relative size-10" asChild><Link to="/follow-ups"><Bell className="size-4" />{alerts > 0 ? <span className="absolute top-2 right-2 size-1.5 rounded-full bg-danger" /> : null}</Link></Button></TooltipTrigger><TooltipContent>{alerts} leads interessados</TooltipContent></Tooltip>
        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="size-10" aria-label="Mais opções"><MoreVertical className="size-4" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="w-56"><DropdownMenuLabel>Prospector</DropdownMenuLabel><DropdownMenuItem asChild><Link to="/us-contact"><Mail className="size-4" />Prospecção EUA</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/leads"><Search className="size-4" />Buscar leads salvos</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/rapido"><Zap className="size-4" />Prospecção rápida</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/pipeline"><Kanban className="size-4" />Pipeline</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/configuracoes"><Settings className="size-4" />Configurações</Link></DropdownMenuItem><DropdownMenuSeparator /><DropdownMenuItem onSelect={() => setDark(!dark)}>{dark ? <Moon className="size-4" /> : <Sun className="size-4" />}Tema {dark ? "escuro" : "claro"}</DropdownMenuItem></DropdownMenuContent></DropdownMenu>
        <span className="ml-1 hidden size-8 place-items-center rounded-full bg-muted text-xs font-semibold text-foreground sm:grid">JP</span>
      </div>
    </header>
    <div className="flex"><aside className="sticky top-14 hidden h-[calc(100vh-3.5rem)] shrink-0 border-r border-border bg-card md:block md:w-16 lg:w-56"><nav className="flex flex-col gap-1 p-2">{nav.map((item) => { const active = pathname === item.to; return <Tooltip key={item.to}><TooltipTrigger asChild><Link to={item.to} className={cn("flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors", active ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><item.icon className="size-4 shrink-0" /><span className="hidden truncate lg:inline">{item.label}</span></Link></TooltipTrigger><TooltipContent side="right" className="lg:hidden">{item.label}</TooltipContent></Tooltip>; })}</nav><InstallAppMenuItem className="hidden px-3 pt-3 lg:block" /></aside><main className="min-w-0 flex-1 px-3 pt-4 pb-28 sm:px-6 sm:pt-5 md:pb-8"><div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">{children}</div></main></div>
    <nav className="fixed bottom-0 z-30 flex w-full items-stretch border-t border-border bg-card pb-[env(safe-area-inset-bottom)] md:hidden" aria-label="Navegação principal">{mobileNav.map((item) => { const active = pathname === item.to; return <Link key={item.to} to={item.to} className={cn("flex min-h-14 flex-1 flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium", active ? "text-primary" : "text-muted-foreground")}><item.icon className="size-5" /><span className="max-w-full truncate px-0.5">{item.label}</span></Link>; })}</nav>
    <LeadWorkspace />
  </div>;
}
