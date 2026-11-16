import React from "react";
import { AbsoluteFill } from "remotion";
import { z } from "zod";
import { Flag, FileUp, MessageCircleQuestion, Play, Tag, Target } from "lucide-react";
import { C, FONT, INK, SAFE, alpha } from "../kit/tokens";
import { Body, Label, Rich, Title, fr } from "../kit/text";
import { CtaButton, DemoTag, Footer, HeroNumber, Lockup } from "../kit/elements";
import { RedPanel, SocialBackground } from "../kit/Background";
import { Visual, VISUAL_IDS } from "../visuals";
import { fitTitle } from "./Slide";

const tone = z.enum(["gain", "loss", "neutral", "gradient", "white"]);

/* ───────────────────────── Déclaration (aplat rouge + repères de construction) ───────────────────────── */

export const declarationSchema = z.object({
  label: z.string(),
  /** Texte principal. *mot* = mot-clé (sombre sur le rouge). \n = retour à la ligne. */
  title: z.string(),
  titleSize: z.number(),
  /** Lignes secondaires (48 px minimum sur le rouge). */
  lines: z.array(z.string()),
  /** Repères de construction façon Figma autour du texte. */
  construction: z.boolean(),
});
export type DeclarationProps = z.infer<typeof declarationSchema>;

