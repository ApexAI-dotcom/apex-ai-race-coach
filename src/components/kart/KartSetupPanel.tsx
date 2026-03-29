import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Save, Loader2, Info } from "lucide-react";
import { KartProfile } from "@/lib/api";
import { getSetupRecommendations } from "@/lib/kart-recommendations";

export function KartSetupPanel({ profile, onSave }: { profile: KartProfile, onSave: (setup: any) => Promise<void> }) {
  const setupJson = profile.setup_json || {};
  const [setup, setSetup] = useState({
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
    await onSave(setup);
    setSaving(false);
  };

  const recos = getSetupRecommendations(profile);

  return (
    <Card className="glass-card border-white/5 bg-black/40">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="w-5 h-5 text-primary" /> Setup Actuel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 text-sm flex gap-3 items-start">
          <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-medium text-primary">Recommandation ({profile.driving_profile === 'longevity' ? 'Longévité' : profile.driving_profile === 'performance' ? 'Performance' : profile.driving_profile === 'leisure' ? 'Loisir' : 'Équilibré'})</p>
            <p className="text-muted-foreground text-xs leading-relaxed">{recos.notes}</p>
            <p className="text-xs text-white/80 mt-1">Pressions : {recos.target_pressure} | Rapport : {recos.sprocket_ratio}</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase">Pression AV (b)</label>
            <Input 
              name="pressure_f"
              placeholder="ex: 0.55"
              value={setup.pressure_f}
              onChange={handleChange}
              className="bg-black/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase">Pression AR (b)</label>
            <Input 
              name="pressure_r"
              placeholder="ex: 0.55"
              value={setup.pressure_r}
              onChange={handleChange}
              className="bg-black/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase">Pignon</label>
            <Input 
              name="sprocket_front"
              placeholder="ex: 12"
              value={setup.sprocket_front}
              onChange={handleChange}
              className="bg-black/20"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs text-muted-foreground uppercase">Couronne</label>
            <Input 
              name="sprocket_rear"
              placeholder="ex: 82"
              value={setup.sprocket_rear}
              onChange={handleChange}
              className="bg-black/20"
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
