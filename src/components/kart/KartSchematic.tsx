import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { KartProfile } from "@/lib/api";
import { Battery, Disc, Flame, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface KartSchematicProps {
  profile: KartProfile;
}

export const KartSchematic = ({ profile }: KartSchematicProps) => {
  const getStatusColor = (current: number | undefined, max: number | undefined, isVoltage = false) => {
    if (isVoltage) {
      if (!current) return "text-muted-foreground";
      if (current < 11.5) return "text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]";
      if (current < 12.0) return "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]";
      return "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]";
    }

    if (current === undefined || max === undefined) return "text-muted-foreground";
    const ratio = current / max;
    if (ratio > 0.9) return "text-red-500 animate-pulse drop-shadow-[0_0_8px_rgba(239,68,68,0.8)]";
    if (ratio > 0.75) return "text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]";
    return "text-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.8)]";
  };

  return (
    <div className="relative w-full max-w-sm mx-auto aspect-[3/4] flex items-center justify-center py-8">
      {/* Kart Silhouette Background */}
      <div className="absolute inset-0 flex items-center justify-center opacity-20 pointer-events-none">
        <svg viewBox="0 0 200 300" className="w-[80%] h-full drop-shadow-2xl">
          <path 
            d="M 60 20 Q 100 0 140 20 L 150 40 L 150 80 L 160 85 L 160 110 L 150 115 L 150 200 L 160 205 L 160 250 L 150 255 L 140 280 Q 100 300 60 280 L 50 255 L 40 250 L 40 205 L 50 200 L 50 115 L 40 110 L 40 85 L 50 80 L 50 40 Z" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="4" 
            className="text-white"
          />
          {/* Steering Wheel */}
          <circle cx="100" cy="120" r="15" fill="none" stroke="currentColor" strokeWidth="4" className="text-white" />
          <line x1="100" y1="135" x2="100" y2="160" stroke="currentColor" strokeWidth="4" className="text-white" />
          {/* Seat */}
          <path d="M 75 160 Q 100 150 125 160 L 120 210 Q 100 220 80 210 Z" fill="none" stroke="currentColor" strokeWidth="4" className="text-white" />
        </svg>
      </div>

      {/* Engine Hotspot */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute right-[20%] top-[45%] flex items-center justify-center w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 cursor-pointer hover:scale-110 transition-transform shadow-xl">
            <Flame className={cn("w-6 h-6", getStatusColor(profile.engine_hours_current, profile.engine_hours_life))} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-bold">Moteur</p>
          <p className="text-xs text-muted-foreground">{profile.engine_hours_current?.toFixed(1) || 0}h / {profile.engine_hours_life}h</p>
        </TooltipContent>
      </Tooltip>

      {/* Front Tires */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute left-[15%] top-[25%] flex items-center justify-center w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 cursor-pointer hover:scale-110 transition-transform shadow-xl">
            <Disc className={cn("w-5 h-5", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="font-bold">Pneu Avant Gauche</p>
          <p className="text-xs text-muted-foreground">Train : {profile.tires_sessions_current} / {profile.tires_sessions_life} sessions</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute right-[15%] top-[25%] flex items-center justify-center w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 cursor-pointer hover:scale-110 transition-transform shadow-xl">
            <Disc className={cn("w-5 h-5", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-bold">Pneu Avant Droit</p>
          <p className="text-xs text-muted-foreground">Train : {profile.tires_sessions_current} / {profile.tires_sessions_life} sessions</p>
        </TooltipContent>
      </Tooltip>

      {/* Rear Tires */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute left-[12%] bottom-[18%] flex items-center justify-center w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 cursor-pointer hover:scale-110 transition-transform shadow-xl">
            <Disc className={cn("w-6 h-6", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="font-bold">Pneu Arrière Gauche</p>
          <p className="text-xs text-muted-foreground">Train : {profile.tires_sessions_current} / {profile.tires_sessions_life} sessions</p>
        </TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute right-[12%] bottom-[18%] flex items-center justify-center w-12 h-12 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 cursor-pointer hover:scale-110 transition-transform shadow-xl">
            <Disc className={cn("w-6 h-6", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-bold">Pneu Arrière Droit</p>
          <p className="text-xs text-muted-foreground">Train : {profile.tires_sessions_current} / {profile.tires_sessions_life} sessions</p>
        </TooltipContent>
      </Tooltip>

      {/* Brakes */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute left-[38%] bottom-[22%] flex items-center justify-center w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 cursor-pointer hover:scale-110 transition-transform shadow-xl">
            <AlertCircle className={cn("w-5 h-5", getStatusColor(profile.brakes_sessions_current, profile.brakes_sessions_life))} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="font-bold">Freins</p>
          <p className="text-xs text-muted-foreground">{profile.brakes_sessions_current || 0} / {profile.brakes_sessions_life} sessions</p>
        </TooltipContent>
      </Tooltip>

      {/* Battery */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute left-[25%] top-[45%] flex items-center justify-center w-10 h-10 bg-black/40 backdrop-blur-sm rounded-full border border-white/10 cursor-pointer hover:scale-110 transition-transform shadow-xl">
            <Battery className={cn("w-5 h-5", getStatusColor(profile.battery_voltage_last, 12.5, true))} />
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="font-bold">Batterie</p>
          <p className="text-xs text-muted-foreground">{profile.battery_voltage_last || "--"}V</p>
        </TooltipContent>
      </Tooltip>
      
    </div>
  );
};
