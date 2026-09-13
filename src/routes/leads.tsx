import { useMemo, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { Download, Search, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toCsv } from "@/features/prospector/generators";
import { formatPhone } from "@/features/prospector/format";
import { useProspector } from "@/features/prospector/store";
import { EmptyState, PageHeader, ScorePill, SiteBadge, SourceNotice, StatusBadge } from "@/features/prospector/ui";
import { LEAD_STATUSES, type LeadStatus } from "@/types";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Meus leads salvos | Prospector B2B" },
      {
        name: "description",
        content: "Lista completa dos leads salvos, com status, score, contato e exportação em CSV.",
      },
      { property: "og:title", content: "Meus leads salvos | Prospector B2B" },
      { property: "og:description", content: "Gerencie seus leads salvos, status e exportação em CSV." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Leads,
});

function download(name: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  URL.revokeObjectURL(url);
}

function Leads() {
  const { leads, openLead, saveLead } = useProspector();
  const [term, setTerm] = useState("");
  const [status, setStatus] = useState<LeadStatus | "todos">("todos");
  const [sort, setSort] = useState<"score" | "nome" | "recente">("score");
  const fileRef = useRef<HTMLInputElement | null>(null);

  const rows = useMemo(() => {
    const t = term.trim().toLowerCase();
    return leads
      .filter((l) => (status === "todos" ? true : l.status === status))
      .filter((l) =>
        t
          ? [l.name, l.category, l.city ?? "", l.neighborhood ?? ""].some((v) => v.toLowerCase().includes(t))
          : true,
      )
      .sort((a, b) =>
        sort === "score" ? b.score - a.score : sort === "nome" ? a.name.localeCompare(b.name) : b.savedAt.localeCompare(a.savedAt),
      );
  }, [leads, term, status, sort]);

  const importCsv = async (file: File) => {
    try {
      const text = await file.text();
      const [header, ...lines] = text.trim().split(/\r?\n/);
      if (!header) throw new Error("vazio");
      const cols = header.split(",").map((c) => c.replace(/"/g, "").trim());
      const idx = (name: string) => cols.indexOf(name);
      let count = 0;
      for (const line of lines) {
        const cells = line.match(/("([^"]|"")*"|[^,]*)/g)?.filter((_, i) => i % 2 === 0) ?? [];
        const get = (name: string) => (cells[idx(name)] ?? "").replace(/^"|"$/g, "").replace(/""/g, '"');
        const name = get("empresa");
        if (!name) continue;
        saveLead({
          id: get("external_id") || `import-${name}-${count}`,
          externalId: get("external_id") || "importado",
          placeId: get("place_id") || "",
          source: get("fonte") || "Importado (CSV)",
          sourceUrl: get("source_url") || null,
          name,
          category: get("categoria") || "Não informado",
          street: null,
          houseNumber: null,
          neighborhood: get("bairro") || null,
          city: get("cidade") || null,
          state: get("estado") || null,
          postalCode: get("cep") || null,
          address: get("endereco") || null,
          phone: get("telefone") || null,
          website: get("site") || null,
          instagram: get("instagram") || null,
          openingHours: get("horario") || null,
          mapsUrl: get("maps_url") || null,
          rating: Number(get("nota")) || null,
          reviews: Number(get("avaliacoes")) || null,
          photoRefs: [],
          photoAttributions: [],
          latitude: Number(get("latitude")) || 0,
          longitude: Number(get("longitude")) || 0,
          score: Number(get("score")) || 0,
          scoreFactors: [],
        });
        count += 1;
      }
      toast.success(`${count} leads importados.`);
    } catch {
      toast.error("Não foi possível ler este arquivo CSV.");
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Meus leads"
        subtitle="Tudo que você salvou, com status e contato — armazenado no seu navegador."
        actions={
          <>
            <Button variant="outline" className="h-11 sm:h-9" onClick={() => fileRef.current?.click()}>
              <Upload className="size-4" aria-hidden />
              Importar CSV
            </Button>
            <Button
              variant="outline"
              className="h-11 sm:h-9"
              disabled={leads.length === 0}
              onClick={() => download("leads-prospector.csv", toCsv(leads))}
            >
              <Download className="size-4" aria-hidden />
              Exportar CSV
            </Button>
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void importCsv(file);
                e.target.value = "";
              }}
            />
          </>
        }
      />

      <Card className="grid gap-3 p-4 sm:grid-cols-3">
        <div className="relative sm:col-span-1">
          <Search className="absolute top-3.5 left-3 size-4 text-muted-foreground sm:top-2.5" aria-hidden />
          <Input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            placeholder="Buscar por nome, categoria ou cidade"
            className="h-11 pl-9 sm:h-9"
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as LeadStatus | "todos")}>
          <SelectTrigger className="h-11 sm:h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os status</SelectItem>
            {LEAD_STATUSES.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v as typeof sort)}>
          <SelectTrigger className="h-11 sm:h-9">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Maior score</SelectItem>
            <SelectItem value="nome">Nome A-Z</SelectItem>
            <SelectItem value="recente">Salvos recentemente</SelectItem>
          </SelectContent>
        </Select>
      </Card>


      {rows.length === 0 ? (
        <EmptyState
          title={leads.length === 0 ? "Nenhum lead salvo" : "Nenhum lead com esses filtros"}
          description={
            leads.length === 0
              ? "Busque empresas na prospecção e salve as que interessam."
              : "Ajuste a busca ou os filtros de status."
          }
          action={
            leads.length === 0 ? (
              <Button asChild size="sm">
                <Link to="/prospeccao">Buscar empresas</Link>
              </Button>
            ) : null
          }
        />
      ) : (
        <>
        {/* Mobile: cards de leitura rápida. Desktop: tabela completa. */}
        <div className="space-y-3 md:hidden">
          {rows.map((l) => (
            <Card key={l.id} className="gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{l.name}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {l.category}
                    {l.city ? ` · ${l.city}` : ""}
                    {l.state ? ` - ${l.state}` : ""}
                  </p>
                </div>
                <ScorePill score={l.score} />
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <StatusBadge status={l.status} />
                <SiteBadge business={l} />
              </div>
              <p className="text-xs text-muted-foreground">{formatPhone(l.phone)}</p>
              {l.nextAction ? (
                <p className="text-xs font-medium text-foreground">Próxima ação: {l.nextAction}</p>
              ) : null}
              <Button variant="outline" className="mt-1 h-11 w-full" onClick={() => openLead(l.id)}>
                Abrir lead
              </Button>
            </Card>
          ))}
        </div>

        <Card className="hidden overflow-x-auto p-0 md:block">
          <table className="w-full min-w-[720px] text-sm">
            <thead className="border-b border-border text-left text-xs text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Empresa</th>
                <th className="px-4 py-3 font-medium">Local</th>
                <th className="px-4 py-3 font-medium">Telefone</th>
                <th className="px-4 py-3 font-medium">Site</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Score</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((l) => (
                <tr key={l.id} className="hover:bg-muted/40">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{l.name}</p>
                    <p className="text-xs text-muted-foreground">{l.category}</p>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {[l.city, l.state].filter(Boolean).join(" - ") || "Não informado"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{formatPhone(l.phone)}</td>
                  <td className="px-4 py-3">
                    <SiteBadge business={l} />
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge status={l.status} />
                  </td>
                  <td className="px-4 py-3">
                    <ScorePill score={l.score} />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button size="sm" variant="outline" onClick={() => openLead(l.id)}>
                      Abrir
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
        </>
      )}

      <SourceNotice />
    </div>
  );
}
