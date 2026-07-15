import React, { useState, useEffect } from 'react';
import { Check, ChevronsUpDown, Plus, Sparkles, Loader2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { TrackSignatureForm } from './TrackSignatureForm';
import { api } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';

interface CircuitPickerProps {
  value: any | null;
  onChange: (circuit: any | null, sessionData?: any) => void;
}

export function CircuitPicker({ value, onChange }: CircuitPickerProps) {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [circuits, setCircuits] = useState<any[]>([]);
  const [recentSessions, setRecentSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isMagicLoading, setIsMagicLoading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!session?.access_token) return;
      setLoading(true);
      try {
        const [circuitsRes, profileRes] = await Promise.all([
          api.getCircuits(session.access_token).catch(() => ({ circuits: [] })),
          api.getKartProfile(session.access_token).catch(() => ({ recent_sessions: [] }))
        ]);
        
        if (circuitsRes && circuitsRes.circuits) {
          setCircuits(circuitsRes.circuits);
        }
        if (profileRes && profileRes.recent_sessions) {
          setRecentSessions(profileRes.recent_sessions);
        }
      } catch (err) {
        console.error("Error fetching circuits and sessions", err);
      } finally {
        setLoading(false);
      }
    };
    if (open && circuits.length === 0) {
      fetchData();
    }
  }, [session, open]);

  const displayValue = value?.label || value?.name || "";

  const handleCreate = () => {
    setOpen(false);
    setIsFormOpen(true);
  };

  const handleSaveSignature = async (signatureData: any) => {
    if (!session?.access_token) return;
    try {
      const payload = {
        name: searchQuery || "Nouveau Circuit",
        ...signatureData,
      };
      const res = await api.createCircuit(session.access_token, payload);
      onChange({ id: res.circuit.id, name: res.circuit.name, ...res.circuit });
    } catch (err) {
      console.error("Error creating circuit:", err);
      onChange({
        name: searchQuery || "Nouveau Circuit",
        ...signatureData,
      });
    } finally {
      setIsFormOpen(false);
      setSearchQuery("");
    }
  };

  const handleMagicSessionSelect = (s: any) => {
    setIsMagicLoading(true);
    setOpen(false);
    
    // Simulate loading for better UX
    setTimeout(() => {
      const trackTemp = s.track_temperature || '';
      const airTemp = s.air_temp || '';
      const weather = s.weather || 'sec';
      const mode = s.session_type || 'course';
      const circuit = s.circuit_id ? { id: s.circuit_id, name: s.track_name || 'Circuit Inconnu' } : null;

      onChange(circuit, { trackTemp, airTemp, weather, mode });
      setIsMagicLoading(false);
    }, 500);
  };

  const inputClass = "w-full justify-between bg-background/50 border-border hover:bg-muted/50 focus-visible:ring-primary focus-visible:border-primary transition-all duration-300";

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={inputClass}
            disabled={isMagicLoading}
          >
            {isMagicLoading ? (
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-primary" /> Extraction de l'analyse...
              </span>
            ) : displayValue ? displayValue : "Rechercher ou créer un circuit..."}
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

              {/* Liaisons Magiques */}
              {!searchQuery && recentSessions.length > 0 && (
                <CommandGroup heading="Liaison Magique ApexAI">
                  {recentSessions.slice(0, 3).map((s) => (
                    <CommandItem 
                      key={s.id} 
                      onSelect={() => handleMagicSessionSelect(s)}
                      className="cursor-pointer gap-2 py-2"
                    >
                      <Sparkles className="w-4 h-4 text-primary" />
                      <div className="flex flex-col">
                        <span className="font-medium">Créer à partir de la session</span>
                        <span className="text-xs text-muted-foreground">
                          {s.session_date ? new Date(s.session_date).toLocaleDateString() : 'Date inconnue'} - {s.track_name || 'Circuit Inconnu'}
                        </span>
                      </div>
                    </CommandItem>
                  ))}
                </CommandGroup>
              )}

              {recentSessions.length > 0 && !searchQuery && <CommandSeparator />}

              {/* Circuits */}
              <CommandGroup heading="Circuits existants">
                {loading ? (
                  <div className="p-4 flex justify-center"><Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /></div>
                ) : circuits.length > 0 ? (
                  circuits.map((circuit) => (
                    <CommandItem
                      key={circuit.id}
                      value={circuit.name}
                      onSelect={() => {
                        onChange({ id: circuit.id, name: circuit.name, ...circuit });
                        setOpen(false);
                        setSearchQuery("");
                      }}
                      className="gap-2"
                    >
                      <MapPin className={cn("w-4 h-4", displayValue === circuit.name ? "text-primary opacity-100" : "opacity-0")} />
                      {circuit.name}
                    </CommandItem>
                  ))
                ) : (
                  <div className="p-2 text-xs text-muted-foreground text-center">Aucun circuit trouvé.</div>
                )}
              </CommandGroup>
              
              <CommandSeparator />
              <CommandGroup heading="Action">
                <CommandItem onSelect={handleCreate} className="text-primary gap-2 cursor-pointer">
                  <Plus className="w-4 h-4" />
                  Créer un circuit manuellement
                </CommandItem>
              </CommandGroup>
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
