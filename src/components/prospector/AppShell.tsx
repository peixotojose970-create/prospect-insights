import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import {
  Bell,
  ChevronLeft,
  Computer,
  Smartphone,
  ChevronRight,
  Flame,
  Kanban,
  LayoutDashboard,
  Menu,
  MessageCircle,
  Moon,
  Search,
  Settings,
  Sun,
  Target,
  Users,
  X,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InstallAppMenuItem, InstallAppStrip } from "@/components/prospector/InstallApp";
import { LeadWorkspace } from "@/components/prospector/LeadPanel";
import { ProspectorProvider, useProspector } from "@/features/prospector/store";
import { cn } from "@/lib/utils";

const mainNav = [
  { to: "/", label: "Painel", icon: LayoutDashboard },
  { to: "/prospeccao", label: "Buscar empresas", icon: Search },
  { to: "/rapido", label: "Modo rápido", icon: Zap },
] as const;
const managementNav = [
  { to: "/oportunidades", label: "Oportunidades", icon: Flame },
  { to: "/leads", label: "Leads salvos", icon: Users },
  { to: "/trabalhar-leads", label: "Trabalhar leads", icon: MessageCircle },
  { to: "/pipeline", label: "Pipeline", icon: Kanban },
  { to: "/follow-ups", label: "Follow-ups", icon: Bell },
] as const;

const pageTitles: Record<string, string> = {
  "/": "Painel",
  "/prospeccao": "Buscar empresas",
  "/rapido": "Modo rápido",
  "/oportunidades": "Oportunidades",
  "/leads": "Leads salvos",
  "/trabalhar-leads": "Trabalhar leads",
  "/pipeline": "Pipeline",
  "/follow-ups": "Follow-ups",
  "/configuracoes": "Configurações",
};

export function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);
  return { dark, setDark };
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <ProspectorProvider>
      <DisplayModeProvider><ShellInner>{children}</ShellInner></DisplayModeProvider>
    </ProspectorProvider>
  );
}

export type DisplayMode = "desktop" | "mobile";
const DISPLAY_MODE_KEY = "prospector:display-mode";

type DisplayModeContextValue = {
  mode: DisplayMode | null;
  selectMode: (mode: DisplayMode) => void;
};
const DisplayModeContext = createContext<DisplayModeContextValue | null>(null);

function DisplayModeProvider({ children }: { children: ReactNode }) {
  // A navegação sempre inicia em um modo seguro. A antiga tela obrigatória de
  // escolha foi removida da inicialização para não bloquear o aplicativo.
  const [mode, setMode] = useState<DisplayMode>("desktop");

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(DISPLAY_MODE_KEY);
      if (saved === "desktop" || saved === "mobile") setMode(saved);
    } catch {
      // O Prospector continua utilizável mesmo se o navegador bloquear armazenamento local.
    }
  }, []);

  const selectMode = (next: DisplayMode) => {
    try {
      window.localStorage.setItem(DISPLAY_MODE_KEY, next);
    } catch {
      // Mantém a preferência apenas nesta sessão quando o armazenamento não estiver disponível.
    }
    setMode(next);
  };

  useEffect(() => {
    document.documentElement.dataset["displayMode"] = mode;
  }, [mode]);

  return <DisplayModeContext.Provider value={{ mode, selectMode }}>{children}</DisplayModeContext.Provider>;
}

export function useDisplayMode() {
  const value = useContext(DisplayModeContext);
  if (!value) throw new Error("useDisplayMode deve ser usado dentro do AppShell");
  return value;
}

function ModeChoice({ onSelect }: { onSelect: (mode: DisplayMode) => void }) {
  const [selected, setSelected] = useState<DisplayMode | null>(null);
  return <main className="grid min-h-screen place-items-center bg-background px-4 py-8"><section className="w-full max-w-3xl space-y-6">
    <div className="text-center"><h1 className="text-2xl font-bold text-foreground">Como você vai usar o PROSPECTOR?</h1><p className="mt-2 text-muted-foreground">Escolha a interface mais adequada para você. Você poderá mudar isso depois nas Configurações.</p></div>
    <div className="grid gap-4 sm:grid-cols-2">
      {([{ mode: "desktop", title: "MODO PC", text: "Vou usar no computador.", description: "Menu lateral fixo, painéis mais amplos e aproveitamento de telas grandes.", Icon: Computer }, { mode: "mobile", title: "MODO CELULAR", text: "Vou usar no celular.", description: "Menu deslizante, botões acessíveis, painéis compactos e navegação adaptada à tela pequena.", Icon: Smartphone }] as const).map(({ mode, title, text, description, Icon }) => <button key={mode} type="button" onClick={() => setSelected(mode)} aria-pressed={selected === mode} className={cn("rounded-xl border bg-card p-6 text-left transition-colors", selected === mode ? "border-primary ring-2 ring-primary" : "border-border hover:border-primary/50")}><Icon className="mb-4 size-8 text-primary" /><span className="block text-xs font-bold tracking-wider text-primary">{title}</span><span className="mt-2 block font-semibold text-foreground">{text}</span><span className="mt-2 block text-sm text-muted-foreground">{description}</span></button>)}
    </div>
    <div className="text-center"><Button disabled={!selected} onClick={() => selected && onSelect(selected)} className="min-w-40">Continuar</Button></div>
  </section></main>;
}

type NavItem = {
  to: "/" | "/prospeccao" | "/rapido" | "/oportunidades" | "/leads" | "/trabalhar-leads" | "/pipeline" | "/follow-ups" | "/configuracoes";
  label: string;
  icon: typeof LayoutDashboard;
};

