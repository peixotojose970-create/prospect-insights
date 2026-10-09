import { useEffect, useState } from "react";
import { BookmarkPlus, Copy, Globe, Instagram, Mail, MapPin, MessageCircle, Phone, PhoneCall, Star, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CreateSiteDialog } from "@/components/prospector/CreateSiteDialog";
import { CallScriptDialog } from "@/components/prospector/CallScriptDialog";
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
import { usEmailMailto } from "@/features/prospector/us-messages";
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
  const photoRefs = Array.isArray(business.photoRefs) ? business.photoRefs : [];
  const photoAttributions = Array.isArray(business.photoAttributions) ? business.photoAttributions : [];

  useEffect(() => {
    let alive = true;
    setPhotos([]);
    if (photoRefs.length === 0) return;
    photoProvider
      .photosFor(business)
      .then((list) => {
        if (alive && Array.isArray(list)) setPhotos(list);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [business, photoRefs.length]);

  if (photoRefs.length === 0) {
    return <p className="text-xs text-muted-foreground">Fotos: não informado</p>;
  }
  if (photos.length === 0) return <p className="text-xs text-muted-foreground">Carregando fotos do Google…</p>;

  return (
    <section className="space-y-1.5">
      <div className="flex max-w-full snap-x gap-2 overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch] sm:grid sm:grid-cols-2 sm:overflow-visible sm:pb-0">
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
        {photoAttributions.length > 0 ? ` · ${photoAttributions.join(", ")}` : ""}
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

/** Barra de ação fixa: em telas estreitas, usa uma grade para manter todas as ações acessíveis. */
function LeadActionBar({ business }: { business: Business | Lead }) {
  const [msgFor, setMsgFor] = useState<Business | null>(null);
  const [siteFor, setSiteFor] = useState<Business | null>(null);
  const wa = whatsappLink(business.phone);

  return (
    <div className="grid shrink-0 grid-cols-2 gap-2 border-t border-border bg-card p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:grid-cols-3 md:hidden">
      {wa ? (
        <Button className="h-12 min-w-0 px-3" asChild>
          <a href={wa} target="_blank" rel="noreferrer">
            <MessageCircle className="size-4" aria-hidden />
            <span className="truncate">WhatsApp</span>
          </a>
        </Button>
      ) : (
        <Button className="h-12 min-w-0 px-3" variant="secondary" onClick={() => toast.info("Telefone não disponível.")}>
          <MessageCircle className="size-4" aria-hidden />
          <span className="truncate">WhatsApp</span>
        </Button>
      )}
      <Button className="h-12 min-w-0 px-3" variant="outline" onClick={() => setMsgFor(business)}>
        <span className="truncate">Mensagem</span>
      </Button>
      <Button className="col-span-2 h-12 min-w-0 px-3 sm:col-span-1" variant="outline" onClick={() => setSiteFor(business)}>
        <span className="truncate">Criar site</span>
      </Button>

      <MessageDialog business={msgFor} onOpenChange={(open) => !open && setMsgFor(null)} />
      <CreateSiteDialog business={siteFor} onOpenChange={(open) => !open && setSiteFor(null)} />
    </div>
  );
}

/** Detalhe da empresa/lead: painel lateral no desktop, tela completa no celular. */
export function LeadWorkspace() {
  const { openId, openedBusiness, openLead, findById } = useProspector();
  const business = openId
    ? openedBusiness && (openedBusiness.id === openId || openedBusiness.placeId === openId)
      ? openedBusiness
      : findById(openId)
    : undefined;

  return (
    <Sheet open={!!business} onOpenChange={(open) => !open && openLead(null)}>
      <SheetContent
        side="right"
        className="inset-y-0 right-0 flex h-[100dvh] max-h-[100dvh] w-screen max-w-none flex-col gap-0 overflow-hidden rounded-none p-0 md:w-full md:max-w-xl"
      >
        {business ? (
          <>
            <SheetHeader className="relative shrink-0 border-b border-border bg-card px-4 pb-3 pt-[max(1rem,env(safe-area-inset-top))] text-left sm:p-6">
              <SheetTitle className="min-w-0 break-words pr-10 text-xl leading-snug sm:text-lg">{business.name || "Não informado"}</SheetTitle>
              <SheetDescription className="min-w-0 break-words pr-6 text-sm leading-relaxed">
                {[business.category, business.city, business.state].filter(Boolean).join(" · ") || "Não informado"}
              </SheetDescription>
            </SheetHeader>
            <ScrollArea className="min-h-0 min-w-0 flex-1">
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
    profile,
  } = useProspector();
  const saved = isSaved(business.id);
  const lead = saved ? (business as Lead) : null;

  const [siteFor, setSiteFor] = useState<Business | null>(null);
  const [msgFor, setMsgFor] = useState<Business | null>(null);
  const [callFor, setCallFor] = useState<Business | null>(null);
  const [contactType, setContactType] = useState<ContactType>("whatsapp");
  const [contactNote, setContactNote] = useState("");
  const [fuLabel, setFuLabel] = useState("");
  const [fuDate, setFuDate] = useState("");
  const [details, setDetails] = useState<PlaceDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // Place Details é consultado apenas quando o estabelecimento é aberto e possui placeId válido.
  useEffect(() => {
    let alive = true;
    setDetails(null);
    const pid = business.placeId?.trim() || "";
    if (business.openingHours || !pid || pid.length < 3) return;
    setLoadingDetails(true);
    placeDetailsRepository
      .detailsFor(business)
      .then((result) => {
        if (alive && result?.ok && result.details) setDetails(result.details);
      })
      .catch(() => undefined)
      .finally(() => {
        if (alive) setLoadingDetails(false);
      });
    return () => {
      alive = false;
    };
  }, [business]);

  const wa = whatsappLink(business.phone);
  const kit = buildKit(business);
  const leadFollowUps = (followUps ?? []).filter((f) => f.leadId === business.id);
  const score = typeof business.score === "number" && !isNaN(business.score) ? business.score : 0;
  const scoreFactors = Array.isArray(business.scoreFactors) ? business.scoreFactors : [];
  const leadHistory = lead && Array.isArray(lead.history) ? lead.history : [];
  const leadNotes = lead?.notes ?? "";
  const leadStatus = lead?.status ?? "novo";

  const hasCoords =
    typeof business.latitude === "number" &&
    typeof business.longitude === "number" &&
    !isNaN(business.latitude) &&
    !isNaN(business.longitude);

  return (
    <div className="min-w-0 max-w-full space-y-5 overflow-x-hidden p-3.5 sm:space-y-6 sm:p-6">
      <section className="min-w-0 space-y-3">
        <div className="flex min-w-0 items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs text-muted-foreground">Lead Score</p>
            <p className="text-3xl font-bold tabular-nums text-foreground">{score}</p>
          </div>
          {lead ? <StatusBadge status={leadStatus} /> : null}
        </div>
        <ScoreBar score={score} />
        {scoreFactors.length > 0 ? (
          <ul className="min-w-0 space-y-1 break-words text-xs text-muted-foreground">
            {scoreFactors.map((f) => (
              <li key={f.label}>
                +{f.points} · {f.label}
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <PlaceGallery business={business} />

      {/* Detalhes da empresa com dados reais */}
      <section className="min-w-0 max-w-full space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <h4 className="break-words text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Detalhes da empresa
        </h4>
        <dl className="grid min-w-0 grid-cols-1 gap-2.5 text-sm [&>div]:min-w-0 sm:grid-cols-2">
          <div className="space-y-0.5 sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Nome</dt>
            <dd className="font-semibold text-foreground break-words">
              {business.name?.trim() || "Não informado"}
            </dd>
          </div>

          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Categoria</dt>
            <dd className="font-medium text-foreground break-words">
              {business.category?.trim() || "Não informado"}
            </dd>
          </div>

          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Place ID</dt>
            <dd className="font-mono text-xs text-foreground break-all">
              {business.placeId?.trim() || business.id?.trim() || "Não informado"}
            </dd>
          </div>

          <div className="space-y-0.5 sm:col-span-2">
            <dt className="text-xs text-muted-foreground">Endereço</dt>
            <dd className="text-foreground break-words">
              {business.address?.trim() || fullAddress(business)}
            </dd>
          </div>

          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Cidade</dt>
            <dd className="text-foreground break-words">
              {business.city?.trim() || "Não informado"}
            </dd>
          </div>

          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Estado</dt>
            <dd className="text-foreground break-words">
              {business.state?.trim() || "Não informado"}
            </dd>
          </div>

          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Telefone</dt>
            <dd className="text-foreground">
              {business.phone ? formatPhone(business.phone) : "Não informado"}
            </dd>
          </div>

          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Website</dt>
            <dd className="break-all">
              {business.website ? (
                <a
                  href={business.website.startsWith("http") ? business.website : `https://${business.website}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline underline-offset-2 hover:text-primary/80"
                >
                  {business.website}
                </a>
              ) : (
                <span className="text-muted-foreground">Não informado</span>
              )}
            </dd>
          </div>

          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Avaliação</dt>
            <dd className="text-foreground font-medium">
              {typeof business.rating === "number" && !isNaN(business.rating)
                ? `★ ${business.rating.toFixed(1)}`
                : "Não informado"}
            </dd>
          </div>

          <div className="space-y-0.5">
            <dt className="text-xs text-muted-foreground">Número de avaliações</dt>
            <dd className="text-foreground">
              {typeof business.reviews === "number" && !isNaN(business.reviews)
                ? `${business.reviews} avaliações`
                : "Não informado"}
            </dd>
          </div>
        </dl>

        {/* Informações complementares */}
        <div className="min-w-0 space-y-2 border-t border-border/60 pt-2">
          <Row
            icon={<Instagram className="size-3.5" />}
            value={business.instagram ?? "Não informado"}
            href={business.instagram}
          />
          <Row icon={<MessageCircle className="size-3.5" />} value={whatsappLabel(business.phone)} />

          {business.country === "US" && business.email ? (
            <div className="min-w-0 pt-1">
              <Button size="sm" variant="secondary" className="h-10 w-full min-w-0 px-3" asChild>
                <a href={usEmailMailto(business as Business, profile) ?? "#"} title={business.email}>
                  <Mail className="size-4" aria-hidden />
                  <span className="truncate">Enviar e-mail</span>
                </a>
              </Button>
            </div>
          ) : null}

          <p className="break-words text-xs text-muted-foreground">
            Horário: {details?.openingHours ?? business.openingHours ?? (loadingDetails ? "Consultando…" : "Não informado")}
          </p>

          <p className="break-words text-xs text-muted-foreground">
            Coordenadas: {hasCoords ? `${business.latitude.toFixed(5)}, ${business.longitude.toFixed(5)}` : "Não informado"}
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
        </div>
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
        <Button size="sm" onClick={() => setCallFor(business)}>
          <PhoneCall className="size-4" aria-hidden />
          Gerar ligação
        </Button>
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

      <Tabs defaultValue="crm" className="min-w-0 max-w-full">
        <div className="max-w-full overflow-x-auto pb-1 [-webkit-overflow-scrolling:touch]">
          <TabsList className="grid h-auto min-w-full grid-cols-3 gap-1 p-1">
            <TabsTrigger value="crm" className="min-w-0 px-2 text-xs sm:text-sm">
              <span className="truncate">CRM</span>
            </TabsTrigger>
            <TabsTrigger value="kit" className="min-w-0 px-2 text-xs sm:text-sm">
              <span className="truncate">Kit do lead</span>
            </TabsTrigger>
            <TabsTrigger value="historico" className="min-w-0 px-2 text-xs sm:text-sm">
              <span className="truncate">Histórico</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="crm" className="min-w-0 space-y-5 pt-4">
          {lead ? (
            <>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={leadStatus} onValueChange={(v) => setStatus(lead.id, v as LeadStatus)}>
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
                  value={leadNotes}
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

        <TabsContent value="kit" className="min-w-0 space-y-3 pt-4">
          {kit.map((item) => (
            <div key={item.title} className="min-w-0 rounded-lg border border-border p-3">
              <div className="flex min-w-0 items-center justify-between gap-2">
                <h4 className="min-w-0 break-words text-sm font-semibold text-foreground">{item.title}</h4>
                <Button size="sm" variant="ghost" className="shrink-0" onClick={() => copyText(item.content, `${item.title} copiado.`)}>
                  <Copy className="size-4" aria-hidden />
                </Button>
              </div>
              <pre className="mt-2 max-h-40 max-w-full overflow-auto break-words whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
                {item.content}
              </pre>
            </div>
          ))}
          <Button
            variant="outline"
            className="w-full min-w-0 whitespace-normal"
            onClick={() =>
              copyText(kit.map((i) => `## ${i.title}\n${i.content}`).join("\n\n"), "Kit completo copiado.")
            }
          >
            Copiar kit completo
          </Button>
        </TabsContent>

        <TabsContent value="historico" className="min-w-0 pt-4">
          {leadHistory.length > 0 ? (
            <ol className="space-y-3 border-l border-border pl-4">
              {leadHistory.map((h) => (
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

      <SourceNotice className="min-w-0 break-words" />

      <CreateSiteDialog business={siteFor} onOpenChange={(open) => !open && setSiteFor(null)} />
      <MessageDialog business={msgFor} onOpenChange={(open) => !open && setMsgFor(null)} />
      <CallScriptDialog business={callFor} onOpenChange={(open) => !open && setCallFor(null)} />
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
