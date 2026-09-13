import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { CheckSquare, Loader2, Mail, Search, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
import { LeadCard } from "@/components/prospector/LeadCard";
import { USEmailDialog } from "@/components/prospector/USEmailDialog";
import { SelectionBar, selectionLabel } from "@/components/prospector/SelectionBar";
import { CreateSiteDialog } from "@/components/prospector/CreateSiteDialog";
import { useProspector } from "@/features/prospector/store";
import { EmptyState, PageHeader, SourceNotice } from "@/features/prospector/ui";
import { US_CITY_SUGGESTIONS, US_STATES } from "@/data/usa";
import type { Business } from "@/types";

export const Route = createFileRoute("/us-contact")({
  head: () => ({
    meta: [
      { title: "US outreach: local businesses with no website | Prospector" },
      {
        name: "description",
        content:
          "Search US local businesses by type, city and state, spot the ones with no website listed and prepare a ready-to-send outreach email.",
      },
      { property: "og:title", content: "US outreach: businesses with no website | Prospector" },
      {
        property: "og:description",
        content: "Find US businesses without a website and prepare the outreach email in one click.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: USContact,
});

const errorHints: Record<string, string> = {
  vazio: "No businesses found for this search. Try another business type or city.",
  amplo: "Enter a business type and a US city to search.",
  timeout: "The search took too long. Please try again.",
  "rate-limit": "Query limit reached. Wait a moment and try again.",
  rede: "Search failed. Check your connection.",
  local: "We couldn't find that city. Check the name and the state.",
  config: "Google Maps is not configured.",
  permissao: "Google Cloud setup (APIs and billing) is required for this integration.",
};

const US_CATEGORIES = [
  "barbershop",
  "hair salon",
  "nail salon",
  "dentist",
  "auto repair",
  "landscaping",
  "roofing contractor",
  "plumber",
  "gym",
  "restaurant",
  "coffee shop",
  "pet grooming",
] as const;

type FilterProps = {
  idPrefix: string;
  category: string;
  setCategory: (v: string) => void;
  city: string;
  setCity: (v: string) => void;
  state: string;
  setState: (v: string) => void;
  onlyNoSite: boolean;
  setOnlyNoSite: (v: boolean) => void;
  onlyPhone: boolean;
  setOnlyPhone: (v: boolean) => void;
};

function FilterFields(p: FilterProps) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-2">
          <Label htmlFor={`${p.idPrefix}-type`}>Business type</Label>
          <Input
            id={`${p.idPrefix}-type`}
            className="h-11"
            value={p.category}
            onChange={(e) => p.setCategory(e.target.value)}
            placeholder="e.g. barbershop"
            list="us-categories"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`${p.idPrefix}-city`}>City</Label>
          <Input
            id={`${p.idPrefix}-city`}
            className="h-11"
            value={p.city}
            onChange={(e) => p.setCity(e.target.value)}
            placeholder="e.g. Miami"
            list="us-cities"
          />
        </div>
        <div className="space-y-2">
          <Label>State</Label>
          <Select value={p.state} onValueChange={p.setState}>
            <SelectTrigger className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {US_STATES.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center sm:gap-5">
        <label className="flex min-h-11 items-center gap-3 text-sm text-foreground">
          <Checkbox checked={p.onlyNoSite} onCheckedChange={(v) => p.setOnlyNoSite(v === true)} />
          Only businesses with no website
        </label>
        <label className="flex min-h-11 items-center gap-3 text-sm text-foreground">
          <Checkbox checked={p.onlyPhone} onCheckedChange={(v) => p.setOnlyPhone(v === true)} />
          Only with phone number
        </label>
      </div>
    </div>
  );
}

function USContact() {
  const { search, runSearch, loadMore, loadingMore, selection, isSelected, selectMany, deselectMany } =
    useProspector();
  const [category, setCategory] = useState("barbershop");
  const [city, setCity] = useState("");
  const [state, setState] = useState("FL");
  const [onlyNoSite, setOnlyNoSite] = useState(true);
  const [onlyPhone, setOnlyPhone] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [emailFor, setEmailFor] = useState<Business | null>(null);
  const [siteFor, setSiteFor] = useState<Business | null>(null);

  const isUS = search.criteria?.country === "US";

  const results = useMemo(() => {
    if (!isUS) return [];
    return search.results
      .filter((b) => (onlyNoSite ? !b.website : true))
      .filter((b) => (onlyPhone ? !!b.phone : true))
      .sort((a, b) => b.score - a.score);
  }, [isUS, search.results, onlyNoSite, onlyPhone]);

  const allVisibleSelected = results.length > 0 && results.every((b) => isSelected(b.id));
  const activeFilters = [onlyNoSite, onlyPhone].filter(Boolean).length;

  const filterProps: FilterProps = {
    idPrefix: "us-desktop",
    category,
    setCategory,
    city,
    setCity,
    state,
    setState,
    onlyNoSite,
    setOnlyNoSite,
    onlyPhone,
    setOnlyPhone,
  };

  const runUSSearch = () => {
    if (!city.trim()) {
      setFiltersOpen(true);
      return;
    }
    void runSearch({ country: "US", category: category.trim() || "barbershop", city, state });
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setFiltersOpen(false);
    runUSSearch();
  };

  return (
    <div className={selection.length > 0 ? "space-y-5 pb-40 lg:pb-28" : "space-y-5"}>
      <PageHeader
        title="US outreach"
        subtitle="Find US businesses with no website listed and prepare the outreach email."
      />

      <datalist id="us-cities">
        {US_CITY_SUGGESTIONS.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>
      <datalist id="us-categories">
        {US_CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <Card className="gap-4 p-4">
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-2">
            <Button type="button" variant="outline" className="h-12 flex-1 md:hidden" onClick={() => setFiltersOpen(true)}>
              <SlidersHorizontal className="size-4" aria-hidden />
              Filters{activeFilters > 0 ? ` (${activeFilters})` : ""}
            </Button>
            <Button type="submit" className="h-12 flex-1 md:flex-none" disabled={search.status === "loading"}>
              {search.status === "loading" ? (
                <Loader2 className="size-4 animate-spin" aria-hidden />
              ) : (
                <Search className="size-4" aria-hidden />
              )}
              Search US
            </Button>
          </div>
          <p className="text-xs text-muted-foreground md:hidden">
            {category || "barbershop"} · {city || "choose a city"} · {state}
          </p>
          <div className="hidden md:block">
            <FilterFields {...filterProps} />
          </div>
        </form>
      </Card>

      <Sheet open={filtersOpen} onOpenChange={setFiltersOpen}>
        <SheetContent side="bottom" className="max-h-[88dvh] overflow-y-auto rounded-t-2xl p-5 md:hidden">
          <SheetHeader className="p-0 pb-4">
            <SheetTitle>Search filters</SheetTitle>
          </SheetHeader>
          <FilterFields {...filterProps} idPrefix="us-mobile" />
          <div className="mt-6 flex gap-2 pb-[env(safe-area-inset-bottom)]">
            <Button
              variant="outline"
              className="h-12 flex-1"
              onClick={() => {
                setOnlyNoSite(false);
                setOnlyPhone(false);
              }}
            >
              Clear
            </Button>
            <Button
              className="h-12 flex-1"
              onClick={() => {
                setFiltersOpen(false);
                runUSSearch();
              }}
            >
              Apply
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {search.status === "loading" ? (
        <div className="space-y-3">
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden />
            Searching businesses…
          </p>
          <div className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-52 w-full rounded-lg" />
            ))}
          </div>
        </div>
      ) : null}

      {search.status === "error" && search.error ? (
        <EmptyState
          title="Search failed"
          description={errorHints[search.error.code] ?? "Please try again."}
          action={
            search.criteria ? (
              <Button variant="outline" className="h-12" onClick={() => void runSearch(search.criteria!)}>
                Try again
              </Button>
            ) : null
          }
        />
      ) : null}

      {search.status === "idle" || (search.status === "success" && !isUS) ? (
        <EmptyState title="Start a US search" description="Example: barbershop · Miami · FL" />
      ) : null}

      {search.status === "success" && isUS ? (
        results.length === 0 ? (
          <EmptyState
            title="No businesses match these filters"
            description="The search returned results, but the current filters removed them all. Turn off a filter and try again."
            action={
              <Button variant="outline" className="h-12 md:hidden" onClick={() => setFiltersOpen(true)}>
                Adjust filters
              </Button>
            }
          />
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-sm font-medium text-foreground">
                {results.length} results
                <span className="font-normal text-muted-foreground">
                  {search.outcome?.areaLabel ? ` in ${search.outcome.areaLabel}` : ""}
                </span>
                {selection.length > 0 ? (
                  <span className="ml-2 font-normal text-primary">· {selectionLabel(selection.length)}</span>
                ) : null}
              </p>
              <Button
                size="sm"
                variant={allVisibleSelected ? "secondary" : "outline"}
                onClick={() => (allVisibleSelected ? deselectMany(results.map((b) => b.id)) : selectMany(results))}
              >
                <CheckSquare className="size-4" aria-hidden />
                {allVisibleSelected ? "Deselect all" : "Select all"}
              </Button>
            </div>

            <div className="grid gap-3 md:grid-cols-2 md:gap-4 xl:grid-cols-3">
              {results.map((b) => (
                <Card key={b.id} className="p-3">
                  <LeadCard business={b} onCreateSite={setSiteFor} selectable />
                  <Button className="mt-2 h-11 w-full" onClick={() => setEmailFor(b)}>
                    <Mail className="size-4" aria-hidden /> Ready email
                  </Button>
                </Card>
              ))}
            </div>

            {search.outcome?.nextPageToken ? (
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  className="h-12 w-full sm:w-auto"
                  onClick={() => void loadMore()}
                  disabled={loadingMore}
                >
                  {loadingMore ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
                  Load more
                </Button>
              </div>
            ) : null}
          </>
        )
      ) : null}

      <SourceNotice />
      <USEmailDialog business={emailFor} onOpenChange={(open) => !open && setEmailFor(null)} />
      <CreateSiteDialog business={siteFor} onOpenChange={(open) => !open && setSiteFor(null)} />
      <SelectionBar />
    </div>
  );
}
