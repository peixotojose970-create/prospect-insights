import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
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
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { InstallAppMenuItem, InstallAppStrip } from "@/components/prospector/InstallApp";
import { LeadWorkspace } from "@/components/prospector/LeadPanel";
import { ProspectorProvider, useProspector } from "@/features/prospector/store";
import { cn } from "@/lib/utils";
import { applyAccent, readAccent } from "@/features/prospector/accent";
import { applyHud, readHud } from "@/features/prospector/hud";

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

const allNav: readonly NavItem[] = [...mainNav, ...managementNav, { to: "/configuracoes", label: "Configurações", icon: Settings }];

function NavLink({ item, active, collapsed, onNavigate }: { item: NavItem; active: boolean; collapsed?: boolean; onNavigate?: (() => void) | undefined }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Link
          to={item.to}
          onClick={onNavigate}
          aria-label={item.label}
          className={cn(
            "group flex min-h-11 items-center rounded-full text-sm font-medium transition-all duration-200",
            collapsed ? "mx-auto size-11 justify-center" : "gap-3 px-4",
            active
              ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-[0_8px_20px_-8px_oklch(0_0_0/0.6)]"
              : "text-sidebar-foreground/75 hover:scale-105 hover:bg-sidebar-accent hover:text-sidebar-foreground",
          )}
        >
          <item.icon className="size-[19px] shrink-0" strokeWidth={1.6} aria-hidden />
          {!collapsed ? <span className="truncate">{item.label}</span> : null}
        </Link>
      </TooltipTrigger>
      {collapsed ? <TooltipContent side="right">{item.label}</TooltipContent> : null}
    </Tooltip>
  );
}

function Navigation({ pathname, collapsed = false, onNavigate }: { pathname: string; collapsed?: boolean; onNavigate?: (() => void) | undefined }) {
  return (
    <nav className={cn(collapsed ? "space-y-2" : "space-y-1")} aria-label="Navegação principal">
      {[...mainNav, ...managementNav].map((item) => <NavLink key={item.to} item={item} active={pathname === item.to} collapsed={collapsed} onNavigate={onNavigate} />)}
    </nav>
  );
}

function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className={cn("flex items-center gap-3", compact && "justify-center")} aria-label="Apex SLS Prospector: ir para o painel">
      <span className="grid size-10 shrink-0 place-items-center rounded-2xl bg-sidebar-primary text-sidebar-primary-foreground shadow-lg"><Target className="size-[18px]" /></span>
      {!compact ? <span className="leading-tight"><span className="block text-[15px] font-bold tracking-[-0.02em] text-sidebar-foreground">PROSPECTOR</span><span className="mt-0.5 block text-[9px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/70">Apex SLS</span></span> : null}
    </Link>
  );
}

function PageSearch() {
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") { e.preventDefault(); inputRef.current?.focus(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  const term = q.trim().toLowerCase();
  const matches = allNav.filter((i) => !term || i.label.toLowerCase().includes(term));
  const go = (to: NavItem["to"]) => { setQ(""); setOpen(false); inputRef.current?.blur(); void navigate({ to }); };
  return (
    <div className="relative min-w-0 flex-1 max-w-xl">
      <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" strokeWidth={1.6} />
      <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => { if (e.key === "Enter" && matches[0]) go(matches[0].to); if (e.key === "Escape") inputRef.current?.blur(); }}
        placeholder="Ir para uma tela…" aria-label="Buscar telas"
        className="h-11 w-full rounded-full border border-border bg-card/60 pl-11 pr-16 text-sm text-foreground backdrop-blur-xl transition-colors placeholder:text-muted-foreground focus:border-primary/50 focus:outline-none" />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-border bg-muted px-1.5 py-0.5 text-[10px] font-semibold text-muted-foreground sm:block">Ctrl K</kbd>
      {open && matches.length > 0 ? (
        <ul className="glass-card absolute inset-x-0 top-13 z-50 overflow-hidden rounded-2xl p-1.5 animate-rise">
          {matches.map((m) => <li key={m.to}><button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => go(m.to)} className="flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"><m.icon className="size-4 text-primary" strokeWidth={1.6} />{m.label}</button></li>)}
        </ul>
      ) : null}
    </div>
  );
}

