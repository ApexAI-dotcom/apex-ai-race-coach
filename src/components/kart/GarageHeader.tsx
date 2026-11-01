import { KartProfile } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

interface GarageHeaderProps {
  profile?: KartProfile;
  onUpdate: (field: keyof KartProfile, value: any) => void;
}

export function GarageHeader({ profile, onUpdate }: GarageHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <div>
        <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Ton garage</p>
        <h1 className="mt-1 text-3xl md:text-4xl font-display font-bold tracking-tight">
          Mon <span className="text-gradient-primary">Kart</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-1">Usure, entretien et pièces de ton kart</p>
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
      </div>
    </div>
  );
}
