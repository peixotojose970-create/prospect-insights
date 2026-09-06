import { useMemo, useRef, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Search, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toCsv } from "@/features/prospector/generators";
import { useProspector } from "@/features/prospector/store";
import { DemoNotice, EmptyState, PageHeader, ScorePill, SiteBadge, StatusBadge } from "@/features/prospector/ui";
import { LEAD_STATUSES } from "@/types";
import { toast } from "sonner";

export const Route = createFileRoute("/leads")({
  head: () => ({
    meta: [
      { title: "Meus Leads — Prospector" },
      {
        name: "description",
        content: "Lista completa dos leads salvos com score, status, contato e ações rápidas.",
      },
      { property: "og:title", content: "Meus Leads — Prospector" },
      {
        property: "og:description",
        content: "Gerencie seus leads salvos: busca, filtros, ordenação e exportação.",
      },
    ],
  }),
  component: Leads,
});

function Leads() {
  const { leads, openLead } = useProspector();
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("todos");
  const [sort, setSort] = useState("score");
  const fileRef = useRef<HTMLInputElement>(null);
  const [imported, setImported] = useState<string[]>([]);

  const rows = useMemo(() => {
    const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
    const terms = norm(q).split(/\s+/).filter(Boolean);
    return leads
      .filter((l) => l.saved)
      .filter((l) => {
        const h = norm(`${l.name} ${l.category} ${l.city} ${l.state}`);
        if (terms.length && !terms.every((t) => h.includes(t))) return false;
        if (status !== "todos" && l.status !== status) return false;
        return true;
      })
      .sort((a, b) =>
        sort === "score" ? b.score - a.score : sort === "nome" ? a.name.localeCompare(b.name) : b.rating - a.rating,
      );
  }, [leads, q, status, sort]);

  function exportCsv() {
    const csv = toCsv(rows);
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "prospector-leads-demo.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exportado.");
  }

  function importCsv(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const lines = String(reader.result).split(/\r?\n/).filter(Boolean).slice(1, 6);
      setImported(lines.map((l) => l.split(",")[0]?.replace(/"/g, "") ?? ""));
      toast.success(`${lines.length} linhas mapeadas (pré-visualização).`);
    };
    reader.readAsText(file);
  }

  return (
    <>
      <PageHeader
        title="Meus Leads"
        subtitle="Todos os leads salvos na sua base de prospecção."
        actions={
          <>
            <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}>
              <Upload className="size-3.5" aria-hidden />
              Importar
            </Button>
            <Button size="sm" onClick={exportCsv}>
              <Download className="size-3.5" aria-hidden />
              Exportar CSV
            </Button>
          </>
        }
      />
      <input
        ref={fileRef}
        type="file"
        accept=".csv"
        className="sr-only"
        aria-label="Importar leads em CSV"
        onChange={(e) => e.target.files?.[0] && importCsv(e.target.files[0])}
      />

      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_10rem_10rem]">
        <div className="min-w-0">
          <Label htmlFor="leads-busca" className="sr-only">
            Buscar leads
          </Label>
          <div className="relative">
            <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input
              id="leads-busca"
              data-global-search
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Buscar por empresa, categoria ou cidade"
              className="pl-9"
            />
          </div>
        </div>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger aria-label="Filtrar por status">
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
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger aria-label="Ordenar">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="score">Maior score</SelectItem>
            <SelectItem value="nome">Nome (A-Z)</SelectItem>
            <SelectItem value="nota">Melhor nota</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {imported.length ? (
        <Card className="p-4">
          <h2 className="text-sm font-semibold text-foreground">Importação (pré-visualização)</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Colunas mapeadas: empresa, categoria, cidade, estado, telefone, site, score, status.
          </p>
          <ul className="mt-2 list-inside list-disc text-sm text-foreground">
            {imported.map((n, i) => (
              <li key={`${n}-${i}`}>{n}</li>
            ))}
          </ul>
        </Card>
      ) : null}

      {rows.length === 0 ? (
        <EmptyState
          title="Nenhum lead salvo"
          description="Você ainda não possui leads salvos. Vá para Prospecção, abra um lead e clique em Salvar."
        />
      ) : (
        <>
          <Card className="overflow-x-auto p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Empresa</TableHead>
                  <TableHead className="hidden sm:table-cell">Categoria</TableHead>
                  <TableHead className="hidden md:table-cell">Cidade</TableHead>
                  <TableHead>Score</TableHead>
                  <TableHead className="hidden lg:table-cell">Site</TableHead>
                  <TableHead className="hidden lg:table-cell">Telefone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden xl:table-cell">Último contato</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((l) => (
                  <TableRow key={l.id} className="cursor-pointer" onClick={() => openLead(l.id)}>
                    <TableCell className="font-medium text-foreground">{l.name}</TableCell>
                    <TableCell className="hidden text-muted-foreground sm:table-cell">{l.category}</TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">
                      {l.city} - {l.state}
                    </TableCell>
                    <TableCell>
                      <ScorePill score={l.score} />
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <SiteBadge lead={l} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{l.phone}</TableCell>
                    <TableCell>
                      <StatusBadge status={l.status} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground xl:table-cell">
                      {l.lastContact ?? "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          openLead(l.id);
                        }}
                      >
                        Abrir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
          <DemoNotice />
        </>
      )}
    </>
  );
}
