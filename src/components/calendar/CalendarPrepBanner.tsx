import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Wrench, Sparkles } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { getTireSets, type PilotEvent } from "@/lib/api";

/**
 * Préparation de la prochaine échéance.
 *
 * C'est ce qui distingue ce calendrier d'un agenda générique : il ne se contente
 * pas d'afficher une date, il croise cette date avec l'état réel du matériel du
 * pilote. Une course dans 5 jours avec des pneus en fin de vie, c'est une
 * information qu'aucun agenda ne saura donner — et qu'un pilote n'a pas envie
 * de découvrir la veille.
 */

interface Alert {
  icon: React.ElementType;
  tone: "warning" | "info";
  text: string;
  action?: { label: string; to: string };
}

interface Props {
  events: PilotEvent[];
}

export function CalendarPrepBanner({ events }: Props) {
  const { session } = useAuth();
  const token = session?.access_token;
  const [alerts, setAlerts] = useState<Alert[]>([]);

  // Prochaine échéance « en piste » (course, entraînement, coaching).
  const nextOnTrack = events
    .filter(
      (e) =>
        !e.completed &&
        new Date(e.starts_at).getTime() > Date.now() &&
        ["race", "training", "coaching"].includes(e.event_type)
    )
    .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at))[0];

  useEffect(() => {
    if (!token || !nextOnTrack) {
      setAlerts([]);
      return;
    }
    let cancelled = false;
    const days = Math.max(
      0,
      Math.ceil((new Date(nextOnTrack.starts_at).getTime() - Date.now()) / 86_400_000)
    );
    // On ne dérange le pilote que quand l'échéance est proche : au-delà d'un
    // mois, une alerte matériel n'est pas encore actionnable.
    if (days > 30) {
      setAlerts([]);
      return;
    }

    (async () => {
      const found: Alert[] = [];
      try {
        const res: any = await getTireSets(token);
        const sets: any[] = Array.isArray(res) ? res : (res?.tire_sets ?? res?.sets ?? []);
        const active = sets.filter((s) => s?.active !== false);
        const mounted = active.find((s) => s?.is_mounted);
        const lifeLeft = (s: any) =>
          Math.max(0, Number(s?.laps_life ?? 250) - Number(s?.laps_current ?? 0));

        if (mounted && lifeLeft(mounted) <= 30) {
          found.push({
            icon: Wrench,
            tone: "warning",
            text:
              lifeLeft(mounted) <= 0
                ? `Le train monté a dépassé sa durée de vie — à changer avant « ${nextOnTrack.title} ».`
                : `Le train monté n'a plus que ${lifeLeft(mounted)} tours de vie avant « ${nextOnTrack.title} ».`,
            action: { label: "Voir Mon Kart", to: "/mon-kart" },
          });
        }
        if (nextOnTrack.event_type === "race" && active.length > 0) {
          const hasRain = active.some((s) => s?.is_rain);
          if (!hasRain) {
            found.push({
              icon: AlertTriangle,
              tone: "info",
              text: "Aucun train pluie déclaré dans ton stock pour cette course.",
              action: { label: "Déclarer un train", to: "/mon-kart" },
            });
          }
        }
      } catch {
        /* pas de stock déclaré : on n'invente rien */
      }

      if (nextOnTrack.circuit_name) {
        found.push({
          icon: Sparkles,
          tone: "info",
          text: `Prépare tes réglages pour ${nextOnTrack.circuit_name} avant « ${nextOnTrack.title} ».`,
          action: { label: "Ouvrir Réglages", to: "/setup" },
        });
      }

      if (!cancelled) setAlerts(found.slice(0, 3));
    })();

    return () => {
      cancelled = true;
    };
  }, [token, nextOnTrack?.id, nextOnTrack?.starts_at]);

  if (!nextOnTrack || alerts.length === 0) return null;

  const days = Math.max(
    0,
    Math.ceil((new Date(nextOnTrack.starts_at).getTime() - Date.now()) / 86_400_000)
  );

  return (
    <div className="rounded-2xl border border-primary/25 bg-primary/[0.06] p-4 mb-5">
      <p className="text-[11px] font-bold uppercase tracking-wider text-primary mb-2">
        Préparation · {nextOnTrack.title}
        {days === 0 ? " · aujourd'hui" : days === 1 ? " · demain" : ` · dans ${days} jours`}
      </p>
      <div className="space-y-2">
        {alerts.map((a, i) => {
          const Icon = a.icon;
          return (
            <div key={i} className="flex items-start gap-2.5 text-sm">
              <Icon
                className={`w-4 h-4 mt-0.5 shrink-0 ${
                  a.tone === "warning" ? "text-amber-400" : "text-primary"
                }`}
              />
              <span className="text-foreground/90 flex-1">{a.text}</span>
              {a.action && (
                <Link
                  to={a.action.to}
                  className="text-xs text-primary hover:underline whitespace-nowrap flex items-center gap-1 shrink-0"
                >
                  {a.action.label}
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
