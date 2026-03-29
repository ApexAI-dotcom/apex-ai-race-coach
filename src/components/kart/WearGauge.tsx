import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface WearGaugeProps {
  current: number;
  max: number;
  label: string;
  icon: ReactNode;
  unit?: string;
  className?: string;
  onAction?: () => void;
  actionLabel?: string;
}

export const WearGauge = ({
  current,
  max,
  label,
  icon,
  unit = "",
  className,
  onAction,
  actionLabel,
}: WearGaugeProps) => {
  const percentage = Math.min(Math.max((current / max) * 100, 0), 100);
  
  // Coloring based on percentage
  const getColor = () => {
    if (percentage > 90) return "text-red-500 stroke-red-500";
    if (percentage > 75) return "text-orange-500 stroke-orange-500";
    return "text-green-500 stroke-green-500";
  };
  
  const getGradient = () => {
    if (percentage > 90) return "from-red-500/20 to-transparent";
    if (percentage > 75) return "from-orange-500/20 to-transparent";
    return "from-green-500/20 to-transparent";
  };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className={cn("glass-card border border-white/5 relative overflow-hidden flex flex-col items-center justify-between p-6", className)}>
      <div className={cn("absolute inset-0 bg-gradient-to-t -z-10", getGradient())} />
      
      <div className="flex items-center gap-2 mb-4 w-full text-muted-foreground font-medium">
        {icon}
        <span>{label}</span>
      </div>

      <div className="relative flex items-center justify-center mb-6">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle cx="64" cy="64" r={radius} className="stroke-muted-foreground/20 fill-none" strokeWidth="8" />
          <circle cx="64" cy="64" r={radius} className={cn("fill-none transition-all duration-1000 ease-in-out", getColor())} strokeWidth="8" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" />
        </svg>
        <div className="absolute flex flex-col items-center justify-center w-[85px] text-center px-1">
          <span className="text-2xl font-bold font-display leading-none">{current.toFixed(1)}</span>
          <span className="text-[9px] text-muted-foreground mt-1 whitespace-nowrap overflow-visible">/ {max} {unit}</span>
        </div>
      </div>

      {onAction && actionLabel && (
        <button
          onClick={onAction}
          className="w-full py-2 px-4 rounded-lg bg-white/5 hover:bg-white/10 text-sm font-medium transition-colors border border-white/10"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
};
