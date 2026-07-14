import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { KartProfile } from "@/lib/api";
import { getAlertThresholds } from "@/lib/kart-recommendations";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface AlertBannerProps {
  profile: KartProfile;
  recent_sessions?: any[];
  onUpdate?: (field: keyof KartProfile, value: any) => void;
}

export const AlertBanner = ({ profile, recent_sessions = [], onUpdate }: AlertBannerProps) => {
  const { warnLimit, critLimit, maxEgt } = getAlertThresholds(profile.driving_profile);
  const alerts: { id: string; level: "critical" | "warning" | "ok"; message: string }[] = [];
  const ignoredAlerts = profile.setup_json?.ignored_alerts || [];

  const handleIgnore = (alertId: string) => {
    if (!onUpdate) return;
    const newIgnored = [...ignoredAlerts, alertId];
    onUpdate("setup_json", {
      ...(profile.setup_json || {}),
      ignored_alerts: newIgnored
    });
  };

  const handleUnignore = (alertId: string) => {
    if (!onUpdate) return;
    const newIgnored = ignoredAlerts.filter((id: string) => id !== alertId);
    onUpdate("setup_json", {
      ...(profile.setup_json || {}),
      ignored_alerts: newIgnored
    });
  };

  // Moteur
  if (profile.engine_hours_life && profile.engine_hours_current !== undefined && !ignoredAlerts.includes("engine_wear")) {
    const ratio = profile.engine_hours_current / profile.engine_hours_life;
    if (ratio >= critLimit)
      alerts.push({ id: "engine_wear", level: "critical", message: "Moteur : Révision haut-moteur imminente." });
    else if (ratio >= warnLimit)
      alerts.push({ id: "engine_wear", level: "warning", message: "Moteur : Prévois une révision prochainement." });
  }

  // Pneus
  if (profile.tires_laps_life && profile.tires_laps_current !== undefined && !ignoredAlerts.includes("tires_wear")) {
    const ratio = profile.tires_laps_current / profile.tires_laps_life;
    if (ratio >= critLimit)
      alerts.push({ id: "tires_wear", level: "critical", message: "Pneus : En fin de vie, prévoir un train neuf." });
    else if (ratio >= warnLimit)
      alerts.push({ id: "tires_wear", level: "warning", message: "Pneus : Baisse d'adhérence probable." });
  }

  // Freins
  if (profile.brakes_sessions_life && profile.brakes_sessions_current !== undefined && !ignoredAlerts.includes("brakes_wear")) {
    const ratio = profile.brakes_sessions_current / profile.brakes_sessions_life;
    if (ratio >= critLimit)
      alerts.push({ id: "brakes_wear", level: "critical", message: "Freins : Contrôle et remplacement des plaquettes requis (limite de tours atteinte)." });
  }

  // Chaîne
  if (profile.chain_hours_life && profile.chain_hours_current !== undefined && !ignoredAlerts.includes("chain_wear")) {
    const ratio = profile.chain_hours_current / profile.chain_hours_life;
    if (ratio >= critLimit)
      alerts.push({ id: "chain_wear", level: "critical", message: "Chaîne : Usure critique détectée, remplacez la chaîne." });
    else if (ratio >= warnLimit)
      alerts.push({ id: "chain_wear", level: "warning", message: "Chaîne : Graissage et vérification de la tension recommandés." });
  }

  // Batterie (Profil global)
  if (profile.battery_voltage_last !== null && profile.battery_voltage_last < 11.5 && !ignoredAlerts.includes("battery_low")) {
    alerts.push({
      id: "battery_low",
      level: "critical",
      message:
        "Batterie : Tension globale faible détectée (" + profile.battery_voltage_last + "V).",
    });
  }

  // Live Alerts basées sur la dernière session
  if (recent_sessions && recent_sessions.length > 0) {
    const lastSess = recent_sessions[0];
    if (lastSess.battery_voltage_min && lastSess.battery_voltage_min < 11.2 && !ignoredAlerts.includes("battery_chute")) {
      alerts.push({
        id: "battery_chute",
        level: "critical",
        message: `Dernière session : Chute de tension critique à ${lastSess.battery_voltage_min}V. Recharge nécessaire.`,
      });
    }
    if (lastSess.exhaust_temp_max && lastSess.exhaust_temp_max > maxEgt && !ignoredAlerts.includes("exhaust_surchauffe")) {
      alerts.push({
        id: "exhaust_surchauffe",
        level: "warning",
        message: `Dernière session : Surchauffe échappement (EGT ${Math.round(lastSess.exhaust_temp_max)}°C > ${maxEgt}°C). Carburation trop pauvre ?`,
      });
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="flex flex-col gap-2 mb-6">
        <div className="bg-green-500/10 border border-green-500/20 px-6 py-4 flex items-center gap-4 rounded-xl shadow-sm">
          <CheckCircle2 className="w-6 h-6 text-green-500" />
          <span className="text-green-500 font-medium">
            Tous les composants sont en bon état. Prêt pour la piste.
          </span>
        </div>
        
        {ignoredAlerts.length > 0 && onUpdate && (
          <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground mt-2 bg-muted/30 p-3 rounded-lg border border-border">
            <span className="font-semibold">Masqués :</span>
            {ignoredAlerts.map((alertId: string) => {
              let label = alertId;
              if (alertId === "engine_wear") label = "Usure Moteur";
              if (alertId === "tires_wear") label = "Usure Pneus";
              if (alertId === "brakes_wear") label = "Usure Freins";
              if (alertId === "chain_wear") label = "Usure Chaîne";
              if (alertId === "battery_low") label = "Tension Batterie";
              if (alertId === "battery_chute") label = "Baisse Tension";
              if (alertId === "exhaust_surchauffe") label = "Surchauffe";
              return (
                <Badge
                  key={alertId}
                  variant="outline"
                  className="bg-background border-border text-muted-foreground py-0.5 px-2 flex items-center gap-1 cursor-pointer hover:bg-muted hover:text-foreground transition-colors"
                  onClick={() => handleUnignore(alertId)}
                >
                  {label} <span className="text-[10px] text-primary">×</span>
                </Badge>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Trier pour afficher le plus critique en premier
  alerts.sort((a, b) => (a.level === "critical" ? -1 : 1));

  return (
    <div className="flex flex-col gap-2 mb-6">
      {alerts.map((alert, i) => (
        <div
          key={i}
          className={cn(
            "px-6 py-4 flex items-center justify-between gap-4 rounded-xl border shadow-sm",
            alert.level === "critical"
              ? "bg-red-500/10 border-red-500/20"
              : "bg-orange-500/10 border-orange-500/20"
          )}
        >
          <div className="flex items-center gap-4">
            {alert.level === "critical" ? (
              <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 animate-pulse" />
            ) : (
              <Info className="w-6 h-6 text-orange-500 shrink-0" />
            )}
            <span
              className={cn(
                "font-medium",
                alert.level === "critical" ? "text-red-500" : "text-orange-500"
              )}
            >
              {alert.message}
            </span>
          </div>
          {onUpdate && (
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "text-xs px-2 h-7 rounded-md hover:bg-white/10 shrink-0",
                alert.level === "critical" ? "text-red-400 hover:text-red-300" : "text-orange-400 hover:text-orange-300"
              )}
              onClick={() => handleIgnore(alert.id)}
            >
              Ignorer
            </Button>
          )}
        </div>
      ))}

      {ignoredAlerts.length > 0 && onUpdate && (
        <div className="flex flex-wrap gap-2 items-center text-xs text-muted-foreground mt-2 bg-muted/30 p-3 rounded-lg border border-border">
          <span className="font-semibold">Masqués :</span>
          {ignoredAlerts.map((alertId: string) => {
            let label = alertId;
            if (alertId === "engine_wear") label = "Usure Moteur";
            if (alertId === "tires_wear") label = "Usure Pneus";
            if (alertId === "brakes_wear") label = "Usure Freins";
            if (alertId === "chain_wear") label = "Usure Chaîne";
            if (alertId === "battery_low") label = "Tension Batterie";
            if (alertId === "battery_chute") label = "Baisse Tension";
            if (alertId === "exhaust_surchauffe") label = "Surchauffe";
            return (
              <Badge
                key={alertId}
                variant="outline"
                className="bg-background border-border text-muted-foreground py-0.5 px-2 flex items-center gap-1 cursor-pointer hover:bg-muted hover:text-foreground transition-colors"
                onClick={() => handleUnignore(alertId)}
              >
                {label} <span className="text-[10px] text-primary">×</span>
              </Badge>
            );
          })}
        </div>
      )}

      <Accordion
        type="single"
        collapsible
        className="w-full mt-4 bg-muted border border-border rounded-xl px-4"
      >
        <AccordionItem value="learn-more" className="border-b-0">
          <AccordionTrigger className="text-sm font-medium hover:no-underline text-muted-foreground hover:text-foreground transition-colors">
            Comprendre les métriques et limites (En savoir plus)
          </AccordionTrigger>
          <AccordionContent className="text-xs text-muted-foreground space-y-3 pb-4">
            <p>
              <strong className="text-foreground">Moteur :</strong> L'usure dépend de ton
              utilisation (heures vs sessions). Un profil "Performance" repousse les alertes pour
              privilégier la recherche de chronos, tandis qu'un profil "Longévité" anticipe les
              alertes pour préserver ta mécanique.
            </p>
            <p>
              <strong className="text-foreground">Pneus & Freins :</strong> Calculés en nombre de
              sessions. Une baisse d'adhérence ou de mordan est attendue au-delà de 80% d'usure
              standard.
            </p>
            <p>
              <strong className="text-foreground">Batterie & Températures :</strong> Ces alertes
              "Live" se basent sur ta toute dernière session importée. Surveille particulièrement la
              température d'échappement (EGT) qui indique si ta carburation est trop pauvre
              (surchauffe, risque de serrage) ou trop riche.
            </p>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};
