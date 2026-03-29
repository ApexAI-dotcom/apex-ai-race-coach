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
      <div className="relative w-full max-w-[350px] mx-auto aspect-[2/3] flex items-center justify-center p-0">
      {/* Tron Grid Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none rounded-2xl opacity-20">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:20px_20px] [transform:perspective(500px)_rotateX(60deg)_scale(2)_translateY(-50px)]" />
      </div>

      {/* Glow Behind Kart */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-1/2 h-3/4 bg-primary/5 blur-[80px] rounded-full" />
      </div>

      {/* Kart Blueprint Schematic (High-End Front-Angle / Semi-3/4) */}
      <div className="absolute inset-0 flex items-center justify-center opacity-80 hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <svg viewBox="0 0 400 600" className="w-full h-full drop-shadow-[0_0_20px_rgba(255,255,255,0.15)]">
          <defs>
             <linearGradient id="podGrad" x1="0" y1="0" x2="1" y2="0">
               <stop offset="0%" stopColor="#111" stopOpacity="0.8" />
               <stop offset="50%" stopColor="#333" stopOpacity="0.8" />
               <stop offset="100%" stopColor="#111" stopOpacity="0.8" />
             </linearGradient>
             <linearGradient id="nassauGrad" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="#2a2a2a" />
               <stop offset="100%" stopColor="#0a0a0a" />
             </linearGradient>
             <linearGradient id="tireGradFront" x1="0" y1="0" x2="0" y2="1">
               <stop offset="0%" stopColor="#1f1f1f" />
               <stop offset="100%" stopColor="#080808" />
             </linearGradient>
             <radialGradient id="seatGlow" cx="50%" cy="50%" r="50%">
               <stop offset="0%" stopColor="#444" />
               <stop offset="100%" stopColor="#111" />
             </radialGradient>
             <linearGradient id="tubes" x1="0" y1="0" x2="1" y2="1">
               <stop offset="0%" stopColor="#888" />
               <stop offset="50%" stopColor="#ccc" />
               <stop offset="100%" stopColor="#555" />
             </linearGradient>
          </defs>

          {/* Center Floor Pan */}
          <path d="M 150 200 L 250 200 L 230 460 L 170 460 Z" fill="rgba(255,255,255,0.02)" stroke="none" />

          {/* Under-chassis tubes */}
          <path d="M 160 180 L 140 440 M 240 180 L 260 440" fill="none" stroke="url(#tubes)" strokeWidth="6" strokeLinecap="round" />
          <path d="M 120 220 L 280 220 M 130 380 L 270 380" fill="none" stroke="url(#tubes)" strokeWidth="5" strokeLinecap="round" />

          {/* Rear Axle Assembly */}
          <rect x="70" y="160" width="260" height="8" rx="4" fill="#666" stroke="#222" strokeWidth="2" />
          {/* Brake Disc (Rear Axle) */}
          <ellipse cx="230" cy="164" rx="6" ry="18" fill="none" stroke="#aaa" strokeWidth="3" />
          <ellipse cx="230" cy="164" rx="3" ry="12" fill="none" stroke="rgba(255,255,255,0.5)" strokeWidth="1" strokeDasharray="2 2" />
          <path d="M 226 150 L 234 150 L 234 160 L 226 160 Z" fill="#b02a2a" /> {/* Caliper */}

          {/* Engine Block (Right Side) */}
          <g transform="translate(255, 230)">
            <rect x="0" y="0" width="45" height="70" rx="6" fill="#151515" stroke="#555" strokeWidth="3" />
            <path d="M 10 10 L 35 10 M 10 20 L 35 20 M 10 30 L 35 30" stroke="#444" strokeWidth="2" strokeLinecap="round" />
            {/* Cylinder Head / Spark Plug area */}
            <circle cx="22" cy="50" r="10" fill="#222" stroke="#666" strokeWidth="2" />
            <circle cx="22" cy="50" r="3" fill="#dfdfdf" />
            {/* Exhaust Pipe routing to the back */}
            <path d="M 40 40 Q 60 40 60 0 Q 60 -40 30 -60" fill="none" stroke="#222" strokeWidth="14" strokeLinecap="round" />
            <path d="M 40 40 Q 60 40 60 0 Q 60 -40 30 -60" fill="none" stroke="#888" strokeWidth="8" strokeLinecap="round" />
            <path d="M 40 40 Q 60 40 60 0 Q 60 -40 30 -60" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" strokeLinecap="round" />
          </g>

          {/* Battery Area (Left Side under pod) */}
          <rect x="135" y="240" width="25" height="35" rx="3" fill="#111" stroke="#444" strokeWidth="2" />
          <line x1="140" y1="245" x2="155" y2="245" stroke="#ff3333" strokeWidth="2" strokeLinecap="round" />

          {/* Rear Tires (Perspective => Drawn higher up, wide) */}
          <g transform="translate(60, 130)">
            {/* Left Rear Tire */}
            <rect x="0" y="0" width="45" height="80" rx="8" fill="url(#tireGradFront)" stroke="#333" strokeWidth="2" />
            <path d="M 5 10 L 40 10 M 5 40 L 40 40 M 5 70 L 40 70" stroke="#111" strokeWidth="1" opacity="0.5" />
            {/* Rim */}
            <rect x="42" y="20" width="3" height="40" fill="#555" />
          </g>
          <g transform="translate(295, 130)">
            {/* Right Rear Tire */}
            <rect x="0" y="0" width="45" height="80" rx="8" fill="url(#tireGradFront)" stroke="#333" strokeWidth="2" />
            <path d="M 5 10 L 40 10 M 5 40 L 40 40 M 5 70 L 40 70" stroke="#111" strokeWidth="1" opacity="0.5" />
            {/* Rim */}
            <rect x="-3" y="20" width="3" height="40" fill="#555" />
          </g>

          {/* Side Pods (Carénages Latéraux) - Aerodynamic contours */}
          <path d="M 70 230 C 50 250 50 380 75 420 C 100 420 115 390 125 350 C 130 310 120 230 105 230 Z" fill="url(#podGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <path d="M 85 240 C 65 260 65 370 85 400" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />

          <path d="M 330 230 C 350 250 350 380 325 420 C 300 420 285 390 275 350 C 270 310 280 230 295 230 Z" fill="url(#podGrad)" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          <path d="M 315 240 C 335 260 335 370 315 400" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="4" />

          {/* Seat (Siège Baquet) - Deep bucket illusion */}
          <path d="M 155 260 C 150 160 250 160 245 260 C 240 320 230 350 200 350 C 170 350 160 320 155 260 Z" fill="url(#seatGlow)" stroke="#555" strokeWidth="3" />
          {/* Seat Inner Cushion */}
          <path d="M 165 260 C 160 190 240 190 235 260 C 230 300 220 330 200 330 C 180 330 170 300 165 260 Z" fill="#151515" stroke="rgba(255,255,255,0.05)" strokeWidth="2" />
          
          {/* Steering Column & Wheel */}
          <line x1="200" y1="360" x2="200" y2="280" stroke="url(#tubes)" strokeWidth="8" strokeLinecap="round" />
          {/* Wheel Frame */}
          <ellipse cx="200" cy="275" rx="35" ry="15" fill="none" stroke="#222" strokeWidth="12" />
          <ellipse cx="200" cy="275" rx="35" ry="15" fill="none" stroke="#777" strokeWidth="4" />
          <ellipse cx="200" cy="275" rx="35" ry="15" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeDasharray="5 15" />
          {/* Dash / Mychron Screen on Wheel */}
          <rect x="185" y="260" width="30" height="15" rx="2" fill="#000" stroke="#444" strokeWidth="2" />
          <line x1="190" y1="267" x2="210" y2="267" stroke="#0f0" strokeWidth="1" className="opacity-70 animate-pulse" />

          {/* Front Nassau Panel (Front Fairing Shield) */}
          <path d="M 175 420 C 160 350 175 290 200 290 C 225 290 240 350 225 420 C 215 450 185 450 175 420 Z" fill="url(#nassauGrad)" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
          {/* Sponsor / Apex Logo placeholder line on Nassau */}
          <path d="M 185 360 C 190 380 210 380 215 360" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="2" />
          <polygon points="200,320 190,340 210,340" fill="#f00" opacity="0.6" />

          {/* Front Spoiler (Aileron Avant) */}
          <path d="M 110 440 C 150 490 250 490 290 440 C 295 440 295 470 260 490 C 220 510 180 510 140 490 C 105 470 105 440 110 440 Z" fill="#151515" stroke="rgba(255,255,255,0.2)" strokeWidth="2" />
          {/* Front Bumper Tubing visible through aero */}
          <path d="M 120 445 C 160 475 240 475 280 445" fill="none" stroke="url(#tubes)" strokeWidth="6" strokeLinecap="round" opacity="0.6" />

          {/* Front Hubs & Tie Rods (Direction) */}
          <line x1="200" y1="360" x2="110" y2="420" stroke="#777" strokeWidth="4" />
          <line x1="200" y1="360" x2="290" y2="420" stroke="#777" strokeWidth="4" />
          
          {/* Front Brake Discs (Left & Right - visible on front axle) */}
          <ellipse cx="106" cy="425" rx="4" ry="12" fill="none" stroke="#aaa" strokeWidth="2" />
          <ellipse cx="294" cy="425" rx="4" ry="12" fill="none" stroke="#aaa" strokeWidth="2" />
          <circle cx="106" cy="420" r="3" fill="#b02a2a" />
          <circle cx="294" cy="420" r="3" fill="#b02a2a" />

          {/* Front Tires (Perspective => Drawn lower down) */}
          <g transform="translate(68, 395)">
            {/* Left Front Tire (Slightly turned maybe? No, straight) */}
            <rect x="0" y="0" width="35" height="65" rx="6" fill="url(#tireGradFront)" stroke="#333" strokeWidth="2" />
            <path d="M 5 10 L 30 10 M 5 30 L 30 30 M 5 50 L 30 50" stroke="#111" strokeWidth="1" opacity="0.5" />
            <rect x="33" y="15" width="2" height="35" fill="#555" />
          </g>
          <g transform="translate(297, 395)">
            {/* Right Front Tire */}
            <rect x="0" y="0" width="35" height="65" rx="6" fill="url(#tireGradFront)" stroke="#333" strokeWidth="2" />
            <path d="M 5 10 L 30 10 M 5 30 L 30 30 M 5 50 L 30 50" stroke="#111" strokeWidth="1" opacity="0.5" />
            <rect x="-2" y="15" width="2" height="35" fill="#555" />
          </g>
        </svg>
      </div>

      {/* --- HOTSPOTS (Accurate to new aero chassis) --- */}
      
      {/* Engine Hotspot */}
      <Tooltip>
        <TooltipTrigger asChild>
          <div onClick={() => setSelectedComp('engine')} className="absolute left-[69.4%] top-[44.2%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-110 hover:z-20">
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
          <div onClick={() => setSelectedComp('tire_fl')} className="absolute left-[21.4%] top-[71.2%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-110">
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
          <div onClick={() => setSelectedComp('tire_fr')} className="absolute left-[78.6%] top-[71.2%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-110">
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
          <div onClick={() => setSelectedComp('tire_rl')} className="absolute left-[20.6%] top-[28.3%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-110">
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
          <div onClick={() => setSelectedComp('tire_rr')} className="absolute left-[79.4%] top-[28.3%] -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center group cursor-pointer z-10 transition-transform hover:scale-110">
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
          <div onClick={() => setSelectedComp('brakes_front')} className="absolute left-[50%] top-[70.8%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center group cursor-pointer transition-transform hover:scale-110 z-10">
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
          <div onClick={() => setSelectedComp('brakes_rear')} className="absolute left-[57.5%] top-[27.3%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center group cursor-pointer transition-transform hover:scale-110 z-10">
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
          <div onClick={() => setSelectedComp('battery')} className="absolute left-[36.9%] top-[42.9%] -translate-x-1/2 -translate-y-1/2 flex items-center justify-center transition-transform hover:scale-110 cursor-pointer z-10">
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
