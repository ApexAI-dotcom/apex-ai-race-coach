import { CSSProperties } from "react";
import { Activity, ArrowRight, Check, CircleCheck, CircleDot, Cpu, Disc3, FileText, Flame, LoaderCircle, Sliders, Wrench } from "lucide-react";

/**
 * Petits visuels de la page « Mon Kart » (hors connexion) : un par encart de
 * fonctionnalité, pour comprendre d'un coup d'œil sans lire. Mêmes libellés et
 * mêmes couleurs que la vraie page ; les valeurs sont des données d'exemple.
 *
 * L'animation se déclenche en CSS (`lp-*`) quand le cadre parent porte `lp-on`.
 */

const delay = (s: number) => ({ "--d": `${s}s` }) as CSSProperties;
const GREEN = "#22C55E";

/* ── 1. Suivi d'usure automatique : un import met les compteurs à jour ─── */

const WEAR = [
  { icon: Flame, color: "#FF4242", label: "Moteur", value: 99 },
  { icon: CircleDot, color: "#A855F7", label: "Pneus", value: 93 },
  { icon: LoaderCircle, color: "#F97316", label: "Freins", value: 99 },
  { icon: Wrench, color: "#3B82F6", label: "Chaîne", value: 99 },
] as const;

export function WearVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 px-3.5 sm:px-5">
      <div className="flex items-center gap-2">
        <span
          className="lp-pop flex items-center gap-2 rounded-lg border border-white/10 bg-[#141414] py-1 pl-1 pr-2.5"
          style={delay(0.1)}
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-[#00FF80] to-[#00B359]">
            <FileText className="h-3.5 w-3.5 text-black" />
          </span>
          <span className="text-[11px] font-semibold text-foreground">session.xrk</span>
        </span>
        <ArrowRight className="lp-rise h-3.5 w-3.5 shrink-0 text-muted-foreground" style={delay(0.55)} />
        <span
          className="lp-pop inline-flex items-center gap-1 whitespace-nowrap rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400"
          style={delay(0.8)}
        >
          <Check className="h-3 w-3" strokeWidth={3} /> Mis à jour
        </span>
      </div>

      <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
        {WEAR.map((w, i) => (
          <li key={w.label}>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-[9.5px] font-semibold uppercase tracking-wider text-muted-foreground">
                <w.icon className="h-3 w-3" style={{ color: w.color }} /> {w.label}
              </span>
              <span className="text-[11.5px] font-bold tabular-nums text-foreground">{w.value}%</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
              <div
                className="lp-grow h-full rounded-full"
                style={{ width: `${w.value}%`, background: w.color, ...delay(0.9 + i * 0.12) }}
              />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── 2. Stock de trains de pneus ─────────────────────────────────────── */

export function TireStockVisual() {
  return (
    <ul className="flex h-full flex-col justify-center gap-1.5 px-3.5 sm:px-5">
      <li
        className="lp-rise flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/[0.05] px-2.5 py-1.5"
        style={delay(0.1)}
      >
        <Disc3 className="h-3.5 w-3.5 shrink-0 text-primary" />
        <span className="text-[12px] font-semibold text-foreground">Train 1</span>
        <span className="inline-flex items-center gap-1 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
          <CircleCheck className="h-2.5 w-2.5" /> Monté
        </span>
        <span className="ml-auto flex items-center gap-2">
          <span className="hidden h-1 w-14 overflow-hidden rounded-full bg-white/10 sm:block">
            <span className="lp-grow block h-full rounded-full bg-primary" style={{ width: "8%", ...delay(0.6) }} />
          </span>
          <span className="text-[10px] tabular-nums text-muted-foreground">9/120 tours</span>
        </span>
      </li>

      <li
        className="lp-rise flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/30 px-2.5 py-1.5"
        style={delay(0.28)}
      >
        <Disc3 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-[12px] font-semibold text-foreground">Train 2</span>
        <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-1.5 py-0.5 text-[9px] font-bold text-emerald-400">
          Neuf
        </span>
        <span className="ml-auto text-[10px] tabular-nums text-muted-foreground">0/120 tours</span>
      </li>

      <li
        className="lp-rise flex items-center gap-2 rounded-xl border border-white/[0.08] bg-black/30 px-2.5 py-1.5"
        style={delay(0.46)}
      >
        <Disc3 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
        <span className="text-[12px] font-semibold text-foreground">Train pluie</span>
        <span className="rounded-full border border-sky-500/25 bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-bold text-sky-400">
          Pluie
        </span>
      </li>
    </ul>
  );
}

/* ── 3. Santé du kart : un score et des alertes avant la casse ───────── */

const ALERTS = [
  { color: "#F59E0B", text: "Révision moteur : bientôt" },
  { color: "#F59E0B", text: "Plaquettes à contrôler" },
  { color: GREEN, text: "Batterie : OK" },
] as const;

export function HealthAlertsVisual() {
  return (
    <div className="flex h-full items-center gap-3 px-3.5 sm:gap-4 sm:px-5">
      <div className="shrink-0 text-center">
        <div className="relative h-[72px] w-[72px] sm:h-[80px] sm:w-[80px]">
          <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90" aria-hidden="true">
            <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="7" />
            <circle
              className="lp-gauge"
              style={{ "--v": 92, "--d": "0.3s" } as CSSProperties}
              cx="50"
              cy="50"
              r="42"
              fill="none"
              stroke={GREEN}
              strokeWidth="7"
              strokeLinecap="round"
              pathLength={100}
            />
          </svg>
          <span className="absolute inset-0 flex items-center justify-center font-display text-[24px] font-bold leading-none text-emerald-400 sm:text-[28px]">
            92
          </span>
        </div>
        <p className="mt-1 text-[8.5px] font-semibold tracking-wider text-muted-foreground">SCORE D'ÉTAT</p>
      </div>

      <ul className="min-w-0 flex-1 space-y-1.5">
        {ALERTS.map((a, i) => (
          <li
            key={a.text}
            className="lp-rise flex items-center gap-2 rounded-lg bg-[#161616] px-2.5 py-1.5 text-[10.5px] text-foreground sm:text-[11px]"
            style={delay(0.6 + i * 0.18)}
          >
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ background: a.color, boxShadow: `0 0 8px ${a.color}` }}
            />
            <span className="truncate">{a.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ── 4. Garage complet : le matériel catalogué nourrit les réglages ──── */

const GEAR = [
  { icon: Wrench, label: "Châssis" },
  { icon: Cpu, label: "Moteur" },
  { icon: LoaderCircle, label: "Freins" },
  { icon: Activity, label: "Acquisition" },
] as const;

export function GarageVisual() {
  return (
    <div className="flex h-full flex-col justify-center gap-3 px-3.5 sm:px-5">
      <ul className="grid grid-cols-2 gap-1.5">
        {GEAR.map((g, i) => (
          <li
            key={g.label}
            className="lp-rise flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-[#141414] px-2 py-2 sm:gap-2 sm:px-2.5"
            style={delay(0.1 + i * 0.12)}
          >
            <g.icon className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate text-[11px] font-semibold text-foreground sm:text-[11.5px]">{g.label}</span>
            <Check className="ml-auto h-3 w-3 shrink-0 text-emerald-400 max-[400px]:hidden" strokeWidth={3} />
          </li>
        ))}
      </ul>
      <div
        className="lp-rise flex items-center justify-center gap-2 text-[10px] text-muted-foreground"
        style={delay(0.8)}
      >
        <span>Durées de vie, poids</span>
        <ArrowRight className="h-3 w-3" />
        <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 font-bold text-primary">
          <Sliders className="h-3 w-3" /> Réglages
        </span>
      </div>
    </div>
  );
}
