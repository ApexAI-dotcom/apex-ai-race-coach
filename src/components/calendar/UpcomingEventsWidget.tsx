import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarDays, Flag, Timer, GraduationCap, AlertCircle, CircleDot, ArrowRight, Plus } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { listUpcomingEvents, type PilotEvent, type PilotEventType } from "@/lib/api";

/**
 * Prochaines échéances, affichées là où le pilote arrive.
 *
 * C'est ce qui différencie le calendrier d'un agenda générique : l'information
 * vient le chercher au lieu d'attendre qu'il pense à ouvrir une page.
 */

const ICONS: Record<PilotEventType, React.ElementType> = {
  race: Flag,
  training: Timer,
  coaching: GraduationCap,
  deadline: AlertCircle,
  other: CircleDot,
};

const COLORS: Record<PilotEventType, string> = {
  race: "text-red-400 border-red-500/40 bg-red-500/10",
  training: "text-sky-400 border-sky-500/40 bg-sky-500/10",
  coaching: "text-violet-400 border-violet-500/40 bg-violet-500/10",
  deadline: "text-amber-400 border-amber-500/40 bg-amber-500/10",
  other: "text-muted-foreground border-white/15 bg-white/5",
};

function whenLabel(ev: PilotEvent): string {
  const d = new Date(ev.starts_at);
  const days = ev.days_until ?? Math.floor((d.getTime() - Date.now()) / 86_400_000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "demain";
  if (days < 7) return `dans ${days} jours`;
  return d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
}

export function UpcomingEventsWidget() {
  const { session } = useAuth();
  const token = session?.access_token;
  const [events, setEvents] = useState<PilotEvent[] | null>(null);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;
    listUpcomingEvents(token, 60)
      .then((e) => !cancelled && setEvents(e))
      .catch(() => !cancelled && setEvents([]));
    return () => {
      cancelled = true;
    };
  }, [token]);

  if (events === null) return null; // chargement : on n'affiche pas de squelette pour rien

  // Calendrier vide : une invitation discrète, pas un bloc qui prend la place
  // des analyses.
  if (events.length === 0) {
    return (
      <Card className="bg-secondary/30 border-white/5 mb-6">
        <CardContent className="p-4 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl border border-white/10 bg-white/5 flex items-center justify-center shrink-0">
              <CalendarDays className="w-4 h-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Prépare ta saison</p>
              <p className="text-xs text-muted-foreground">
                Ajoute ta prochaine course ou ta date limite d'inscription.
              </p>
            </div>
          </div>
          <Button asChild size="sm" variant="outline" className="gap-1.5">
            <Link to="/calendrier">
              <Plus className="w-3.5 h-3.5" />
              Calendrier
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-secondary/30 border-white/5 mb-6">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-bold flex items-center gap-1.5">
            <CalendarDays className="w-3.5 h-3.5" />
            Prochaines échéances
          </h2>
          <Link
            to="/calendrier"
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            Tout voir <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {events.slice(0, 3).map((ev) => {
            const Icon = ICONS[ev.event_type] ?? CircleDot;
            return (
              <Link
                key={ev.id}
                to="/calendrier"
                className="flex items-center gap-2.5 rounded-lg border border-white/5 bg-background/40 p-2.5 hover:border-primary/30 transition-colors"
              >
                <div
                  className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 ${COLORS[ev.event_type] ?? COLORS.other}`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{ev.title}</p>
                  <p className="text-[11px] text-muted-foreground truncate">
                    {whenLabel(ev)}
                    {ev.circuit_name ? ` · ${ev.circuit_name}` : ""}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
