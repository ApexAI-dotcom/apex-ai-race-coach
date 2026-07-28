/**
 * Panneau « Freinages » — le détail chiffré, virage par virage.
 *
 * Tout vient de `src/analysis/braking.py`, la même source que les bandes et les
 * repères de la carte et que les conseils de coaching. Aucune valeur n'est
 * recalculée ici : ce composant met en forme, il ne décide de rien.
 *
 * Chaque chiffre répond à une question précise que se pose un pilote :
 *   • Où je déclenche ?      → distance jusqu'à l'apex
 *   • Est-ce que j'appuie ?  → décélération de crête, comparée à sa propre capacité
 *   • Est-ce que je traîne ? → temps mort entre le relâcher et la remise des gaz
 *   • Est-ce que je répète ? → dispersion du point d'un tour à l'autre
 */
import { useMemo, useState } from "react";
import { ChevronDown } from "lucide-react";
import type { BrakingAnalysis, BrakingCorner } from "@/types/analysis";
import { BRAKING_VERDICT_COLORS, BRAKING_VERDICT_LABELS } from "./TrackMapPro/trackMapColors";

interface BrakingPanelProps {
  braking?: BrakingAnalysis | null;
  /**
   * Temps perdu MESURÉ par virage, tel qu'affiché sur la carte, dans les
   * conseils et dans le PDF. Le panneau n'invente plus son propre chiffre :
   * il annonçait 0,77 s là où le reste du rapport donnait 0,00 s.
   */
  cornerLosses?: Record<number, number>;
  /**
   * D'où vient la perte quand le freinage est déjà au meilleur niveau du
   * pilote : sans cette phrase, « Freinage à ton meilleur » affiché à côté de
   * « +0,27 s » se lit comme une contradiction.
   */
  cornerHints?: Record<number, string>;
  /** Remonte au virage sélectionné sur la carte du circuit. */
  onFocusCorner?: (cornerId: number) => void;
}

/** Régularité : les paliers viennent de la pratique, pas d'un calcul. */
function consistencyLabel(spread: number): { text: string; tone: string } {
  if (spread <= 3) return { text: "Très régulier", tone: "text-emerald-400" };
  if (spread <= 6) return { text: "Correct", tone: "text-amber-400" };
  return { text: "Instable", tone: "text-rose-400" };
}

function Metric({
  label,
  value,
  unit,
  hint,
  tone = "text-foreground",
}: {
  label: string;
  value: string;
  unit?: string;
  hint: string;
  tone?: string;
}) {
  return (
    <div title={hint} className="min-w-0">
      <div className="text-[10px] uppercase tracking-wide text-muted-foreground truncate">{label}</div>
      <div className={`text-sm font-semibold tabular-nums ${tone}`}>
        {value}
        {unit ? <span className="text-[10px] font-normal text-muted-foreground ml-0.5">{unit}</span> : null}
      </div>
    </div>
  );
}

