/**
 * Kit social ApexAI — jetons de mise en page.
 * Couleurs : uniquement celles de theme.ts (issues de tokens.json). Aucune valeur hexadécimale ici :
 * les transparences passent par alpha().
 */
import { BODY, C, DISPLAY, G, SHADOW } from "../../theme";

export { C, G, SHADOW };

export const FONT = {
  display: `'${DISPLAY}', sans-serif`,
  body: `'${BODY}', sans-serif`,
};

/** rgba() à partir d'une couleur de la charte (#RRGGBB). */
export const alpha = (hex: string, a: number) => {
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255}, ${(n >> 8) & 255}, ${n & 255}, ${a})`;
};

/** Texte secondaire : blanc de la charte à opacité réduite (lisible sur #0A0A0A). */
export const INK = {
  strong: C.text,
  body: alpha(C.text, 0.78),
  soft: alpha(C.text, 0.62),
  muted: C.muted,
  dim: C.dim,
};

export const POST = { w: 1080, h: 1350, m: 72 } as const;
export const STORY = { w: 1080, h: 1920 } as const;
export const SQUARE = { w: 1080, h: 1080 } as const;

/** Zones sûres (§5.2 du prompt). */
export const SAFE = {
  post: { x0: 72, x1: 1008, y0: 72, y1: 1290 },
  reel: { x0: 80, x1: 940, y0: 260, y1: 1480 },
  reelCover: { x0: 80, x1: 1000, y0: 300, y1: 1600 },
  story: { x0: 64, x1: 1016, y0: 250, y1: 1670 },
  ad: { x0: 65, x1: 1015, y0: 270, y1: 1248 },
} as const;

/** Recadrages de la grille du profil (3:4). */
export const GRID = {
  post: { x0: 34, x1: 1046, scale: 1350 / 1440 },
  reel: { y0: 240, y1: 1680 },
} as const;

/** Dégradés dérivés de la charte. */
export const GRAD = {
  primary: G.primary,
  keyword: G.textPrimary,
  success: G.success,
  gold: G.gold,
};

export const LABEL_DEMO = "Session de démo · Adria Karting Raceway";
