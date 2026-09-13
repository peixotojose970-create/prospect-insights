import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/features/prospector/ui";
import { useProspector } from "@/features/prospector/store";

export const Route = createFileRoute("/us")({ component: USProspecting });

function USProspecting() {
  const { runSearch } = useProspector();
  const [city, setCity] = useState("");
  const [state, setState] = useState("FL");
  const [category, setCategory] = useState("barbershop");
  return <div className="space-y-5">
    <PageHeader title="US Prospecting" subtitle="Search local businesses in the United States using Google Maps." />
    <form className="flex flex-wrap gap-2" onSubmit={(e) => { e.preventDefault(); if (city.trim()) void runSearch({ country: "US", category, city, state }); }}>
      <Input value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Business type" />
      <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
      <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
      <Button type="submit"><Search className="size-4" /> Search US</Button>
    </form>
  </div>;
}
