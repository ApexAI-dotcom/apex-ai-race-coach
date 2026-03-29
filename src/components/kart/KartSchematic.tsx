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

      {/* High-End Vector Schematic (Blueprint Style) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none p-4 opacity-80 backdrop-blur-sm">
        <svg viewBox="0 0 800 600" preserveAspectRatio="xMidYMid meet" className="w-full h-full drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          <defs>
            {/* Gradients to give volume without being photorealistic */}
            <linearGradient id="tubeGlow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="rgba(255,255,255,0.4)" />
              <stop offset="50%" stopColor="rgba(255,255,255,0.1)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0.0)" />
            </linearGradient>
            
            <linearGradient id="tireGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#222" />
              <stop offset="100%" stopColor="#050505" />
            </linearGradient>
            
            <linearGradient id="seatGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#333" />
              <stop offset="100%" stopColor="#111" />
            </linearGradient>

            <pattern id="blueprintGrid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
            </pattern>
          </defs>

          {/* Grid Background within SVG */}
          <rect width="800" height="600" fill="url(#blueprintGrid)" className="opacity-50" />
          
          {/* Floor / Ground Reflection */}
          <ellipse cx="400" cy="450" rx="300" ry="100" fill="rgba(255,255,255,0.02)" filter="blur(20px)" />

          <g transform="translate(0, 50)">
            {/* Rear Axle Assembly */}
            <path d="M 280 180 L 620 280" fill="none" stroke="#555" strokeWidth="10" strokeLinecap="round" />
            {/* Brake Disc (Rear) */}
            <g transform="translate(420, 222)">
              <ellipse cx="0" cy="0" rx="15" ry="35" transform="rotate(-15)" fill="none" stroke="#888" strokeWidth="6" />
              <ellipse cx="0" cy="0" rx="10" ry="25" transform="rotate(-15)" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="2" strokeDasharray="2 4" />
              <path d="M -15 -10 L -25 -5 L -20 15 L -10 10 Z" fill="#444" stroke="#777" strokeWidth="2" /> {/* Caliper */}
            </g>

            {/* Tires - Drawn in Z-order back to front */}
            {/* Rear Right Tire */}
            <g transform="translate(600, 240)">
              <path d="M 0 -40 Q 30 -30 40 20 L 10 50 Q -20 40 -30 -10 Z" fill="url(#tireGrad)" stroke="#444" strokeWidth="3" strokeLinejoin="round" />
              <ellipse cx="5" cy="5" rx="15" ry="35" transform="rotate(-15)" fill="none" stroke="#333" strokeWidth="2" />
              <ellipse cx="-15" cy="-5" rx="8" ry="18" transform="rotate(-15)" fill="none" stroke="#777" strokeWidth="4" />
            </g>

            {/* Rear Left Tire */}
            <g transform="translate(250, 140)">
              <path d="M 0 -40 Q 30 -30 40 20 L 10 50 Q -20 40 -30 -10 Z" fill="url(#tireGrad)" stroke="#444" strokeWidth="3" strokeLinejoin="round" />
              <ellipse cx="-15" cy="-5" rx="8" ry="18" transform="rotate(-15)" fill="none" stroke="#777" strokeWidth="4" />
            </g>

            {/* Central Tubing / Chassis */}
            <g fill="none" stroke="url(#tubeGlow)" strokeWidth="12" strokeLinejoin="round" strokeLinecap="round">
              {/* Main Rails */}
              <path d="M 320 200 L 220 300 C 200 320 220 360 260 380 L 400 420 L 520 280 M 440 230 L 540 330 L 600 240" />
              {/* Front Cross */}
              <path d="M 260 380 L 460 440 L 540 330" />
              {/* Floor Pan */}
              <path d="M 300 280 L 260 380 L 420 420 L 440 290 Z" fill="rgba(255,255,255,0.02)" stroke="none" />
            </g>
            <g fill="none" stroke="#888" strokeWidth="4" strokeLinejoin="round" strokeLinecap="round">
              <path d="M 320 200 L 220 300 C 200 320 220 360 260 380 L 400 420 L 520 280" />
            </g>

            {/* Engine Silhouette */}
            <g transform="translate(480, 240)">
              {/* Engine Block */}
              <rect x="-40" y="-40" width="80" height="70" rx="8" transform="rotate(-15)" fill="#111" stroke="#888" strokeWidth="4" />
              <rect x="-30" y="-30" width="60" height="50" rx="4" transform="rotate(-15)" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeDasharray="3 3" />
              {/* Exhaust Pipe */}
              <path d="M 20 -20 C 60 -50 80 10 40 40 C 20 50 -10 60 -30 50" fill="none" stroke="#666" strokeWidth="12" strokeLinecap="round" />
              <path d="M 20 -20 C 60 -50 80 10 40 40 C 20 50 -10 60 -30 50" fill="none" stroke="#444" strokeWidth="6" strokeLinecap="round" />
            </g>

            {/* Left Side Pod */}
            <g transform="translate(240, 250)">
              <path d="M -30 -20 L -60 40 C -70 60 -50 80 -10 90 L 80 120 C 100 125 100 100 80 70 L 40 -10 Z" fill="#111" stroke="#555" strokeWidth="5" strokeLinejoin="round" />
              <path d="M -10 0 L -30 40 L 40 70 L 60 30 Z" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
            </g>

            {/* Right Side Pod */}
            <g transform="translate(560, 360)">
              <path d="M -40 -30 L -10 20 C 0 40 30 50 60 40 L 110 0 C 120 -20 100 -40 80 -40 L 0 -50 Z" fill="#111" stroke="#555" strokeWidth="5" strokeLinejoin="round" />
            </g>

            {/* Seat */}
            <g transform="translate(380, 260)">
              <path d="M -30 -60 C -10 -80 30 -60 40 -20 L 50 50 C 55 80 20 90 -10 70 L -40 30 C -60 10 -50 -30 -30 -60 Z" fill="url(#seatGrad)" stroke="#777" strokeWidth="6" strokeLinejoin="round" />
              <path d="M -20 -40 C 0 -60 20 -40 30 -10 L 40 40 C 40 50 10 60 -10 40 L -30 10 C -40 -10 -30 -30 -20 -40 Z" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="3" />
            </g>

            {/* Battery */}
            <g transform="translate(310, 310)">
              <rect x="-20" y="-30" width="40" height="50" rx="4" transform="rotate(-15)" fill="#222" stroke="#666" strokeWidth="4" />
              <line x1="-15" y1="-25" x2="15" y2="-15" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
            </g>

            {/* Steering Column & Wheel */}
            <g transform="translate(380, 380)">
              {/* Column */}
              <line x1="0" y1="0" x2="-20" y2="-70" stroke="#777" strokeWidth="8" strokeLinecap="round" />
              {/* Wheel */}
              <path d="M -20 -70 C -50 -90 -40 -110 -10 -110 C 20 -110 30 -80 -20 -70" fill="none" stroke="#222" strokeWidth="12" />
              <path d="M -20 -70 C -50 -90 -40 -110 -10 -110 C 20 -110 30 -80 -20 -70" fill="none" stroke="#888" strokeWidth="6" />
              <circle cx="-15" cy="-90" r="10" fill="#111" stroke="#555" strokeWidth="2" />
            </g>

            {/* Front Bumper / Nassau Panel */}
            <g transform="translate(430, 480)">
              {/* Steering linkage / tie rods */}
              <line x1="-50" y1="-60" x2="-120" y2="0" stroke="#666" strokeWidth="6" strokeLinecap="round" />
              <line x1="10" y1="-40" x2="120" y2="-20" stroke="#666" strokeWidth="6" strokeLinecap="round" />
              
              {/* Nassau Panel */}
              <path d="M -60 -100 C -20 -140 20 -120 40 -80 L 100 20 C 110 60 70 80 30 70 L -40 20 C -70 0 -80 -60 -60 -100 Z" fill="#111" stroke="#999" strokeWidth="5" strokeLinejoin="round" />
              
              {/* Bumper tubes */}
              <path d="M -80 0 C -120 40 -60 100 0 100 C 60 100 120 60 120 0" fill="none" stroke="#555" strokeWidth="10" strokeLinecap="round" />
            </g>

            {/* Front Left Tire */}
            <g transform="translate(260, 440)">
               <path d="M 0 -40 Q 30 -30 40 20 L 10 50 Q -20 40 -30 -10 Z" fill="url(#tireGrad)" stroke="#444" strokeWidth="3" strokeLinejoin="round" />
              <ellipse cx="5" cy="5" rx="15" ry="35" transform="rotate(-15)" fill="none" stroke="#333" strokeWidth="2" />
              <ellipse cx="-15" cy="-5" rx="8" ry="18" transform="rotate(-15)" fill="none" stroke="#999" strokeWidth="4" />
            </g>

            {/* Front Right Tire */}
            <g transform="translate(580, 460)">
              <path d="M 0 -40 Q 30 -30 40 20 L 10 50 Q -20 40 -30 -10 Z" fill="url(#tireGrad)" stroke="#444" strokeWidth="3" strokeLinejoin="round" />
              <ellipse cx="5" cy="5" rx="15" ry="35" transform="rotate(-15)" fill="none" stroke="#333" strokeWidth="2" />
              <ellipse cx="-15" cy="-5" rx="8" ry="18" transform="rotate(-15)" fill="none" stroke="#999" strokeWidth="4" />
            </g>
          </g>
        </svg>
      </div>

      {/* --- HUD BADGES --- */}
      {/* 
        The dots are placed accurately over the vector schematic. 
        Each dot connects via a CSS line to a floating frosted-glass badge.
      */}

      {/* Engine Hotspot */}
      <div 
        className="absolute left-[65%] top-[45%] group cursor-pointer z-10" 
        onClick={() => setSelectedComp('engine')}
      >
        <div className={cn("relative flex items-center", getStatusColor(profile.engine_hours_current, profile.engine_hours_life))} >
          {/* Dot */}
           <div className="w-4 h-4 rounded-full bg-current shadow-[0_0_15px_currentColor] z-10 group-hover:scale-150 transition-transform" />
          {/* Line */}
          <div className="w-16 h-px bg-current opacity-60 ml-1 transition-all group-hover:w-20" />
          {/* Box */}
          <div className="whitespace-nowrap px-4 py-2 bg-black/80 backdrop-blur-md border border-current/30 rounded shadow-xl transition-transform group-hover:scale-105 ml-1">
            <span className="font-bold text-sm text-white opacity-90 uppercase">Moteur</span>
            <span className="ml-3 font-mono text-sm text-white">{profile.engine_hours_current?.toFixed(1) || 0}h</span>
          </div>
        </div>
      </div>

      {/* Front Left Tire (AVG) */}
      <div 
        className="absolute left-[33%] top-[77%] group cursor-pointer z-10" 
        onClick={() => setSelectedComp('tire_fl')}
      >
        <div className={cn("relative flex items-center flex-row-reverse", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} >
           <div className="w-4 h-4 rounded-full bg-current shadow-[0_0_15px_currentColor] z-10 group-hover:scale-150 transition-transform" />
          <div className="w-12 h-px bg-current opacity-60 mr-1 transition-all group-hover:w-16" />
          <div className="whitespace-nowrap px-4 py-2 bg-black/80 backdrop-blur-md border border-current/30 rounded shadow-xl transition-transform group-hover:scale-105 mr-1 flex items-center gap-3">
            <span className="font-bold text-sm text-white opacity-90">AVG</span>
            <span className="font-mono text-sm text-white">{profile.tires_sessions_current || 0} sess.</span>
          </div>
        </div>
      </div>

      {/* Front Right Tire (AVD) */}
      <div 
        className="absolute left-[72%] top-[80%] group cursor-pointer z-10" 
        onClick={() => setSelectedComp('tire_fr')}
      >
        <div className={cn("relative flex items-center", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} >
           <div className="w-4 h-4 rounded-full bg-current shadow-[0_0_15px_currentColor] z-10 group-hover:scale-150 transition-transform" />
          <div className="w-12 h-px bg-current opacity-60 ml-1 transition-all group-hover:w-16" />
          <div className="whitespace-nowrap px-4 py-2 bg-black/80 backdrop-blur-md border border-current/30 rounded shadow-xl transition-transform group-hover:scale-105 ml-1 flex items-center gap-3">
            <span className="font-bold text-sm text-white opacity-90">AVD</span>
            <span className="font-mono text-sm text-white">{profile.tires_sessions_current || 0} sess.</span>
          </div>
        </div>
      </div>

      {/* Rear Left Tire (ARG) */}
      <div 
        className="absolute left-[31%] top-[30%] group cursor-pointer z-10" 
        onClick={() => setSelectedComp('tire_rl')}
      >
        <div className={cn("relative flex items-center flex-row-reverse", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} >
           <div className="w-4 h-4 rounded-full bg-current shadow-[0_0_15px_currentColor] z-10 group-hover:scale-150 transition-transform" />
          <div className="w-16 h-px bg-current opacity-60 mr-1 transition-all group-hover:w-20" />
          <div className="whitespace-nowrap px-4 py-2 bg-black/80 backdrop-blur-md border border-current/30 rounded shadow-xl transition-transform group-hover:scale-105 mr-1 flex items-center gap-3">
            <span className="font-bold text-sm text-white opacity-90">ARG</span>
            <span className="font-mono text-sm text-white">{profile.tires_sessions_current || 0} sess.</span>
          </div>
        </div>
      </div>

      {/* Rear Right Tire (ARD) */}
      <div 
        className="absolute left-[75%] top-[40%] group cursor-pointer z-10" 
        onClick={() => setSelectedComp('tire_rr')}
      >
        <div className={cn("relative flex items-center", getStatusColor(profile.tires_sessions_current, profile.tires_sessions_life))} >
           <div className="w-4 h-4 rounded-full bg-current shadow-[0_0_15px_currentColor] z-10 group-hover:scale-150 transition-transform" />
          <div className="w-16 h-px bg-current opacity-60 ml-1 transition-all group-hover:w-20" />
          <div className="whitespace-nowrap px-4 py-2 bg-black/80 backdrop-blur-md border border-current/30 rounded shadow-xl transition-transform group-hover:scale-105 ml-1 flex items-center gap-3">
            <span className="font-bold text-sm text-white opacity-90">ARD</span>
            <span className="font-mono text-sm text-white">{profile.tires_sessions_current || 0} sess.</span>
          </div>
        </div>
      </div>

      {/* Brakes (Rear Axle) */}
      <div 
        className="absolute left-[52%] top-[40%] group cursor-pointer z-10" 
        onClick={() => setSelectedComp('brakes')}
      >
        <div className={cn("relative flex flex-col items-center", getStatusColor(profile.brakes_sessions_current, profile.brakes_sessions_life).replace("drop-shadow", ""))} >
          <div className="whitespace-nowrap px-4 py-2 bg-black/80 backdrop-blur-md border border-current/30 rounded shadow-xl transition-transform group-hover:scale-105 mb-1 flex flex-col items-center gap-1">
            <span className="font-bold text-[11px] text-white opacity-90 uppercase tracking-widest">Freins</span>
            <span className="font-mono text-sm text-white">{profile.brakes_sessions_current || 0} sess.</span>
          </div>
          <div className="w-px h-10 bg-current opacity-60 mb-1 transition-all group-hover:h-12" />
           <div className="w-4 h-4 rounded-full bg-current shadow-[0_0_15px_currentColor] z-10 group-hover:scale-150 transition-transform" />
        </div>
      </div>

      {/* Battery */}
      <div 
        className="absolute left-[39%] top-[55%] group cursor-pointer z-10" 
        onClick={() => setSelectedComp('battery')}
      >
        <div className={cn("relative flex flex-col items-center", getStatusColor(profile.battery_voltage_last, 12.5, true))} >
          <div className="whitespace-nowrap px-4 py-2 bg-black/80 backdrop-blur-md border border-current/30 rounded shadow-xl transition-transform group-hover:scale-105 mb-1 flex flex-col items-center gap-1">
            <span className="font-bold text-[11px] text-white opacity-90 uppercase tracking-widest">Batterie</span>
            <span className="font-mono text-sm text-white">{profile.battery_voltage_last || "--"}V</span>
          </div>
          <div className="w-px h-8 bg-current opacity-60 mb-1 transition-all group-hover:h-12" />
           <div className="w-4 h-4 rounded-full bg-current shadow-[0_0_15px_currentColor] z-10 group-hover:scale-150 transition-transform" />
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
