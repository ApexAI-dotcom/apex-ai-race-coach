import type { WeekBar } from "./usePaddockData";

/** Tours roulés par semaine sur les 12 dernières semaines ; la semaine en cours à droite. */
export function WeekStrip({ weeks }: { weeks: WeekBar[] }) {
  const max = Math.max(1, ...weeks.map((w) => w.laps));
  const label = (t: number) => new Date(t).toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
  return (
    <figure className="w-full">
      <div className="flex h-20 items-end gap-1.5" role="img" aria-label="Tours roulés par semaine, 12 dernières semaines">
        {weeks.map((w, i) => {
          const current = i === weeks.length - 1;
          const h = w.laps ? Math.max(8, (w.laps / max) * 100) : 0;
          return (
            <div
              key={w.start}
              className="relative flex h-full flex-1 items-end"
              title={`Semaine du ${label(w.start)} : ${w.laps} tours, ${w.sessions} séance${w.sessions > 1 ? "s" : ""}`}
            >
              <div className="absolute inset-x-0 bottom-0 h-px bg-border" />
              {w.laps > 0 && (
                <div
                  className={`relative w-full rounded-t-[3px] ${current ? "bg-primary" : "bg-foreground/30"}`}
                  style={{ height: `${h}%` }}
                />
              )}
            </div>
          );
        })}
      </div>
      <figcaption className="mt-2 flex justify-between text-xs text-muted-foreground">
        <span>{label(weeks[0].start)}</span>
        <span>Tours par semaine</span>
        <span>Cette semaine</span>
      </figcaption>
    </figure>
  );
}
