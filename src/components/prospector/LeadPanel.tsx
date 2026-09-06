import { useEffect, useState } from "react";
import { BookmarkPlus, Copy, Globe, Instagram, MapPin, MessageCircle, Phone, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CreateSiteDialog } from "@/components/prospector/CreateSiteDialog";
import { MessageDialog } from "@/components/prospector/MessageDialog";
import { buildKit } from "@/features/prospector/generators";
import { placeDetailsRepository, photoProvider } from "@/features/prospector/repository";
import {
  formatPhone,
  fullAddress,
  ratingLabel,
  whatsappLabel,
  whatsappLink,
} from "@/features/prospector/format";
import { useProspector } from "@/features/prospector/store";
import { ScoreBar, SourceNotice, StatusBadge, copyText } from "@/features/prospector/ui";
import { LEAD_STATUSES, type Business, type ContactType, type Lead, type LeadStatus } from "@/types";

type PlaceDetails = {
  openingHours: string | null;
  phone: string | null;
  website: string | null;
  photoRefs: string[];
  photoAttributions: string[];
};

/** Galeria de fotos do Google (URLs temporárias, nada é armazenado). */
function PlaceGallery({ business }: { business: Business }) {
  const [photos, setPhotos] = useState<{ url: string; alt: string }[]>([]);

  useEffect(() => {
    let alive = true;
    setPhotos([]);
    if (business.photoRefs.length === 0) return;
    photoProvider
      .photosFor(business)
      .then((list) => alive && setPhotos(list))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [business]);

  if (business.photoRefs.length === 0) {
    return <p className="text-xs text-muted-foreground">Fotos: não informado</p>;
  }
  if (photos.length === 0) return <p className="text-xs text-muted-foreground">Carregando fotos do Google…</p>;

  return (
    <section className="space-y-1.5">
      <div className="-mx-4 flex snap-x gap-2 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-2 sm:overflow-visible sm:px-0">
        {photos.map((photo) => (
          <img
            key={photo.url}
            src={photo.url}
            alt={photo.alt}
            loading="lazy"
            className="h-28 w-48 shrink-0 snap-start rounded-md object-cover sm:w-full"
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">
        Fotos © Google Maps
        {business.photoAttributions.length > 0 ? ` · ${business.photoAttributions.join(", ")}` : ""}
      </p>
    </section>
  );
}


const contactTypes: { value: ContactType; label: string }[] = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "ligacao", label: "Ligação" },
  { value: "instagram", label: "Instagram" },
  { value: "outro", label: "Outro" },
];

/** Barra de ação fixa (mobile): as três ações mais usadas sempre ao alcance do dedo. */
function LeadActionBar({ business }: { business: Business | Lead }) {
  const [msgFor, setMsgFor] = useState<Business | null>(null);
  const [siteFor, setSiteFor] = useState<Business | null>(null);
  const wa = whatsappLink(business.phone);

  return (
    <div className="flex shrink-0 gap-2 border-t border-border bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] md:hidden">
      {wa ? (
        <Button className="h-12 flex-1" asChild>
          <a href={wa} target="_blank" rel="noreferrer">
            <MessageCircle className="size-4" aria-hidden />
            WhatsApp
          </a>
        </Button>
      ) : (
        <Button
          className="h-12 flex-1"
          variant="secondary"
          onClick={() => toast.info("Telefone não disponível.")}
        >
          <MessageCircle className="size-4" aria-hidden />
          WhatsApp
        </Button>
      )}
      <Button className="h-12 flex-1" variant="outline" onClick={() => setMsgFor(business)}>
        Mensagem
      </Button>
      <Button className="h-12 flex-1" variant="outline" onClick={() => setSiteFor(business)}>
        Criar site
      </Button>

      <MessageDialog business={msgFor} onOpenChange={(open) => !open && setMsgFor(null)} />
      <CreateSiteDialog business={siteFor} onOpenChange={(open) => !open && setSiteFor(null)} />
    </div>
  );
}

/** Detalhe da empresa/lead: painel lateral no desktop, tela cheia no celular. */
export function LeadWorkspace() {
  const { openId, openLead, findById } = useProspector();
  const isMobile = useIsMobile();
  const business = openId ? findById(openId) : undefined;

  return (
    <Sheet open={!!business} onOpenChange={(open) => !open && openLead(null)}>
      <SheetContent
        side={isMobile ? "bottom" : "right"}
        className="flex h-[96dvh] w-full flex-col gap-0 rounded-t-2xl p-0 md:h-full md:rounded-none sm:max-w-xl"
      >
        {business ? (
          <>
            <SheetHeader className="shrink-0 border-b border-border p-4 sm:p-6">
              <SheetTitle className="pr-8 leading-tight">{business.name}</SheetTitle>
              <SheetDescription>
                {business.category}
                {business.city ? ` · ${business.city}` : ""}
                {business.state ? ` - ${business.state}` : ""}
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="min-h-0 flex-1">
              <LeadDetail business={business} />
            </ScrollArea>
            <LeadActionBar business={business} />
          </>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}

function LeadDetail({ business }: { business: Business | Lead }) {
  const {
    isSaved,
    saveLead,
    removeLead,
    setStatus,
    setNotes,
    registerContact,
    followUps,
    createFollowUp,
    openLead,
  } = useProspector();
  const saved = isSaved(business.id);
  const lead = saved ? (business as Lead) : null;

  const [siteFor, setSiteFor] = useState<Business | null>(null);
  const [msgFor, setMsgFor] = useState<Business | null>(null);
  const [contactType, setContactType] = useState<ContactType>("whatsapp");
  const [contactNote, setContactNote] = useState("");
  const [fuLabel, setFuLabel] = useState("");
  const [fuDate, setFuDate] = useState("");
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Place Details é consultado apenas quando o estabelecimento é aberto.
  useEffect(() => {
    let alive = true;
    setDetails(null);
    if (business.openingHours) return;
    setLoadingDetails(true);
    placeDetailsRepository
      .detailsFor(business)
      .then((result) => {
        if (alive && result.ok) setDetails(result.details);
      })
      .catch(() => undefined)
      .finally(() => alive && setLoadingDetails(false));
    return () => {
      alive = false;
    };
  }, [business]);

  const wa = whatsappLink(business.phone);
  const kit = buildKit(business);
  const leadFollowUps = followUps.filter((f) => f.leadId === business.id);


  return (
    <div className="space-y-6 p-4 sm:p-6">
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-xs text-muted-foreground">Lead Score</p>
            <p className="text-3xl font-bold tabular-nums text-foreground">{business.score}</p>
          </div>
          {lead ? <StatusBadge status={lead.status} /> : null}
        </div>
        <ScoreBar score={business.score} />
        <ul className="space-y-1 text-xs text-muted-foreground">
          {business.scoreFactors.map((f) => (
            <li key={f.label}>
              +{f.points} · {f.label}
            </li>
          ))}
        </ul>
      </section>

      <PlaceGallery business={business} />

      <section className="space-y-2 rounded-lg border border-border p-4">
        <Row icon={<MapPin className="size-3.5" />} value={fullAddress(business)} />
        <Row icon={<Star className="size-3.5" />} value={ratingLabel(business)} />
        <Row icon={<Phone className="size-3.5" />} value={formatPhone(business.phone)} />
        <Row
          icon={<Globe className="size-3.5" />}
          value={business.website ?? "Site não informado (a verificar)"}
          href={business.website}
        />
        <Row
          icon={<Instagram className="size-3.5" />}
          value={business.instagram ?? "Não informado"}
          href={business.instagram}
        />
        <Row icon={<MessageCircle className="size-3.5" />} value={whatsappLabel(business.phone)} />
        <p className="pt-1 text-xs text-muted-foreground">
          Horário: {details?.openingHours ?? business.openingHours ?? (loadingDetails ? "Consultando…" : "Não informado")}
        </p>
        <p className="text-xs text-muted-foreground">Place ID: {business.placeId}</p>
        <p className="text-xs text-muted-foreground">
          Coordenadas: {business.latitude.toFixed(5)}, {business.longitude.toFixed(5)}
        </p>
        <div className="flex flex-wrap gap-2 pt-1">
          {business.phone ? (
            <Button size="sm" variant="outline" onClick={() => void copyText(business.phone!, "Telefone copiado.")}>
              <Copy className="size-4" aria-hidden />
              Copiar telefone
            </Button>
          ) : null}
          {wa ? (
            <Button size="sm" variant="outline" asChild title={whatsappLabel(business.phone)}>
              <a href={wa} target="_blank" rel="noreferrer">
                Abrir WhatsApp
              </a>
            </Button>
          ) : null}
        </div>
        {business.mapsUrl ? (
          <a
            href={business.mapsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-block text-xs text-primary underline underline-offset-2"
          >
            Ver no Google Maps
          </a>
        ) : null}
      </section>


      <div className="flex flex-wrap gap-2">
        {saved ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              removeLead(business.id);
              openLead(null);
            }}
          >
            <Trash2 className="size-4" aria-hidden />
            Remover lead
          </Button>
        ) : (
          <Button size="sm" onClick={() => saveLead(business)}>
            <BookmarkPlus className="size-4" aria-hidden />
            Salvar lead
          </Button>
        )}
        <Button size="sm" variant="outline" onClick={() => setMsgFor(business)}>
          Gerar mensagem
        </Button>
        <Button size="sm" variant="outline" onClick={() => setSiteFor(business)}>
          Criar Site
        </Button>
        {wa ? (
          <Button size="sm" variant="ghost" asChild>
            <a href={wa} target="_blank" rel="noreferrer">
              WhatsApp
            </a>
          </Button>
        ) : null}
      </div>

      <Tabs defaultValue="crm">
        <TabsList className="w-full">
          <TabsTrigger value="crm" className="flex-1">
            CRM
          </TabsTrigger>
          <TabsTrigger value="kit" className="flex-1">
            Kit do lead
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex-1">
            Histórico
          </TabsTrigger>
        </TabsList>

        <TabsContent value="crm" className="space-y-5 pt-4">
          {lead ? (
            <>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={lead.status} onValueChange={(v) => setStatus(lead.id, v as LeadStatus)}>
                  <SelectTrigger>
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

              <div className="space-y-2">
                <Label htmlFor="notas">Notas</Label>
                <Textarea
                  id="notas"
                  rows={4}
                  value={lead.notes}
                  onChange={(e) => setNotes(lead.id, e.target.value)}
                  placeholder="O que foi conversado, objeções, próximos passos…"
                />
              </div>

              <div className="space-y-2 rounded-lg border border-border p-4">
                <Label>Registrar contato</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Select value={contactType} onValueChange={(v) => setContactType(v as ContactType)}>
                    <SelectTrigger className="sm:w-40">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {contactTypes.map((c) => (
                        <SelectItem key={c.value} value={c.value}>
                          {c.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    value={contactNote}
                    onChange={(e) => setContactNote(e.target.value)}
                    placeholder="Observação (opcional)"
                  />
                  <Button
                    onClick={() => {
                      registerContact(lead.id, contactType, contactNote);
                      setContactNote("");
                    }}
                  >
                    Registrar
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Último contato: {lead.lastContact ?? "nenhum registrado"}
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-border p-4">
                <Label>Novo follow-up</Label>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input value={fuLabel} onChange={(e) => setFuLabel(e.target.value)} placeholder="Ex.: retornar ligação" />
                  <Input type="date" value={fuDate} onChange={(e) => setFuDate(e.target.value)} className="sm:w-44" />
                  <Button
                    disabled={!fuLabel.trim()}
                    onClick={() => {
                      createFollowUp(lead.id, fuLabel.trim(), fuDate);
                      setFuLabel("");
                      setFuDate("");
                    }}
                  >
                    Agendar
                  </Button>
                </div>
                <ul className="space-y-1 text-xs text-muted-foreground">
                  {leadFollowUps.length === 0 ? (
                    <li>Nenhum follow-up agendado.</li>
                  ) : (
                    leadFollowUps.map((f) => (
                      <li key={f.id}>
                        {f.date} · {f.label} {f.done ? "(concluído)" : ""}
                      </li>
                    ))
                  )}
                </ul>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Salve este lead para usar status, notas, contatos e follow-ups.
            </p>
          )}
        </TabsContent>

        <TabsContent value="kit" className="space-y-3 pt-4">
          {kit.map((item) => (
            <div key={item.title} className="rounded-lg border border-border p-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="text-sm font-semibold text-foreground">{item.title}</h4>
                <Button size="sm" variant="ghost" onClick={() => copyText(item.content, `${item.title} copiado.`)}>
                  <Copy className="size-4" aria-hidden />
                </Button>
              </div>
              <pre className="mt-2 max-h-40 overflow-auto text-xs leading-relaxed whitespace-pre-wrap text-muted-foreground">
                {item.content}
              </pre>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full"
            onClick={() =>
              copyText(kit.map((i) => `## ${i.title}\n${i.content}`).join("\n\n"), "Kit completo copiado.")
            }
          >
            Copiar kit completo
          </Button>
        </TabsContent>

        <TabsContent value="historico" className="pt-4">
          {lead && lead.history.length > 0 ? (
            <ol className="space-y-3 border-l border-border pl-4">
              {lead.history.map((h) => (
                <li key={h.id} className="relative text-sm">
                  <span className="absolute top-1.5 -left-[21px] size-2 rounded-full bg-primary" aria-hidden />
                  <p className="text-foreground">{h.label}</p>
                  <p className="text-xs text-muted-foreground">{h.date}</p>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-muted-foreground">Sem histórico ainda.</p>
          )}
        </TabsContent>
      </Tabs>

      <SourceNotice />

      <CreateSiteDialog business={siteFor} onOpenChange={(open) => !open && setSiteFor(null)} />
      <MessageDialog business={msgFor} onOpenChange={(open) => !open && setMsgFor(null)} />
    </div>
  );
}

function Row({ icon, value, href }: { icon: React.ReactNode; value: string; href?: string | null }) {
  return (
    <div className="flex items-start gap-2 text-sm">
      <span className="mt-0.5 shrink-0 text-muted-foreground" aria-hidden>
        {icon}
      </span>
      {href ? (
        <a
          href={href}
          target="_blank"
          rel="noreferrer"
          className="min-w-0 break-all text-primary underline underline-offset-2"
        >
          {value}
        </a>
      ) : (
        <span className="min-w-0 break-words text-foreground">{value}</span>
      )}
    </div>
  );
}
