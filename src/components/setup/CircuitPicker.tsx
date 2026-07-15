import React, { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from "lucide-react";
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
import { TrackSignatureForm } from './TrackSignatureForm';

const KNOWN_CIRCUITS = [
  { value: "le-mans", label: "Le Mans Karting International" },
  { value: "mariembourg", label: "Karting des Fagnes (Mariembourg)" },
  { value: "genk", label: "Karting Genk (Home of Champions)" },
  { value: "salbris", label: "Sologne Karting (Salbris)" },
  { value: "essay", label: "Circuit d'Essay" },
];

interface CircuitPickerProps {
  value: any | null;
  onChange: (circuit: any | null) => void;
}

export function CircuitPicker({ value, onChange }: CircuitPickerProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);

  const displayValue = value?.label || value?.name || "";

  const handleCreate = () => {
    setOpen(false);
    setIsFormOpen(true);
  };

  const handleSaveSignature = (signatureData: any) => {
    onChange({
      name: searchQuery || "Nouveau Circuit",
      ...signatureData,
    });
    setIsFormOpen(false);
    setSearchQuery("");
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between bg-background border-border hover:bg-muted/50"
          >
            {displayValue ? displayValue : "Rechercher ou créer un circuit..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput 
              placeholder="Nom du circuit..." 
              value={searchQuery}
              onValueChange={setSearchQuery}
            />
            <CommandList>
              <CommandEmpty className="py-2 px-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-sm text-primary hover:text-primary/90 gap-2"
                  onClick={handleCreate}
                >
                  <Plus className="w-4 h-4" />
                  Créer "{searchQuery}"
                </Button>
              </CommandEmpty>
              <CommandGroup heading="Circuits connus">
                {KNOWN_CIRCUITS.map((circuit) => (
                  <CommandItem
                    key={circuit.value}
                    value={circuit.label}
                    onSelect={(currentValue) => {
                      onChange(circuit);
                      setOpen(false);
                      setSearchQuery("");
                    }}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        displayValue === circuit.label ? "opacity-100" : "opacity-0"
                      )}
                    />
                    {circuit.label}
                  </CommandItem>
                ))}
              </CommandGroup>
              
              {searchQuery && (
                <CommandGroup heading="Action">
                  <CommandItem onSelect={handleCreate} className="text-primary gap-2 cursor-pointer">
                    <Plus className="w-4 h-4" />
                    Créer le circuit "{searchQuery}"
                  </CommandItem>
                </CommandGroup>
              )}
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>

      <TrackSignatureForm 
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSave={handleSaveSignature}
        circuitName={searchQuery}
      />
    </>
  );
}
