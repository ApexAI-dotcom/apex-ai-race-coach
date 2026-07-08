import { KartProfile } from "@/lib/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Scale } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface WeightCardProps {
  profile: KartProfile;
  onUpdate: (field: keyof KartProfile, value: any) => void;
}

export function WeightCard({ profile, onUpdate }: WeightCardProps) {
  const emptyWeight = profile.weight_empty_kg || 0;
  const driverWeight = profile.driver_weight_kg || 0;
  const ballast = profile.ballast_kg || 0;
  const totalWeight = emptyWeight + driverWeight + ballast;
  const minWeight = profile.category_min_weight_kg || 0;
  
  const delta = minWeight > 0 ? totalWeight - minWeight : 0;
  const isCompliant = minWeight > 0 && delta >= 0;

  return (
    <Card className="bg-card border border-border shadow-sm rounded-2xl">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <Scale className="w-5 h-5 text-primary" />
          Bilan Poids
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-col items-center justify-center py-4 bg-background/50 rounded-xl border border-border">
          <div className="text-4xl font-display font-bold">
            {totalWeight > 0 ? totalWeight : "--"}
            <span className="text-xl text-muted-foreground ml-1">kg</span>
          </div>
          {minWeight > 0 && (
            <div className="mt-2">
              {isCompliant ? (
                <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20 border-green-500/20">
                  Conforme · marge +{delta} kg
                </Badge>
              ) : (
                <Badge variant="destructive" className="bg-red-500/10 text-red-500 hover:bg-red-500/20 border-red-500/20">
                  Sous le mini · manque {Math.abs(delta)} kg
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Poids à vide (kg)</Label>
            <Input
              type="number"
              defaultValue={profile.weight_empty_kg || ""}
              onBlur={(e) => onUpdate("weight_empty_kg", parseFloat(e.target.value) || null)}
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Pilote + Équip. (kg)</Label>
            <Input
              type="number"
              defaultValue={profile.driver_weight_kg || ""}
              onBlur={(e) => onUpdate("driver_weight_kg", parseFloat(e.target.value) || null)}
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Lest (kg)</Label>
            <Input
              type="number"
              defaultValue={profile.ballast_kg || ""}
              onBlur={(e) => onUpdate("ballast_kg", parseFloat(e.target.value) || null)}
              className="bg-background border-border"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Poids Mini Règl. (kg)</Label>
            <Input
              type="number"
              defaultValue={profile.category_min_weight_kg || ""}
              onBlur={(e) => onUpdate("category_min_weight_kg", parseFloat(e.target.value) || null)}
              className="bg-background border-border"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
