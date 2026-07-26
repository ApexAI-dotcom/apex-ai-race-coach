import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PilotEvent, PilotEventType } from "@/lib/api";

/**
 * Vue mois — la lecture « saison » que ne donne pas une simple liste : on voit
 * d'un coup les semaines chargées, les enchaînements course/entraînement, et
 * les trous où l'on pourrait caler une séance.
 */

const DOT: Record<PilotEventType, string> = {
  race: "bg-red-500",
  training: "bg-sky-500",
  coaching: "bg-violet-500",
  deadline: "bg-amber-500",
  other: "bg-muted-foreground",
};

const WEEKDAYS = ["L", "M", "M", "J", "V", "S", "D"];

interface MonthGridProps {
  month: Date;
  events: PilotEvent[];
  selectedDay: string | null;
  onMonthChange: (d: Date) => void;
  onSelectDay: (isoDay: string | null) => void;
}

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

export function MonthGrid({
  month,
  events,
  selectedDay,
  onMonthChange,
  onSelectDay,
}: MonthGridProps) {
  const { cells, byDay } = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1);
    const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
    // Semaine commençant le lundi (getDay: 0 = dimanche)
    const lead = (first.getDay() + 6) % 7;
    const out: { date: Date; inMonth: boolean }[] = [];
    for (let i = lead; i > 0; i--) {
      out.push({ date: new Date(first.getFullYear(), first.getMonth(), 1 - i), inMonth: false });
    }
    for (let d = 1; d <= last.getDate(); d++) {
      out.push({ date: new Date(first.getFullYear(), first.getMonth(), d), inMonth: true });
    }
    while (out.length % 7 !== 0) {
      const prev = out[out.length - 1].date;
      out.push({
        date: new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1),
        inMonth: false,
      });
    }

    const map = new Map<string, PilotEvent[]>();
    for (const ev of events) {
      const k = dayKey(new Date(ev.starts_at));
      const arr = map.get(k);
      if (arr) arr.push(ev);
      else map.set(k, [ev]);
    }
    return { cells: out, byDay: map };
  }, [month, events]);

  const todayKey = dayKey(new Date());
  const monthLabel = month.toLocaleDateString("fr-FR", { month: "long", year: "numeric" });

  return (
    <div className="rounded-2xl border border-white/5 bg-secondary/30 p-3 md:p-4">
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 sm:h-8 sm:w-8"
          aria-label="Mois précédent"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-sm font-semibold text-foreground capitalize">{monthLabel}</h2>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 sm:h-8 sm:w-8"
          aria-label="Mois suivant"
          onClick={() => onMonthChange(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={i} className="text-center text-[10px] uppercase tracking-wider text-muted-foreground font-bold py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {cells.map(({ date, inMonth }, i) => {
          const k = dayKey(date);
          const dayEvents = byDay.get(k) ?? [];
          const isToday = k === todayKey;
          const isSelected = k === selectedDay;
          return (
            <button
              key={i}
              onClick={() => onSelectDay(isSelected ? null : k)}
              aria-label={`${date.getDate()} — ${dayEvents.length} événement(s)`}
              className={`relative aspect-square rounded-lg border p-1 flex flex-col items-center justify-start transition-all
                ${inMonth ? "bg-background/40" : "bg-transparent opacity-35"}
                ${isSelected ? "border-primary ring-1 ring-primary/50" : "border-white/5 hover:border-white/20"}
                ${dayEvents.length ? "cursor-pointer" : "cursor-default"}`}
            >
              <span
                className={`text-[11px] leading-5 ${
                  isToday
                    ? "font-bold text-primary"
                    : inMonth
                      ? "text-foreground/80"
                      : "text-muted-foreground"
                }`}
              >
                {date.getDate()}
              </span>
              <div className="flex flex-wrap gap-0.5 justify-center mt-0.5">
                {dayEvents.slice(0, 4).map((ev) => (
                  <span
                    key={ev.id}
                    title={ev.title}
                    className={`w-1.5 h-1.5 rounded-full ${DOT[ev.event_type] ?? DOT.other} ${
                      ev.completed ? "opacity-40" : ""
                    }`}
                  />
                ))}
                {dayEvents.length > 4 && (
                  <span className="text-[8px] text-muted-foreground leading-none">
                    +{dayEvents.length - 4}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
