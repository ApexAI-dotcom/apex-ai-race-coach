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

      {/* Kart 3/4 Front Schematic */}
      <div className="absolute inset-0 flex items-center justify-center opacity-70 hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <svg viewBox="0 0 400 600" className="w-[90%] h-full drop-shadow-[0_0_15px_rgba(255,255,255,0.2)]">
          <defs>
             <linearGradient id="chassisGrad" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="#888" stopOpacity="0.8" />
               <stop offset="100%" stopColor="#fff" stopOpacity="0.2" />
             </linearGradient>
             <style>
               {`
                 .hud-grid { stroke: rgba(255,255,255,0.05); stroke-width: 1; stroke-dasharray: 4 4; }
               `}
             </style>
          </defs>
          
          {/* Subtle HUD grid matching Kart perspective */}
          <path d="M 50 100 L 350 150 M 40 250 L 360 300 M 30 400 L 370 450" className="hud-grid" />
          <path d="M 100 50 L 80 550 M 200 60 L 200 560 M 300 70 L 320 570" className="hud-grid" />

          {/* Tires (drawn behind chassis where needed) */}
          <rect x="70" y="140" width="40" height="70" rx="10" transform="rotate(-15 90 175)" fill="#111" stroke="#333" strokeWidth="2" /> {/* RL */}
          <rect x="300" y="160" width="40" height="70" rx="10" transform="rotate(-15 320 195)" fill="#111" stroke="#333" strokeWidth="2" /> {/* RR */}
          <rect x="50" y="360" width="40" height="80" rx="10" transform="rotate(-20 70 400)" fill="#111" stroke="#333" strokeWidth="2" /> {/* FL */}
          <rect x="290" y="380" width="40" height="80" rx="10" transform="rotate(-20 310 420)" fill="#111" stroke="#333" strokeWidth="2" /> {/* FR */}

          {/* Rear Axle */}
          <line x1="110" y1="175" x2="320" y2="195" stroke="#444" strokeWidth="8" />
          {/* Rear Brake Disk */}
          <ellipse cx="180" cy="182" rx="15" ry="30" transform="rotate(-15 180 182)" fill="none" stroke="#666" strokeWidth="4" />

          {/* Main Frame / Tubes */}
          <path d="M 200 480 L 100 400 L 130 220 L 230 190 L 280 280 L 260 410 Z" fill="none" stroke="url(#chassisGrad)" strokeWidth="6" strokeLinejoin="round" />
          
          {/* Front Bumper & Spoiler */}
          <path d="M 200 490 Q 250 510 290 460 L 230 420 Z" fill="none" stroke="currentColor" strokeWidth="3" className="text-white/40" />
          <path d="M 180 470 L 220 500" stroke="currentColor" strokeWidth="2" className="text-white/20" />
          
          {/* Left Side Pod */}
          <path d="M 70 380 L 100 240 L 140 260 L 110 390 Z" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/40" />
          
          {/* Right Side Pod */}
          <path d="M 260 420 L 320 320 L 290 260 L 230 310 Z" fill="none" stroke="currentColor" strokeWidth="4" className="text-white/40" />

          {/* Seat */}
          <path d="M 190 320 Q 220 280 240 310 L 220 380 Q 200 370 170 350 Z" fill="none" stroke="#555" strokeWidth="5" className="text-white/50" />
          
          {/* Steering Wheel & Column */}
          <ellipse cx="200" cy="360" rx="20" ry="10" transform="rotate(-20 200 360)" fill="none" stroke="#777" strokeWidth="5" className="text-white/60" />
          <line x1="200" y1="360" x2="190" y2="300" stroke="#777" strokeWidth="3" className="text-white/40" />
          
          {/* Engine Silhouette */}
          <rect x="230" y="250" width="50" height="60" rx="5" transform="rotate(-15 255 280)" fill="none" stroke="#888" strokeWidth="3" className="text-white/30" />
          
          {/* Battery */}
          <rect x="100" y="280" width="30" height="40" rx="3" transform="rotate(-15 115 300)" fill="none" stroke="#666" strokeWidth="3" className="text-white/30" />
        </svg>
      </div>

      {/* --- HOTSPOTS --- */}
      
      {/* Engine Hotspot */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div onClick={() => setSelectedComp('engine')} className="absolute left-[63%] top-[46%] flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-125 hover:z-20">
            <div className={cn("w-14 h-14 sm:w-16 sm:h-16 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center shadow-2xl transition-all duration-300", getStatusColor(profile.engine_hours_current, profile.engine_hours_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <Flame className={cn("w-7 h-7 sm:w-8 sm:h-8", getStatusColor(profile.engine_hours_current, profile.engine_hours_life))} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right" className="bg-black/90 border-white/10 text-white">
          <p className="font-bold uppercase tracking-wider text-xs">Moteur ({profile.engine_model || "NC"})</p>
          <p className="text-sm font-mono mt-1 text-muted-foreground">{profile.engine_hours_current?.toFixed(1) || 0}h / {profile.engine_hours_life}h limit</p>
          <p className="text-[10px] mt-2 opacity-50">Clique pour détails</p>
        </TooltipContent>
      </Tooltip>

      {/* Front Left Tire */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div onClick={() => setSelectedComp('tire_fl')} className="absolute left-[20%] top-[66%] flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-125">
            <div className={cn("w-12 h-12 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-xl", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <Disc className={cn("w-6 h-6", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="bottom">
          <p className="font-bold">AVG ({profile.tires_model || "NC"})</p>
          <p className="text-xs text-muted-foreground">{profile.tires_sessions_current} / {profile.tires_sessions_life} sess.</p>
        </TooltipContent>
      </Tooltip>

      {/* Front Right Tire */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div onClick={() => setSelectedComp('tire_fr')} className="absolute left-[78%] top-[70%] flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-125">
             <div className={cn("w-12 h-14 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-xl", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
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
          <div onClick={() => setSelectedComp('tire_rl')} className="absolute left-[25%] top-[29%] flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-125">
             <div className={cn("w-12 h-14 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-xl", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
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
          <div onClick={() => setSelectedComp('tire_rr')} className="absolute left-[80%] top-[32%] flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-125">
             <div className={cn("w-12 h-14 bg-black/60 backdrop-blur-md rounded-xl border border-white/20 flex items-center justify-center shadow-xl", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <Disc className={cn("w-6 h-6", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="right">
          <p className="font-bold">ARD ({profile.tires_model || "NC"})</p>
          <p className="text-xs text-muted-foreground">{profile.tires_sessions_current} / {profile.tires_sessions_life} sess.</p>
        </TooltipContent>
      </Tooltip>

      {/* Brakes (Rear Axle exclusively per constraints) */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div onClick={() => setSelectedComp('brakes')} className="absolute left-[45%] top-[30%] flex items-center justify-center group cursor-pointer transition-transform hover:scale-125 z-10">
            <div className={cn("w-12 h-12 bg-black/60 backdrop-blur-md rounded-full border border-white/20 flex items-center justify-center shadow-xl", getStatusColor(profile.brakes_sessions_current, profile.brakes_sessions_life).replace("text-", "shadow-").replace("stroke-", "border-"))}>
              <AlertCircle className={cn("w-6 h-6", getStatusColor(profile.brakes_sessions_current, profile.brakes_sessions_life))} />
            </div>
          </div>
        </TooltipTrigger>
        <TooltipContent side="top">
          <p className="font-bold uppercase text-xs">Freins Arrière ({profile.brakes_model || "NC"})</p>
          <p className="text-sm font-mono mt-1 text-muted-foreground">{profile.brakes_sessions_current || 0} / {profile.brakes_sessions_life} sess.</p>
        </TooltipContent>
      </Tooltip>

      {/* Battery */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div onClick={() => setSelectedComp('battery')} className="absolute left-[28%] top-[50%] flex items-center justify-center transition-transform hover:scale-125 cursor-pointer z-10">
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

      <Dialog open={!!selectedComp} onOpenChange={(open) => !open && setSelectedComp(null)}>
        <DialogContent className="bg-black/95 border-white/10 text-white sm:max-w-md backdrop-blur-xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-display text-primary flex items-center gap-2">
              {selectedComp === 'engine' && <Flame className="w-5 h-5" />}
              {selectedComp?.startsWith('tire') && <Disc className="w-5 h-5" />}
              {selectedComp === 'brakes' && <AlertCircle className="w-5 h-5" />}
              {selectedComp === 'battery' && <Battery className="w-5 h-5" />}
              {selectedComp === 'engine' && "Vue Détaillée : Moteur"}
              {selectedComp === 'tire_fl' && "Pneu Avant Gauche"}
              {selectedComp === 'tire_fr' && "Pneu Avant Droit"}
              {selectedComp === 'tire_rl' && "Pneu Arrière Gauche"}
              {selectedComp === 'tire_rr' && "Pneu Arrière Droit"}
              {selectedComp === 'brakes' && "Système de Freinage Arrière"}
              {selectedComp === 'battery' && "État de la Batterie"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {selectedComp === 'engine' && "La gestion rigoureuse des heures moteur prévient les casses et maintient des performances optimales."}
              {selectedComp?.startsWith('tire') && "La dégradation des gommes influe drastiquement sur le grip mécanique et les chronos."}
              {selectedComp === 'brakes' && "L'usure des plaquettes impacte directement la puissance et la répartition de freinage."}
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

            {selectedComp === 'brakes' && (
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
                <p className="text-xs text-muted-foreground italic border-l-2 border-primary pl-2 mt-4">Sur la plupart des karts loisir, le frein principal agit exclusivement sur l'axe arrière.</p>
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
