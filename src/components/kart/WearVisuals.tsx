import { cn } from "@/lib/utils";

interface WearVisProps {
  ratio: number; // 0 (new) to 1 (worn)
}

export const TireVis = ({ ratio }: WearVisProps) => {
  // Ratio 0 = brand new, shiny black, deep grooves.
  // Ratio 1 = worn out, dull grey, shallow grooves.
  const isWorn = ratio > 0.8;
  const color = ratio < 0.4 ? "#0a0a0a" : ratio < 0.8 ? "#1f1f1f" : "#333333";
  const glow = isWorn ? "drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]" : "drop-shadow-[0_0_10px_rgba(0,0,0,0.8)]";

  return (
    <div className="w-full h-32 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className={cn("w-24 h-24 transition-all duration-1000", glow)}>
        <defs>
          <linearGradient id="tireGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#444" />
            <stop offset="50%" stopColor={color} />
            <stop offset="100%" stopColor="#111" />
          </linearGradient>
        </defs>
        {/* Main Tire Body */}
        <rect x="20" y="10" width="60" height="80" rx="15" fill="url(#tireGrad)" stroke="#555" strokeWidth="2" opacity={0.9} />
        {/* Grooves (fade out as wear increases) */}
        <path d="M 35 10 L 35 90 M 50 10 L 50 90 M 65 10 L 65 90" stroke="#050505" strokeWidth="3" opacity={Math.max(1 - ratio * 1.5, 0)} strokeDasharray="10 5" />
        {/* Wear Indicators / Cracks */}
        {isWorn && (
          <path d="M 30 25 L 45 35 M 65 60 L 50 70 M 35 75 L 45 80" stroke="#888" strokeWidth="1" opacity={0.6} />
        )}
      </svg>
    </div>
  );
};

export const EngineVis = ({ ratio }: WearVisProps) => {
  // As ratio approaches 1, Engine cylinder head glows orange/red indicating heat/stress
  const heatOpacity = Math.max(0, (ratio - 0.5) * 2);

  return (
    <div className="w-full h-32 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-24 h-24 transition-all duration-1000 drop-shadow-[0_0_12px_rgba(255,255,255,0.1)]">
        {/* Engine Block */}
        <path d="M 20 50 L 80 50 L 80 90 L 20 90 Z" fill="#222" stroke="#555" strokeWidth="2" />
        <path d="M 25 30 L 75 30 L 80 50 L 20 50 Z" fill="#333" stroke="#666" strokeWidth="2" />
        {/* Cylinder Fins */}
        <line x1="22" y1="35" x2="78" y2="35" stroke="#111" strokeWidth="2" />
        <line x1="22" y1="40" x2="78" y2="40" stroke="#111" strokeWidth="2" />
        <line x1="22" y1="45" x2="78" y2="45" stroke="#111" strokeWidth="2" />
        {/* Heat Glow Overlay */}
        <path d="M 25 30 L 75 30 L 80 50 L 20 50 Z" fill="rgba(239, 68, 68, 1)" opacity={heatOpacity * 0.8} filter="blur(4px)" />
        {/* Spark Plug */}
        <rect x="45" y="15" width="10" height="15" fill="#ddd" />
        <path d="M 50 5 L 50 15" stroke="#ea580c" strokeWidth="3" opacity={ratio > 0.9 ? 1 : 0} />
      </svg>
    </div>
  );
};

export const BrakeVis = ({ ratio }: WearVisProps) => {
  // Disk glows red-hot as wear ratio increases
  const heat = Math.max(0, (ratio - 0.4) * 1.5);
  
  return (
    <div className="w-full h-32 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-24 h-24 transition-all duration-1000">
        <defs>
          <radialGradient id="diskGrad" cx="50%" cy="50%" r="50%">
            <stop offset="30%" stopColor="#111" />
            <stop offset="60%" stopColor="#666" />
            <stop offset="100%" stopColor="#333" />
          </radialGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(239,68,68,1)" strokeWidth="4" opacity={heat * 0.5} filter="blur(6px)" />
        <circle cx="50" cy="50" r="40" fill="url(#diskGrad)" stroke="#888" strokeWidth="2" />
        <circle cx="50" cy="50" r="20" fill="#111" stroke="#555" strokeWidth="2" />
        {/* Heat rings */}
        <circle cx="50" cy="50" r="30" fill="none" stroke="#ef4444" strokeWidth="8" opacity={heat * 0.8} />
        {/* Caliper */}
        <path d="M 10 50 C 10 30 20 15 40 10 L 45 25 C 30 30 25 40 25 50 Z" fill="#b91c1c" />
      </svg>
    </div>
  );
};

export const BatteryVis = ({ voltage }: { voltage: number }) => {
  // Ratio from 11.0V (0) to 13.0V (1)
  const ratio = Math.max(0, Math.min((voltage - 11.0) / 2.0, 1));
  const isLow = voltage < 12.0;

  return (
    <div className="w-full h-32 flex items-center justify-center">
      <svg viewBox="0 0 100 100" className="w-24 h-24 transition-all duration-1000">
        {/* Terminals */}
        <rect x="25" y="15" width="10" height="10" fill="#ef4444" />
        <rect x="65" y="15" width="10" height="10" fill="#222" />
        {/* Box */}
        <rect x="15" y="25" width="70" height="65" rx="5" fill="#1f1f1f" stroke="#444" strokeWidth="3" />
        {/* Charge Level */}
        <rect x="20" y={25 + (60 * (1 - ratio))} width="60" height={60 * ratio} fill={isLow ? "#ef4444" : "#22c55e"} opacity={0.8} />
        {/* Energy Symbol */}
        <path d="M 55 35 L 40 55 L 50 55 L 45 75 L 60 55 L 50 55 Z" fill="#fff" opacity={isLow ? 0.3 : 0.8} className={isLow ? "animate-pulse" : ""} />
      </svg>
    </div>
  );
};
