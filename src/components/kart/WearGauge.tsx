import { ReactNode, useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";

interface WearGaugeProps {
  current?: number;
  max?: number;
  label: string;
  icon: ReactNode;
  unit: string;
  component: string;
  field: string;
  onUpdate: (field: string, value: number) => void;
  onAction: () => void;
  actionLabel: string;
}

export const WearGauge = ({
  current = 0,
  max = 100,
  label,
  icon,
  unit,
  field,
  onUpdate,
  onAction,
  actionLabel,
}: WearGaugeProps) => {
  const safeCurrent = current ?? 0;
  const safeMax = max ?? 100;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(safeCurrent.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  const percentage = Math.min(Math.max((safeCurrent / (safeMax || 1)) * 100, 0), 100);

  useEffect(() => {
    setEditValue(safeCurrent.toString());
  }, [safeCurrent]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleSave = () => {
    setIsEditing(false);
    const val = parseFloat(editValue);
    if (!isNaN(val)) {
      onUpdate(field, val);
    } else {
      setEditValue(safeCurrent.toString());
    }
  };

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
    <Card className="bg-card border border-border shadow-sm rounded-2xl relative overflow-hidden flex flex-col">
      <div className={cn("absolute inset-0 bg-gradient-to-t -z-10", getGradient())} />
      <CardContent className="p-6 flex flex-col items-center justify-between h-full space-y-4">
        <div className="flex items-center gap-2 w-full text-muted-foreground font-medium">
          {icon}
          <span>{label}</span>
        </div>

        <div className="relative flex items-center justify-center">
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
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            {isEditing ? (
              <Input
                ref={inputRef}
                type="number"
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={handleSave}
                onKeyDown={(e) => e.key === "Enter" && handleSave()}
                className="w-16 h-8 text-center px-1 font-bold bg-background/50 border-white/20"
              />
            ) : (
              <div className="group flex items-center gap-1 cursor-pointer" onClick={() => setIsEditing(true)}>
                <span className="text-2xl font-bold font-display leading-none">
                  {safeCurrent % 1 !== 0 ? safeCurrent.toFixed(1) : safeCurrent}
                </span>
                <Pencil className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            )}
            <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">
              / {safeMax} {unit}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          onClick={onAction}
          className="w-full bg-white/5 hover:bg-white/10 border-white/10"
        >
          {actionLabel}
        </Button>
      </CardContent>
    </Card>
  );
};
