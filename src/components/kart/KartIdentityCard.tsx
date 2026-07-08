import { KartProfile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Edit2 } from "lucide-react";

const CATEGORY_WEIGHTS: Record<string, number> = {
  "X30 Senior": 162,
  "Rotax Max": 162,
  "KZ2": 175,
  "Mini 60": 110,
  "Nationale": 145,
  "KA100": 150
};

interface KartIdentityCardProps {
  profile: KartProfile;
  onUpdate: (field: keyof KartProfile, value: any) => void;
}

export function KartIdentityCard({ profile, onUpdate }: KartIdentityCardProps) {
  const handleEngineChange = (val: string) => {
    onUpdate("engine_category", val);
    const weight = CATEGORY_WEIGHTS[val as keyof typeof CATEGORY_WEIGHTS];
    if (weight) {
      onUpdate("category_min_weight_kg", weight);
    }
  };

  return (
    <Card className="bg-card border border-border shadow-sm rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Edit2 className="w-5 h-5 text-primary" />
          Identité du Kart
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Châssis Marque</Label>
            <Input
              defaultValue={profile.chassis_brand || ""}
              onBlur={(e) => onUpdate("chassis_brand", e.target.value)}
              className="bg-background border-border"
              placeholder="Ex: Tony Kart"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Modèle Châssis</Label>
            <Input
              defaultValue={profile.chassis_model || ""}
              onBlur={(e) => onUpdate("chassis_model", e.target.value)}
              className="bg-background border-border"
              placeholder="Ex: Racer 401R"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Catégorie Moteur</Label>
            <Select value={profile.engine_category || ""} onValueChange={handleEngineChange}>
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Catégorie..." />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(CATEGORY_WEIGHTS).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Boîtier d'Acquisition</Label>
            <Select
              value={profile.acquisition_device || ""}
              onValueChange={(val) => onUpdate("acquisition_device", val)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Catégorie" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="X30 Senior">X30 Senior</SelectItem>
                <SelectItem value="Rotax Max">Rotax Max</SelectItem>
                <SelectItem value="KZ2">KZ2</SelectItem>
                <SelectItem value="Mini 60">Mini 60</SelectItem>
                <SelectItem value="Nationale">Nationale</SelectItem>
                <SelectItem value="KA100">KA100</SelectItem>
              </SelectContent>
            </Select>
            <Input 
              placeholder="Modèle exact" 
              value={profile.engine_model || ""}
              onChange={(e) => onUpdate("engine_model", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Acquisition de données</h3>
          <Select 
            value={profile.acquisition_device || ""} 
            onValueChange={(v) => onUpdate("acquisition_device", v)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Choisir un boîtier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mychron 5">Mychron 5</SelectItem>
              <SelectItem value="Alfano 6">Alfano 6</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
