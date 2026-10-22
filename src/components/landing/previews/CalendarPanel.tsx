import { useMemo, useState } from "react";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import type { PilotEvent, PilotEventType } from "@/lib/api";

/**
 * « Calendrier » : la vue mois de la vraie page. Les événements sont des
 * exemples, calés sur la date du jour pour toujours rester à venir.
 */

const LEGEND: { type: PilotEventType; label: string; dot: string }[] = [
  { type: "race", label: "Course", dot: "bg-red-500" },
  { type: "training", label: "Entraînement", dot: "bg-sky-500" },
  { type: "coaching", label: "Coaching", dot: "bg-violet-500" },
  { type: "deadline", label: "Échéance d'inscription", dot: "bg-amber-500" },
];

/** Écart en jours entre le point de départ et chaque événement d'exemple. */
const OFFSETS: [number, PilotEventType][] = [
  [3, "training"],
  [7, "coaching"],
  [9, "deadline"],
  [12, "race"],
];

export default function CalendarPanel() {
  const { first, events } = useMemo(() => {
    const now = new Date();
    const lastOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    // Fin de mois : on montre le mois suivant, pour que les événements restent à venir.
    const next = now.getDate() > lastOfMonth - 12;
    const first = new Date(now.getFullYear(), now.getMonth() + (next ? 1 : 0), 1);
    const anchor = next ? 0 : now.getDate();
    const events: PilotEvent[] = OFFSETS.map(([offset, type]) => ({
      id: `demo-${type}`,
      title: LEGEND.find((l) => l.type === type)!.label,
      event_type: type,
      starts_at: new Date(first.getFullYear(), first.getMonth(), anchor + offset, 10).toISOString(),
      all_day: true,
      completed: false,
    }));
    return { first, events };
  }, []);

  const [month, setMonth] = useState(first);
  const [day, setDay] = useState<string | null>(null);

  return (
    <div className="mx-auto max-w-[520px]">
      <MonthGrid month={month} events={events} selectedDay={day} onMonthChange={setMonth} onSelectDay={setDay} />
      <ul className="mt-3 flex flex-wrap justify-center gap-x-5 gap-y-1.5 text-xs text-muted-foreground">
        {LEGEND.map((l) => (
          <li key={l.type} className="flex items-center gap-1.5">
            <span className={`h-2 w-2 rounded-full ${l.dot}`} aria-hidden="true" />
            {l.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
