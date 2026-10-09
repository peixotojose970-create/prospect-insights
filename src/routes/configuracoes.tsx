import { type ReactNode } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Download, Moon, Sun, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { InstallAppCard } from "@/components/prospector/InstallApp";
import { toCsv } from "@/features/prospector/generators";
import { useProspector } from "@/features/prospector/store";
import { PageHeader, SourceNotice } from "@/features/prospector/ui";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações | Prospector B2B" },
      {
        name: "description",
        content: "Ajuste tema, preferências de busca, exportação de dados e origem das informações de empresas.",
      },
      { property: "og:title", content: "Configurações | Prospector B2B" },
      { property: "og:description", content: "Tema, preferências de busca e exportação dos seus leads." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Configuracoes,
});

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card className="gap-4 p-5">
      <div>
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </Card>
  );
}

function Pref({
  id,
  label,
  defaultChecked = false,
}: {
  id: string;
  label: string;
  defaultChecked?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="text-sm font-normal">
        {label}
      </Label>
      <Switch id={id} defaultChecked={defaultChecked} />
    </div>
  );
}

function Configuracoes() {
  const { leads, profile, setProfile } = useProspector();

  const downloadBackup = () => {
    const raw = window.localStorage.getItem("prospector:v1");
    if (!raw) {
      toast.error("Não há dados locais para criar o backup.");
      return;
    }
    const blob = new Blob([JSON.stringify({ format: "prospector-backup-v1", createdAt: new Date().toISOString(), data: JSON.parse(raw) }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `prospector-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup recuperável baixado. Os dados locais foram mantidos.");
  };

  const restoreBackup = async (file?: File) => {
    if (!file) return;
    try {
      const parsed = JSON.parse(await file.text());
      if (parsed?.format !== "prospector-backup-v1" || !parsed.data || !Array.isArray(parsed.data.leads)) {
        throw new Error("Formato de backup inválido.");
      }
      const before = window.localStorage.getItem("prospector:v1");
      if (before) window.localStorage.setItem("prospector:v1:recovery-before-restore", before);
      window.localStorage.setItem("prospector:v1", JSON.stringify(parsed.data));
      toast.success("Backup restaurado. Recarregando o Prospector…");
      window.location.reload();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Não foi possível restaurar o backup.");
    }
  };

  const setTheme = (dark: boolean) => {
    document.documentElement.classList.toggle("dark", dark);
  };

  const exportAll = () => {
    if (leads.length === 0) {
      toast.error("Nenhum lead salvo para exportar.");
      return;
    }
    const url = URL.createObjectURL(new Blob([toCsv(leads)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "prospector-backup.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Backup exportado.");
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" subtitle="Aparência, preferências e seus dados." />

      <InstallAppCard />

      <Section title="Aparência" description="Escolha entre tema claro e escuro.">
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => setTheme(false)}>
            <Sun className="size-4" aria-hidden />
            Claro
          </Button>
          <Button variant="outline" size="sm" onClick={() => setTheme(true)}>
            <Moon className="size-4" aria-hidden />
            Escuro
          </Button>
        </div>
      </Section>

      <Section title="Preferências de prospecção" description="Aplicadas às próximas buscas nesta sessão.">
        <div className="space-y-3">
          <Pref id="pref-sem-site" label="Priorizar empresas sem site informado" defaultChecked />
          <Pref id="pref-telefone" label="Exigir telefone nos resultados" />
          <Pref id="pref-mapa" label="Mostrar mapa dos resultados" defaultChecked />
        </div>
      </Section>

      <Section
        title="Identificação nas mensagens e sites"
        description="Esses dados personalizam suas abordagens e os projetos de site gerados."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="personal-name">Nome pessoal</Label>
            <Input
              id="personal-name"
              value={profile.personalName}
              placeholder="Ex.: José Peixoto"
              onChange={(event) => setProfile({ ...profile, personalName: event.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="company-name">Nome da empresa</Label>
            <Input
              id="company-name"
              value={profile.companyName}
              placeholder="Ex.: Nextor Studio"
              onChange={(event) => setProfile({ ...profile, companyName: event.target.value })}
            />
          </div>
        </div>
        <p className="text-xs text-muted-foreground">As alterações são salvas automaticamente neste navegador.</p>
      </Section>

      <Section title="Seus dados" description="Faça um backup recuperável dos dados deste navegador quando precisar.">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={downloadBackup}>
            <Download className="size-4" aria-hidden />
            Baixar backup recuperável
          </Button>
          <Button variant="outline" size="sm" onClick={() => document.getElementById("prospector-backup-file")?.click()}>
            <Upload className="size-4" aria-hidden />
            Restaurar backup
          </Button>
          <input id="prospector-backup-file" type="file" accept="application/json,.json" className="hidden" onChange={(event) => { void restoreBackup(event.target.files?.[0]); event.currentTarget.value = ""; }} />
          <Button variant="outline" size="sm" onClick={exportAll}>
            <Download className="size-4" aria-hidden />
            Exportar leads em CSV
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{leads.length} leads neste navegador. O backup não apaga os dados locais.</p>
      </Section>

      <Section title="Origem dos dados" description="De onde vêm as informações das empresas.">
        <SourceNotice />
      </Section>
    </div>
  );
}
