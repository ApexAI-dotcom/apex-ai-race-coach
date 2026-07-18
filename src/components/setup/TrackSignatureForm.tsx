import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Settings2, RotateCw, RotateCcw, TrendingUp, Mountain, Navigation, Zap } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface TrackSignatureFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (signatureData: any) => void;
  circuitName?: string;
  initialData?: any;
}

export function TrackSignatureForm({ open, onOpenChange, onSave, circuitName, initialData }: TrackSignatureFormProps) {
  const [speedRatio, setSpeedRatio] = useState<string>('mixte');
  const [rotation, setRotation] = useState<string>('horaire');
  const [relief, setRelief] = useState<string>('plat');
  const [surface, setSurface] = useState<string>('lisse');
  const [hairpins, setHairpins] = useState<number>(2);
  const [fastCorners, setFastCorners] = useState<number>(3);
  const [customName, setCustomName] = useState<string>(circuitName || '');

  useEffect(() => {
    if (open) {
      if (initialData) {
        setSpeedRatio(initialData.speedRatio || 'mixte');
        setRotation(initialData.rotation || 'horaire');
        setRelief(initialData.elevation || 'plat');
        setSurface(initialData.bumpiness || 'lisse');
        setHairpins(initialData.hairpinsCount ?? 2);
        setFastCorners(initialData.fastCornersCount ?? 3);
        setCustomName(initialData.name || circuitName || '');
      } else {
        setSpeedRatio('mixte');
        setRotation('horaire');
        setRelief('plat');
        setSurface('lisse');
        setHairpins(2);
        setFastCorners(3);
        setCustomName(circuitName || '');
      }
    }
  }, [open, circuitName, initialData]);

  const handleSave = () => {
    onSave({
      speedRatio,
      rotation,
      elevation: relief,
      bumpiness: surface,
      hairpinsCount: hairpins,
      fastCornersCount: fastCorners,
      isCustom: true,
      name: customName || "Nouveau Circuit"
    });
  };

  const Stepper = ({ label, value, onChange, min = 0, max = 20 }: any) => (
    <div className="flex items-center justify-between p-2 rounded-lg border border-border bg-muted/20">
      <Label className="text-xs font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-7 w-7 rounded-full" 
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="h-3.5 w-3.5" />
        </Button>
        <span className="w-5 text-center font-semibold text-sm">{value}</span>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-7 w-7 rounded-full" 
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px] md:max-w-[540px] bg-card border-border rounded-2xl max-h-[90vh] overflow-y-auto pr-1">
        <DialogHeader className="pb-2 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Settings2 className="w-5 h-5 text-primary" />
            Caractéristiques de la Piste
          </DialogTitle>
          <DialogDescription className="text-xs">
            {circuitName ? `Ajustez les spécificités de la piste pour "${circuitName}"` : "Définissez les caractéristiques du nouveau circuit."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-sm">
          
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-muted-foreground">Nom du circuit</Label>
            <Input 
              placeholder="Ex: Le Mans, Essay, etc." 
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              className="h-9 bg-background border-border text-xs"
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-primary" /> Ratio de Vitesse
            </Label>
            <ToggleGroup type="single" value={speedRatio} onValueChange={(v) => v && setSpeedRatio(v)} className="justify-start w-full gap-2">
              <ToggleGroupItem value="sinueux" className="flex-1 h-9 text-xs">Sinueux</ToggleGroupItem>
              <ToggleGroupItem value="mixte" className="flex-1 h-9 text-xs">Mixte</ToggleGroupItem>
              <ToggleGroupItem value="rapide" className="flex-1 h-9 text-xs">Rapide</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-primary" /> Rotation
              </Label>
              <ToggleGroup type="single" value={rotation} onValueChange={(v) => v && setRotation(v)} className="w-full gap-2">
                <ToggleGroupItem value="horaire" className="flex-1 h-9 text-xs" aria-label="Horaire">
                  <RotateCw className="w-3.5 h-3.5 mr-1" /> HD
                </ToggleGroupItem>
                <ToggleGroupItem value="anti-horaire" className="flex-1 h-9 text-xs" aria-label="Anti-horaire">
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> AH
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
                <Mountain className="w-3.5 h-3.5 text-primary" /> Relief
              </Label>
              <ToggleGroup type="single" value={relief} onValueChange={(v) => v && setRelief(v)} className="w-full gap-2">
                <ToggleGroupItem value="plat" className="flex-1 h-9 text-xs">Plat</ToggleGroupItem>
                <ToggleGroupItem value="vallonne" className="flex-1 h-9 text-xs">Vallonné</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <Navigation className="w-3.5 h-3.5 text-primary" /> Revêtement
            </Label>
            <ToggleGroup type="single" value={surface} onValueChange={(v) => v && setSurface(v)} className="justify-start w-full gap-2">
              <ToggleGroupItem value="lisse" className="flex-1 h-9 text-xs">Lisse / Neuf</ToggleGroupItem>
              <ToggleGroupItem value="bossele" className="flex-1 h-9 text-xs">Bosselé / Abrasif</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-primary" /> Technicité
            </Label>
            <div className="grid grid-cols-2 gap-3">
              <Stepper 
                label="Épingles" 
                value={hairpins} 
                onChange={setHairpins} 
              />
              <Stepper 
                label="Courbes" 
                value={fastCorners} 
                onChange={setFastCorners} 
              />
            </div>
          </div>

        </div>

        <DialogFooter className="pt-3 border-t border-border/50 gap-2">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button size="sm" onClick={handleSave}>
            Confirmer et appliquer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
