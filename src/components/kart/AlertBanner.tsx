import { AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { KartProfile } from "@/lib/api";

interface AlertBannerProps {
  profile: KartProfile;
  recent_sessions?: any[];
}

export const AlertBanner = ({ profile, recent_sessions = [] }: AlertBannerProps) => {
  const alerts: { level: "critical" | "warning" | "ok"; message: string }[] = [];

  // Moteur
  if (profile.engine_hours_life && profile.engine_hours_current !== undefined) {
    const ratio = profile.engine_hours_current / profile.engine_hours_life;
    if (ratio >= 0.95) alerts.push({ level: "critical", message: "Moteur : Révision haut-moteur imminente." });
    else if (ratio >= 0.8) alerts.push({ level: "warning", message: "Moteur : Prévois une révision prochainement." });
  }

  // Pneus
  if (profile.tires_sessions_life && profile.tires_sessions_current !== undefined) {
    const ratio = profile.tires_sessions_current / profile.tires_sessions_life;
    if (ratio >= 0.95) alerts.push({ level: "critical", message: "Pneus : En fin de vie, prévoir un train neuf." });
    else if (ratio >= 0.8) alerts.push({ level: "warning", message: "Pneus : Baisse d'adhérence probable." });
  }

  // Freins
  if (profile.brakes_sessions_life && profile.brakes_sessions_current !== undefined) {
    const ratio = profile.brakes_sessions_current / profile.brakes_sessions_life;
    if (ratio >= 0.95) alerts.push({ level: "critical", message: "Freins : Contrôle les plaquettes urgemment." });
  }

  // Batterie (Profil global)
  if (profile.battery_voltage_last !== null && profile.battery_voltage_last < 11.5) {
    alerts.push({ level: "critical", message: "Batterie : Tension globale faible détectée (" + profile.battery_voltage_last + "V)." });
  }

  // Live Alerts basées sur la dernière session
  if (recent_sessions && recent_sessions.length > 0) {
    const lastSess = recent_sessions[0];
    if (lastSess.battery_voltage_min && lastSess.battery_voltage_min < 11.2) {
      alerts.push({ level: "critical", message: `Dernière session : Chute de tension critique à ${lastSess.battery_voltage_min}V. Recharge nécessaire.` });
    }
    if (lastSess.exhaust_temp_max && lastSess.exhaust_temp_max > 600) {
      alerts.push({ level: "warning", message: `Dernière session : Surchauffe échappement (EGT ${Math.round(lastSess.exhaust_temp_max)}°C > 600°C). Carburation trop pauvre ?` });
    }
  }

  if (alerts.length === 0) {
    return (
      <div className="glass-card bg-green-500/10 border-green-500/20 px-6 py-4 flex items-center gap-4 rounded-xl mb-6">
        <CheckCircle2 className="w-6 h-6 text-green-500" />
        <span className="text-green-500 font-medium">Tous les composants sont en bon état. Prêt pour la piste.</span>
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
            "glass-card px-6 py-4 flex items-center gap-4 rounded-xl",
            alert.level === "critical" ? "bg-red-500/10 border-red-500/20" : "bg-orange-500/10 border-orange-500/20"
          )}
        >
          {alert.level === "critical" ? (
            <AlertTriangle className="w-6 h-6 text-red-500 shrink-0 animate-pulse" />
          ) : (
            <Info className="w-6 h-6 text-orange-500 shrink-0" />
          )}
          <span className={cn(
            "font-medium",
            alert.level === "critical" ? "text-red-500" : "text-orange-500"
          )}>
            {alert.message}
          </span>
        </div>
      ))}
    </div>
  );
};
