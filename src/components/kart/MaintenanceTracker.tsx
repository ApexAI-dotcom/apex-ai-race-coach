import { useState, useRef, useEffect } from "react";
import { KartProfile } from "@/lib/api";
import { Flame, Disc, Link as LinkIcon, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface GaugeProps {
  current: number;
  max: number;
  label: string;
  icon: React.ReactNode;
  unit: string;
  onUpdate: (val: number) => void;
}

function EditableGauge({ current, max, label, icon, unit, onUpdate }: GaugeProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(current.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setEditValue(current.toString());
  }, [current]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    const val = parseFloat(editValue);
    if (!isNaN(val)) {
      onUpdate(val);
    } else {
      setEditValue(current.toString());
    }
    setIsEditing(false);
  };

  const percentage = Math.min(Math.max((current / max) * 100, 0), 100);

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
    <div className="glass-card border border-white/5 relative overflow-hidden flex flex-col items-center justify-between p-6">
      <div className={cn("absolute inset-0 bg-gradient-to-t -z-10", getGradient())} />

      <div className="flex items-center gap-2 mb-4 w-full text-muted-foreground font-medium">
        {icon}
        <span>{label}</span>
      </div>

      <div className="relative flex items-center justify-center mb-2">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle
            cx="64"
            cy="64"
            r={radius}
            className="stroke-muted-foreground/20 fill-none"
            strokeWidth="8"
          />
          <circle
            cx="64"
            cy="64"
            r={radius}
            className={cn("fill-none transition-all duration-1000 ease-in-out", getColor())}
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        <div className="absolute flex flex-col items-center justify-center w-[85px] text-center px-1">
          {isEditing ? (
            <Input
              ref={inputRef}
              type="number"
              className="h-8 text-center text-lg font-bold p-0 bg-background/50 border-white/20"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            />
          ) : (
            <div 
              className="flex items-center justify-center gap-1 cursor-pointer group"
              onClick={() => setIsEditing(true)}
            >
              <span className="text-2xl font-bold font-display leading-none group-hover:text-primary transition-colors">
                {current % 1 === 0 ? current : current.toFixed(1)}
              </span>
              <Edit2 className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}
          <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap overflow-visible">
            / {max} {unit}
          </span>
        </div>
      </div>
    </div>
  );
}

export function MaintenanceTracker({
  profile,
  onUpdate,
}: {
  profile: KartProfile;
  onUpdate: (field: keyof KartProfile, value: any) => void;
}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
      <EditableGauge
        current={profile.engine_hours_current || 0}
        max={profile.engine_hours_life || 15}
        icon={<Flame className="w-5 h-5 text-red-500" />}
        label="Moteur"
        unit="h"
        onUpdate={(val) => onUpdate("engine_hours_current", val)}
      />
      <EditableGauge
        current={profile.tires_laps_current || 0}
        max={profile.tires_laps_life || 100}
        icon={<Disc className="w-5 h-5 text-purple-500" />}
        label="Pneus"
        unit="tours"
        onUpdate={(val) => onUpdate("tires_laps_current", val)}
      />
      <EditableGauge
        current={profile.chain_hours_current || 0}
        max={profile.chain_hours_life || 5}
        icon={<LinkIcon className="w-5 h-5 text-blue-500" />}
        label="Chaîne"
        unit="h"
        onUpdate={(val) => onUpdate("chain_hours_current", val)}
      />
    </div>
  );
}
