import { createFileRoute } from "@tanstack/react-router";
import { Download, Moon, Sun, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
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
  const { leads } = useProspector();

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

  const clearAll = () => {
    window.localStorage.removeItem("prospector:v1");
    toast.success("Dados apagados. Recarregando…");
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Configurações" subtitle="Aparência, preferências e seus dados." />

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

      <Section title="Seus dados" description="Tudo fica salvo apenas neste navegador.">
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" onClick={exportAll}>
            <Download className="size-4" aria-hidden />
            Exportar backup CSV
          </Button>
          <Button variant="outline" size="sm" onClick={clearAll}>
            <Trash2 className="size-4" aria-hidden />
            Apagar todos os dados
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">{leads.length} leads salvos neste navegador.</p>
      </Section>

      <Section title="Origem dos dados" description="De onde vêm as informações das empresas.">
        <SourceNotice />
      </Section>
    </div>
  );
}
