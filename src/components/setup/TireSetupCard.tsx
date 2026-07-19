import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Disc3, Sparkles, CloudRain } from 'lucide-react';
import { SetupState } from '@/pages/SetupPage';
import { FieldRecommendation } from './FieldRecommendation';

interface TireSetupCardProps {
  state: SetupState;
  onChange: (updates: Partial<SetupState>) => void;
  recommendations?: Record<string, any>;
  // Recommandation du train de pneus depuis le stock Mon Kart (advisor backend)
  tireSetAdvice?: {
    set: any | null;
    mounted?: any | null;
    is_change?: boolean;
    is_optimal?: boolean;
    message: string;
    priority?: string;
  } | null;
  // Trains du stock Mon Kart (pour le sélecteur de modèle)
  tireSets?: any[];
}

export function TireSetupCard({ state, onChange, recommendations, tireSetAdvice, tireSets = [] }: TireSetupCardProps) {
  const inputClass = "bg-background/50 border-border focus-visible:ring-primary focus-visible:border-primary transition-all duration-300 hover:border-primary/50";

  const setModel = (s: any) => s.custom_model || s.component_label || 'Pneu';
  // Le train dont le modèle correspond à la valeur actuelle (pour l'affichage sélectionné)
  const currentValue = state.tireModel || '';
  const knownModels = tireSets.map(setModel);
  const isCustomValue = currentValue !== '' && !knownModels.includes(currentValue);

  return (
    <Card className="bg-card border-border rounded-2xl shadow-md hover:shadow-primary/5 transition-all overflow-hidden h-full">
      <CardHeader className="bg-muted/30 border-b border-border pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Disc3 className="w-5 h-5 text-primary" />
          Pneumatiques
        </CardTitle>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">

        {tireSetAdvice && (
          <div className={`rounded-xl border p-3 text-xs leading-relaxed ${
            tireSetAdvice.is_change
              ? 'border-amber-500/40 bg-amber-500/10 text-amber-200'
              : tireSetAdvice.is_optimal
              ? 'border-emerald-500/30 bg-emerald-500/5 text-foreground'
              : 'border-primary/20 bg-primary/5 text-foreground'
          }`}>
            <div className={`flex items-center gap-1.5 font-semibold mb-1 ${
              tireSetAdvice.is_change ? 'text-amber-300' : tireSetAdvice.is_optimal ? 'text-emerald-400' : 'text-primary'
            }`}>
              <Sparkles className="w-3.5 h-3.5" />
              {tireSetAdvice.is_change
                ? `Changement recommandé → ${tireSetAdvice.set?.label}`
                : tireSetAdvice.is_optimal
                ? `Pneu optimal déjà monté : ${tireSetAdvice.set?.label}`
                : tireSetAdvice.set
                ? `Train recommandé : ${tireSetAdvice.set.label}`
                : 'Stock de pneus'}
            </div>
            {tireSetAdvice.message}
          </div>
        )}

        <div className="space-y-3">
          <Label className="text-sm text-muted-foreground">Modèle de pneus (train du stock)</Label>
          {tireSets.length > 0 ? (
            <Select
              value={isCustomValue ? '__custom__' : currentValue}
              onValueChange={(v) => { if (v !== '__custom__') onChange({ tireModel: v }); }}
            >
              <SelectTrigger className={inputClass}>
                <SelectValue placeholder="Choisir un train de votre stock..." />
              </SelectTrigger>
              <SelectContent>
                {tireSets.map((s) => (
                  <SelectItem key={s.id} value={setModel(s)}>
                    <span className="flex items-center gap-1.5">
                      {s.is_rain && <CloudRain className="w-3.5 h-3.5 text-sky-400" />}
                      {s.label} · {setModel(s)}{s.is_mounted ? ' (monté)' : ''}
                    </span>
                  </SelectItem>
                ))}
                {isCustomValue && (
                  <SelectItem value="__custom__">{currentValue} (hors stock)</SelectItem>
                )}
              </SelectContent>
            </Select>
          ) : (
            <Input
              type="text"
              placeholder="Ex: Komet K2M"
              value={state.tireModel}
              onChange={(e) => onChange({ tireModel: e.target.value })}
              className={inputClass}
            />
          )}
          {tireSets.length === 0 && (
            <p className="text-[11px] text-muted-foreground">
              Déclarez vos trains dans « Mon Kart » pour les retrouver ici.
            </p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Pressions à Froid</h4>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Avant (bar)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.80" 
                value={state.coldPressureFront}
                onChange={(e) => onChange({ coldPressureFront: e.target.value ? Number(e.target.value) : '' })}
                className={inputClass}
              />
              <FieldRecommendation recommendation={recommendations?.coldPressureFront} />
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Arrière (bar)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.80" 
                value={state.coldPressureRear}
                onChange={(e) => onChange({ coldPressureRear: e.target.value ? Number(e.target.value) : '' })}
                className={inputClass}
              />
              <FieldRecommendation recommendation={recommendations?.coldPressureRear} />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-sm">Pressions à Chaud (Cible)</h4>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Avant (bar)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.95" 
                value={state.hotPressureFront}
                onChange={(e) => onChange({ hotPressureFront: e.target.value ? Number(e.target.value) : '' })}
                className={inputClass}
              />
              <FieldRecommendation recommendation={recommendations?.hotPressureFront} />
            </div>
            <div className="space-y-3">
              <Label className="text-xs text-muted-foreground">Arrière (bar)</Label>
              <Input 
                type="number" 
                step="0.01"
                placeholder="0.95" 
                value={state.hotPressureRear}
                onChange={(e) => onChange({ hotPressureRear: e.target.value ? Number(e.target.value) : '' })}
                className={inputClass}
              />
              <FieldRecommendation recommendation={recommendations?.hotPressureRear} />
            </div>
          </div>
        </div>
        
      </CardContent>
    </Card>
  );
}