function NavLink({ item, active, collapsed, onNavigate }: { item: NavItem; active: boolean; collapsed?: boolean; onNavigate?: (() => void) | undefined }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={item.to}
          onClick={onNavigate}
          className={cn(
            "group flex min-h-11 items-center rounded-lg px-3 text-sm font-medium transition-colors",
            collapsed ? "justify-center" : "gap-3",
            active
              ? "bg-primary text-primary-foreground shadow-sm"
              : "text-slate-300 hover:bg-white/10 hover:text-white",
          )}
        >
          <item.icon className="size-[18px] shrink-0" aria-hidden />
          {!collapsed ? <span className="truncate">{item.label}</span> : null}
        </Link>
      </TooltipTrigger>
      {collapsed ? <TooltipContent side="right">{item.label}</TooltipContent> : null}
    </Tooltip>
  );
}

function Navigation({ pathname, collapsed = false, onNavigate }: { pathname: string; collapsed?: boolean; onNavigate?: (() => void) | undefined }) {
  return (
    <nav className="space-y-6" aria-label="Navegação principal">
      <section>
        {!collapsed ? <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Visão geral</p> : null}
        <div className="space-y-1">{mainNav.map((item) => <NavLink key={item.to} item={item} active={pathname === item.to} collapsed={collapsed} onNavigate={onNavigate} />)}</div>
      </section>
      <section>
        {!collapsed ? <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-500">Gestão de leads</p> : null}
        <div className="space-y-1">{managementNav.map((item) => <NavLink key={item.to} item={item} active={pathname === item.to} collapsed={collapsed} onNavigate={onNavigate} />)}</div>
      </section>
    </nav>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-3", compact && "justify-center")} aria-label="Prospector: ir para o painel">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm"><Target className="size-5" /></span>
      {!compact ? <span className="text-base font-bold tracking-tight text-white">PROSPECTOR</span> : null}
    </Link>
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const { dark, setDark } = useTheme();
  const { mode } = useDisplayMode();
  const { leads } = useProspector();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const alerts = leads.filter((lead) => lead.status === "interessado").length;
  const pageTitle = pageTitles[pathname] ?? "Prospector";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [menuOpen]);

  const sidebar = (
    <div className="flex h-full flex-col bg-slate-950 text-slate-100">
      <div className={cn("flex h-[72px] items-center border-b border-white/10", collapsed ? "justify-center px-2" : "px-5")}><Brand compact={collapsed} /></div>
      <div className="flex-1 overflow-y-auto px-3 py-5"><Navigation pathname={pathname} collapsed={collapsed} onNavigate={() => setMenuOpen(false)} /></div>
      <div className="space-y-3 border-t border-white/10 p-3">
        <NavLink item={{ to: "/configuracoes", label: "Configurações", icon: Settings }} active={pathname === "/configuracoes"} collapsed={collapsed} onNavigate={() => setMenuOpen(false)} />
        {!collapsed ? <InstallAppMenuItem className="[&_button]:border-white/15 [&_button]:bg-white/5 [&_button]:text-slate-100 [&_button:hover]:bg-white/10" /> : null}
      </div>
    </div>
  );

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip bg-background">
      <aside className={cn("fixed inset-y-0 left-0 z-40 hidden border-r border-white/10 transition-[width] duration-200", mode === "desktop" ? "md:block" : "", collapsed ? "w-[72px]" : "w-60")}>
        {sidebar}
        <Button variant="ghost" size="icon" className="absolute -right-4 top-[88px] z-10 size-8 rounded-full border border-border bg-card text-foreground shadow-sm hover:bg-muted" onClick={() => setCollapsed((value) => !value)} aria-label={collapsed ? "Expandir menu" : "Recolher menu"}>
          {collapsed ? <ChevronRight className="size-4" /> : <ChevronLeft className="size-4" />}
        </Button>
      </aside>

      <div className={cn("min-h-screen min-w-0 transition-[margin] duration-200", mode === "desktop" && "md:ml-60", mode === "desktop" && collapsed && "md:ml-[72px]")}>
        <InstallAppStrip />
        <header className="sticky top-0 z-30 flex h-16 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-background/80 sm:px-6">
          <Button variant="ghost" size="icon" className={cn("-ml-2 size-10", mode === "desktop" ? "md:hidden" : "md:inline-flex")} onClick={() => setMenuOpen(true)} aria-label="Abrir menu"><Menu className="size-5" /></Button>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground sm:text-base">{pageTitle}</p>
            <p className="hidden text-xs text-muted-foreground lg:block">PROSPECTOR</p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Button variant="ghost" size="icon" className="size-10" onClick={() => setDark(!dark)} aria-label="Alternar tema">{dark ? <Moon className="size-[18px]" /> : <Sun className="size-[18px]" />}</Button>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="relative size-10" aria-label="Ver follow-ups" asChild><Link to="/follow-ups"><Bell className="size-[18px]" />{alerts > 0 ? <span className="absolute right-2.5 top-2.5 size-1.5 rounded-full bg-danger" /> : null}</Link></Button></TooltipTrigger><TooltipContent>{alerts} leads interessados</TooltipContent></Tooltip>
          </div>
        </header>
        <main className="min-w-0 px-3 py-5 sm:px-6 sm:py-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">{children}</div></main>
      </div>

      {menuOpen ? <div className={cn("fixed inset-0 z-50", mode === "desktop" ? "md:hidden" : "")} role="dialog" aria-modal="true" aria-label="Menu de navegação"><button className="absolute inset-0 bg-slate-950/60" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" /><aside className="relative h-full w-[min(82vw,300px)] shadow-2xl"><Button variant="ghost" size="icon" className="absolute right-3 top-4 z-10 size-10 text-slate-300 hover:bg-white/10 hover:text-white" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X className="size-5" /></Button>{sidebar}</aside></div> : null}
      <LeadWorkspace />
    </div>
  );
}
