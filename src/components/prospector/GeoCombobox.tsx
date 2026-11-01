import { useState } from "react";
import { Check, ChevronsUpDown, X } from "lucide-react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export type GeoOption = { value: string; label: string; hint?: string };

/** Campo de seleção com pesquisa interna, no mesmo formato dos outros campos. */
export function GeoCombobox(props: {
  id?: string;
  value: string;
  options: GeoOption[];
  placeholder: string;
  searchPlaceholder: string;
  onSelect: (option: GeoOption | null) => void;
  allowCustom?: boolean;
  clearable?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const selected = props.options.find((o) => o.value === props.value);
  const label = selected?.label ?? props.value;
  const custom = term.trim();
  const showCustom = props.allowCustom && custom && !props.options.some((o) => o.label.toLowerCase() === custom.toLowerCase());

  const pick = (o: GeoOption | null) => {
    props.onSelect(o);
    setTerm("");
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <div className="relative">
        <PopoverTrigger asChild>
          <button
            id={props.id}
            type="button"
            role="combobox"
            aria-expanded={open}
            className="flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 text-left text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <span className={cn("truncate", !label && "text-muted-foreground")}>{label || props.placeholder}</span>
            <ChevronsUpDown className={cn("h-4 w-4 shrink-0 opacity-50", props.clearable && label && "invisible")} />
          </button>
        </PopoverTrigger>
        {props.clearable && label ? (
          <button type="button" aria-label="Limpar" onClick={() => pick(null)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        ) : null}
      </div>
      <PopoverContent className="w-[--radix-popover-trigger-width] min-w-[240px] p-0" align="start">
        <Command>
          <CommandInput placeholder={props.searchPlaceholder} value={term} onValueChange={setTerm} />
          <CommandList className="max-h-64">
            <CommandEmpty>Nenhuma opção encontrada.</CommandEmpty>
            {showCustom ? (
              <CommandGroup>
                <CommandItem value={`__custom ${custom}`} onSelect={() => pick({ value: custom, label: custom })}>
                  Usar “{custom}”
                </CommandItem>
              </CommandGroup>
            ) : null}
            <CommandGroup>
              {props.options.map((o) => (
                <CommandItem key={`${o.value}|${o.hint ?? ""}`} value={`${o.label} ${o.hint ?? ""}`} onSelect={() => pick(o)}>
                  <Check className={cn("mr-2 h-4 w-4", o.value === props.value ? "opacity-100" : "opacity-0")} />
                  <span className="truncate">{o.label}</span>
                  {o.hint ? <span className="ml-auto pl-2 text-xs text-muted-foreground">{o.hint}</span> : null}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