function ShellInner({ children }: { children: ReactNode }) {
  const { mode } = useDisplayMode();
  const { leads, profile } = useProspector();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const [menuOpen, setMenuOpen] = useState(false);
  const alerts = leads.filter((lead) => lead.status === "interessado").length;
  const pageTitle = pageTitles[pathname] ?? "Prospector";
  const initials = (profile.personalName || "Você").trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => { applyHud(readHud(), false); applyAccent(readAccent(), false); }, []);
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === "Escape") setMenuOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => { setMenuOpen(false); }, [pathname]);
  useEffect(() => {
    if (!menuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = previousOverflow; };
  }, [menuOpen]);

  const drawer = (
    <div className="flex h-full flex-col bg-gradient-brand text-sidebar-foreground">
      <div className="flex h-[72px] items-center px-5"><Brand /></div>
      <div className="flex-1 overflow-y-auto px-3 py-4"><Navigation pathname={pathname} onNavigate={() => setMenuOpen(false)} /></div>
      <div className="space-y-3 border-t border-sidebar-border p-3">
        <NavLink item={{ to: "/configuracoes", label: "Configurações", icon: Settings }} active={pathname === "/configuracoes"} onNavigate={() => setMenuOpen(false)} />
        <InstallAppMenuItem className="[&_button]:border-white/20 [&_button]:bg-white/10 [&_button]:text-sidebar-foreground" />
      </div>
    </div>
  );
  const bottomItems = [mainNav[0], mainNav[1], managementNav[1], managementNav[3]];

  return (
    <div className="min-h-screen w-full max-w-full overflow-x-clip">
      <aside className={cn("fixed inset-y-3 left-3 z-40 hidden w-[76px] flex-col items-center rounded-[28px] bg-gradient-brand py-5 shadow-glow", mode === "desktop" ? "md:flex" : "")}>
        <Brand compact />
        <div className="mt-8 flex-1 overflow-y-auto"><Navigation pathname={pathname} collapsed /></div>
        <NavLink item={{ to: "/configuracoes", label: "Configurações", icon: Settings }} active={pathname === "/configuracoes"} collapsed />
      </aside>

      <div className={cn("min-h-screen min-w-0 pb-24", mode === "desktop" && "md:ml-[100px] md:pb-0")}>
        <InstallAppStrip />
        <header className="sticky top-0 z-30 flex h-[72px] items-center gap-3 border-b border-border/60 bg-background/70 px-3 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="hidden min-w-0 lg:block lg:w-44">
            <p className="truncate text-base font-bold tracking-[-0.01em] text-foreground">{pageTitle}</p>
            <p className="mt-0.5 text-[11px] font-medium text-muted-foreground">PROSPECTOR · Apex SLS</p>
          </div>
          <PageSearch />
          <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
            <span className="hidden items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1 text-[10px] font-bold tracking-[0.14em] text-primary sm:inline-flex">
              <span className="relative flex size-2"><span className="absolute inset-0 animate-ping rounded-full bg-primary opacity-75" /><span className="relative size-2 rounded-full bg-primary" /></span>AO VIVO
            </span>
            <Tooltip><TooltipTrigger asChild><Button variant="ghost" size="icon" className="relative size-10" aria-label="Ver follow-ups" asChild><Link to="/follow-ups"><Bell className="size-[18px]" strokeWidth={1.6} />{alerts > 0 ? <span className="absolute right-2.5 top-2.5 size-2 rounded-full bg-primary ring-2 ring-background" /> : null}</Link></Button></TooltipTrigger><TooltipContent>{alerts} leads interessados</TooltipContent></Tooltip>
            <DropdownMenu>
              <DropdownMenuTrigger asChild><button type="button" aria-label="Menu do usuário" className="grid size-10 place-items-center rounded-full bg-gradient-brand text-xs font-bold text-primary-foreground shadow-glow transition-transform hover:scale-105">{initials}</button></DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 rounded-2xl">
                <DropdownMenuLabel><span className="block truncate">{profile.personalName || "Seu perfil"}</span><span className="block truncate text-xs font-normal text-muted-foreground">{profile.companyName || "Apex SLS"}</span></DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild><Link to="/configuracoes"><Settings className="size-4" />Configurações</Link></DropdownMenuItem>
                <DropdownMenuItem asChild><Link to="/leads"><Users className="size-4" />Leads salvos</Link></DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="min-w-0 px-3 py-5 sm:px-6 sm:py-6 lg:px-8"><div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">{children}</div></main>
      </div>

      <nav aria-label="Navegação inferior" className={cn("fixed inset-x-2 bottom-2 z-40 flex items-center justify-around rounded-full bg-gradient-brand px-2 py-2 shadow-glow", mode === "desktop" ? "md:hidden" : "")} style={{ marginBottom: "env(safe-area-inset-bottom)" }}>
        {bottomItems.map((item) => <NavLink key={item.to} item={item} active={pathname === item.to} collapsed />)}
        <button type="button" onClick={() => setMenuOpen(true)} aria-label="Abrir menu" className="grid size-11 place-items-center rounded-full text-sidebar-foreground/80 hover:bg-sidebar-accent"><Menu className="size-5" strokeWidth={1.6} /></button>
      </nav>

      {menuOpen ? <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Menu de navegação"><button className="absolute inset-0 bg-background/70 backdrop-blur-sm" onClick={() => setMenuOpen(false)} aria-label="Fechar menu" /><aside className="relative h-full w-[min(82vw,300px)] shadow-2xl animate-rise"><Button variant="ghost" size="icon" className="absolute right-3 top-4 z-10 size-10 text-sidebar-foreground hover:bg-sidebar-accent" onClick={() => setMenuOpen(false)} aria-label="Fechar menu"><X className="size-5" /></Button>{drawer}</aside></div> : null}
      <LeadWorkspace />
    </div>
  );
}
