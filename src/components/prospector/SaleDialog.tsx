import { useEffect, useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useProspector } from "@/features/prospector/store";
import type { Sale, SaleStatus } from "@/types";

const today = () => new Date().toISOString().slice(0, 10);
type Draft = Omit<Sale, "id" | "createdAt" | "updatedAt">;
const blank = (): Draft => ({ clientName: "", leadId: null, service: "", totalValue: 0, receivedValue: 0, saleDate: today(), status: "fechada", notes: "" });

export function SaleDialog({ sale, open, onOpenChange }: { sale: Sale | null; open: boolean; onOpenChange: (open: boolean) => void }) {
  const { leads, createSale, updateSale } = useProspector();
  const [draft, setDraft] = useState<Draft>(blank());
  useEffect(() => { if (open) setDraft(sale ? { clientName: sale.clientName, leadId: sale.leadId, service: sale.service, totalValue: sale.totalValue, receivedValue: sale.receivedValue, saleDate: sale.saleDate, status: sale.status, notes: sale.notes } : blank()); }, [open, sale]);
  const set = (key: keyof Draft, value: string | number | null) => setDraft((prev) => ({ ...prev, [key]: value } as Draft));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!draft.clientName.trim() || !draft.service.trim() || !draft.saleDate) return toast.error("Preencha cliente, serviço e data da venda.");
    if (!Number.isFinite(draft.totalValue) || draft.totalValue < 0 || !Number.isFinite(draft.receivedValue) || draft.receivedValue < 0) return toast.error("Os valores devem ser positivos.");
    if (draft.receivedValue > draft.totalValue) return toast.error("O valor recebido não pode superar o valor total.");
    const clean = { ...draft, clientName: draft.clientName.trim(), service: draft.service.trim(), notes: draft.notes.trim() };
    if (sale) updateSale(sale.id, clean); else createSale(clean);
    toast.success(sale ? "Venda atualizada." : "Venda registrada."); onOpenChange(false);
  };
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[92dvh] w-[calc(100vw-1.5rem)] overflow-y-auto p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:max-w-xl sm:p-6"><DialogHeader><DialogTitle>{sale ? "Editar venda" : "Registrar venda"}</DialogTitle><DialogDescription>Registre manualmente os valores da sua venda.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4 [&_input]:h-11 [&_select]:h-11 [&_textarea]:min-h-28 sm:[&_input]:h-9 sm:[&_select]:h-9"><div className="grid gap-4 sm:grid-cols-2"><Field label="Cliente ou empresa"><Input value={draft.clientName} onChange={(e) => set("clientName", e.target.value)} placeholder="Nome do cliente" /></Field><Field label="Lead relacionado (opcional)"><select className="flex w-full rounded-md border border-input bg-transparent px-3 text-sm" value={draft.leadId ?? ""} onChange={(e) => set("leadId", e.target.value || null)}><option value="">Sem lead relacionado</option>{leads.map((lead) => <option key={lead.id} value={lead.id}>{lead.name}</option>)}</select></Field><Field label="Serviço vendido"><Input value={draft.service} onChange={(e) => set("service", e.target.value)} placeholder="Ex.: criação de site" /></Field><Field label="Data da venda"><Input type="date" value={draft.saleDate} onChange={(e) => set("saleDate", e.target.value)} /></Field><Field label="Valor total (R$)"><Input type="number" min="0" step="0.01" value={draft.totalValue || ""} onChange={(e) => set("totalValue", Number(e.target.value))} /></Field><Field label="Valor já recebido (R$)"><Input type="number" min="0" step="0.01" value={draft.receivedValue || ""} onChange={(e) => set("receivedValue", Number(e.target.value))} /></Field><Field label="Status"><select className="flex w-full rounded-md border border-input bg-transparent px-3 text-sm" value={draft.status} onChange={(e) => set("status", e.target.value as SaleStatus)}><option value="fechada">Fechada</option><option value="pagamento_pendente">Pagamento pendente</option><option value="cancelada">Cancelada</option></select></Field></div><Field label="Observações (opcional)"><Textarea value={draft.notes} onChange={(e) => set("notes", e.target.value)} /></Field><div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><Button className="h-11 sm:h-9" type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button className="h-11 sm:h-9" type="submit">Salvar venda</Button></div></form></DialogContent></Dialog>;
}
function Field({ label, children }: { label: string; children: ReactNode }) { return <label className="grid gap-1.5 text-sm font-medium text-foreground"><span>{label}</span>{children}</label>; }
