import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { LeadCard } from "@/components/prospector/LeadCard";
import { SelectionBar } from "@/components/prospector/SelectionBar";
import { CreateSiteDialog } from "@/components/prospector/CreateSiteDialog";
import { useProspector } from "@/features/prospector/store";
import { PageHeader, EmptyState, SourceNotice } from "@/features/prospector/ui";
import type { Business } from "@/types";

export const Route = createFileRoute("/us-results")({ component: USResults });

function USResults() {
  const { search, runSearch, loadMore, loadingMore } = useProspector();
  const [category, setCategory] = useState("barbershop");
  const [city, setCity] = useState("");
  const [state, setState] = useState("FL");
  const [noSite, setNoSite] = useState(true);
  const [siteFor, setSiteFor] = useState<Business | null>(null);
  const results = useMemo(() => search.results.filter((b) => noSite ? !b.website : true), [search.results, noSite]);
  const submit = (e: React.FormEvent) => { e.preventDefault(); if (city.trim()) void runSearch({ country: "US", category, city: city.trim(), state }); };

  return <div className="space-y-5 pb-28">
    <PageHeader title="US Prospecting" subtitle="Google Maps businesses in the United States, prioritized for website outreach." />
    <Card className="p-4">
      <form onSubmit={submit} className="grid gap-2 md:grid-cols-4">
        <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Business type" />
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
        <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State code" />
        <Button type="submit" disabled={!city.trim() || search.status === "loading"}>{search.status === "loading" ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />} Search US</Button>
      </form>
      <label className="mt-3 flex items-center gap-2 text-sm"><Checkbox checked={noSite} onCheckedChange={(v) => setNoSite(v === true)} /> Only businesses without a website</label>
    </Card>
    {search.status === "idle" ? <EmptyState title="Start a US search" description="Enter a city and business type to find local prospects." /> : null}
    {search.status === "error" ? <EmptyState title="Search failed" description={search.error?.message ?? "Try again."} /> : null}
    {search.status === "success" && results.length === 0 ? <EmptyState title="No matching businesses" description="Try another city or disable the website filter." /> : null}
    {results.length > 0 ? <>
      <div className="flex items-center justify-between"><p className="text-sm font-medium">{results.length} results{search.outcome?.areaLabel ? ` · ${search.outcome.areaLabel}` : ""}</p>{search.outcome?.nextPageToken ? <Button variant="outline" onClick={() => void loadMore()} disabled={loadingMore}>{loadingMore ? <Loader2 className="size-4 animate-spin" /> : null} Load more</Button> : null}</div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">{results.map((b) => <LeadCard key={b.id} business={b} onCreateSite={setSiteFor} selectable />)}</div>
    </> : null}
    <SourceNotice />
    <CreateSiteDialog business={siteFor} onOpenChange={(open) => !open && setSiteFor(null)} />
    <SelectionBar />
  </div>;
}
