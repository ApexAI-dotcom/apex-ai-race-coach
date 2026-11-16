import React from "react";
import { z } from "zod";
import { VISUAL_IDS } from "../visuals";
import { Carousel } from "./Carousel";

/**
 * Gabarits simples (une image) bâtis sur le moteur du carrousel : mêmes règles, mêmes signatures.
 * Chaque gabarit s'édite dans Remotion Studio (panneau de droite), puis « Render ».
 */

const tone = z.enum(["gain", "loss", "neutral", "gradient", "white"]);

/* T-Couverture : titre + héros (visuel ou chiffre) */
export const coverSchema = z.object({
  label: z.string(),
  title: z.string(),
  sub: z.string().optional(),
  visual: z.enum(VISUAL_IDS),
  visualWidth: z.number().optional(),
  visualHeight: z.number().optional(),
  number: z.string().optional(),
  unit: z.string().optional(),
  tone: tone.optional(),
  red: z.boolean().optional(),
  demo: z.boolean().optional(),
});
export const TCouverture: React.FC<z.infer<typeof coverSchema>> = ({ label, ...s }) => (
  <Carousel label={label} rail={false} slides={[{ kind: "cover", ...s }]} />
);

/* T-ChiffreHeros : un chiffre, une leçon */
export const heroSchema = z.object({
  label: z.string(),
  number: z.string(),
  unit: z.string().optional(),
  tone: tone,
  title: z.string(),
  body: z.string().optional(),
  tip: z.string().optional(),
  progress: z.number().optional(),
  visual: z.enum(VISUAL_IDS).optional(),
  visualWidth: z.number().optional(),
  demo: z.boolean().optional(),
});
export const TChiffreHeros: React.FC<z.infer<typeof heroSchema>> = ({ label, ...s }) => (
  <Carousel label={label} rail={false} slides={[{ kind: "number", ...s }]} />
);

/* T-Conseil : un virage, un geste, un gain */
export const conseilSchema = z.object({
  label: z.string(),
  corner: z.number().min(1).max(12),
  title: z.string(),
  body: z.string(),
  gain: z.string(),
  demo: z.boolean(),
});
export const TConseil: React.FC<z.infer<typeof conseilSchema>> = ({ label, corner, title, body, gain, demo }) => (
  <Carousel
    label={label}
    rail={false}
    slides={[{ kind: "number", number: gain, unit: "s", tone: "gain", title, body, visual: "trace-zoom", corner, visualWidth: 936, visualHeight: 520, demo }]}
  />
);

/* T-Offre : un plan */
export const offreSchema = z.object({
  label: z.string(),
  plan: z.string(),
  title: z.string(),
  price: z.string(),
  period: z.string().optional(),
  priceNote: z.string().optional(),
  bullets: z.array(z.string()),
  note: z.string().optional(),
});
export const TOffre: React.FC<z.infer<typeof offreSchema>> = ({ label, ...s }) => (
  <Carousel label={label} rail={false} slides={[{ kind: "plan", ...s }]} />
);
