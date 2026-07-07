import { KartProfile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function WeightCard({
  profile,
  onUpdate,
}: {
  profile: KartProfile;
  onUpdate: (field: keyof KartProfile, value: any) => void;
}) {
  const empty = profile.weight_empty_kg || 0;
  const driver = profile.driver_weight_kg || 0;
  const ballast = profile.ballast_kg || 0;
  const total = empty + driver + ballast;
  
  const target = profile.category_min_weight_kg || 0;
  const isOk = total >= target && target > 0;

  return (
    <Card className="bg-card border-border shadow-sm h-full flex flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-lg">Bilan Poids</CardTitle>
        <div className={`px-3 py-1 rounded-full text-xs font-bold ${isOk ? 'bg-green-500/20 text-green-500' : 'bg-red-500/20 text-red-500'}`}>
          {total} kg / {target} kg
        </div>
      </CardHeader>
      <CardContent className="space-y-4 flex-1">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Poids à vide</span>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                className="w-20 text-right h-8" 
                value={profile.weight_empty_kg || ""} 
                onChange={(e) => onUpdate("weight_empty_kg", parseFloat(e.target.value) || 0)}
              />
              <span className="text-xs text-muted-foreground w-4">kg</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Poids pilote</span>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                className="w-20 text-right h-8" 
                value={profile.driver_weight_kg || ""} 
                onChange={(e) => onUpdate("driver_weight_kg", parseFloat(e.target.value) || 0)}
              />
              <span className="text-xs text-muted-foreground w-4">kg</span>
            </div>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-muted-foreground">Lest</span>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                className="w-20 text-right h-8" 
                value={profile.ballast_kg || ""} 
                onChange={(e) => onUpdate("ballast_kg", parseFloat(e.target.value) || 0)}
              />
              <span className="text-xs text-muted-foreground w-4">kg</span>
            </div>
          </div>
          <div className="pt-4 border-t border-border flex justify-between items-center">
            <span className="text-sm font-bold uppercase tracking-wider">Règlement</span>
            <div className="flex items-center gap-2">
              <Input 
                type="number" 
                className="w-20 text-right h-8 font-bold text-primary" 
                value={profile.category_min_weight_kg || ""} 
                onChange={(e) => onUpdate("category_min_weight_kg", parseFloat(e.target.value) || 0)}
              />
              <span className="text-xs text-muted-foreground w-4">kg</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
