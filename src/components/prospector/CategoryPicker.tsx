import { useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { categoryGroups, normalizeCategory } from "@/data/category-catalog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";

export function CategoryPicker({ country, selected, onChange, multiple = false, disabled = false, includeLegacy = false }: {
  country: string; selected: string[]; onChange: (terms: string[]) => void; multiple?: boolean; disabled?: boolean; includeLegacy?: boolean;
}) {
  const [query, setQuery] = useState("");
  const [collapsed, setCollapsed] = useState<string[]>([]);
  const groups = useMemo(() => categoryGroups(country, includeLegacy), [country, includeLegacy]);
  const term = normalizeCategory(query.trim());
  const visible = groups.map((group) => ({ ...group, options: group.options.filter((option) => normalizeCategory(`${group.label} ${option.label} ${option.term}`).includes(term)) })).filter((group) => group.options.length);
  const labels = new Map(groups.flatMap((g) => g.options.map((o) => [o.term, o.label] as const)));
  const toggle = (value: string) => onChange(selected.includes(value) ? selected.filter((s) => s !== value) : multiple ? [...selected, value] : [value]);

  return <div className="min-w-0 space-y-3">
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-3.5 size-4 text-muted-foreground" aria-hidden />
      <Input aria-label="Pesquisar categorias" placeholder="Pesquisar categorias..." value={query} onChange={(e) => setQuery(e.target.value)} className="h-11 pl-9" />
    </div>
    {selected.length ? <div className="flex flex-wrap gap-2" aria-label="Categorias selecionadas">
      {selected.map((value) => <Button key={value} type="button" variant="secondary" disabled={disabled} onClick={() => toggle(value)} className="h-auto min-h-11 max-w-full whitespace-normal rounded-md text-left text-xs">
        <span className="min-w-0 break-words">{labels.get(value) ?? value}</span><X className="size-3.5 shrink-0" aria-hidden />
      </Button>)}
    </div> : null}
    <div role="region" aria-label="Lista de categorias" tabIndex={0} className="max-h-[min(22rem,45dvh)] overflow-y-auto overscroll-contain rounded-md border border-border touch-pan-y">
      {visible.length === 0 ? <p className="p-4 text-sm text-muted-foreground">Nenhuma categoria encontrada.</p> : visible.map((group) => {
        const open = !!term || !collapsed.includes(group.label);
        return <div key={group.label} className="border-b border-border last:border-b-0">
          <Button type="button" variant="ghost" aria-expanded={open} onClick={() => setCollapsed((prev) => prev.includes(group.label) ? prev.filter((label) => label !== group.label) : [...prev, group.label])} className="h-auto min-h-11 w-full justify-between rounded-none px-3 py-3 text-left whitespace-normal">
            <span className="min-w-0 break-words text-sm">{group.label}</span><ChevronDown className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
          </Button>
          {open ? <div className="space-y-1 px-3 pb-3">{group.options.map((option) => <label key={option.term} className="flex min-h-11 cursor-pointer items-center gap-3 rounded-md px-2 text-sm hover:bg-muted">
            <Checkbox disabled={disabled} checked={selected.includes(option.term)} onCheckedChange={() => toggle(option.term)} aria-label={option.label} />
            <span className="min-w-0 break-words">{option.label}</span>
          </label>)}</div> : null}
        </div>;
      })}
    </div>
  </div>;
}