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
      if (!current) return "text-muted-foreground stroke-muted-foreground/50";
      if (current < 11.5) return "text-red-500 stroke-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,1)] animate-pulse";
      if (current < 12.0) return "text-orange-500 stroke-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]";
      return "text-green-500 stroke-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]";
    }

    if (current === undefined || max === undefined) return "text-muted-foreground stroke-muted-foreground/50";
    const ratio = current / max;
    if (ratio > 0.95) return "text-red-500 stroke-red-500 drop-shadow-[0_0_12px_rgba(239,68,68,1)] animate-pulse";
    if (ratio > 0.75) return "text-orange-500 stroke-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.8)]";
    return "text-green-500 stroke-green-500 drop-shadow-[0_0_8px_rgba(34,197,94,0.6)]";
  };

  return (
    <div className="relative w-full max-w-lg mx-auto aspect-[3/4] flex items-center justify-center p-4">
      {/* Tron Grid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [transform:perspective(500px)_rotateX(60deg)_scale(2)_translateY(-50px)]" />
      </div>

      {/* Glow Behind Kart */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-1/2 h-3/4 bg-primary/5 blur-[80px] rounded-full" />
      </div>

      {/* Kart Blueprint Schematic */}
      <div className="absolute inset-0 flex items-center justify-center opacity-40 hover:opacity-80 transition-opacity duration-700 pointer-events-none">
        <svg viewBox="0 0 400 600" className="w-[85%] h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          <defs>
             <linearGradient id="chassisGrad" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="#888" stopOpacity="0.8" />
               <stop offset="100%" stopColor="#fff" stopOpacity="0.2" />
             </linearGradient>
          </defs>
          
          {/* Main Frame / Tubes */}
          <path d="M 160 120 L 240 120 Q 280 120 280 200 L 280 480 Q 280 520 260 520 L 140 520 Q 120 520 120 480 L 120 200 Q 120 120 160 120 Z" 
                fill="none" stroke="url(#chassisGrad)" strokeWidth="6" strokeLinejoin="round" />
          
          {/* Front Bumper & Spoiler */}
          <path d="M 120 120 C 100 80 140 40 200 40 C 260 40 300 80 280 120" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/40" />
          <path d="M 100 80 L 300 80" stroke="currentColor" strokeWidth="2" className="text-white/20" strokeDasharray="10 5" />
          
          {/* Side Pods */}
          <rect x="60" y="240" width="40" height="150" rx="15" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/40" />
          <rect x="300" y="240" width="40" height="150" rx="15" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/40" />

          {/* Rear Axle */}
          <line x1="80" y1="480" x2="320" y2="480" stroke="currentColor" strokeWidth="8" className="text-white/60" />
          
          {/* Seat */}
          <path d="M 150 300 Q 200 260 250 300 L 230 400 Q 200 420 170 400 Z" fill="none" stroke="currentColor" strokeWidth="5" className="text-white/50" />
          
          {/* Steering Wheel & Column */}
          <circle cx="200" cy="220" r="25" fill="none" stroke="currentColor" strokeWidth="5" className="text-white/60" />
          <line x1="200" y1="245" x2="200" y2="290" stroke="currentColor" strokeWidth="4" className="text-white/40" />
          
          {/* Engine Silhouette (Abstract) */}
          <rect x="230" y="320" width="60" height="70" rx="5" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/30" />
          <line x1="230" y1="355" x2="290" y2="355" stroke="currentColor" strokeWidth="2" className="text-white/20" />
        </svg>
      </div>

      {/* --- HOTSPOTS --- */}
      
      {/* Engine Hotspot */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute right-[20%] top-[55%] flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-125 hover:z-20">
            <div className={cn("w-16 h-16 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center shadow-2xl transition-all duration-300", getStatusColor(profile.engine_hours_current, profile.engine_hours_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <Flame className={cn("w-8 h-8", getStatusColor(profile.engine_hours_current, profile.engine_hours_life))} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-black/90 border-white/10 text-white">
          <p className="font-bold uppercase tracking-wider text-xs">Moteur ({profile.engine_model || "NC"})</p>
          <p className="text-sm font-mono mt-1 text-muted-foreground">{profile.engine_hours_current?.toFixed(1) || 0}h / {profile.engine_hours_life}h limit</p>
          <p className="text-[10px] mt-2 opacity-50">Clique pour ajuster</p>
        </TooltipContent>
      </Tooltip>

      {/* Front Left Tire */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute left-[15%] top-[18%] flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-125">
            <div className={cn("w-12 h-16 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-xl", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <Disc className={cn("w-6 h-6", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="font-bold">AVG ({profile.tires_model || "NC"})</p>
          <p className="text-xs text-muted-foreground">{profile.tires_sessions_current} / {profile.tires_sessions_life} sess.</p>
        </TooltipContent>
      </Tooltip>

      {/* Front Right Tire */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute right-[15%] top-[18%] flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-125">
             <div className={cn("w-12 h-16 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-xl", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <Disc className={cn("w-6 h-6", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-bold">AVD ({profile.tires_model || "NC"})</p>
          <p className="text-xs text-muted-foreground">{profile.tires_sessions_current} / {profile.tires_sessions_life} sess.</p>
        </TooltipContent>
      </Tooltip>

      {/* Rear Left Tire */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute left-[12%] bottom-[18%] flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-125">
             <div className={cn("w-14 h-20 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-xl", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <Disc className={cn("w-7 h-7", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="font-bold">ARG ({profile.tires_model || "NC"})</p>
          <p className="text-xs text-muted-foreground">{profile.tires_sessions_current} / {profile.tires_sessions_life} sess.</p>
        </TooltipContent>
      </Tooltip>

      {/* Rear Right Tire */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute right-[12%] bottom-[18%] flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-125">
             <div className={cn("w-14 h-20 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-xl", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <Disc className={cn("w-7 h-7", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-bold">ARD ({profile.tires_model || "NC"})</p>
          <p className="text-xs text-muted-foreground">{profile.tires_sessions_current} / {profile.tires_sessions_life} sess.</p>
        </TooltipContent>
      </Tooltip>

      {/* Brakes */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute left-[35%] bottom-[25%] flex items-center justify-center group cursor-pointer transition-transform hover:scale-125 z-10">
            <div className={cn("w-12 h-12 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center shadow-xl", getStatusColor(profile.brakes_sessions_current, profile.brakes_sessions_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <AlertCircle className={cn("w-6 h-6", getStatusColor(profile.brakes_sessions_current, profile.brakes_sessions_life))} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="font-bold uppercase text-xs">Freins Arrière ({profile.brakes_model || "NC"})</p>
          <p className="text-sm font-mono mt-1 text-muted-foreground">{profile.brakes_sessions_current || 0} / {profile.brakes_sessions_life} sess.</p>
        </TooltipContent>
      </Tooltip>

      {/* Battery */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="absolute left-[30%] top-[45%] flex items-center justify-center transition-transform hover:scale-125 cursor-pointer z-10">
            <div className={cn("w-10 h-10 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center shadow-md", getStatusColor(profile.battery_voltage_last, 12.5, true).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <Battery className={cn("w-5 h-5", getStatusColor(profile.battery_voltage_last, 12.5, true))} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="font-bold uppercase text-xs">Batterie</p>
          <p className="text-sm font-mono mt-1 text-muted-foreground">{profile.battery_voltage_last || "--"}V</p>
        </TooltipContent>
      </Tooltip>
      
    </div>
  );
};
