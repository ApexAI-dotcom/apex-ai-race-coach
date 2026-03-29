import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Settings, Save, Loader2 } from "lucide-react";

export function KartSetupPanel({ setupJson = {}, onSave }: { setupJson: any, onSave: (setup: any) => Promise<void> }) {
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

  return (
    <Card className="glass-card border-white/5 bg-black/40">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Settings className="w-5 h-5 text-primary" /> Setup Actuel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
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
