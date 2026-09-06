import { createFileRoute } from "@tanstack/react-router";
import { Download, Moon, Sun } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { toCsv } from "@/features/prospector/generators";
import { useProspector } from "@/features/prospector/store";
import { DemoNotice, PageHeader } from "@/features/prospector/ui";

export const Route = createFileRoute("/configuracoes")({
  head: () => ({
    meta: [
      { title: "Configurações — Prospector" },
      {
        name: "description",
        content: "Perfil, preferências, aparência, notificações e exportação de dados.",
      },
      { property: "og:title", content: "Configurações — Prospector" },
      {
        property: "og:description",
        content: "Ajuste perfil, tema, notificações e exportação dos seus dados.",
      },
    ],
  }),
  component: Configuracoes,
});

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card className="gap-4 p-5">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      <Separator />
      {children}
    </Card>
  );
}

function Configuracoes() {
  const { leads } = useProspector();

  function setTheme(dark: boolean) {
    document.documentElement.classList.toggle("dark", dark);
    toast.success(`Tema ${dark ? "escuro" : "claro"} ativado.`);
  }

  function exportAll() {
    const url = URL.createObjectURL(new Blob([toCsv(leads)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "prospector-base-demo.csv";
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Exportação concluída.");
  }

  return (
    <>
      <PageHeader title="Configurações" subtitle="Ajuste seu perfil, aparência e preferências do aplicativo." />

      <div className="grid gap-4 lg:grid-cols-2">
        <Section title="Perfil">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <Label htmlFor="nome">Nome</Label>
              <Input id="nome" className="mt-1" defaultValue="José Peixoto" />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" className="mt-1" defaultValue="jose@exemplo.com.br" />
            </div>
            <div className="sm:col-span-2">
              <Label htmlFor="whats">WhatsApp comercial</Label>
              <Input id="whats" className="mt-1" defaultValue="(41) 90000-0000" />
            </div>
          </div>
          <Button size="sm" className="w-fit" onClick={() => toast.success("Perfil salvo.")}>
            Salvar perfil
          </Button>
        </Section>

        <Section title="Aparência">
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => setTheme(false)}>
              <Sun className="size-3.5" aria-hidden />
              Tema claro
            </Button>
            <Button size="sm" variant="outline" onClick={() => setTheme(true)}>
              <Moon className="size-3.5" aria-hidden />
              Tema escuro
            </Button>
          </div>
        </Section>

        <Section title="Preferências">
          <Pref id="p1" label="Priorizar empresas sem site nos resultados" defaultChecked />
          <Pref id="p2" label="Ordenar sempre pelo maior Lead Score" defaultChecked />
          <Pref id="p3" label="Abrir lead em painel lateral" defaultChecked />
        </Section>

        <Section title="Notificações">
          <Pref id="n1" label="Avisar sobre follow-ups atrasados" defaultChecked />
          <Pref id="n2" label="Resumo diário de oportunidades" />
        </Section>

        <Section title="Dados e exportação">
          <p className="text-sm text-muted-foreground">
            {leads.length} empresas na base de demonstração.
          </p>
          <Button size="sm" className="w-fit" onClick={exportAll}>
            <Download className="size-3.5" aria-hidden />
            Exportar CSV
          </Button>
          <DemoNotice />
        </Section>

        <Section title="Sobre o aplicativo">
          <p className="text-sm text-muted-foreground">
            Prospector — protótipo de interface, versão 0.1 (demonstração). Nenhuma integração externa
            está ativa: buscas, contatos e materiais funcionam sobre dados fictícios, com a arquitetura
            preparada para conexão com backend real.
          </p>
        </Section>
      </div>
    </>
  );
}

function Pref({ id, label, defaultChecked = false }: { id: string; label: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <Label htmlFor={id} className="text-sm font-normal text-muted-foreground">
        {label}
      </Label>
      <Switch id={id} defaultChecked={defaultChecked} />
    </div>
  );
}
