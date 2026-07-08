import { KartProfile } from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";

interface GarageHeaderProps {
  profile?: KartProfile;
  onUpdate: (field: keyof KartProfile, value: any) => void;
  onRelaunchConfig: () => void;
}

export function GarageHeader({ profile, onUpdate, onRelaunchConfig }: GarageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <div>
        <h1 className="text-3xl font-display font-bold">Mon Garage</h1>
        <p className="text-muted-foreground mt-2">Vue détaillée, usure et recommandations</p>
      </div>
      <div className="flex items-center gap-4">
        {profile?.race_number && (
          <Badge variant="outline" className="text-sm px-3 py-1 bg-black/40 border-white/10">
            N°{profile.race_number}
          </Badge>
        )}
        {profile?.transponder_number && (
          <Badge variant="outline" className="text-sm px-3 py-1 bg-black/40 border-white/10">
            Transpondeur {profile.transponder_number}
          </Badge>
        )}
        <Button
          variant="outline"
          className="gap-2 bg-black/40 border-white/10 hover:bg-black/60"
          onClick={onRelaunchConfig}
        >
          <Wrench className="w-4 h-4" /> Relancer la config
        </Button>
      </div>
    </div>
  );
}
