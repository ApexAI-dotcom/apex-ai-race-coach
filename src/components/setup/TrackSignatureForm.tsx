import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Button } from '@/components/ui/button';
import { Minus, Plus, Settings2, RotateCw, RotateCcw, TrendingUp, Mountain, Navigation, Zap } from 'lucide-react';
import { Label } from '@/components/ui/label';

interface TrackSignatureFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (signatureData: any) => void;
  circuitName?: string;
}

export function TrackSignatureForm({ open, onOpenChange, onSave, circuitName }: TrackSignatureFormProps) {
  const [speedRatio, setSpeedRatio] = useState<string>('mixte');
  const [rotation, setRotation] = useState<string>('horaire');
  const [relief, setRelief] = useState<string>('plat');
  const [surface, setSurface] = useState<string>('lisse');
  const [hairpins, setHairpins] = useState<number>(2);
  const [fastCorners, setFastCorners] = useState<number>(3);

  useEffect(() => {
    if (open) {
      setSpeedRatio('mixte');
      setRotation('horaire');
      setRelief('plat');
      setSurface('lisse');
      setHairpins(2);
      setFastCorners(3);
    }
  }, [open]);

  const handleSave = () => {
    onSave({
      speedRatio,
      rotation,
      relief,
      surface,
      hairpins,
      fastCorners,
      isCustom: true
    });
  };

  const Stepper = ({ label, value, onChange, min = 0, max = 20 }: any) => (
    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-3">
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-full" 
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-6 text-center font-semibold text-lg">{value}</span>
        <Button 
          variant="outline" 
          size="icon" 
          className="h-8 w-8 rounded-full" 
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Settings2 className="w-5 h-5 text-primary" />
            Empreinte de la piste
          </DialogTitle>
          <DialogDescription>
            {circuitName ? `Configuration pour "${circuitName}"` : "Définissez les caractéristiques du nouveau circuit."}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          
          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Zap className="w-4 h-4" /> Ratio de Vitesse
            </Label>
            <ToggleGroup type="single" value={speedRatio} onValueChange={(v) => v && setSpeedRatio(v)} className="justify-start w-full">
              <ToggleGroupItem value="sinueux" className="flex-1">Sinueux</ToggleGroupItem>
              <ToggleGroupItem value="mixte" className="flex-1">Mixte</ToggleGroupItem>
              <ToggleGroupItem value="rapide" className="flex-1">Rapide</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <RotateCw className="w-4 h-4" /> Rotation
              </Label>
              <ToggleGroup type="single" value={rotation} onValueChange={(v) => v && setRotation(v)} className="w-full">
                <ToggleGroupItem value="horaire" className="flex-1 px-2" aria-label="Horaire">
                  <RotateCw className="w-4 h-4 mr-1" /> HD
                </ToggleGroupItem>
                <ToggleGroupItem value="anti-horaire" className="flex-1 px-2" aria-label="Anti-horaire">
                  <RotateCcw className="w-4 h-4 mr-1" /> AH
                </ToggleGroupItem>
              </ToggleGroup>
            </div>

            <div className="space-y-3">
              <Label className="text-sm text-muted-foreground flex items-center gap-2">
                <Mountain className="w-4 h-4" /> Relief
              </Label>
              <ToggleGroup type="single" value={relief} onValueChange={(v) => v && setRelief(v)} className="w-full">
                <ToggleGroupItem value="plat" className="flex-1">Plat</ToggleGroupItem>
                <ToggleGroupItem value="vallonne" className="flex-1">Vallonné</ToggleGroupItem>
              </ToggleGroup>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <Navigation className="w-4 h-4" /> Revêtement
            </Label>
            <ToggleGroup type="single" value={surface} onValueChange={(v) => v && setSurface(v)} className="justify-start w-full">
              <ToggleGroupItem value="lisse" className="flex-1">Lisse / Neuf</ToggleGroupItem>
              <ToggleGroupItem value="bossele" className="flex-1">Bosselé / Abrasif</ToggleGroupItem>
            </ToggleGroup>
          </div>

          <div className="space-y-3">
            <Label className="text-sm text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-4 h-4" /> Technicité
            </Label>
            <div className="space-y-2">
              <Stepper 
                label="Nombre d'épingles" 
                value={hairpins} 
                onChange={setHairpins} 
              />
              <Stepper 
                label="Courbes rapides" 
                value={fastCorners} 
                onChange={setFastCorners} 
              />
            </div>
          </div>

        </div>

        <DialogFooter className="pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSave}>
            Valider l'empreinte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
