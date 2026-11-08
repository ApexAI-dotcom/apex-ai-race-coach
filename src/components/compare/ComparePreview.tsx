import { GitCompare, LineChart, Timer, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PreviewPanel, type PreviewFeature } from "@/components/preview/PreviewShell";
import { CornersVisual, GapVisual, OverlayVisual, SourcesVisual } from "@/components/preview/visuals/CompareVisuals";

const FEATURES: PreviewFeature[] = [
  {
    icon: Users,
    title: "Ton coéquipier, ou deux de tes séances",
    description: "Dépose ton fichier de session et le sien sur le même circuit, ou deux de tes séances pour mesurer tes progrès.",
    visual: SourcesVisual,
  },
  {
    icon: LineChart,
    title: "Deux tours superposés",
    description: "Vos meilleurs tours l'un sur l'autre : vitesse, gaz et frein sur la même carte et les mêmes courbes.",
    visual: OverlayVisual,
  },
  {
    icon: Timer,
    title: "L'écart mètre par mètre",
    description: "Où le temps se gagne et où il se perd, au mètre près, sans avoir à deviner.",
    visual: GapVisual,
  },
  {
    icon: GitCompare,
    title: "Virage par virage",
    description: "Qui freine plus tard, qui garde plus de vitesse au point de corde, qui sort plus fort.",
    visual: CornersVisual,
  },
];

/* Rendu réaliste (fausses données) du comparateur, affiché flouté en fond. */
function CompareMock() {
  const bar = (w: number, c: string) => <div className="h-2 rounded-full" style={{ width: `${w}%`, background: c }} />;
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="rounded-2xl border-border bg-card p-5">
        <p className="mb-4 font-semibold">Carte du circuit</p>
        <svg viewBox="0 0 200 120" className="h-48 w-full" fill="none">
          <path d="M20,90 C20,40 70,20 100,40 S170,30 180,70 S120,110 80,100 S20,110 20,90Z" stroke="#f97316" strokeWidth="5" />
          <path d="M24,88 C24,44 72,26 100,46 S166,36 174,70 S120,104 82,96 S24,104 24,88Z" stroke="#e5e5e5" strokeWidth="2" />
        </svg>
      </Card>
      <Card className="space-y-4 rounded-2xl border-border bg-card p-5">
        <p className="font-semibold">Virage par virage</p>
        {[80, 62, 90, 55, 70].map((w, i) => (
          <div key={i} className="space-y-1">
            {bar(w, "#f97316")}
            {bar(w - 12 + i * 4, "#a3a3a3")}
          </div>
        ))}
      </Card>
      <Card className="rounded-2xl border-border bg-card p-5 lg:col-span-2">
        <p className="mb-4 font-semibold">Écart de temps</p>
        <svg viewBox="0 0 400 80" className="h-24 w-full" fill="none">
          <path d="M0,40 L60,42 L120,50 L180,48 L240,58 L300,62 L400,70" stroke="#f97316" strokeWidth="3" />
        </svg>
      </Card>
    </div>
  );
}

/**
 * Onglet « Comparer deux séances » pour les comptes gratuits et les
 * visiteurs : on voit ce que fait le comparateur, sans pouvoir l'utiliser.
 * Même vitrine que Mon Kart et Réglages.
 */
export function ComparePreview() {
  return (
    <PreviewPanel
      mock={<CompareMock />}
      features={FEATURES}
      bullets={[
        "Ton fichier contre celui d'un coéquipier",
        "Ou deux de tes séances, pour voir ta progression",
        "L'écart au mètre près, virage par virage",
        "Ne compte pas dans tes analyses",
      ]}
      ctaTitle="Le comparateur est réservé à Racer"
      ctaSubtitle="Crée ton compte, puis passe à Racer pour comparer tes séances avec celles de tes coéquipiers."
    />
  );
}
