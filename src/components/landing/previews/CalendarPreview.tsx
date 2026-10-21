import { CSSProperties, useMemo } from "react";
import { ChevronLeft, ChevronRight, LayoutGrid, List, Plus, Sparkles, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * « Calendrier » : la vue mois de l'app et sa bannière de préparation, qui
 * croise la prochaine échéance avec l'état du matériel. Mêmes couleurs que
 * l'app (course, entraînement, coaching, échéance). Les événements sont des
 * exemples, calés sur la date du jour pour toujours rester à venir.
 */

const TYPES = {
  race: { label: "Course", dot: "bg-red-500", text: "text-red-400" },
  training: { label: "Entraînement", dot: "bg-sky-500", text: "text-sky-400" },
  coaching: { label: "Coaching", dot: "bg-violet-500", text: "text-violet-400" },
  deadline: { label: "Échéance d'inscription", dot: "bg-amber-500", text: "text-amber-400" },
} as const;

type EventType = keyof typeof TYPES;

/** Écart (en jours) entre le point de départ et chaque événement d'exemple. */
const DEMO_EVENTS: { offset: number; type: EventType; delay: number }[] = [
  { offset: 3, type: "training", delay: 0.7 },
  { offset: 7, type: "coaching", delay: 1.0 },
  { offset: 9, type: "deadline", delay: 1.3 },
  { offset: 12, type: "race", delay: 1.6 },
];

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function CalendarPreview({ play }: { play: boolean }) {
  const { label, cells, today, events, daysToRace } = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const lastOfThis = new Date(y, now.getMonth() + 1, 0).getDate();
    // Fin de mois : on montre le mois suivant, pour que les événements restent à venir.
    const showNext = now.getDate() > lastOfThis - 12;
    const first = new Date(y, now.getMonth() + (showNext ? 1 : 0), 1);
    const anchor = showNext ? 0 : now.getDate();
    const last = new Date(first.getFullYear(), first.getMonth() + 1, 0).getDate();
    const lead = (first.getDay() + 6) % 7; // semaine qui commence le lundi
    const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: last }, (_, i) => i + 1)];
    while (cells.length % 7) cells.push(null);
    const events = DEMO_EVENTS.map((e) => {
      const date = new Date(first.getFullYear(), first.getMonth(), anchor + e.offset);
      return {
        ...e,
        day: date.getDate(),
        date,
        when: cap(date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" })),
      };
    });
    const race = events.find((e) => e.type === "race")!;
    return {
      label: cap(first.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })),
      cells,
      today: showNext ? -1 : now.getDate(),
      events,
      daysToRace: Math.max(1, Math.ceil((race.date.getTime() - now.getTime()) / 86_400_000)),
    };
  }, []);

  const byDay = new Map(events.map((e) => [e.day, e]));
  const delay = (d: number) => ({ "--d": `${d}s` }) as CSSProperties;

  return (
    <div className={cn("space-y-3", play && "lp-on")}>
      {/* Préparation de la prochaine course */}
      <div className="lp-rise rounded-2xl border border-primary/25 bg-primary/[0.06] p-3" style={delay(0.2)}>
        <p className="text-[10px] font-bold uppercase tracking-wider text-primary">
          Préparation · Course · dans {daysToRace} jour{daysToRace > 1 ? "s" : ""}
        </p>
        <ul className="mt-2 space-y-1.5 text-[11.5px] leading-snug text-foreground/90">
          <li className="flex items-start gap-2">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" aria-hidden="true" />
            <span>Prépare tes réglages pour Adria Karting Raceway avant « Course ».</span>
          </li>
          <li className="flex items-start gap-2">
            <Wrench className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-400" aria-hidden="true" />
            <span>Aucun train pluie déclaré dans ton stock pour cette course.</span>
          </li>
        </ul>
      </div>

      {/* Barre d'outils */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex rounded-lg border border-white/10 bg-white/[0.03] p-0.5 text-[10.5px] font-semibold">
          <span className="inline-flex items-center gap-1 rounded-md bg-white/10 px-2 py-1 text-foreground">
            <LayoutGrid className="h-3 w-3" aria-hidden="true" /> Mois
          </span>
          <span className="inline-flex items-center gap-1 px-2 py-1 text-muted-foreground">
            <List className="h-3 w-3" aria-hidden="true" /> Liste
          </span>
        </div>
        <span className="inline-flex items-center gap-1 rounded-lg gradient-primary px-2.5 py-1.5 text-[10.5px] font-semibold text-primary-foreground">
          <Plus className="h-3 w-3" aria-hidden="true" /> Ajouter
        </span>
      </div>

      {/* Mois */}
      <div className="rounded-2xl border border-white/[0.07] bg-[#0f0f10] p-3">
        <div className="mb-2 flex items-center justify-between">
          <ChevronLeft className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          <p className="text-[13px] font-bold text-foreground">{label}</p>
          <ChevronRight className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((d, i) => (
            <span key={i} className="pb-0.5 text-[9.5px] font-semibold text-muted-foreground">
              {d}
            </span>
          ))}
          {cells.map((d, i) => {
            const ev = d ? byDay.get(d) : undefined;
            return (
              <div
                key={i}
                className={cn(
                  "relative flex h-8 flex-col items-center justify-center rounded-md text-[11px] tabular-nums",
                  d ? "bg-white/[0.03] text-foreground/90" : "",
                  d === today && "bg-primary/10 font-bold text-primary ring-1 ring-primary/70"
                )}
              >
                {d}
                {ev && (
                  <i
                    className={cn("lp-pop absolute bottom-1 h-1.5 w-1.5 rounded-full", TYPES[ev.type].dot)}
                    style={delay(ev.delay)}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Les prochains rendez-vous */}
      <ul className="space-y-1.5">
        {events.map((e) => (
          <li
            key={e.type}
            className="lp-rise flex items-center gap-2.5 rounded-xl border border-white/[0.07] bg-[#0f0f10] px-3 py-1.5 text-[11.5px]"
            style={delay(e.delay + 0.1)}
          >
            <i className={cn("h-2 w-2 shrink-0 rounded-full", TYPES[e.type].dot)} />
            <span className={cn("font-semibold", TYPES[e.type].text)}>{TYPES[e.type].label}</span>
            <span className="ml-auto text-muted-foreground">{e.when}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
