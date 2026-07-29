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

      {/* Vue Freinage : bande, temps mort, repère — expliqués un par un */}
      {profile === "braking" && (
        <>
          {/* La TRACE elle-même est colorée par phase. Sans ces trois entrées,
              le gris n'apparaissait nulle part dans la légende et le pilote
              n'avait aucun moyen de savoir ce qu'il regardait. */}
          <LegendItem
            swatch={<span className="block w-4 h-1.5 rounded-full" style={{ background: TRACK_GREEN }} />}
            label="Sur les gaz"
            hint="tu accélères, ou tu tiens ta vitesse de pointe. En bout de ligne droite l'accélération tombe à zéro alors que tu es à fond : c'est normal, la traînée compense le moteur. Un kart ne tient jamais sa vitesse sans gaz"
          />
          <LegendItem
            swatch={<span className="block w-4 h-1.5 rounded-full" style={{ background: APEX_RED }} />}
            label="Freinage"
            hint="décélération franche mesurée. La bande épaisse le long de la piste marque la même zone : plus elle est épaisse, plus tu freines fort"
          />
          <LegendItem
            swatch={<span className="block w-4 h-1.5 rounded-full" style={{ background: TRACK_GRAY }} />}
            label="Ni frein ni gaz"
            hint="tu as levé le pied sans freiner : le kart ralentit sur sa seule traînée. On le voit surtout entre le relâcher de frein et la remise des gaz, à l'intérieur des virages. Court, c'est normal ; long ou répété, c'est du temps perdu"
          />
          <LegendItem
            swatch={
              <span
                className="block w-4 h-0 border-t-2 border-dashed"
                style={{ borderColor: "#fb923c" }}
              />
            }
            label="Temps mort"
            hint="ni frein ni gaz : le kart roule en roue libre. En karting il n'y a pas de transfert de masse à attendre, ce temps est perdu"
          />
          <LegendItem
            swatch={<span className="block w-0.5 h-3.5 rounded-full bg-emerald-500" />}
            label="Repère « V7 · 39m · 0.87g »"
            hint="la barre marque le début de ta zone de freinage — c'est exactement le premier point de la bande. L'étiquette donne le virage, la distance jusqu'à l'apex (à compter en piste depuis un panneau ou une bordure) et la décélération de crête"
          />
          <LegendItem
            swatch={<span className="block w-2.5 h-2.5 rounded-full bg-emerald-500" />}
            label="Vert = rien à gagner"
            hint="tu freines déjà comme sur ton meilleur passage de la session à ce virage"
          />
          <LegendItem
            swatch={<span className="block w-2.5 h-2.5 rounded-full bg-amber-500" />}
            label="Couleur = marge détectée"
            hint="ambre : tu peux freiner plus tard · orange : temps mort · bleu : ton meilleur tour anticipait davantage · violet : freinage trop mou · rose : point instable. Le détail chiffré est sous la carte"
          />
          <LegendItem
            swatch={<span className="text-[10px]">⚠</span>}
            label="Double freinage"
            hint="tu as repris du frein après l'avoir relâché : une correction, signe que le premier appui n'était pas au bon endroit"
          />
        </>
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
