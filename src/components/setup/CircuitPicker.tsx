import React, { useState } from 'react';
import { Check, ChevronsUpDown, MapPin, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface CircuitPickerProps {
  value: any | null;
  onChange: (circuit: any | null) => void;
  circuits: any[];
  loading: boolean;
}

export function CircuitPicker({ value, onChange, circuits, loading }: CircuitPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const displayValue = value?.label || value?.name || "";

  // Filter circuits locally based on search query
  const filteredCircuits = circuits.filter(circuit =>
    (circuit.name || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  const inputClass = "w-full justify-between bg-background/50 border-border hover:bg-muted/50 focus-visible:ring-primary focus-visible:border-primary transition-all duration-300";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={inputClass}
        >
          {displayValue ? displayValue : "Rechercher un circuit..."}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <Command>
          <CommandInput 
            placeholder="Rechercher par nom..." 
            value={searchQuery}
            onValueChange={setSearchQuery}
          />
          <CommandList>
            <CommandEmpty className="py-2 px-4 text-sm text-muted-foreground">
              Aucun circuit trouvé.
            </CommandEmpty>

            <CommandGroup heading="Circuits disponibles">
              {loading ? (
                <div className="p-4 flex justify-center">
                  <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                </div>
              ) : filteredCircuits.length > 0 ? (
                filteredCircuits.map((circuit) => (
                  <CommandItem
                    key={circuit.id}
                    value={circuit.name}
                    onSelect={() => {
                      onChange(circuit);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                    className="gap-2 cursor-pointer"
                  >
                    <MapPin className={cn("w-4 h-4", displayValue === circuit.name ? "text-primary opacity-100" : "opacity-0")} />
                    {circuit.name}
                  </CommandItem>
                ))
              ) : (
                <div className="p-2 text-xs text-muted-foreground text-center">Aucun résultat.</div>
              )}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
