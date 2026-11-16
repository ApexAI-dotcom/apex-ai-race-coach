/** Charte ApexAI — valeurs issues de assets/brand/tokens.json (code de production). */
export const C = {
  bg: "#0A0A0A",
  bgDeep: "#050505",
  card: "#121212",
  cardInner: "#181818",
  cardAlt: "#0F0F0F",
  secondary: "#1F1F1F",
  border: "#262626",
  borderStrong: "#333333",
  text: "#FAFAFA",
  muted: "#999999",
  dim: "#666666",
  primary: "#FF4242",
  primaryDeep: "#E60000",
  red600: "#DC2626",
  orange: "#FF9933",
  orangeChart: "#F97316",
  orangeForm: "#FF6B35",
  pink: "#EC4899",
  success: "#22C55E",
  successNeon: "#00FF80",
  emerald: "#34D399",
  gold: "#FACC15",
  goldDeep: "#EAB308",
  blue: "#3B82F6",
  blueLight: "#60A5FA",
  purple: "#A855F7",
  redTintBg: "#160C0C",
  redTintBorder: "#742323",
};

export const G = {
  primary: "linear-gradient(135deg, #FF4242 0%, #E60000 100%)",
  textPrimary: "linear-gradient(135deg, #FF4242 0%, #FF9933 100%)",
  score: "linear-gradient(90deg, #FF4242 0%, #EC4899 100%)",
  success: "linear-gradient(135deg, #00FF80 0%, #00B359 100%)",
  gold: "linear-gradient(135deg, #FFD966 0%, #FF9500 100%)",
};

export const SHADOW = {
  glowPrimary: "0 0 40px -10px rgba(255, 66, 66, 0.5)",
  glowPrimaryStrong: "0 0 60px -6px rgba(255, 66, 66, 0.75)",
  logoIcon: "0 10px 15px -3px rgba(255, 66, 66, 0.3)",
  cardLift: "0 30px 60px -18px rgba(0, 0, 0, 0.75)",
};

export const DISPLAY = "Space Grotesk";
export const BODY = "Inter";

export const display = (size: number, weight = 700): React.CSSProperties => ({
  fontFamily: `'${DISPLAY}', sans-serif`,
  fontWeight: weight,
  fontSize: size,
  letterSpacing: "-0.03em",
  lineHeight: 1,
});

export const body = (size: number, weight = 500): React.CSSProperties => ({
  fontFamily: `'${BODY}', sans-serif`,
  fontWeight: weight,
  fontSize: size,
  lineHeight: 1.35,
});

/** Texte en dégradé (background-clip). */
export const gradientText = (bg: string): React.CSSProperties => ({
  backgroundImage: bg,
  WebkitBackgroundClip: "text",
  backgroundClip: "text",
  color: "transparent",
  WebkitTextFillColor: "transparent",
});
