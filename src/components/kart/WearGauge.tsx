import { ReactNode, useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface WearGaugeProps {
  current?: number;
  max?: number;
  label: string;
  icon: ReactNode;
  unit: string;
  component: string;
  field: string;
  /** Champ de l'échéance (durée avant entretien) : réglable par le pilote. */
  lifeField?: string;
  /** Petite aide sous l'échéance (ex. ce que dit le manuel). */
  lifeHelp?: string | null;
  onUpdate: (field: string, value: number) => void;
  onAction: () => void;
  actionLabel: string;
  /** Pièce ou train suivi par la jauge (ex. « Train « Slicks B » »). */
  sublabel?: string | null;
  /** Ce qui reste avant l'entretien, dans l'unité du composant. */
  hint?: string | null;
  /** Aperçu (compte sans abonnement) : jauge visible, actions verrouillées. */
  readOnly?: boolean;
  /** Seuils (0-1) du profil de pilotage : mêmes couleurs que la liste « À faire ». */
  warnAt?: number;
  critAt?: number;
}

export const WearGauge = ({
  current = 0,
  max = 100,
  label,
  icon,
  unit,
  field,
  lifeField,
  lifeHelp,
  onUpdate,
  onAction,
  actionLabel,
  sublabel,
  hint,
  readOnly = false,
  warnAt = 0.8,
  critAt = 0.95,
}: WearGaugeProps) => {
  const safeCurrent = current ?? 0;
  const safeMax = max ?? 100;
  const [isEditing, setIsEditing] = useState(false);
  const fmt = (v: number) => String(Math.round(v * 10) / 10).replace(".", ",");
  const [curValue, setCurValue] = useState(fmt(safeCurrent));
  const [lifeValue, setLifeValue] = useState(fmt(safeMax));

  const percentage = Math.min(Math.max((safeCurrent / (safeMax || 1)) * 100, 0), 100);

  useEffect(() => {
    if (!isEditing) {
      setCurValue(fmt(safeCurrent));
      setLifeValue(fmt(safeMax));
    }
  }, [safeCurrent, safeMax, isEditing]);

  const parse = (v: string) => parseFloat(v.replace(",", "."));
  const handleSave = () => {
    setIsEditing(false);
    const c = parse(curValue);
    const l = parse(lifeValue);
    if (!isNaN(c) && c >= 0 && Math.abs(c - safeCurrent) > 1e-6) onUpdate(field, c);
    if (lifeField && !isNaN(l) && l > 0 && Math.abs(l - safeMax) > 1e-6) onUpdate(lifeField, l);
  };

  const getColor = () => {
    if (percentage >= critAt * 100) return "text-red-500 stroke-red-500";
    if (percentage >= warnAt * 100) return "text-orange-500 stroke-orange-500";
    return "text-green-500 stroke-green-500";
  };

  const getGradient = () => {
    if (percentage >= critAt * 100) return "from-red-500/20 to-transparent";
    if (percentage >= warnAt * 100) return "from-orange-500/20 to-transparent";
    return "from-green-500/20 to-transparent";
  };

  const radius = 40;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Card className="bg-card border border-border shadow-sm rounded-2xl relative overflow-hidden flex flex-col">
      <div className={cn("absolute inset-0 bg-gradient-to-t -z-10", getGradient())} />
      <CardContent className="p-6 flex flex-col items-center justify-between h-full space-y-4">
        <div className="flex w-full items-start justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2 font-medium text-muted-foreground">
            {icon}
            <span>{label}</span>
          </div>
          {sublabel && <span className="min-w-0 truncate pt-0.5 text-right text-[11px] text-muted-foreground/80">{sublabel}</span>}
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
            <button
              type="button"
              className={cn("group flex items-center gap-1", readOnly && "cursor-default")}
              onClick={() => !readOnly && setIsEditing(true)}
              disabled={readOnly}
              aria-label={`Régler la jauge ${label}`}
            >
              <span className="text-2xl font-bold font-display leading-none">{fmt(safeCurrent)}</span>
              {!readOnly && <Pencil className="w-3 h-3 text-muted-foreground opacity-100 can-hover:opacity-0 can-hover:group-hover:opacity-100 transition-opacity" />}
            </button>
            <span className="text-[10px] text-muted-foreground mt-1 whitespace-nowrap">
              / {fmt(safeMax)} {unit}
            </span>
          </div>
        </div>

        {hint && (
          <p className={cn("-mt-1 text-xs font-medium tabular-nums", percentage >= critAt * 100 ? "text-red-500" : percentage >= warnAt * 100 ? "text-orange-500" : "text-muted-foreground")}>
            {hint}
          </p>
        )}

        <div className="flex gap-2 w-full mt-auto pt-2">
          <Button
            variant="outline"
            onClick={onAction}
            className="flex-1 bg-white/5 hover:bg-white/10 border-white/10 text-xs whitespace-normal h-auto py-2"
          >
            {actionLabel}
          </Button>
          <Button
            variant="outline"
            onClick={() => !readOnly && setIsEditing(true)}
            disabled={readOnly}
            title="Régler le compteur et l'échéance"
            aria-label={`Régler la jauge ${label}`}
            className="w-10 shrink-0 px-0 bg-white/5 hover:bg-white/10 border-white/10"
          >
            <Pencil className="w-4 h-4 text-muted-foreground" />
          </Button>
        </div>
      </CardContent>

      <Dialog open={isEditing} onOpenChange={(o) => !o && setIsEditing(false)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Régler la jauge {label.toLowerCase()}</DialogTitle>
            <DialogDescription>{sublabel || "Corrige le compteur ou fixe ta propre échéance."}</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              handleSave();
            }}
          >
            <label className="block space-y-1.5">
              <span className="text-sm font-medium">Compteur actuel ({unit})</span>
              <Input inputMode="decimal" value={curValue} onChange={(e) => setCurValue(e.target.value)} className="h-11" />
            </label>
            {lifeField && (
              <label className="block space-y-1.5">
                <span className="text-sm font-medium">Échéance : entretien à ({unit})</span>
                <Input inputMode="decimal" value={lifeValue} onChange={(e) => setLifeValue(e.target.value)} className="h-11" />
                <span className="block text-xs text-muted-foreground">
                  {lifeHelp || "Celle de ton manuel ou de ton préparateur : la jauge et les alertes suivent ce chiffre."}
                </span>
              </label>
            )}
            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="ghost" onClick={() => setIsEditing(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
