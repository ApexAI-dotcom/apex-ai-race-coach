/**
 * TrackMapPro — Dynamic legend
 */
import type { TrackMapProfile } from "@/types/analysis";
import {
  APEX_ORANGE,
  APEX_RED,
  TRACK_GREEN,
  TRACK_GRAY,
  TRACK_YELLOW,
  MODEL_GOLD,
} from "./trackMapColors";

interface TrackMapLegendProps {
  profile: TrackMapProfile;
  speedMin: number;
  speedMax: number;
  hasModel: boolean;
  comparisonLabel?: string;
  showSynthetic?: boolean;
  trackWidthM?: number;
  trackWidthSource?: string;
  hasRibbon?: boolean;
  hasBrakingPoints?: boolean;
}

/** Un repère de la carte, expliqué. Sans légende, un point coloré ne veut rien dire. */
function LegendItem({
  swatch,
  label,
  hint,
}: {
  swatch: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <div className="flex items-start gap-1.5" title={hint}>
      <span className="mt-[3px] shrink-0">{swatch}</span>
      <span>
        <span className="text-foreground/90 font-medium">{label}</span>
        <span className="hidden md:inline"> — {hint}</span>
      </span>
    </div>
  );
}

const Dot = ({ color }: { color: string }) => (
  <span className="block w-2.5 h-2.5 rounded-full" style={{ background: color }} />
);

export function TrackMapLegend({
  profile,
  speedMin,
  speedMax,
  hasModel,
  comparisonLabel,
  showSynthetic,
  trackWidthM,
  trackWidthSource,
  hasRibbon,
  hasBrakingPoints,
}: TrackMapLegendProps) {
  return (
    <div className="flex flex-wrap items-start gap-x-4 gap-y-1.5 px-2 py-1.5 text-[10px] leading-snug text-muted-foreground">
      {/* Speed legend */}
      {(profile === "speed" || profile === "complete") && (
        <div className="flex items-center gap-2">
          <span>{Math.round(speedMin)} km/h</span>
          <div
            className="h-2 w-20 rounded-full"
            style={{
              background: `linear-gradient(to right, ${APEX_RED}, ${TRACK_YELLOW}, ${TRACK_GREEN})`,
            }}
          />
          <span>{Math.round(speedMax)} km/h</span>
        </div>
      )}

      {/* Braking legend */}
      {profile === "braking" && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: APEX_RED }} />
            <span>Freinage</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: TRACK_GREEN }} />
            <span>Accélération</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: TRACK_GRAY }} />
            <span>Transition</span>
          </div>
        </div>
      )}

      {/* Complete mode legend addon */}
      {profile === "complete" && (
        <div className="flex items-center gap-3 border-l border-white/10 pl-3">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-1.5 rounded-full" style={{ background: APEX_RED }} />
            <span>Zone de Freinage</span>
          </div>
        </div>
      )}

      {/* Compare legend */}
      {profile === "compare" && (
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: APEX_ORANGE }} />
            <span>Votre tour</span>
          </div>
          {hasModel && comparisonLabel ? (
            <div className="flex items-center gap-1">
              <div className="w-2.5 h-2.5 rounded-full" style={{ background: MODEL_GOLD }} />
              <span>{comparisonLabel}</span>
            </div>
          ) : comparisonLabel ? (
            <div className="flex items-center gap-1">
              <div
                className="w-2.5 h-2.5 rounded-sm border border-white/30"
                style={{ background: "rgba(255,255,255,0.3)" }}
              />
              <span>{comparisonLabel}</span>
            </div>
          ) : null}
        </div>
      )}

      {/* Mini-secteurs : c'est ici que le pilote lit où il perd du temps */}
      {profile === "sectors" && (
        <>
          <LegendItem
            swatch={<Dot color="#22c55e" />}
            label="Rien à gagner"
            hint="tu es déjà à ton meilleur sur cette portion"
          />
          <LegendItem
            swatch={<Dot color="#f59e0b" />}
            label="Perte modérée"
            hint="quelques centièmes récupérables"
          />
          <LegendItem
            swatch={<Dot color="#ef4444" />}
            label="Grosse perte"
            hint="la portion qui te coûte le plus de temps — à travailler en priorité"
          />
          <LegendItem
            swatch={<span className="block px-1 rounded bg-black/70 border border-white/30 text-[8px] text-white">V9 +0.27s</span>}
            label="Étiquette"
            hint="total perdu sur ce virage (approche, courbe et relance comprises) — c'est exactement le chiffre repris dans les conseils de coaching"
          />
        </>
      )}

      {/* Repères de freinage : affichés seulement s'ils existent réellement */}
      {hasBrakingPoints && profile === "braking" && (
        <LegendItem
          swatch={<span className="block w-3 h-3 rounded-full border-2 border-emerald-500" />}
          label={`Point de freinage « V5 · 32m »`}
          hint="cercle = là où tu commences réellement à freiner, l'étiquette = distance jusqu'à l'apex de ce virage (à compter en piste depuis un repère fixe). Vert : bien placé · orange : tu freines trop tôt · rouge : trop tard"
        />
      )}

      {/* Repères permanents : ils sont sur toutes les vues */}
      <LegendItem
        swatch={
          <span className="block w-3.5 h-3.5 rounded-full bg-black border-2" style={{ borderColor: APEX_ORANGE }} />
        }
        label="Numéros de virage"
        hint="cliquables ; ce sont les mêmes numéros que dans les conseils de coaching et les graphiques"
      />
      <LegendItem swatch={<Dot color="#22c55e" />} label="Départ" hint="début du tour affiché" />
      <LegendItem swatch={<Dot color="#ef4444" />} label="Arrivée" hint="fin du tour affiché" />

      {/* Ruban de piste : l'échelle réelle */}
      {hasRibbon && (
        <LegendItem
          swatch={<span className="block w-4 h-2.5 rounded-sm bg-white/10 border border-white/25" />}
          label={`Largeur de piste ${trackWidthM ? `≈ ${trackWidthM} m` : ""}`}
          hint={trackWidthSource || "largeur réglementaire karting, pour situer ta trajectoire dans la piste réelle"}
        />
      )}

      {/* Persistent AI Lap legend if synthetic overlay is active */}
      {showSynthetic && profile !== "compare" && (
        <LegendItem
          swatch={<Dot color={MODEL_GOLD} />}
          label="Tour Parfait IA"
          hint="trajectoire optimale calculée : courbure minimale dans les limites de piste, vitesses calibrées sur ton grip réel"
        />
      )}
    </div>
  );
}
