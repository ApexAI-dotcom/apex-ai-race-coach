import { KartProfile } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WeightCardProps {
  profile: KartProfile;
  onUpdate: (field: keyof KartProfile, value: any) => void;
}

export function WeightCard({ profile, onUpdate }: WeightCardProps) {
  // Use setup_json to store weight to bypass API validation errors on unsupported root fields
  const setup = profile.setup_json || {};
  const emptyWeight = setup.weight_empty_kg || 0;
  const driverWeight = setup.driver_weight_kg || 0;
  const ballast = setup.ballast_kg || 0;
  const totalWeight = emptyWeight + driverWeight + ballast;
  const minWeight = setup.category_min_weight_kg || 0;
  
  const delta = minWeight > 0 ? totalWeight - minWeight : 0;
  const isCompliant = minWeight > 0 && delta >= 0;

  const handleUpdateWeight = (key: string, value: number | null) => {
    const newSetup = { ...setup, [key]: value };
    onUpdate("setup_json", newSetup);
  };

  return (
    <Card className="bg-card border border-border shadow-sm rounded-2xl flex flex-col h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-primary" />
            Bilan Poids
          </div>
          {minWeight > 0 && (
            <Badge variant="outline" className={isCompliant ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-red-500/10 text-red-500 border-red-500/20"}>
              {totalWeight > 0 ? totalWeight : "--"} / {minWeight} kg
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 flex-1 flex flex-col justify-center">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
            <span className="text-muted-foreground text-xs">À vide</span>
            <div className="flex items-center">
              <Input
                type="number"
                defaultValue={setup.weight_empty_kg || ""}
                onBlur={(e) => handleUpdateWeight("weight_empty_kg", parseFloat(e.target.value) || null)}
                className="w-16 h-7 px-1 text-right text-sm bg-transparent border-b border-x-0 border-t-0 border-border rounded-none focus-visible:ring-0"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground ml-1">kg</span>
            </div>
          </div>
          <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
            <span className="text-muted-foreground text-xs">Pilote</span>
            <div className="flex items-center">
              <Input
                type="number"
                defaultValue={setup.driver_weight_kg || ""}
                onBlur={(e) => handleUpdateWeight("driver_weight_kg", parseFloat(e.target.value) || null)}
                className="w-16 h-7 px-1 text-right text-sm bg-transparent border-b border-x-0 border-t-0 border-border rounded-none focus-visible:ring-0"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground ml-1">kg</span>
            </div>
          </div>
          <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
            <span className="text-muted-foreground text-xs">Lest</span>
            <div className="flex items-center">
              <Input
                type="number"
                defaultValue={setup.ballast_kg || ""}
                onBlur={(e) => handleUpdateWeight("ballast_kg", parseFloat(e.target.value) || null)}
                className="w-16 h-7 px-1 text-right text-sm bg-transparent border-b border-x-0 border-t-0 border-border rounded-none focus-visible:ring-0"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground ml-1">kg</span>
            </div>
          </div>
          <div className="flex items-center justify-between bg-black/20 p-2 rounded-lg border border-white/5">
            <span className="text-muted-foreground text-xs">Minimum</span>
            <div className="flex items-center">
              <Input
                type="number"
                defaultValue={setup.category_min_weight_kg || ""}
                onBlur={(e) => handleUpdateWeight("category_min_weight_kg", parseFloat(e.target.value) || null)}
                className="w-16 h-7 px-1 text-right text-sm bg-transparent border-b border-x-0 border-t-0 border-border rounded-none focus-visible:ring-0"
                placeholder="0"
              />
              <span className="text-xs text-muted-foreground ml-1">kg</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
