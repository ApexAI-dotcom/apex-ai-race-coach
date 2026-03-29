import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Save, Loader2, Info, Download, CheckCircle2 } from "lucide-react";
import { KartProfile } from "@/lib/api";
import { getSetupRecommendations } from "@/lib/kart-recommendations";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function KartSetupPanel({ profile, onSave }: { profile: KartProfile, onSave: (setup: any, saved_setups?: any[]) => Promise<void> }) {
  const setupJson = profile.setup_json || {};
  const savedSetups = profile.saved_setups || [];
  
  const [setup, setSetup] = useState({
    name: setupJson?.name || "Défaut",
    pressure_f: setupJson?.pressure_f || "",
    pressure_r: setupJson?.pressure_r || "",
    sprocket_front: setupJson?.sprocket_front || "",
    sprocket_rear: setupJson?.sprocket_rear || "",
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSetup({ ...setup, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setSaving(true);
    
    // Si c'est un nouveau nom, on l'ajoute à la liste des setups sauvegardés
    let newSavedSetups = [...savedSetups];
    const existingIndex = newSavedSetups.findIndex(s => s.name === setup.name);
    
    if (existingIndex >= 0) {
      newSavedSetups[existingIndex] = { ...setup, updated_at: new Date().toISOString() };
    } else {
      newSavedSetups.push({ ...setup, id: crypto.randomUUID(), created_at: new Date().toISOString() });
    }
    
    await onSave(setup, newSavedSetups);
    setSaving(false);
  };

  const handleApplyReco = () => {
    // Parse les recommandations pour extraire les pressions et couronnes
    const pAV = recos.target_pressure.match(/AV: ([\d.]+)b/)?.[1] || "";
    const pAR = recos.target_pressure.match(/AR: ([\d.]+)b/)?.[1] || "";
    const [pign, cour] = recos.sprocket_ratio.split("/");
    
    setSetup({
      ...setup,
      pressure_f: pAV,
      pressure_r: pAR,
      sprocket_front: pign || "",
      sprocket_rear: cour || ""
    });
  };

  const handleLoadSetup = (setupName: string) => {
    const s = savedSetups.find(x => x.name === setupName);
    if (s) {
      setSetup({ ...s });
    }
  };

  const recos = getSetupRecommendations(profile);

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="w-5 h-5 text-primary" /> Setup & Réglages
        </CardTitle>
        {savedSetups.length > 0 && (
          <Select onValueChange={handleLoadSetup}>
            <SelectTrigger className="w-[180px] h-8 text-xs bg-background border-border">
              <SelectValue placeholder="Charger un setup..." />
            </SelectTrigger>
            <SelectContent>
              {savedSetups.map(s => (
                <SelectItem key={s.id || s.name} value={s.name}>{s.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm flex flex-col gap-3">
          <div className="flex gap-3 items-start">
            <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1 flex-1">
              <p className="font-medium text-primary flex items-center justify-between">
                <span>Recommandation ({profile.driving_profile === 'longevity' ? 'Longévité' : profile.driving_profile === 'performance' ? 'Performance' : profile.driving_profile === 'leisure' ? 'Loisir' : 'Équilibré'})</span>
              </p>
              <p className="text-muted-foreground text-xs leading-relaxed">{recos.notes}</p>
              <p className="text-xs text-muted-foreground mt-1">Pressions : {recos.target_pressure} | Rapport : {recos.sprocket_ratio}</p>
            </div>
          </div>
          <Button variant="secondary" size="sm" className="w-full text-xs h-8 gap-2" onClick={handleApplyReco}>
            <Download className="w-3.5 h-3.5" /> Appliquer la recommandation
          </Button>
        </div>
        
        <div className="space-y-1">
          <label className="text-xs text-muted-foreground uppercase">Nom (Profil pour sauvegarde)</label>
          <Input 
            name="name"
            placeholder="ex: Sec CIK FIA"
            value={setup.name}
            onChange={handleChange}
            className="bg-background border-border shadow-sm"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase">Pression AV (b)</label>
            <Input 
              name="pressure_f"
              placeholder="ex: 0.55"
              value={setup.pressure_f}
              onChange={handleChange}
              className="bg-background border-border shadow-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase">Pression AR (b)</label>
            <Input 
              name="pressure_r"
              placeholder="ex: 0.55"
              value={setup.pressure_r}
              onChange={handleChange}
              className="bg-background border-border shadow-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase">Pignon</label>
            <Input 
              name="sprocket_front"
              placeholder="ex: 12"
              value={setup.sprocket_front}
              onChange={handleChange}
              className="bg-background border-border shadow-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase">Couronne</label>
            <Input 
              name="sprocket_rear"
              placeholder="ex: 82"
              value={setup.sprocket_rear}
              onChange={handleChange}
              className="bg-background border-border shadow-sm"
            />
          </div>
        </div>
        <Button className="w-full mt-2 gap-2" variant="outline" onClick={handleSave} disabled={saving}>
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Enregistrer le setup
        </Button>
      </CardContent>
    </Card>
  );
}