function CornerRow({
  c,
  capability,
  measuredLoss,
  hint,
  onFocusCorner,
}: {
  c: BrakingCorner;
  capability: number;
  /** Perte MESURÉE du virage — même chiffre que la carte et les conseils. */
  measuredLoss: number;
  /** Cause dominante de cette perte, quand elle n'est pas au freinage. */
  hint?: string;
  onFocusCorner?: (id: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const color = BRAKING_VERDICT_COLORS[c.braking_verdict] ?? BRAKING_VERDICT_COLORS.optimal;
  const label = BRAKING_VERDICT_LABELS[c.braking_verdict] ?? "À ton meilleur";
  const cons = consistencyLabel(c.braking_consistency_m);
  // Part de la capacité du pilote réellement exploitée dans ce virage.
  const intensity = capability > 0 ? Math.min(1, c.braking_peak_g / capability) : 0;

  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.02] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover:bg-white/[0.04] transition-colors"
      >
        <span
          className="shrink-0 w-8 h-8 rounded-full grid place-items-center text-xs font-bold border-2"
          style={{ borderColor: color, color }}
        >
          {c.corner_id}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-sm font-medium truncate" style={{ color }}>
            {label}
          </span>
          <span className="block text-[11px] text-muted-foreground truncate">
            Déclenchement à {Math.round(c.braking_point_distance)} m de l'apex ·{" "}
            {c.braking_peak_g.toFixed(2)} g · {c.braking_entry_speed.toFixed(0)} →{" "}
            {c.braking_min_speed.toFixed(0)} km/h
          </span>
        </span>
        {measuredLoss > 0.02 && (
          <span
            className="shrink-0 text-[11px] font-semibold text-amber-400 tabular-nums"
            title="Temps perdu mesuré sur ce virage — identique à la carte, aux conseils et au PDF"
          >
            +{measuredLoss.toFixed(2)}s
          </span>
        )}
        <ChevronDown
          className={`shrink-0 w-4 h-4 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 border-t border-white/5 space-y-3">
          {/* Intensité : la seule référence honnête est ce que le pilote sait faire */}
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Intensité exploitée
              </span>
              <span className="text-[11px] tabular-nums text-muted-foreground">
                {c.braking_peak_g.toFixed(2)} g sur {capability.toFixed(2)} g démontrés
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(intensity * 100).toFixed(0)}%`, background: color }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-3 gap-y-3">
            <Metric
              label="Point"
              value={c.braking_point_distance.toFixed(0)}
              unit="m"
              hint="distance entre ton premier appui sur le frein et l'apex du virage. C'est le repère à compter en piste depuis un panneau ou une bordure."
            />
            <Metric
              label="Ton meilleur"
              value={c.braking_best_point_m.toFixed(0)}
              unit="m"
              hint={`ton passage le plus rapide sur cette portion (tour ${c.braking_best_lap}). Un objectif que tu as déjà réalisé, donc reproductible.`}
              tone="text-emerald-400"
            />
            <Metric
              label="Minimum physique"
              value={c.braking_theoretical_min_m.toFixed(0)}
              unit="m"
              hint="distance la plus courte autorisée par la physique pour passer de ta vitesse d'arrivée à ta vitesse de passage, à la décélération que tu sais produire. C'est une borne, pas un objectif."
              tone="text-muted-foreground"
            />
            <Metric
              label="Longueur"
              value={c.braking_length_m.toFixed(0)}
              unit="m"
              hint="longueur de ta zone de freinage, du premier appui au relâcher."
            />
            <Metric
              label="Durée"
              value={c.braking_duration_s.toFixed(2)}
              unit="s"
              hint="temps passé sur le frein."
            />
            <Metric
              label="Temps mort"
              value={c.coasting_s.toFixed(2)}
              unit="s"
              hint={`ni frein ni gaz, entre le relâcher et la remise des gaz. Ton meilleur passage ici : ${c.coasting_best_s.toFixed(2)} s.`}
              tone={c.coasting_excess_s >= 0.15 ? "text-orange-400" : "text-foreground"}
            />
            <Metric
              label="Régularité"
              value={`± ${c.braking_consistency_m.toFixed(0)}`}
              unit="m"
              hint={`dispersion de ton point de freinage sur ${c.laps} tours. Un pilote confirmé tient 2 à 3 m.`}
              tone={cons.tone}
            />
            <Metric
              label="Frein gardé en virage"
              value={`${Math.round(c.trail_braking_ratio * 100)}`}
              unit="%"
              hint="appelé « trail braking » : la part de ton freinage réalisée alors que le kart est déjà braqué. Un peu aide à faire tourner ; trop charge l'avant et fait glisser l'arrière."
            />
          </div>

          {/* Le verdict ne juge QUE le freinage : on nomme la cause réelle
              quand le temps se perd ailleurs. */}
          {hint && c.braking_verdict === "optimal" && (
            <p className="text-[11px] text-muted-foreground">
              <span className="font-medium text-foreground">
                +{measuredLoss.toFixed(2)} s perdues sur ce virage.
              </span>{" "}
              {hint}
            </p>
          )}

          {c.double_brake_laps > 0 && (
            <p className="text-[11px] text-amber-400/90">
              Double freinage sur {c.double_brake_laps} tour{c.double_brake_laps > 1 ? "s" : ""} : tu
              as repris du frein après l'avoir relâché. Signe que le premier appui n'était pas au bon
              endroit ou pas assez fort.
            </p>
          )}

          {onFocusCorner && (
            <button
              type="button"
              onClick={() => onFocusCorner(c.corner_id)}
              className="text-[11px] font-medium text-primary hover:underline"
            >
              Voir le virage {c.corner_id} sur la carte →
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export function BrakingPanel({ braking, cornerLosses, cornerHints, onFocusCorner }: BrakingPanelProps) {
  const losses = cornerLosses ?? {};
  const corners = useMemo(
    () =>
      [...(braking?.corners ?? [])].sort(
        (a, b) => (losses[b.corner_id] ?? 0) - (losses[a.corner_id] ?? 0)
      ),
    [braking, cornerLosses]
  );

  if (!corners.length) return null;
  const capability = braking?.capability_g ?? 0;
  const totalLoss = corners.reduce((s, c) => s + (losses[c.corner_id] ?? 0), 0);

  return (
    <section className="rounded-xl border border-white/10 bg-black/20 p-3 sm:p-4 space-y-3">
      <header className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <div>
          <h3 className="text-sm font-semibold">Analyse des freinages</h3>
          <p className="text-[11px] text-muted-foreground">
            {corners.length} zone{corners.length > 1 ? "s" : ""} de freinage mesurée
            {corners.length > 1 ? "s" : ""} — les virages pris à plat n'apparaissent pas.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
              Ta capacité
            </div>
            <div className="text-sm font-semibold tabular-nums">{capability.toFixed(2)} g</div>
          </div>
          {totalLoss > 0.02 && (
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">
                Marge freinage
              </div>
              <div className="text-sm font-semibold tabular-nums text-amber-400">
                {totalLoss.toFixed(2)} s
              </div>
            </div>
          )}
        </div>
      </header>

      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Chaque virage est comparé à <strong className="text-foreground/80">ton propre meilleur
        passage</strong> sur cette même portion de piste, pas à un modèle théorique : l'objectif
        affiché est un chrono que tu as déjà signé, donc atteignable.
      </p>

      <div className="space-y-1.5">
        {corners.map((c) => (
          <CornerRow
            key={c.corner_id}
            c={c}
            capability={capability}
            measuredLoss={losses[c.corner_id] ?? 0}
            hint={cornerHints?.[c.corner_id]}
            onFocusCorner={onFocusCorner}
          />
        ))}
      </div>
    </section>
  );
}
