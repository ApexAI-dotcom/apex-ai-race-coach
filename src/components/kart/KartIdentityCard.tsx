import { KartProfile } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Wrench, Edit2, Shield, Settings2, Cpu, Disc3, CloudRain } from "lucide-react";

interface KartIdentityCardProps {
  profile: KartProfile;
  mountedTire?: any | null;
  onRelaunchConfig: () => void;
}

export function KartIdentityCard({ profile, mountedTire, onRelaunchConfig }: KartIdentityCardProps) {
  const tireLabel = mountedTire
    ? (mountedTire.custom_model || mountedTire.component_label || "Pneu monté")
    : null;
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
              {profile.chassis_brand || profile.setup_json?.chassis_brand || "Non défini"} {profile.chassis_model || profile.setup_json?.chassis_model} {profile.chassis_year || profile.setup_json?.chassis_year ? `(${profile.chassis_year || profile.setup_json?.chassis_year})` : ""}
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
              {profile.acquisition_device || profile.setup_json?.acquisition_device || "Non défini"}
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

          <div className="flex items-center justify-between py-2">
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              <Disc3 className="w-4 h-4" /> Pneu monté
            </div>
            <div className="text-sm font-semibold text-right flex items-center gap-1.5 justify-end">
              {tireLabel ? (
                <>
                  {mountedTire?.is_rain && <CloudRain className="w-3.5 h-3.5 text-sky-400" />}
                  <span>{mountedTire?.label ? `${mountedTire.label} · ${tireLabel}` : tireLabel}</span>
                </>
              ) : (
                <span className="text-muted-foreground font-normal">Aucun — voir Stock de Pneus</span>
              )}
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
