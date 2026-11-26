import { z } from "zod";
import { VISUAL_IDS } from "../visuals";

const tone = z.enum(["gain", "loss", "neutral", "gradient", "white"]);

export const slideSchema = z.object({
  /** Mise en page de la slide. */
  kind: z.enum(["cover", "step", "statement", "number", "compare", "plan", "cta", "list"]),
  /** Rubrique en haut à gauche (capitales). */
  label: z.string().optional(),
  /** Titre. *mot* = dégradé ; [vert]…[/vert], [rouge]…[/rouge], [or]…[/or], [gris]…[/gris] ; \n = retour à la ligne. */
  title: z.string().optional(),
  titleSize: z.number().optional(),
  body: z.string().optional(),
  /** Numéro d'étape (01) ou chiffre héros (−1,23). */
  number: z.string().optional(),
  unit: z.string().optional(),
  tone: tone.optional(),
  visual: z.enum(VISUAL_IDS).optional(),
  visualWidth: z.number().optional(),
  visualHeight: z.number().optional(),
  /** Virage à cadrer pour le visuel « trace-zoom » (1 à 12). */
  corner: z.number().optional(),
  /** Affiche « Session de démo · Adria Karting Raceway ». */
  demo: z.boolean().optional(),
  /** Remplace le texte de l'étiquette de démo (ex. « Données de démonstration »). */
  demoLabel: z.string().optional(),
  /** Encadré « À travailler » sous le texte. */
  tip: z.string().optional(),
  /** Barre de progression sous le chiffre (0 → 1). */
  progress: z.number().optional(),
  /** Mention en petit (ex. marques). */
  note: z.string().optional(),
  bullets: z.array(z.string()).optional(),
  plan: z.string().optional(),
  price: z.string().optional(),
  period: z.string().optional(),
  priceNote: z.string().optional(),
  button: z.string().optional(),
  buttonIcon: z.enum(["chevron", "bookmark"]).optional(),
  sub: z.string().optional(),
  /** Fond rouge plein (déclaration). */
  red: z.boolean().optional(),
  compare: z
    .array(z.object({ value: z.string(), unit: z.string().optional(), label: z.string(), tone: tone.optional(), corner: z.number().optional() }))
    .optional(),
});

export const carouselSchema = z.object({
  /** Rubrique par défaut (reprise sur chaque slide sans label). */
  label: z.string(),
  /** Trace de vitesse continue en bas des slides (elle relie les slides au swipe). */
  rail: z.boolean(),
  /** 2 ou 3 : la 1re slide reprend la tuile du panorama de la grille (posts épinglés). */
  panorama: z.number().optional(),
  slides: z.array(slideSchema),
});

export type SlideProps = z.infer<typeof slideSchema>;
export type CarouselProps = z.infer<typeof carouselSchema>;
