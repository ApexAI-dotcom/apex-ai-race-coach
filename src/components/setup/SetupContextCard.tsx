import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CloudRain, Sun, Cloud, Thermometer, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';
import { SetupState } from '@/pages/SetupPage';

interface SetupContextCardProps {
  state: SetupState;
  onChange: (updates: Partial<SetupState>) => void;
  className?: string;
}

export function SetupContextCard({ state, onChange, className }: SetupContextCardProps) {
  const inputClass = "bg-background/50 border-border focus-visible:ring-primary focus-visible:border-primary transition-all duration-300 hover:border-primary/50";

  return (
    <Card className={cn("bg-card border-border rounded-2xl shadow-md hover:shadow-primary/5 transition-all overflow-hidden flex flex-col", className)}>
      <CardHeader className="bg-muted/30 border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="w-5 h-5 text-primary" />
          Contexte et piste
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-4 sm:p-6 space-y-6 sm:space-y-8 flex-1 flex flex-col justify-between">
        
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Nom du réglage</Label>
          <Input 
            type="text" 
            placeholder="Ex: Qualif - Vega vert" 
            value={state.setupName || ""}
            onChange={(e) => onChange({ setupName: e.target.value })}
            className={inputClass}
          />
        </div>
        
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Météo</Label>
            <ToggleGroup 
              type="single" 
              value={state.weather} 
              onValueChange={(val) => val && onChange({ weather: val as any })}
              className="justify-start gap-2 flex-wrap"
            >
              <ToggleGroupItem value="sec" aria-label="Sec" className="h-10 flex-1 gap-1.5 min-w-0 px-2">
                <Sun className="w-4 h-4" /> Sec
              </ToggleGroupItem>
              <ToggleGroupItem value="humide" aria-label="Humide" className="h-10 flex-1 gap-1.5 min-w-0 px-2">
                <Cloud className="w-4 h-4" /> Humide
              </ToggleGroupItem>
              <ToggleGroupItem value="pluie" aria-label="Pluie" className="h-10 flex-1 gap-1.5 min-w-0 px-2">
                <CloudRain className="w-4 h-4" /> Pluie
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Grip de la piste</Label>
            <ToggleGroup 
              type="single" 
              value={state.grip} 
              onValueChange={(val) => val && onChange({ grip: val as any })}
              className="justify-start gap-2 flex-wrap"
            >
              <ToggleGroupItem value="faible" aria-label="Faible" className="h-10 flex-1 min-w-0 px-2">
                Faible
              </ToggleGroupItem>
              <ToggleGroupItem value="normal" aria-label="Normal" className="h-10 flex-1 min-w-0 px-2">
                Normal
              </ToggleGroupItem>
              <ToggleGroupItem value="gommée" aria-label="Gommée" className="h-10 flex-1 min-w-0 px-2">
                Gommée
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6">
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Type de séance</Label>
            <ToggleGroup 
              type="single" 
              value={state.mode} 
              onValueChange={(val) => val && onChange({ mode: val as any })}
              className="justify-start gap-2 flex-wrap"
            >
              {[
                { v: "roulage", l: "Roulage" },
                { v: "warmup", l: "Warm-up" },
                { v: "qualif", l: "Qualif" },
                { v: "course", l: "Course" },
              ].map((m) => (
                <ToggleGroupItem key={m.v} value={m.v} aria-label={m.l} className="h-10 min-w-0 flex-1 basis-[calc(50%-0.25rem)] px-2 sm:basis-0">
                  {m.l}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:gap-6">
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Thermometer className="w-4 h-4" /> Air (°C)
            </Label>
            <Input 
              type="number" 
              placeholder="Ex: 22" 
              value={state.airTemp}
              onChange={(e) => onChange({ airTemp: e.target.value ? Number(e.target.value) : '' })}
              className={inputClass}
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-primary" /> Piste (°C)
            </Label>
            <Input 
              type="number" 
              placeholder="Ex: 35" 
              value={state.trackTemp}
              onChange={(e) => onChange({ trackTemp: e.target.value ? Number(e.target.value) : '' })}
              className={inputClass}
            />
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
}
