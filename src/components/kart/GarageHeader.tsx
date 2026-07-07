import { KartProfile } from "@/lib/api";
import { Input } from "@/components/ui/input";

export function GarageHeader({
  profile,
  onUpdate,
}: {
  profile: KartProfile;
  onUpdate: (field: keyof KartProfile, value: any) => void;
}) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
      <div>
        <div className="flex items-center gap-2">
          <Input 
            className="text-3xl font-display font-bold border-transparent hover:border-border bg-transparent p-0 h-auto focus-visible:ring-0 max-w-[300px] shadow-none"
            value={profile.kart_nickname || ""}
            onChange={(e) => onUpdate("kart_nickname", e.target.value)}
            placeholder="Mon Kart"
          />
        </div>
        <div className="flex gap-4 text-muted-foreground mt-2 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">N° Course:</span>
            <Input 
              className="w-16 h-8 bg-transparent border-transparent hover:border-border shadow-none text-sm"
              value={profile.race_number || ""}
              onChange={(e) => onUpdate("race_number", e.target.value)}
              placeholder="00"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Transpondeur:</span>
            <Input 
              className="w-24 h-8 bg-transparent border-transparent hover:border-border shadow-none text-sm"
              value={profile.transponder_number || ""}
              onChange={(e) => onUpdate("transponder_number", e.target.value)}
              placeholder="123456"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
