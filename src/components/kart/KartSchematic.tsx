import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { KartProfile } from "@/lib/api";
import { Battery, Disc, Flame, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { EngineVis, TireVis, BrakeVis, BatteryVis } from "@/components/kart/WearVisuals";

interface KartSchematicProps {
  profile: KartProfile;
}

export const KartSchematic = ({ profile }: KartSchematicProps) => {
  const [selectedComp, setSelectedComp] = useState<string | null>(null);

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
    <>
      <div className="relative w-full max-w-lg mx-auto aspect-[3/4] flex items-center justify-center p-4">
      {/* Tron Grid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [transform:perspective(500px)_rotateX(60deg)_scale(2)_translateY(-50px)]" />
      </div>

      {/* Glow Behind Kart */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-1/2 h-3/4 bg-primary/5 blur-[80px] rounded-full" />
      </div>

      {/* Kart Blueprint Schematic (Poussé et Lisible) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <svg viewBox="0 0 400 600" className="w-[85%] h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          <defs>
             <linearGradient id="chassisGrad" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="#aaa" stopOpacity="0.9" />
               <stop offset="100%" stopColor="#fff" stopOpacity="0.3" />
             </linearGradient>
             <linearGradient id="seatGrad" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="#444" />
               <stop offset="100%" stopColor="#222" />
             </linearGradient>
          </defs>
          
          {/* Main Frame / Tubes */}
          <path d="M 160 120 L 240 120 Q 280 120 280 200 L 280 480 Q 280 520 260 520 L 140 520 Q 120 520 120 480 L 120 200 Q 120 120 160 120 Z" 
                fill="none" stroke="url(#chassisGrad)" strokeWidth="8" strokeLinejoin="round" />
          <path d="M 120 200 L 280 200 M 120 420 L 280 420" fill="none" stroke="url(#chassisGrad)" strokeWidth="6" />

          {/* Front Bumper & Spoiler (Nassau) */}
          <path d="M 120 120 C 100 80 140 40 200 40 C 260 40 300 80 280 120 Z" fill="#111" stroke="#555" strokeWidth="4" />
          <path d="M 160 120 L 200 70 L 240 120 Z" fill="#222" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <path d="M 100 80 L 300 80" stroke="#555" strokeWidth="4" />
          
          {/* Side Pods */}
          <rect x="60" y="240" width="40" height="150" rx="15" fill="#111" stroke="#555" strokeWidth="4" />
          <rect x="300" y="240" width="40" height="150" rx="15" fill="#111" stroke="#555" strokeWidth="4" />
          
          {/* Secondary support bars */}
          <line x1="100" y1="280" x2="120" y2="280" stroke="#777" strokeWidth="4" />
          <line x1="280" y1="280" x2="300" y2="280" stroke="#777" strokeWidth="4" />

          {/* Rear Axle */}
          <line x1="80" y1="480" x2="320" y2="480" stroke="#888" strokeWidth="12" strokeLinecap="round" />
          <line x1="80" y1="480" x2="320" y2="480" stroke="#333" strokeWidth="6" strokeLinecap="round" />
          
          {/* Seat */}
          <path d="M 150 280 C 200 240 250 280 250 280 L 230 400 C 200 420 170 400 170 400 Z" fill="url(#seatGrad)" stroke="#666" strokeWidth="4" strokeLinejoin="round" />
          <path d="M 165 295 C 200 265 235 295 235 295 L 220 380 C 200 395 180 380 180 380 Z" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
          
          {/* Steering Wheel & Column */}
          <circle cx="200" cy="220" r="25" fill="#111" stroke="#888" strokeWidth="6" />
          <circle cx="200" cy="220" r="8" fill="#333" />
          <line x1="200" y1="245" x2="200" y2="290" stroke="#777" strokeWidth="6" />
          <line x1="160" y1="160" x2="200" y2="220" stroke="#444" strokeWidth="4" />
          <line x1="240" y1="160" x2="200" y2="220" stroke="#444" strokeWidth="4" />
          
          {/* Engine Block */}
          <rect x="235" y="300" width="55" height="80" rx="8" fill="#1a1a1a" stroke="#777" strokeWidth="4" />
          <rect x="245" y="310" width="35" height="40" rx="4" fill="none" stroke="#555" strokeWidth="2" strokeDasharray="3 3" />
          <path d="M 290 320 Q 320 320 320 360" fill="none" stroke="#555" strokeWidth="6" strokeLinecap="round" />

          {/* Battery Area */}
          <rect x="130" y="320" width="30" height="40" rx="4" fill="#1a1a1a" stroke="#666" strokeWidth="4" />
          <line x1="135" y1="330" x2="155" y2="330" stroke="#ff4444" strokeWidth="2" />
        </svg>
      </div>

      {/* --- HOTSPOTS (Badges V3 Scaled down ~15%) --- */}
      
      {/* Engine Hotspot */}
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Reduced size: w-12 h-12 from w-16 h-16. Icon w-6 h-6 */}
          <div onClick={() => setSelectedComp('engine')} className="absolute right-[20%] top-[55%] flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-110 hover:z-20">
            <div className={cn("w-12 h-12 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center shadow-xl transition-all duration-300", getStatusColor(profile.engine_hours_current, profile.engine_hours_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <Flame className={cn("w-6 h-6", getStatusColor(profile.engine_hours_current, profile.engine_hours_life))} />
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
          {/* Reduced size: w-10 h-14 from w-12 h-16 */}
          <div onClick={() => setSelectedComp('tire_fl')} className="absolute left-[15%] top-[18%] flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-110">
            <div className={cn("w-10 h-14 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-lg", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <Disc className={cn("w-5 h-5", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} />
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
          <div onClick={() => setSelectedComp('tire_fr')} className="absolute right-[15%] top-[18%] flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-110">
             <div className={cn("w-10 h-14 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-lg", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <Disc className={cn("w-5 h-5", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} />
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
          <div onClick={() => setSelectedComp('tire_rl')} className="absolute left-[12%] bottom-[18%] flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-110">
             <div className={cn("w-12 h-16 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-lg", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <Disc className={cn("w-6 h-6", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} />
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
          <div onClick={() => setSelectedComp('tire_rr')} className="absolute right-[12%] bottom-[18%] flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-110">
             <div className={cn("w-12 h-16 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-lg", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <Disc className={cn("w-6 h-6", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-bold">ARD ({profile.tires_model || "NC"})</p>
          <p className="text-xs text-muted-foreground">{profile.tires_sessions_current} / {profile.tires_sessions_life} sess.</p>
        </TooltipContent>
      </Tooltip>

      {/* Brakes Front (AV) */}
      <Tooltip>
        <TooltipTrigger asChild>
          {/* Note: mapped to the same single brake lifecycle state per instructions */}
          <div onClick={() => setSelectedComp('brakes_front')} className="absolute left-[35%] top-[25%] flex items-center justify-center group cursor-pointer transition-transform hover:scale-110 z-10">
            <div className={cn("w-9 h-9 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center shadow-lg", getStatusColor(profile.brakes_sessions_current, profile.brakes_sessions_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <span className={cn("font-bold text-[10px]", getStatusColor(profile.brakes_sessions_current, profile.brakes_sessions_life))}>AV</span>
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-bold uppercase text-xs">Freins AV ({profile.brakes_model || "NC"})</p>
          <p className="text-sm font-mono mt-1 text-muted-foreground">{profile.brakes_sessions_current || 0} / {profile.brakes_sessions_life} sess.</p>
        </TooltipContent>
      </Tooltip>

      {/* Brakes Rear (AR) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div onClick={() => setSelectedComp('brakes_rear')} className="absolute left-[35%] bottom-[25%] flex items-center justify-center group cursor-pointer transition-transform hover:scale-110 z-10">
            <div className={cn("w-10 h-10 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center shadow-lg", getStatusColor(profile.brakes_sessions_current, profile.brakes_sessions_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <AlertCircle className={cn("w-5 h-5", getStatusColor(profile.brakes_sessions_current, profile.brakes_sessions_life))} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="font-bold uppercase text-xs">Freins AR ({profile.brakes_model || "NC"})</p>
          <p className="text-sm font-mono mt-1 text-muted-foreground">{profile.brakes_sessions_current || 0} / {profile.brakes_sessions_life} sess.</p>
        </TooltipContent>
      </Tooltip>

      {/* Battery */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div onClick={() => setSelectedComp('battery')} className="absolute left-[30%] top-[45%] flex items-center justify-center transition-transform hover:scale-110 cursor-pointer z-10">
            <div className={cn("w-8 h-8 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center shadow-md", getStatusColor(profile.battery_voltage_last, 12.5, true).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <Battery className={cn("w-4 h-4", getStatusColor(profile.battery_voltage_last, 12.5, true))} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="left">
          <p className="font-bold uppercase text-xs">Batterie</p>
          <p className="text-sm font-mono mt-1 text-muted-foreground">{profile.battery_voltage_last || "--"}V</p>
        </TooltipContent>
      </Tooltip>
      
      </div>

      <Dialog open={!!selectedComp} onOpenChange={(open) => !open && setSelectedComp(null)}>
        <DialogContent className="bg-black/95 border-white/10 text-white sm:max-w-md backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-primary flex items-center gap-2">
              {selectedComp === 'engine' && <Flame className="w-5 h-5" />}
              {selectedComp?.startsWith('tire') && <Disc className="w-5 h-5" />}
              {selectedComp?.startsWith('brakes') && <AlertCircle className="w-5 h-5" />}
              {selectedComp === 'battery' && <Battery className="w-5 h-5" />}
              {selectedComp === 'engine' && "Vue Détaillée : Moteur"}
              {selectedComp === 'tire_fl' && "Pneu Avant Gauche"}
              {selectedComp === 'tire_fr' && "Pneu Avant Droit"}
              {selectedComp === 'tire_rl' && "Pneu Arrière Gauche"}
              {selectedComp === 'tire_rr' && "Pneu Arrière Droit"}
              {selectedComp === 'brakes_front' && "Système de Freinage Avant"}
              {selectedComp === 'brakes_rear' && "Système de Freinage Arrière"}
              {selectedComp === 'battery' && "État de la Batterie"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedComp === 'engine' && "La gestion rigoureuse des heures moteur prévient les casses et maintient des performances optimales."}
              {selectedComp?.startsWith('tire') && "La dégradation des gommes influe drastiquement sur le grip mécanique et les chronos."}
              {selectedComp?.startsWith('brakes') && "L'usure des plaquettes impacte directement la puissance et la répartition de freinage."}
              {selectedComp === 'battery' && "Une tension faible peut causer des ratés d'allumage ou empêcher le démarrage."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {selectedComp === 'engine' && (
              <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/5">
                <EngineVis ratio={Math.min((profile.engine_hours_current || 0) / (profile.engine_hours_life || 15), 1)} />
                <p><strong>Modèle :</strong> <span className="text-primary">{profile.engine_model || "Standard"}</span></p>
                <div className="flex justify-between items-center mt-2">
                  <span>Usure Actuelle :</span>
                  <span className="font-mono text-lg">{profile.engine_hours_current?.toFixed(1) || 0} / {profile.engine_hours_life} h</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                  <div className={cn("h-full transition-all duration-500", (profile.engine_hours_current || 0) / (profile.engine_hours_life || 15) > 0.8 ? "bg-red-500" : "bg-primary")} style={{ width: `${Math.min(((profile.engine_hours_current || 0) / (profile.engine_hours_life || 15)) * 100, 100)}%` }} />
                </div>
              </div>
            )}
            
            {selectedComp?.startsWith('tire') && (
              <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/5">
                <TireVis ratio={Math.min((profile.tires_sessions_current || 0) / (profile.tires_sessions_life || 50), 1)} />
                <p><strong>Train complet :</strong> <span className="text-primary">{profile.tires_model || "Standard"}</span></p>
                <div className="flex justify-between items-center mt-2">
                  <span>Sessions Roulées :</span>
                  <span className="font-mono text-lg">{profile.tires_sessions_current || 0} / {profile.tires_sessions_life} sess.</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                  <div className={cn("h-full transition-all duration-500", (profile.tires_sessions_current || 0) / (profile.tires_sessions_life || 50) > 0.8 ? "bg-red-500" : "bg-primary")} style={{ width: `${Math.min(((profile.tires_sessions_current || 0) / (profile.tires_sessions_life || 50)) * 100, 100)}%` }} />
                </div>
              </div>
            )}

            {selectedComp?.startsWith('brakes') && (
              <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/5">
                <BrakeVis ratio={Math.min((profile.brakes_sessions_current || 0) / (profile.brakes_sessions_life || 100), 1)} />
                <p><strong>Système :</strong> <span className="text-primary">{profile.brakes_model || "Standard"}</span></p>
                <div className="flex justify-between items-center mt-2">
                  <span>Usure Plaquettes :</span>
                  <span className="font-mono text-lg">{profile.brakes_sessions_current || 0} / {profile.brakes_sessions_life} sess.</span>
                </div>
                <div className="w-full bg-white/10 h-2 rounded-full mt-2 overflow-hidden">
                  <div className={cn("h-full transition-all duration-500", (profile.brakes_sessions_current || 0) / (profile.brakes_sessions_life || 100) > 0.8 ? "bg-orange-500" : "bg-primary")} style={{ width: `${Math.min(((profile.brakes_sessions_current || 0) / (profile.brakes_sessions_life || 100)) * 100, 100)}%` }} />
                </div>
              </div>
            )}

            {selectedComp === 'battery' && (
              <div className="space-y-4 bg-white/5 p-4 rounded-lg border border-white/5">
                <BatteryVis voltage={profile.battery_voltage_last || 0} />
                <div className="flex justify-between items-center mt-2">
                  <span>Dernière Tension Relevée :</span>
                  <span className={cn("font-mono text-lg font-bold", getStatusColor(profile.battery_voltage_last, 12.5, true).split(' ')[0])}>
                    {profile.battery_voltage_last || "--"} V
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">Tension à vide minimale recommandée : 12.0V.</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
