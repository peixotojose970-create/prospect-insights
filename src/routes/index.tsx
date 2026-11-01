import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Bell, Flame, Globe, Plus, Target, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { SaleDialog } from "@/components/prospector/SaleDialog";
import { InstallAppCard } from "@/components/prospector/InstallApp";
import { useProspector } from "@/features/prospector/store";
import { EmptyState, PageHeader, ScorePill, SourceNotice, StatusBadge } from "@/features/prospector/ui";
import type { Sale, SaleStatus } from "@/types";

export const Route = createFileRoute("/")({ component: Dashboard });
const money = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const monthKey = (date: string) => date.slice(0, 7);
const periods = [{ id: "1d", label: "Hoje", days: 1 }, { id: "7d", label: "7 dias", days: 7 }, { id: "1m", label: "1 mês", days: 30 }, { id: "3m", label: "3 meses", days: 90 }, { id: "6m", label: "6 meses", days: 180 }, { id: "1y", label: "1 ano", days: 365 }] as const;
const statusLabel: Record<SaleStatus, string> = { fechada: "Fechada", pagamento_pendente: "Pagamento pendente", cancelada: "Cancelada" };
const statusClass: Record<SaleStatus, string> = { fechada: "bg-success/15 text-success", pagamento_pendente: "bg-warning/15 text-warning", cancelada: "bg-danger/15 text-danger" };

