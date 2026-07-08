import { KartProfile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
        {/* Chassis section */}
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Châssis Marque</Label>
            <Input
              defaultValue={profile.chassis_brand || ""}
              onBlur={(e) => onUpdate("chassis_brand", e.target.value)}
              className="bg-background border-border"
              placeholder="Tony Kart"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Modèle</Label>
            <Input
              defaultValue={profile.chassis_model || ""}
              onBlur={(e) => onUpdate("chassis_model", e.target.value)}
              className="bg-background border-border"
              placeholder="Racer 401R"
            />
          </div>
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Année</Label>
            <Input
              type="number"
              defaultValue={profile.chassis_year || ""}
              onBlur={(e) => onUpdate("chassis_year", parseInt(e.target.value) || null)}
              className="bg-background border-border"
              placeholder="2024"
            />
          </div>
        </div>

        {/* Engine section */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1">
            <Label className="text-xs text-muted-foreground">Modèle exact Moteur</Label>
            <Input
              defaultValue={profile.engine_model || ""}
              onBlur={(e) => onUpdate("engine_model", e.target.value)}
              className="bg-background border-border"
              placeholder="IAME X30"
            />
          </div>
          <div className="space-y-1">
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
        </div>

        {/* Acquisition device */}
        <div className="space-y-1">
          <Label className="text-xs text-muted-foreground">Boîtier d'Acquisition</Label>
          <Select
            value={profile.acquisition_device || ""}
            onValueChange={(val) => onUpdate("acquisition_device", val)}
          >
            <SelectTrigger className="bg-background border-border">
              <SelectValue placeholder="MyChron, Alfano..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Mychron 5">Mychron 5</SelectItem>
              <SelectItem value="Mychron 5S">Mychron 5S</SelectItem>
              <SelectItem value="Alfano 6">Alfano 6</SelectItem>
              <SelectItem value="Unipro">Unipro</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
