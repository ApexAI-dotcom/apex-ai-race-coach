import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale, Save, Trash2, Check, X, Sparkles, Loader2, Wand2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { api } from "@/lib/api";

interface WeightProfile {
  id: string;
  name: string;
  driverWeight: number | '';
  kartWeight: number | '';
  ballast: number | '';
  targetWeight: number | '';
}

interface WeightCardProps {
  driverWeight: number | '';
  kartWeight: number | '';
  targetWeight: number | '';
  ballast: number | '';
  onChange: (updates: any) => void;
  weightProfiles?: WeightProfile[];
  onSaveProfile?: (name: string) => void;
  onDeleteProfile?: (id: string) => void;
  // Jeton d'accès pour l'estimation depuis le Garage (composants catalogue)
  token?: string;
}

export function WeightCard({ 
  driverWeight, 
  kartWeight, 
  targetWeight, 
  ballast, 
  onChange,
  weightProfiles = [],
  onSaveProfile,
  onDeleteProfile,
  token
}: WeightCardProps) {
  const emptyWeight = Number(kartWeight) || 0;
  const dWeight = Number(driverWeight) || 0;
  const bWeight = Number(ballast) || 0;
  const totalWeight = emptyWeight + dWeight + bWeight;
  const minWeight = Number(targetWeight) || 0;
  
  const delta = minWeight > 0 ? totalWeight - minWeight : 0;
  const isCompliant = minWeight > 0 && delta >= 0;

  const [isSaving, setIsSaving] = useState(false);
  const [profileName, setProfileName] = useState("");
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);

  // Estimation depuis le Garage (poids constructeur châssis + moteur + pilote)
  const [estimateOpen, setEstimateOpen] = useState(false);
  const [estimate, setEstimate] = useState<any | null>(null);
  const [estimateLoading, setEstimateLoading] = useState(false);
  const [pilotWeight, setPilotWeight] = useState<string>('');

  const openEstimate = async () => {
    if (!token) return;
    setEstimateOpen(true);
    setEstimateLoading(true);
    try {
      const res = await api.getWeightEstimate(token);
      setEstimate(res.estimate || null);
      if (res.estimate?.driver_weight_kg != null) {
        setPilotWeight(String(res.estimate.driver_weight_kg));
      }
    } catch {
      setEstimate(null);
    } finally {
      setEstimateLoading(false);
    }
  };

  const applyEstimate = async () => {
    const dw = Number(pilotWeight);
    const updates: any = {};
    if (estimate?.kart_weight_kg != null) updates.kartWeight = estimate.kart_weight_kg;
    if (dw > 0) {
      updates.driverWeight = dw;
      // Persiste le poids pilote dans le profil pour les prochaines fois
      if (token) {
        api.updateKartProfile(token, { driver_weight_kg: dw }).catch(() => {});
      }
    }
    onChange(updates);
    setEstimateOpen(false);
  };

  // Détecte automatiquement si les poids actuels correspondent à un profil existant
  React.useEffect(() => {
    const matched = weightProfiles.find(
      p => Number(p.driverWeight) === Number(driverWeight) &&
           Number(p.kartWeight) === Number(kartWeight) &&
           Number(p.ballast) === Number(ballast) &&
           Number(p.targetWeight) === Number(targetWeight)
    );
    if (matched) {
      setSelectedProfileId(matched.id);
    } else {
      setSelectedProfileId(null);
    }
  }, [driverWeight, kartWeight, ballast, targetWeight, weightProfiles]);

  const handleSave = () => {
    if (!profileName.trim()) return;
    if (onSaveProfile) {
      onSaveProfile(profileName.trim());
    }
    setProfileName("");
    setIsSaving(false);
  };

  const handleSelectProfile = (id: string) => {
    setSelectedProfileId(id);
    const selected = weightProfiles.find(p => p.id === id);
    if (selected) {
      onChange({
        driverWeight: selected.driverWeight,
        kartWeight: selected.kartWeight,
        ballast: selected.ballast,
        targetWeight: selected.targetWeight
      });
    }
  };

  const handleDelete = () => {
    if (!selectedProfileId) return;
    if (onDeleteProfile) {
      onDeleteProfile(selectedProfileId);
    }
    setSelectedProfileId(null);
  };

  return (
    <Card className="bg-card border border-border shadow-sm rounded-2xl flex flex-col relative overflow-hidden transition-all duration-300 hover:shadow-md">
      <CardHeader className="pb-3 border-b border-border bg-muted/20">
        <CardTitle className="text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Bilan Poids
          </span>
          {!isSaving ? (
            <span className="flex items-center gap-1">
              {token && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={openEstimate}
                  className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                  title="Estimer depuis mon Garage"
                >
                  <Wand2 className="w-4 h-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsSaving(true)}
                className="h-8 w-8 text-muted-foreground hover:text-primary transition-colors"
                title="Sauvegarder en profil"
              >
                <Save className="w-4 h-4" />
              </Button>
            </span>
          ) : (
            <div className="flex items-center gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setIsSaving(false)}
                className="h-8 w-8 text-destructive"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          )}
        </CardTitle>

        {/* Formulaire de sauvegarde rapide de profil de poids */}
        {isSaving && (
          <div className="flex gap-2 mt-3 animate-slide-down">
            <Input 
              placeholder="Nom du profil (ex: Pluie, Qualification)" 
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="h-8 text-xs bg-background"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); }}
            />
            <Button size="icon" className="h-8 w-8 shrink-0" onClick={handleSave}>
              <Check className="w-4 h-4" />
            </Button>
          </div>
        )}

        {/* Selecteur de profil de poids */}
        {weightProfiles.length > 0 && !isSaving && (
          <div className="flex gap-2 mt-3 items-center">
            <Select 
              value={selectedProfileId || ""} 
              onValueChange={handleSelectProfile}
            >
              <SelectTrigger className="h-8 text-xs bg-background/50 border-border">
                <SelectValue placeholder="Sélectionner un profil..." />
              </SelectTrigger>
              <SelectContent>
                {weightProfiles.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name} ({(Number(p.driverWeight) || 0) + (Number(p.kartWeight) || 0) + (Number(p.ballast) || 0)} kg)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProfileId && (
              <Button
                size="icon"
                variant="ghost"
                onClick={handleDelete}
                className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/5"
                title="Supprimer ce profil"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      
      <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-center">
        <div className="flex flex-col items-center justify-center py-2 bg-background/30 rounded-xl border border-border/80 shadow-inner relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
          <div className="text-3xl font-display font-extrabold tracking-tight">
            {totalWeight > 0 ? totalWeight : "--"}
            <span className="text-sm text-muted-foreground font-normal ml-1">kg</span>
          </div>
          {minWeight > 0 && (
            <div className="mt-1">
              {isCompliant ? (
                <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border border-green-500/20 px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
                  Conforme · +{delta} kg
                </Badge>
              ) : (
                <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border border-red-500/20 px-2 py-0.5 text-[9px] font-semibold tracking-wide uppercase">
                  Non-Conforme · {delta} kg
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-2.5 mt-auto">
          <div className="space-y-1">
            <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Poids à vide (kg)</Label>
            <Input
              type="number"
              value={kartWeight}
              onChange={(e) => onChange({ kartWeight: e.target.value ? parseFloat(e.target.value) : '' })}
              className="h-8 text-xs bg-background/50 border-border focus-visible:ring-primary focus-visible:border-primary transition-all duration-300 hover:border-primary/50"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Pilote + Équip. (kg)</Label>
            <Input
              type="number"
              value={driverWeight}
              onChange={(e) => onChange({ driverWeight: e.target.value ? parseFloat(e.target.value) : '' })}
              className="h-8 text-xs bg-background/50 border-border focus-visible:ring-primary focus-visible:border-primary transition-all duration-300 hover:border-primary/50"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Lest (kg)</Label>
            <Input
              type="number"
              value={ballast}
              onChange={(e) => onChange({ ballast: e.target.value ? parseFloat(e.target.value) : '' })}
              className="h-8 text-xs bg-background/50 border-border focus-visible:ring-primary focus-visible:border-primary transition-all duration-300 hover:border-primary/50"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-[9px] uppercase font-bold tracking-wider text-muted-foreground">Poids Mini Règl. (kg)</Label>
            <Input
              type="number"
              value={targetWeight}
              onChange={(e) => onChange({ targetWeight: e.target.value ? parseFloat(e.target.value) : '' })}
              className="h-8 text-xs bg-background/50 border-border focus-visible:ring-primary focus-visible:border-primary transition-all duration-300 hover:border-primary/50"
            />
          </div>
        </div>
      </CardContent>
      <Dialog open={estimateOpen} onOpenChange={setEstimateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-primary" />
              Estimation depuis mon Garage
            </DialogTitle>
            <DialogDescription>
              Poids constructeur de tes composants + ton poids pilote.
              Estimation à ±{estimate?.tolerance_kg ?? 3} kg (essence et accessoires non comptés).
            </DialogDescription>
          </DialogHeader>

          {estimateLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : !estimate ? (
            <p className="text-sm text-muted-foreground py-4">Estimation indisponible.</p>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Châssis · {estimate.chassis?.label || 'non configuré'}</span>
                  <span className="font-semibold">{estimate.chassis?.weight_kg != null ? `${estimate.chassis.weight_kg} kg` : '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-border/50">
                  <span className="text-muted-foreground">Moteur · {estimate.engine?.label || 'non configuré'}</span>
                  <span className="font-semibold">{estimate.engine?.weight_kg != null ? `${estimate.engine.weight_kg} kg` : '—'}</span>
                </div>
                <div className="flex justify-between py-1.5 font-semibold">
                  <span>Kart à vide estimé</span>
                  <span className="text-primary">{estimate.kart_weight_kg != null ? `${estimate.kart_weight_kg} kg` : '—'}</span>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Ton poids pilote (kg, équipement compris)</Label>
                <Input
                  type="number"
                  min={20}
                  value={pilotWeight}
                  onChange={(e) => setPilotWeight(e.target.value)}
                  placeholder="Ex: 74"
                />
                <p className="text-[11px] text-muted-foreground">
                  Mémorisé dans ton profil pour les prochaines estimations.
                </p>
              </div>

              {estimate.missing?.includes('chassis') || estimate.missing?.includes('engine') ? (
                <p className="text-xs text-amber-400">
                  ⚠ Configure ton châssis/moteur dans Mon Kart pour une estimation complète.
                </p>
              ) : null}

              <Button
                className="w-full"
                onClick={applyEstimate}
                disabled={estimate.kart_weight_kg == null && !Number(pilotWeight)}
              >
                Appliquer au Bilan Poids
                {estimate.kart_weight_kg != null && Number(pilotWeight) > 0 && (
                  <span className="ml-2 font-mono">
                    ({(estimate.kart_weight_kg + Number(pilotWeight)).toFixed(1)} kg)
                  </span>
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
}
