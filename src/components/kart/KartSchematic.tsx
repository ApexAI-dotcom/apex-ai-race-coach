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

      {/* High-End 3D Render Kart */}
      <div className="absolute inset-0 flex items-center justify-center p-8">
        <img 
          src="/kart-render.png" 
          alt="Karting Chassis" 
          className="w-full h-full object-contain filter drop-shadow-[0_0_30px_rgba(255,255,255,0.05)]"
        />
      </div>

      {/* --- HUD BADGES --- */}
      {/* 
        The dots are placed accurately over the render. 
        Each dot connects via a CSS line to a floating frosted-glass badge.
      */}

      {/* Engine Hotspot */}
      <div 
        className="absolute left-[65%] top-[45%] group cursor-pointer z-10" 
        onClick={() => setSelectedComp('engine')}
      >
        <div className={cn("relative flex items-center", getStatusColor(profile.engine_hours_current, profile.engine_hours_life))} >
          {/* Dot */}
           <div className="w-3 h-3 rounded-full bg-current shadow-[0_0_12px_currentColor] z-10 group-hover:scale-150 transition-transform" />
          {/* Line */}
          <div className="w-16 h-px bg-current opacity-40 ml-1 transition-all group-hover:w-20" />
          {/* Box */}
          <div className="whitespace-nowrap px-3 py-1.5 bg-black/80 backdrop-blur-md border border-current/30 rounded shadow-lg transition-transform group-hover:scale-105 ml-1">
            <span className="font-bold text-xs text-white opacity-80 uppercase">Moteur</span>
            <span className="ml-2 font-mono text-xs text-white">{profile.engine_hours_current?.toFixed(1) || 0}h</span>
          </div>
        </div>
      </div>

      {/* Front Left Tire (AVG) */}
      <div 
        className="absolute left-[30%] top-[75%] group cursor-pointer z-10" 
        onClick={() => setSelectedComp('tire_fl')}
      >
        <div className={cn("relative flex items-center flex-row-reverse", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} >
           <div className="w-3 h-3 rounded-full bg-current shadow-[0_0_12px_currentColor] z-10 group-hover:scale-150 transition-transform" />
          <div className="w-12 h-px bg-current opacity-40 mr-1 transition-all group-hover:w-16" />
          <div className="whitespace-nowrap px-3 py-1.5 bg-black/80 backdrop-blur-md border border-current/30 rounded shadow-lg transition-transform group-hover:scale-105 mr-1 flex items-center gap-2">
            <span className="font-bold text-xs text-white opacity-80">AVG</span>
            <span className="font-mono text-xs text-white">{profile.tires_sessions_current || 0} sess.</span>
          </div>
        </div>
      </div>

      {/* Front Right Tire (AVD) */}
      <div 
        className="absolute left-[80%] top-[70%] group cursor-pointer z-10" 
        onClick={() => setSelectedComp('tire_fr')}
      >
        <div className={cn("relative flex items-center", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} >
           <div className="w-3 h-3 rounded-full bg-current shadow-[0_0_12px_currentColor] z-10 group-hover:scale-150 transition-transform" />
          <div className="w-12 h-px bg-current opacity-40 ml-1 transition-all group-hover:w-16" />
          <div className="whitespace-nowrap px-3 py-1.5 bg-black/80 backdrop-blur-md border border-current/30 rounded shadow-lg transition-transform group-hover:scale-105 ml-1 flex items-center gap-2">
            <span className="font-bold text-xs text-white opacity-80">AVD</span>
            <span className="font-mono text-xs text-white">{profile.tires_sessions_current || 0} sess.</span>
          </div>
        </div>
      </div>

      {/* Rear Left Tire (ARG) */}
      <div 
        className="absolute left-[20%] top-[25%] group cursor-pointer z-10" 
        onClick={() => setSelectedComp('tire_rl')}
      >
        <div className={cn("relative flex items-center flex-row-reverse", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} >
           <div className="w-3 h-3 rounded-full bg-current shadow-[0_0_12px_currentColor] z-10 group-hover:scale-150 transition-transform" />
          <div className="w-16 h-px bg-current opacity-40 mr-1 transition-all group-hover:w-20" />
          <div className="whitespace-nowrap px-3 py-1.5 bg-black/80 backdrop-blur-md border border-current/30 rounded shadow-lg transition-transform group-hover:scale-105 mr-1 flex items-center gap-2">
            <span className="font-bold text-xs text-white opacity-80">ARG</span>
            <span className="font-mono text-xs text-white">{profile.tires_sessions_current || 0} sess.</span>
          </div>
        </div>
      </div>

      {/* Rear Right Tire (ARD) */}
      <div 
        className="absolute left-[75%] top-[25%] group cursor-pointer z-10" 
        onClick={() => setSelectedComp('tire_rr')}
      >
        <div className={cn("relative flex items-center", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} >
           <div className="w-3 h-3 rounded-full bg-current shadow-[0_0_12px_currentColor] z-10 group-hover:scale-150 transition-transform" />
          <div className="w-16 h-px bg-current opacity-40 ml-1 transition-all group-hover:w-20" />
          <div className="whitespace-nowrap px-3 py-1.5 bg-black/80 backdrop-blur-md border border-current/30 rounded shadow-lg transition-transform group-hover:scale-105 ml-1 flex items-center gap-2">
            <span className="font-bold text-xs text-white opacity-80">ARD</span>
            <span className="font-mono text-xs text-white">{profile.tires_sessions_current || 0} sess.</span>
          </div>
        </div>
      </div>

      {/* Brakes (Rear Axle) */}
      <div 
        className="absolute left-[45%] top-[25%] group cursor-pointer z-10" 
        onClick={() => setSelectedComp('brakes')}
      >
        <div className={cn("relative flex flex-col items-center", getStatusColor(profile.brakes_sessions_current, profile.brakes_sessions_life).replace("drop-shadow", ""))} >
          <div className="whitespace-nowrap px-3 py-1.5 bg-black/80 backdrop-blur-md border border-current/30 rounded shadow-lg transition-transform group-hover:scale-105 mb-1 flex flex-col items-center gap-1">
            <span className="font-bold text-[10px] text-white opacity-80 uppercase tracking-widest">Freins</span>
            <span className="font-mono text-xs text-white">{profile.brakes_sessions_current || 0} sess.</span>
          </div>
          <div className="w-px h-8 bg-current opacity-40 mb-1 transition-all group-hover:h-12" />
           <div className="w-3 h-3 rounded-full bg-current shadow-[0_0_12px_currentColor] z-10 group-hover:scale-150 transition-transform" />
        </div>
      </div>

      {/* Battery */}
      <div 
        className="absolute left-[38%] top-[55%] group cursor-pointer z-10" 
        onClick={() => setSelectedComp('battery')}
      >
        <div className={cn("relative flex flex-col items-center", getStatusColor(profile.battery_voltage_last, 12.5, true))} >
          <div className="whitespace-nowrap px-3 py-1.5 bg-black/80 backdrop-blur-md border border-current/30 rounded shadow-lg transition-transform group-hover:scale-105 mb-1 flex items-center gap-2">
            <span className="font-bold text-[10px] text-white opacity-80 uppercase tracking-widest">Batterie</span>
            <span className="font-mono text-xs text-white">{profile.battery_voltage_last || "--"}V</span>
          </div>
          <div className="w-px h-6 bg-current opacity-40 mb-1 transition-all group-hover:h-10" />
           <div className="w-3 h-3 rounded-full bg-current shadow-[0_0_12px_currentColor] z-10 group-hover:scale-150 transition-transform" />
        </div>
      </div>
      
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
