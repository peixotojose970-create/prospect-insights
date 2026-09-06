import { useState } from "react";
import {
  Bell,
  Copy,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Monitor,
  Phone,
  Save,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { buildKit, demoPhotos } from "@/features/prospector/generators";
import { useProspector } from "@/features/prospector/store";
import { copyText, DemoNotice, ScoreBar, SiteBadge, StatusBadge, priorityOf } from "@/features/prospector/ui";
import { LEAD_STATUSES, type ContactType, type Lead } from "@/types";
import { CreateSiteDialog } from "./CreateSiteDialog";
import { MessageDialog } from "./MessageDialog";

export function LeadWorkspace() {
  const { leads, openLeadId, openLead } = useProspector();
  const [siteLead, setSiteLead] = useState<Lead | null>(null);
  const [msgLead, setMsgLead] = useState<Lead | null>(null);
  const lead = leads.find((l) => l.id === openLeadId) ?? null;

  return (
    <>
      <Sheet open={!!lead} onOpenChange={(o) => !o && openLead(null)}>
        <SheetContent className="w-full gap-0 overflow-y-auto p-0 sm:max-w-xl">
          {lead ? (
            <LeadPanelBody
              lead={lead}
              onCreateSite={() => setSiteLead(lead)}
              onGenerateMessage={() => setMsgLead(lead)}
            />
          ) : null}
        </SheetContent>
      </Sheet>
      <CreateSiteDialog lead={siteLead} onOpenChange={(o) => !o && setSiteLead(null)} />
      <MessageDialog lead={msgLead} onOpenChange={(o) => !o && setMsgLead(null)} />
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-6 py-5">
      <h3 className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">{title}</h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function LeadPanelBody({
  lead,
  onCreateSite,
  onGenerateMessage,
}: {
  lead: Lead;
  onCreateSite: () => void;
  onGenerateMessage: () => void;
}) {
  const { saveLead, setStatus, setNotes, registerContact, createFollowUp, followUps } = useProspector();
  const [contactOpen, setContactOpen] = useState(false);
  const [contactType, setContactType] = useState<ContactType>("whatsapp");
  const [contactNote, setContactNote] = useState("");
  const [zoom, setZoom] = useState<string | null>(null);
  const [kitOpen, setKitOpen] = useState(false);
  const priority = priorityOf(lead.score);
  const photos = demoPhotos(lead);
  const nextFollowUp = followUps.find((f) => f.leadId === lead.id && !f.done);

  const info: [string, string][] = [
    ["Nome", lead.name],
    ["Categoria", lead.category],
    ["Endereço", lead.address],
    ["Cidade", lead.city],
    ["Estado", lead.state],
    ["Telefone", lead.phone],
    ["Website", lead.website ?? "Sem site"],
    ["Instagram", lead.instagram ?? "Não informado"],
  ];

  return (
    <div className="pb-10">
      <SheetHeader className="gap-1 border-b border-border px-6 pt-6 pb-5">
        <SheetTitle className="text-lg">{lead.name}</SheetTitle>
        <SheetDescription>{lead.category}</SheetDescription>
        <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
          <span className="font-medium text-foreground">★ {lead.rating.toFixed(1)}</span>
          <span>{lead.reviews} avaliações</span>
          <span className="inline-flex items-center gap-1">
            <MapPin className="size-3.5" aria-hidden />
            {lead.city} - {lead.state}
          </span>
          <StatusBadge status={lead.status} />
        </div>
      </SheetHeader>

      <Section title="Ações">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            onClick={() => {
              registerContact(lead.id, "whatsapp", "Abordagem via WhatsApp (demonstração)");
              copyText(lead.phone, "Telefone copiado — abra o WhatsApp manualmente nesta versão.");
            }}
          >
            <MessageCircle className="size-3.5" aria-hidden />
            WhatsApp
          </Button>
          <Button size="sm" variant="outline" onClick={() => copyText(lead.phone, "Telefone copiado.")}>
            <Copy className="size-3.5" aria-hidden />
            Copiar telefone
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => copyText(`${lead.address}, ${lead.city} - ${lead.state}`, "Endereço copiado.")}
          >
            <MapPin className="size-3.5" aria-hidden />
            Abrir localização
          </Button>
          <Button
            size="sm"
            variant="outline"
            disabled={!lead.website}
            onClick={() => lead.website && copyText(lead.website, "Endereço do site copiado.")}
          >
            <Globe className="size-3.5" aria-hidden />
            Site
          </Button>
          <Button size="sm" variant="outline" onClick={onCreateSite}>
            <Monitor className="size-3.5" aria-hidden />
            Criar Site
          </Button>
          <Button size="sm" variant="outline" onClick={onGenerateMessage}>
            <Mail className="size-3.5" aria-hidden />
            Gerar mensagem
          </Button>
          <Button size="sm" variant="outline" onClick={() => setKitOpen(true)}>
            Gerar kit
          </Button>
          <Button
            size="sm"
            variant={lead.saved ? "secondary" : "outline"}
            onClick={() => {
              saveLead(lead.id);
              toastSaved(lead.saved);
            }}
          >
            <Save className="size-3.5" aria-hidden />
            {lead.saved ? "Salvo" : "Salvar"}
          </Button>
        </div>
      </Section>
      <Separator />

      <Section title="Informações">
        <dl className="grid grid-cols-2 gap-3">
          {info.map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-xs text-muted-foreground">{k}</dt>
              <dd className="truncate text-sm font-medium text-foreground">{v}</dd>
            </div>
          ))}
        </dl>
        {lead.instagram ? (
          <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Instagram className="size-3.5" aria-hidden />
            {lead.instagram}
          </p>
        ) : null}
      </Section>
      <Separator />

      <Section title="Qualificação">
        <div className="flex items-baseline justify-between">
          <p className="text-2xl font-semibold tabular-nums text-foreground">
            {lead.score}
            <span className="text-sm font-normal text-muted-foreground">/100</span>
          </p>
          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
            <span className={`size-2 rounded-full ${priority.dot}`} aria-hidden />
            {priority.label}
          </span>
        </div>
        <ScoreBar score={lead.score} className="mt-2" />
        <ul className="mt-4 space-y-1.5">
          {lead.scoreFactors.map((f) => (
            <li key={f.label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{f.label}</span>
              <span className="font-mono text-xs text-success">+{f.points}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex flex-wrap gap-3 text-xs">
          <SiteBadge lead={lead} />
          <span className="text-muted-foreground">Telefone: {lead.phone}</span>
          <span className="text-muted-foreground">
            WhatsApp: {lead.whatsapp ? "disponível" : "não informado"}
          </span>
        </div>
      </Section>
      <Separator />

      <Section title="CRM">
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <Label htmlFor={`status-${lead.id}`} className="text-xs text-muted-foreground">
              Status
            </Label>
            <Select value={lead.status} onValueChange={(v) => setStatus(lead.id, v as Lead["status"])}>
              <SelectTrigger id={`status-${lead.id}`} className="mt-1 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEAD_STATUSES.map((s) => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Último contato</p>
            <p className="mt-2 text-sm font-medium text-foreground">{lead.lastContact ?? "Sem contato"}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Próximo follow-up</p>
            <p className="mt-2 text-sm font-medium text-foreground">
              {nextFollowUp ? nextFollowUp.label : "Não agendado"}
            </p>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => setContactOpen(true)}>
            Registrar contato
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => createFollowUp(lead.id, "Retomar contato com proposta")}
          >
            <Bell className="size-3.5" aria-hidden />
            Criar follow-up
          </Button>
        </div>
      </Section>
      <Separator />

      <Section title="Observações">
        <Textarea
          aria-label="Observações do lead"
          value={lead.notes}
          onChange={(e) => setNotes(lead.id, e.target.value)}
          placeholder="Cliente demonstrou interesse em site moderno. Pediu retorno amanhã."
          rows={3}
        />
      </Section>
      <Separator />

      <Section title="Fotos de demonstração">
        <div className="grid grid-cols-3 gap-2">
          {photos.map((p) => (
            <ContextMenu key={p.id}>
              <ContextMenuTrigger asChild>
                <button
                  type="button"
                  onClick={() => setZoom(p.url)}
                  className="overflow-hidden rounded-md border border-border focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <img
                    src={p.url}
                    alt={p.alt}
                    loading="lazy"
                    className="aspect-[4/3] w-full object-cover transition-transform hover:scale-[1.03]"
                  />
                </button>
              </ContextMenuTrigger>
              <ContextMenuContent>
                <ContextMenuItem onClick={() => setZoom(p.url)}>Abrir imagem</ContextMenuItem>
                <ContextMenuItem onClick={() => copyText(p.url, "Link da imagem copiado.")}>
                  Copiar imagem
                </ContextMenuItem>
                <ContextMenuItem onClick={() => copyText(p.url, "Origem copiada.")}>
                  Abrir origem
                </ContextMenuItem>
              </ContextMenuContent>
            </ContextMenu>
          ))}
        </div>
        <DemoNotice className="mt-2" />
      </Section>
      <Separator />

      <Section title="Histórico">
        <ol className="space-y-3">
          {lead.history.map((h) => (
            <li key={h.id} className="flex gap-3">
              <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-primary" aria-hidden />
              <div className="min-w-0">
                <p className="text-sm text-foreground">{h.label}</p>
                <p className="text-xs text-muted-foreground">{h.date}</p>
              </div>
            </li>
          ))}
        </ol>
      </Section>

      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Registrar contato</DialogTitle>
            <DialogDescription>{lead.name}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="contact-type">Tipo</Label>
              <Select value={contactType} onValueChange={(v) => setContactType(v as ContactType)}>
                <SelectTrigger id="contact-type" className="mt-1 w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                  <SelectItem value="ligacao">Ligação</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="contact-note">Observação</Label>
              <Textarea
                id="contact-note"
                className="mt-1"
                rows={3}
                value={contactNote}
                onChange={(e) => setContactNote(e.target.value)}
                placeholder="O que foi conversado?"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={() => {
                registerContact(lead.id, contactType, contactNote);
                setContactNote("");
                setContactOpen(false);
              }}
            >
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={kitOpen} onOpenChange={setKitOpen}>
        <DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kit do lead</DialogTitle>
            <DialogDescription>Central de materiais de {lead.name}.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {buildKit(lead).map((item) => (
              <div key={item.title} className="rounded-md border border-border p-3">
                <div className="flex items-center justify-between gap-3">
                  <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyText(item.content, `${item.title} copiado.`)}
                  >
                    <Copy className="size-3.5" aria-hidden />
                    Copiar
                  </Button>
                </div>
                <p className="mt-2 max-h-32 overflow-auto text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                  {item.content}
                </p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!zoom} onOpenChange={(o) => !o && setZoom(null)}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Foto de demonstração</DialogTitle>
            <DialogDescription>Imagem ilustrativa do nicho {lead.category}.</DialogDescription>
          </DialogHeader>
          {zoom ? (
            <img src={zoom} alt={`Foto de demonstração ampliada — ${lead.name}`} className="w-full rounded-md" />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function toastSaved(alreadySaved: boolean) {
  import("sonner").then(({ toast }) =>
    toast.success(alreadySaved ? "Lead atualizado." : "Lead salvo em Meus Leads."),
  );
}
