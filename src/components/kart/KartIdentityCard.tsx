import { KartProfile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const CATEGORY_WEIGHTS: Record<string, number> = {
  "X30 Senior": 162,
  "Rotax Max": 162,
  "KZ2": 175,
  "Mini 60": 110,
  "Nationale": 145,
  "KA100": 150
};

export function KartIdentityCard({
  profile,
  onUpdate,
}: {
  profile: KartProfile;
  onUpdate: (field: keyof KartProfile, value: any) => void;
}) {
  return (
    <Card className="bg-card border-border shadow-sm h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Identité du Kart</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Châssis</h3>
          <div className="grid grid-cols-3 gap-2">
            <Input 
              placeholder="Marque" 
              value={profile.chassis_brand || ""}
              onChange={(e) => onUpdate("chassis_brand", e.target.value)}
            />
            <Input 
              placeholder="Modèle" 
              value={profile.chassis_model || ""}
              onChange={(e) => onUpdate("chassis_model", e.target.value)}
            />
            <Input 
              type="number"
              placeholder="Année" 
              value={profile.chassis_year || ""}
              onChange={(e) => onUpdate("chassis_year", parseInt(e.target.value) || null)}
            />
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wider">Moteur</h3>
          <div className="grid grid-cols-2 gap-2">
            <Select 
              value={profile.engine_category || ""} 
              onValueChange={(v) => {
                onUpdate("engine_category", v);
                if (CATEGORY_WEIGHTS[v]) {
                  // Wait a tick to avoid race condition with state if possible, but standard react is fine
                  setTimeout(() => {
                    onUpdate("category_min_weight_kg", CATEGORY_WEIGHTS[v]);
                  }, 50);
                }
              }}
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
