import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { CloudRain, Sun, Cloud, Thermometer, MapPin } from 'lucide-react';
import { CircuitPicker } from './CircuitPicker';
import { SetupState } from '@/pages/SetupPage';

interface SetupContextCardProps {
  state: SetupState;
  onChange: (updates: Partial<SetupState>) => void;
}

export function SetupContextCard({ state, onChange }: SetupContextCardProps) {
  return (
    <Card className="bg-card border-border rounded-2xl shadow-sm overflow-hidden">
      <CardHeader className="bg-muted/30 border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <MapPin className="w-5 h-5 text-primary" />
          Contexte & Piste
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-8">
        
        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground flex items-center gap-2">
            Circuit / Empreinte de Piste
          </Label>
          <CircuitPicker 
            value={state.circuit}
            onChange={(circuit) => onChange({ circuit })}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Conditions Météo</Label>
            <ToggleGroup 
              type="single" 
              value={state.weather} 
              onValueChange={(val) => val && onChange({ weather: val as any })}
              className="justify-start"
            >
              <ToggleGroupItem value="sec" aria-label="Sec" className="flex-1 gap-2">
                <Sun className="w-4 h-4" /> Sec
              </ToggleGroupItem>
              <ToggleGroupItem value="humide" aria-label="Humide" className="flex-1 gap-2">
                <Cloud className="w-4 h-4" /> Humide
              </ToggleGroupItem>
              <ToggleGroupItem value="pluie" aria-label="Pluie" className="flex-1 gap-2">
                <CloudRain className="w-4 h-4" /> Pluie
              </ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground">Mode de Session</Label>
            <ToggleGroup 
              type="single" 
              value={state.mode} 
              onValueChange={(val) => val && onChange({ mode: val as any })}
              className="justify-start"
            >
              <ToggleGroupItem value="warmup" aria-label="Warmup" className="flex-1">
                Warm-up
              </ToggleGroupItem>
              <ToggleGroupItem value="qualif" aria-label="Qualif" className="flex-1">
                Qualif
              </ToggleGroupItem>
              <ToggleGroupItem value="course" aria-label="Course" className="flex-1">
                Course
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Thermometer className="w-4 h-4" /> Temp. Air (°C)
            </Label>
            <Input 
              type="number" 
              placeholder="Ex: 22" 
              value={state.airTemp}
              onChange={(e) => onChange({ airTemp: e.target.value ? Number(e.target.value) : '' })}
              className="bg-background"
            />
          </div>
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Thermometer className="w-4 h-4 text-orange-500" /> Temp. Piste (°C)
            </Label>
            <Input 
              type="number" 
              placeholder="Ex: 35" 
              value={state.trackTemp}
              onChange={(e) => onChange({ trackTemp: e.target.value ? Number(e.target.value) : '' })}
              className="bg-background"
            />
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
}
