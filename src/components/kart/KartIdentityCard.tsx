import { KartProfile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Edit2, Shield, Settings2, Cpu } from "lucide-react";

interface KartIdentityCardProps {
  profile: KartProfile;
  onRelaunchConfig: () => void;
}

export function KartIdentityCard({ profile, onRelaunchConfig }: KartIdentityCardProps) {
  return (
    <Card className="bg-card border border-border shadow-sm rounded-2xl flex flex-col h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Identité du Kart
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6 flex-1 flex flex-col">
        <div className="space-y-4 flex-1">
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Châssis
            </div>
            <div className="text-sm font-semibold text-right">
              {profile.chassis_brand || "Non défini"} {profile.chassis_model} {profile.chassis_year ? `(${profile.chassis_year})` : ""}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Wrench className="w-4 h-4" /> Moteur
            </div>
            <div className="text-sm font-semibold text-right">
              {profile.engine_model || profile.engine_category || "Non défini"}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Cpu className="w-4 h-4" /> Acquisition
            </div>
            <div className="text-sm font-semibold text-right">
              {profile.acquisition_device || "Non défini"}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Shield className="w-4 h-4" /> Freins
            </div>
            <div className="text-sm font-semibold text-right">
              {profile.brakes_model || "Non défini"}
            </div>
          </div>

          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Settings2 className="w-4 h-4" /> Pneus
            </div>
            <div className="text-sm font-semibold text-right">
              {profile.tires_model || "Non défini"}
            </div>
          </div>
        </div>

        <Button 
          variant="outline" 
          className="w-full gap-2 bg-white/5 hover:bg-white/10 border-white/10 mt-auto"
          onClick={onRelaunchConfig}
        >
          <Edit2 className="w-4 h-4" />
          Modifier la configuration
        </Button>
      </CardContent>
    </Card>
  );
}