export const Declaration: React.FC<DeclarationProps> = ({ label, title, titleSize, lines, construction }) => {
  const W = 1080;
  const H = 1350;
  const nLines = title.split("\n").length;
  const box = { x: 72, y: 250, w: 936, h: titleSize * 1.02 * nLines + titleSize * 0.18 };
  const dash = (v: boolean): React.CSSProperties => ({
    position: "absolute",
    backgroundImage: `repeating-linear-gradient(${v ? 180 : 90}deg, ${alpha(C.text, 0.55)} 0 8px, transparent 8px 16px)`,
  });
  const M = 26;
  return (
    <AbsoluteFill>
      <RedPanel width={W} height={H} glow={{ x: 0.75, y: 0.2 }} />
      <Label text={label} color={alpha(C.text, 0.92)} bar={false} style={{ position: "absolute", left: 72, top: 72 }} />
      {construction ? (
        <>
          <div style={{ ...dash(false), left: 0, width: W, top: box.y - M, height: 2 }} />
          <div style={{ ...dash(false), left: 0, width: W, top: box.y + box.h + M, height: 2 }} />
          <div style={{ ...dash(true), left: box.x - M / 2, width: 2, top: 0, height: H }} />
          <div style={{ ...dash(true), left: box.x + box.w + M / 2, width: 2, top: 0, height: H }} />
          {[
            [box.x - M / 2, box.y - M],
            [box.x + box.w + M / 2, box.y - M],
            [box.x - M / 2, box.y + box.h + M],
            [box.x + box.w + M / 2, box.y + box.h + M],
          ].map(([x, y], i) => (
            <div key={i} style={{ position: "absolute", left: x - 7, top: y - 7, width: 16, height: 16, background: C.text, border: `2px solid ${C.primaryDeep}` }} />
          ))}
          <div style={{ position: "absolute", left: box.x + box.w - 130, top: box.y - M - 40, fontFamily: FONT.body, fontWeight: 600, fontSize: 22, color: alpha(C.text, 0.8), letterSpacing: "0.08em" }}>
            {`${box.w} × ${Math.round(box.h)}`}
          </div>
        </>
      ) : null}
      <div style={{ position: "absolute", left: box.x, top: box.y, width: box.w }}>
        <Title text={title} size={titleSize} onRed lineHeight={1.02} />
      </div>
      <div style={{ position: "absolute", left: 72, right: 72, top: box.y + box.h + M + 70, display: "flex", flexDirection: "column", gap: 34 }}>
        {lines.map((l, i) => (
          <div key={i} style={{ fontFamily: FONT.body, fontWeight: i === 0 ? 600 : 500, fontSize: 48, lineHeight: 1.18, color: C.text }}>
            <Rich text={l} base="white" onRed />
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 72, bottom: 120 }}>
        <Lockup height={64} variant="mono-white" />
      </div>
      <Footer light />
    </AbsoluteFill>
  );
};

/* ───────────────────────── Couverture de reel (1080 × 1920) ───────────────────────── */

export const reelCoverSchema = z.object({
  label: z.string(),
  title: z.string().optional(),
  titleSize: z.number().optional(),
  sub: z.string().optional(),
  number: z.string().optional(),
  unit: z.string().optional(),
  tone: tone.optional(),
  visual: z.enum(VISUAL_IDS).optional(),
  visualWidth: z.number().optional(),
  visualHeight: z.number().optional(),
  demo: z.boolean().optional(),
});
export type ReelCoverProps = z.infer<typeof reelCoverSchema>;

export const ReelCover: React.FC<ReelCoverProps> = ({ label, title, titleSize, sub, number, unit, tone: t, visual, visualWidth = 920, visualHeight, demo }) => {
  const Z = SAFE.reelCover;
  const size = titleSize ?? fitTitle(title ?? "", 132, Z.x1 - Z.x0);
  return (
    <AbsoluteFill>
      <SocialBackground width={1080} height={1920} preset="default" intensity={0.8} />
      <Label text={label} size={26} style={{ position: "absolute", left: Z.x0, top: Z.y0 + 20 }} />
      {demo ? <DemoTag style={{ position: "absolute", left: Z.x0, top: Z.y0 + 72 }} /> : null}
      {visual ? (
        <div style={{ position: "absolute", left: 0, width: 1080, top: 470, display: "flex", justifyContent: "center" }}>
          <Visual id={visual} width={visualWidth} height={visualHeight} />
        </div>
      ) : null}
      <div style={{ position: "absolute", left: Z.x0, width: Z.x1 - Z.x0, bottom: 1920 - Z.y1 + 30 }}>
        {number ? <HeroNumber value={fr(number)} unit={unit} size={290} tone={t ?? "gradient"} style={{ marginBottom: 30 }} /> : null}
        {title ? <Title text={title} size={size} /> : null}
        {sub ? <Body text={sub} size={42} style={{ marginTop: 26 }} /> : null}
      </div>
      <Footer x0={Z.x0} x1={Z.x1} y={1700} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── Story (1080 × 1920) ───────────────────────── */

export const storySchema = z.object({
  label: z.string(),
  title: z.string(),
  titleSize: z.number().optional(),
  body: z.string().optional(),
  number: z.string().optional(),
  unit: z.string().optional(),
  tone: tone.optional(),
  visual: z.enum(VISUAL_IDS).optional(),
  visualWidth: z.number().optional(),
  visualHeight: z.number().optional(),
  /** Zone réservée au sticker ajouté dans Instagram. */
  sticker: z.enum(["none", "sondage", "question", "lien"]),
  /** Version guide : la zone du sticker est dessinée. */
  guide: z.boolean(),
  red: z.boolean().optional(),
  demo: z.boolean().optional(),
  demoLabel: z.string().optional(),
  note: z.string().optional(),
  button: z.string().optional(),
  step: z.string().optional(),
});
export type StoryProps = z.infer<typeof storySchema>;

const STICKER = {
  sondage: { w: 760, h: 300, y: 1290, text: "Sticker « Sondage » ici" },
  question: { w: 760, h: 300, y: 1270, text: "Sticker « Questions » ici" },
  lien: { w: 560, h: 120, y: 1350, text: "Sticker « Lien » ici" },
  none: { w: 0, h: 0, y: 0, text: "" },
} as const;

export const Story: React.FC<StoryProps> = ({ label, title, titleSize, body, number, unit, tone: t, visual, visualWidth = 880, visualHeight, sticker, guide, red, demo, demoLabel, note, button, step }) => {
  const Z = SAFE.story;
  const x0 = Z.x0 + 16;
  const w = Z.x1 - Z.x0 - 32;
  const size = titleSize ?? fitTitle(title, 124, w, 64);
  const st = STICKER[sticker];
  const contentBottom = sticker !== "none" ? st.y - 40 : note ? 1560 : 1640;
  return (
    <AbsoluteFill>
      {red ? <RedPanel width={1080} height={1920} /> : <SocialBackground width={1080} height={1920} preset="default" intensity={0.85} />}
      <Label text={label} size={26} color={red ? alpha(C.text, 0.9) : INK.muted} style={{ position: "absolute", left: x0, top: Z.y0 + 30 }} />
      {demo ? <DemoTag light={red} text={demoLabel} style={{ position: "absolute", left: x0, top: Z.y0 + 82 }} /> : null}
      <div style={{ position: "absolute", left: x0, width: w, top: Z.y0 + 160, height: contentBottom - (Z.y0 + 160), display: "flex", flexDirection: "column" }}>
        {step ? <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 150, lineHeight: 0.85, color: "transparent", WebkitTextStroke: `4px ${red ? C.text : C.primary}`, marginBottom: 40 }}>{step}</div> : null}
        {number ? <HeroNumber value={fr(number)} unit={unit} size={260} tone={t ?? (red ? "white" : "gradient")} style={{ marginBottom: 28 }} /> : null}
        <Title text={title} size={size} onRed={!!red} lineHeight={1.02} />
        {body ? <Body text={body} size={44} tone={red ? "white" : "soft"} style={{ marginTop: 34 }} /> : null}
        {visual ? (
          <div style={{ flex: 1, minHeight: 0, display: "flex", alignItems: "center", justifyContent: "center", paddingTop: 40 }}>
            <Visual id={visual} width={visualWidth} height={visualHeight} />
          </div>
        ) : null}
        {button ? (
          <div style={{ marginTop: 60 }}>
            <CtaButton text={button} light={!!red} />
          </div>
        ) : null}
      </div>
      {note ? (
        <div style={{ position: "absolute", left: x0, width: w, top: 1600, fontFamily: FONT.body, fontWeight: 500, fontSize: 26, lineHeight: 1.4, color: red ? alpha(C.text, 0.85) : INK.muted }}>{fr(note)}</div>
      ) : null}
      {guide && sticker !== "none" ? (
        <div
          style={{
            position: "absolute",
            left: (1080 - st.w) / 2,
            top: st.y,
            width: st.w,
            height: st.h,
            border: `4px dashed ${alpha(C.text, 0.7)}`,
            borderRadius: 36,
            background: alpha(C.text, 0.06),
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: FONT.body,
            fontWeight: 700,
            fontSize: 34,
            color: alpha(C.text, 0.85),
          }}
        >
          {fr(st.text)}
        </div>
      ) : null}
      <Footer x0={x0} x1={Z.x1 - 16} y={1700} light={!!red} />
    </AbsoluteFill>
  );
};

/* ───────────────────────── Couvertures « À la une » ───────────────────────── */

export const HIGHLIGHT_ICONS = { demo: Play, tuto: FileUp, conseils: Target, offres: Tag, faq: MessageCircleQuestion, histoire: Flag } as const;
export const highlightSchema = z.object({ icon: z.enum(["demo", "tuto", "conseils", "offres", "faq", "histoire"]) });

export const HighlightCover: React.FC<z.infer<typeof highlightSchema> & { height: number }> = ({ icon, height }) => {
  const W = 1080;
  const D = 900; // anneau
  const cy = height / 2;
  const Icon = HIGHLIGHT_ICONS[icon];
  const iconSize = 0.38 * W;
  return (
    <AbsoluteFill style={{ backgroundColor: C.bg }}>
      <div style={{ position: "absolute", left: W / 2 - 520, top: cy - 520, width: 1040, height: 1040, borderRadius: "50%", background: `radial-gradient(circle, ${alpha(C.primary, 0.26)} 0%, ${alpha(C.primary, 0.08)} 45%, ${alpha(C.primary, 0)} 70%)` }} />
      <svg width={W} height={height} style={{ position: "absolute", inset: 0 }}>
        <defs>
          <linearGradient id="hl-ring" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={C.primary} />
            <stop offset="100%" stopColor={C.orange} />
          </linearGradient>
        </defs>
        <circle cx={W / 2} cy={cy} r={D / 2} fill={C.bg} stroke="url(#hl-ring)" strokeWidth={12} />
      </svg>
      <div style={{ position: "absolute", left: W / 2 - iconSize / 2, top: cy - iconSize / 2, width: iconSize, height: iconSize, filter: `drop-shadow(0 0 30px ${alpha(C.primary, 0.45)})` }}>
        <Icon size={iconSize} color={C.text} strokeWidth={2} />
      </div>
    </AbsoluteFill>
  );
};