function Dashboard() {
  const { leads, followUps, activities, sales, monthlySalesGoal, setMonthlySalesGoal, deleteSale, openLead } = useProspector();
  const [dialogOpen, setDialogOpen] = useState(false); const [editing, setEditing] = useState<Sale | null>(null);
  const [filter, setFilter] = useState("all"); const [customStart, setCustomStart] = useState(""); const [customEnd, setCustomEnd] = useState("");
  const now = new Date(); const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const lastMonth = `${now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear()}-${String(now.getMonth() === 0 ? 12 : now.getMonth()).padStart(2, "0")}`;
  const valid = sales.filter((sale) => sale.status !== "cancelada");
  const total = valid.reduce((sum, sale) => sum + sale.totalValue, 0); const received = valid.reduce((sum, sale) => sum + sale.receivedValue, 0);
  const currentReceived = valid.filter((sale) => monthKey(sale.saleDate) === currentMonth).reduce((sum, sale) => sum + sale.receivedValue, 0);
  const previousReceived = valid.filter((sale) => monthKey(sale.saleDate) === lastMonth).reduce((sum, sale) => sum + sale.receivedValue, 0);
  const filtered = useMemo(() => sales.filter((sale) => {
    if (filter === "month") return monthKey(sale.saleDate) === currentMonth;
    if (filter === "previous") return monthKey(sale.saleDate) === lastMonth;
    if (filter === "pending") return sale.status === "pagamento_pendente";
    if (filter === "cancelled") return sale.status === "cancelada";
    if (filter === "custom") return (!customStart || sale.saleDate >= customStart) && (!customEnd || sale.saleDate <= customEnd);
    return true;
  }).sort((a, b) => b.saleDate.localeCompare(a.saleDate)), [sales, filter, currentMonth, lastMonth, customStart, customEnd]);
  const stats = [
    { label: "Leads salvos", value: leads.length, icon: Users, to: "/leads" }, { label: "Sem site informado", value: leads.filter((l) => !l.website).length, icon: Globe, to: "/oportunidades" },
    { label: "Alta prioridade", value: leads.filter((l) => l.score >= 80).length, icon: Flame, to: "/oportunidades" }, { label: "Follow-ups pendentes", value: followUps.filter((f) => !f.done).length, icon: Bell, to: "/follow-ups" },
  ] as const;
  const salesStats = [["Vendas fechadas", valid.length], ["Faturamento total", money.format(total)], ["Valor recebido", money.format(received)], ["Valor a receber", money.format(total - received)], ["Vendas do mês", valid.filter((sale) => monthKey(sale.saleDate) === currentMonth).length], ["Ticket médio", money.format(valid.length ? total / valid.length : 0)]];
  const progress = monthlySalesGoal > 0 ? Math.min(100, (currentReceived / monthlySalesGoal) * 100) : 0;
  const [period, setPeriod] = useState<(typeof periods)[number]["id"]>("1m");
  const closedLeads = leads.filter((l) => l.status === "fechado").length;
  const chart = useMemo(() => {
    const days = periods.find((p) => p.id === period)?.days ?? 30;
    const buckets = days === 1 ? 1 : Math.min(12, days);
    const span = (days * 86_400_000) / buckets; const start = Date.now() - days * 86_400_000;
    const counts = Array.from({ length: buckets }, () => 0);
    let totalInPeriod = 0;
    for (const l of leads) { const t = Date.parse(l.savedAt); if (Number.isNaN(t) || t < start) continue; totalInPeriod++; counts[Math.min(buckets - 1, Math.floor((t - start) / span))]! += 1; }
    return { counts, max: Math.max(1, ...counts), totalInPeriod };
  }, [leads, period]);
  const openSale = (sale: Sale | null = null) => { setEditing(sale); setDialogOpen(true); };
  return <div className="space-y-6"><PageHeader title="Painel" subtitle="Acompanhe sua prospecção, vendas e recebimentos." actions={<div className="flex gap-2"><Button variant="outline" asChild><Link to="/prospeccao">Buscar empresas</Link></Button><Button onClick={() => openSale()}><Plus className="mr-1 size-4" />Registrar venda</Button></div>} /><InstallAppCard />
    <div className="grid gap-4 lg:grid-cols-[1.6fr_1fr]">
      <section className="relative overflow-hidden rounded-[24px] bg-gradient-brand p-6 text-primary-foreground shadow-glow animate-rise sm:p-8">
        <div className="pointer-events-none absolute -right-16 -top-16 size-64 rounded-full bg-primary-foreground/10 blur-2xl" />
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-primary-foreground/75">Prospecção</p>
        <h2 className="mt-3 max-w-md text-3xl font-bold leading-tight tracking-tight sm:text-4xl">Sua próxima venda começa agora</h2>
        <p className="mt-3 max-w-md text-sm text-primary-foreground/80">Encontre empresas, salve leads e transforme conversas em clientes.</p>
        <Link to="/prospeccao" className="mt-6 inline-flex h-11 items-center gap-2 rounded-full bg-primary-foreground px-6 text-sm font-semibold text-brand-deep shadow-lg transition-transform hover:-translate-y-0.5">Buscar empresas <ArrowRight className="size-4" /></Link>
      </section>
      <section className="relative flex min-h-[200px] flex-col justify-between overflow-hidden rounded-[24px] border border-border bg-background p-6 shadow-[0_24px_50px_-24px_oklch(0_0_0/0.9)] animate-rise">
        <div className="pointer-events-none absolute -bottom-20 -right-10 size-56 rounded-full bg-primary/25 blur-3xl" />
        <div className="flex items-center justify-between"><span className="text-xs font-bold uppercase tracking-[0.18em] text-muted-foreground">Leads fechados</span><Target className="size-5 text-primary" strokeWidth={1.6} /></div>
        <div className="flex gap-1.5" aria-hidden><span className="h-7 w-10 rounded-md bg-gradient-to-br from-warning/80 to-warning/30" /></div>
        <div><p className="text-5xl font-bold tabular-nums tracking-tight">{closedLeads}</p><p className="mt-2 font-mono text-xs tracking-[0.3em] text-muted-foreground">PROSPECTOR · APEX SLS</p></div>
      </section>
    </div>
    <Card className="gap-4 p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Leads salvos no período</p><p className="mt-1 text-4xl font-bold tabular-nums tracking-tight">{chart.totalInPeriod}</p></div>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1">{periods.map((p) => <button key={p.id} type="button" onClick={() => setPeriod(p.id)} aria-pressed={period === p.id} className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-all ${period === p.id ? "border-transparent bg-gradient-brand text-primary-foreground shadow-glow" : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"}`}>{p.label}</button>)}</div>
      </div>
      <div className="flex h-32 items-end gap-1.5">{chart.counts.map((c, i) => <div key={i} className="flex-1 rounded-t-lg bg-gradient-to-t from-brand-deep to-brand transition-all duration-500" style={{ height: `${Math.max(4, (c / chart.max) * 100)}%`, opacity: c ? 1 : 0.25 }} title={`${c} leads`} />)}</div>
    </Card>
    <div className="grid grid-cols-1 gap-3 min-[360px]:grid-cols-2 sm:gap-4 xl:grid-cols-4">{stats.map((s) => <Card key={s.label} className="group relative gap-3 overflow-hidden border-border/80 p-4 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-md"><div className="absolute inset-x-0 top-0 h-0.5 bg-primary/70 opacity-0 transition-opacity group-hover:opacity-100" /><div className="flex items-center justify-between gap-3"><p className="text-sm font-medium text-muted-foreground">{s.label}</p><span className="grid size-9 place-items-center rounded-lg bg-primary/8 text-primary"><s.icon className="size-4" /></span></div><p className="text-3xl font-bold tracking-tight tabular-nums">{s.value}</p><Link to={s.to} className="text-xs font-semibold text-primary transition-colors hover:text-primary/75">Ver detalhes →</Link></Card>)}</div>
    <section className="space-y-4"><div className="flex items-end justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Visão financeira</p><h2 className="mt-1 text-lg font-semibold tracking-tight">Financeiro de vendas</h2><p className="text-sm text-muted-foreground">Registros manuais, sem cobranças automáticas.</p></div></div><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{salesStats.map(([label, value]) => <Card key={String(label)} className="gap-1.5 border-border/80 p-4 shadow-sm"><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="text-2xl font-bold tracking-tight tabular-nums">{value}</p></Card>)}</div><Card className="gap-4 border-primary/15 bg-primary/[0.025] p-4 shadow-sm"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">Acompanhamento</p><h3 className="mt-1 font-semibold">Meta mensal de recebimentos</h3><p className="text-sm text-muted-foreground">{money.format(currentReceived)} recebidos neste mês.</p></div><label className="grid gap-1.5 text-sm font-medium">Meta (R$)<Input className="w-44 bg-background" type="number" min="0" step="0.01" value={monthlySalesGoal || ""} onChange={(e) => setMonthlySalesGoal(Math.max(0, Number(e.target.value)))} /></label></div>{monthlySalesGoal > 0 ? <><div className="h-2.5 overflow-hidden rounded-full bg-primary/10"><div className="h-full rounded-full bg-gradient-brand transition-all" style={{ width: `${progress}%` }} /></div><p className="text-xs font-medium text-muted-foreground">{progress.toFixed(0)}% da meta mensal alcançada.</p></> : <p className="text-xs text-muted-foreground">Defina uma meta para acompanhar o progresso.</p>}{previousReceived > 0 && <p className="text-xs text-muted-foreground">Mês anterior: {money.format(previousReceived)} recebidos.</p>}</Card></section>
    <section className="space-y-3"><div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end"><div><h2 className="text-lg font-semibold">Vendas recentes</h2><p className="text-sm text-muted-foreground">Consulte, edite ou atualize pagamentos registrados.</p></div><div className="grid gap-2 min-[360px]:grid-cols-2 sm:flex sm:flex-wrap"><select className="h-11 w-full rounded-md border border-input bg-transparent px-3 text-sm sm:h-9 sm:w-auto" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="all">Todas</option><option value="month">Este mês</option><option value="previous">Mês anterior</option><option value="custom">Personalizado</option><option value="pending">Pagamento pendente</option><option value="cancelled">Canceladas</option></select>{filter === "custom" && <><Input className="h-11 w-full sm:h-9 sm:w-36" type="date" value={customStart} onChange={(e) => setCustomStart(e.target.value)} /><Input className="h-11 w-full sm:h-9 sm:w-36" type="date" value={customEnd} onChange={(e) => setCustomEnd(e.target.value)} /></>}</div></div>{filtered.length === 0 ? <EmptyState title="Nenhuma venda encontrada" description="Registre sua primeira venda para acompanhar faturamento e recebimentos." action={<Button size="sm" onClick={() => openSale()}>Registrar venda</Button>} /> : <Card className="overflow-hidden p-0"><div className="divide-y divide-border">{filtered.slice(0, 12).map((sale) => <div key={sale.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between"><div className="min-w-0"><p className="break-words font-medium">{sale.clientName}</p><p className="text-sm text-muted-foreground">{sale.service} · {new Date(`${sale.saleDate}T12:00:00`).toLocaleDateString("pt-BR")}</p></div><div className="flex flex-wrap items-center gap-2 text-sm sm:justify-end"><span>Total: <b>{money.format(sale.totalValue)}</b></span><span>Recebido: <b>{money.format(sale.receivedValue)}</b></span><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass[sale.status]}`}>{statusLabel[sale.status]}</span><Button size="sm" variant="outline" className="h-11 sm:h-9" onClick={() => openSale(sale)}>Abrir</Button><Button size="sm" variant="ghost" className="h-11 text-danger sm:h-9" onClick={() => { if (window.confirm("Excluir esta venda? Esta ação não pode ser desfeita.")) deleteSale(sale.id); }}>Excluir</Button></div></div>)}</div></Card>}</section>
    <div className="grid gap-4 lg:grid-cols-2"><Card className="gap-3 p-4"><h2 className="text-sm font-semibold">Leads recentes</h2>{leads.length === 0 ? <EmptyState title="Nenhum lead salvo" description="Faça uma busca e salve empresas." action={<Button asChild size="sm"><Link to="/prospeccao">Ir para prospecção</Link></Button>} /> : <ul className="divide-y divide-border">{leads.slice(0, 6).map((lead) => <li key={lead.id} className="flex items-center justify-between gap-3 py-3"><div className="min-w-0"><p className="truncate text-sm font-medium">{lead.name}</p><div className="mt-1 flex gap-2"><StatusBadge status={lead.status} /><ScorePill score={lead.score} /></div></div><Button size="sm" variant="outline" onClick={() => openLead(lead.id)}>Abrir</Button></li>)}</ul>}</Card><Card className="gap-3 p-4"><h2 className="text-sm font-semibold">Atividade recente</h2>{activities.length === 0 ? <p className="text-sm text-muted-foreground">Suas ações aparecem aqui.</p> : <ol className="space-y-3 border-l border-border pl-4">{activities.slice(0, 8).map((a) => <li key={a.id} className="relative text-sm"><span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-primary" /><p>{a.label} — <span className="text-muted-foreground">{a.lead}</span></p><p className="text-xs text-muted-foreground">{a.at}</p></li>)}</ol>}</Card></div><SourceNotice /><SaleDialog sale={editing} open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) setEditing(null); }} /></div>;
}
