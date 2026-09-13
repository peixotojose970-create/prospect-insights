import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LeadCard } from "@/components/prospector/LeadCard";
import { USEmailDialog } from "@/components/prospector/USEmailDialog";
import { SelectionBar } from "@/components/prospector/SelectionBar";
import { CreateSiteDialog } from "@/components/prospector/CreateSiteDialog";
import { useProspector } from "@/features/prospector/store";
import { EmptyState, PageHeader, SourceNotice } from "@/features/prospector/ui";
import type { Business } from "@/types";

export const Route = createFileRoute("/us-contact")({ component: USContact });

function USContact() {
  const { search, runSearch } = useProspector();
  const [category, setCategory] = useState("barbershop");
  const [city, setCity] = useState("");
  const [state, setState] = useState("FL");
  const [emailFor, setEmailFor] = useState<Business | null>(null);
  const [siteFor, setSiteFor] = useState<Business | null>(null);
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (city.trim()) void runSearch({ country: "US", category, city, state }); };
  return <div className="space-y-5 pb-28">
    <PageHeader title="US Contact" subtitle="Find US businesses without a listed website and prepare the outreach email." />
    <Card className="p-4"><form onSubmit={submit} className="grid gap-2 md:grid-cols-4"><Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Business type" /><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" /><Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" /><Button type="submit"><Search className="size-4" /> Search US</Button></form></Card>
    {search.status === "idle" ? <EmptyState title="Start a US search" description="Example: barbershop · Miami · FL" /> : null}
    {search.results.length > 0 ? <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{search.results.filter((b) => !b.website).map((b) => <Card key={b.id} className="p-3"><LeadCard business={b} onCreateSite={setSiteFor} selectable /><Button className="mt-2 w-full" onClick={() => setEmailFor(b)}><Mail className="size-4" /> Ready email</Button></Card>)}</div> : null}
    <SourceNotice />
    <USEmailDialog business={emailFor} onOpenChange={(open) => !open && setEmailFor(null)} />
    <CreateSiteDialog business={siteFor} onOpenChange={(open) => !open && setSiteFor(null)} />
    <SelectionBar />
  </div>;
}
