import React from "react";
import { AbsoluteFill } from "remotion";
import { ArrowRight } from "lucide-react";
import { C, FONT, INK, alpha } from "../kit/tokens";
import { Body, Label, Rich, Title, fr } from "../kit/text";
import { CheckList, CtaButton, DemoTag, Footer, HeroNumber, Lockup, ScoreBar, StepNumber, TipBox } from "../kit/elements";
import { RedPanel } from "../kit/Background";
import { Visual } from "../visuals";
import type { SlideProps } from "./schema";

export const W = 1080;
export const H = 1350;
const M = 72;

/** Taille de titre qui tient dans la largeur (approximation de la chasse de Space Grotesk 700). */
export const fitTitle = (text: string, max: number, width: number, min = 56, maxLines = 3) => {
  const clean = text.replace(/\[\/?(vert|rouge|or|gris|blanc|doux)\]/g, "").replace(/\*/g, "");
  const lines = clean.split("\n");
  const CW = 0.5; // chasse moyenne de Space Grotesk 700 (mesurée sur les rendus)
  if (lines.length === 1 && clean.length * CW * max > width) {
    // pas de retour à la ligne imposé : on laisse le texte se couper sur maxLines lignes
    return Math.max(min, Math.min(max, Math.floor((width * maxLines * 0.9) / (CW * clean.length))));
  }
  const longest = Math.max(...lines.map((l) => l.length));
  return Math.max(min, Math.min(max, Math.floor(width / (CW * Math.max(1, longest)))));
};

export const SlideView: React.FC<{ s: SlideProps; index: number; total: number; label: string; rail: boolean }> = ({ s, index, total, label, rail }) => {
  const red = !!s.red;
  const bottom = rail ? 1150 : 1215;
  const lab = s.label ?? label;
  const light = red;
  const textTone = red ? "white" : undefined;
  const bodyTone = red ? "white" : "soft";
  const vw = s.visualWidth ?? 900;

  const header = (
    <>
      {lab ? <Label text={lab} color={red ? alpha(C.text, 0.9) : INK.muted} style={{ position: "absolute", left: M, top: M }} /> : null}
      {s.demo ? <DemoTag light={light} text={s.demoLabel} style={{ position: "absolute", left: M, top: M + 48 }} /> : null}
    </>
  );

  const visual = s.visual && s.visual !== "none" ? <Visual id={s.visual} width={vw} height={s.visualHeight} corner={s.corner} /> : null;

  let content: React.ReactNode = null;
  switch (s.kind) {
    case "cover": {
      const size = s.titleSize ?? fitTitle(s.title ?? "", 132, W - 2 * M);
      content = (
        <div style={{ position: "absolute", left: M, right: M, top: 170, bottom: H - bottom, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            {s.number ? <HeroNumber value={fr(s.number)} unit={s.unit} size={s.number.length > 3 ? 300 : 380} tone={s.tone ?? (red ? "white" : "gradient")} /> : visual}
          </div>
          <div>
            {s.title ? <Title text={s.title} size={size} tone={textTone} onRed={red} /> : null}
            {s.sub ? <Body text={s.sub} size={40} tone={bodyTone} style={{ marginTop: 26 }} /> : null}
          </div>
        </div>
      );
      break;
    }
    case "step": {
      const size = s.titleSize ?? fitTitle(s.title ?? "", 88, W - 2 * M);
      content = (
        <div style={{ position: "absolute", left: M, right: M, top: 150, bottom: H - bottom, display: "flex", flexDirection: "column" }}>
          {s.number ? <StepNumber n={s.number} size={200} /> : null}
          {s.title ? <Title text={s.title} size={size} tone={textTone} onRed={red} style={{ marginTop: 34 }} /> : null}
          {s.body ? <Body text={s.body} size={36} tone={bodyTone} style={{ marginTop: 22, maxWidth: 900 }} /> : null}
          <div style={{ flex: 1 }} />
          {visual ? <div style={{ display: "flex", justifyContent: "center" }}>{visual}</div> : null}
          <div style={{ flex: 1 }} />
          {s.note ? <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 26, lineHeight: 1.35, color: INK.muted }}>{fr(s.note)}</div> : null}
        </div>
      );
      break;
    }
    case "statement": {
      const size = s.titleSize ?? fitTitle(s.title ?? "", visual ? 96 : 112, W - 2 * M);
      content = (
        <div style={{ position: "absolute", left: M, right: M, top: 150, bottom: H - bottom, display: "flex", flexDirection: "column", justifyContent: visual ? "flex-start" : "center" }}>
          {s.title ? <Title text={s.title} size={size} tone={textTone} onRed={red} style={{ marginTop: visual ? 40 : 0 }} /> : null}
          {s.body ? <Body text={s.body} size={38} tone={bodyTone} style={{ marginTop: 30, maxWidth: 910 }} /> : null}
          {visual ? (
            <>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", justifyContent: "center" }}>{visual}</div>
              <div style={{ flex: 1 }} />
            </>
          ) : null}
          {s.tip ? <TipBox text={s.tip} style={{ marginTop: 34 }} /> : null}
          {s.note ? <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 24, color: red ? alpha(C.text, 0.8) : INK.muted, marginTop: 26, lineHeight: 1.4 }}>{fr(s.note)}</div> : null}
        </div>
      );
      break;
    }
    case "number": {
      const size = s.titleSize ?? fitTitle(s.title ?? "", 72, W - 2 * M, 48);
      content = (
        <div style={{ position: "absolute", left: M, right: M, top: 150, bottom: H - bottom, display: "flex", flexDirection: "column", justifyContent: visual ? "flex-start" : "center" }}>
          {s.number ? <HeroNumber value={fr(s.number)} unit={s.unit} size={s.number.length > 5 ? 250 : 300} tone={s.tone ?? "neutral"} style={{ marginTop: visual ? 50 : 0 }} /> : null}
          {s.progress !== undefined ? <ScoreBar value={s.progress} width={W - 2 * M} style={{ marginTop: 34 }} /> : null}
          {s.title ? <Title text={s.title} size={size} tone={textTone} onRed={red} style={{ marginTop: 34 }} /> : null}
          {s.body ? <Body text={s.body} size={36} tone={bodyTone} style={{ marginTop: 22, maxWidth: 900 }} /> : null}
          {s.tip ? <TipBox text={s.tip} style={{ marginTop: 40 }} /> : null}
          {visual ? (
            <>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", justifyContent: "center" }}>{visual}</div>
              <div style={{ flex: 1 }} />
            </>
          ) : null}
          {s.note ? <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 28, color: INK.muted, lineHeight: 1.4, marginBottom: 14 }}>{fr(s.note)}</div> : null}
        </div>
      );
      break;
    }
    case "compare": {
      const size = s.titleSize ?? fitTitle(s.title ?? "", 76, W - 2 * M, 48);
      const items = s.compare ?? [];
      content = (
        <div style={{ position: "absolute", left: M, right: M, top: 150, bottom: H - bottom, display: "flex", flexDirection: "column", justifyContent: visual ? "flex-start" : "center" }}>
          {s.title ? <Title text={s.title} size={size} tone={textTone} style={{ marginTop: visual ? 30 : 0 }} /> : null}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: items.some((it) => it.corner) ? 56 : 80 }}>
            {items.map((it, i) => (
              <React.Fragment key={i}>
                {i > 0 ? (
                  // deux virages côte à côte : un filet les sépare ; sinon flèche « avant → après »
                  it.corner ? <div style={{ width: 2, alignSelf: "stretch", background: alpha(C.text, 0.14) }} /> : <ArrowRight size={64} color={INK.muted} strokeWidth={2} />
                ) : null}
                <div style={{ display: "flex", flexDirection: "column", alignItems: it.corner ? "center" : "flex-start" }}>
                  <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 24, letterSpacing: "0.16em", textTransform: "uppercase", color: INK.muted, marginBottom: 16 }}>{fr(it.label)}</div>
                  <HeroNumber value={fr(it.value)} unit={it.unit} size={180} tone={it.tone ?? "neutral"} />
                  {it.corner ? <Visual id="trace-spot" width={430} height={420} corner={it.corner} style={{ marginTop: 28 }} /> : null}
                </div>
              </React.Fragment>
            ))}
          </div>
          {s.body ? <Body text={s.body} size={36} tone={bodyTone} style={{ marginTop: 64, maxWidth: 900 }} /> : null}
          {visual ? (
            <>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", justifyContent: "center" }}>{visual}</div>
              <div style={{ flex: 1 }} />
            </>
          ) : null}
        </div>
      );
      break;
    }
    case "plan": {
      content = (
        <div style={{ position: "absolute", left: M, right: M, top: 150, bottom: H - bottom, display: "flex", flexDirection: "column" }}>
          {s.plan ? (
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 64, letterSpacing: "-0.02em", color: C.text, marginTop: 20 }}>
              <Rich text={s.plan} />
            </div>
          ) : null}
          {s.title ? <Body text={s.title} size={34} tone="soft" style={{ marginTop: 10 }} /> : null}
          <div style={{ display: "flex", alignItems: "baseline", gap: 18, marginTop: 40 }}>
            {s.price ? <HeroNumber value={fr(s.price)} size={200} tone={s.tone ?? "white"} /> : null}
            {s.period ? <span style={{ fontFamily: FONT.display, fontWeight: 600, fontSize: 56, color: INK.soft }}>{fr(s.period)}</span> : null}
          </div>
          {s.priceNote ? <Body text={s.priceNote} size={30} tone="muted" style={{ marginTop: 14 }} /> : null}
          <div style={{ height: 1, background: alpha(C.text, 0.12), margin: "44px 0 40px" }} />
          {s.bullets ? <CheckList items={s.bullets} size={32} gap={20} /> : null}
          <div style={{ flex: 1 }} />
          {s.note ? <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 24, color: INK.muted }}>{fr(s.note)}</div> : null}
        </div>
      );
      break;
    }
    case "list": {
      const size = s.titleSize ?? fitTitle(s.title ?? "", 84, W - 2 * M);
      content = (
        <div style={{ position: "absolute", left: M, right: M, top: 150, bottom: H - bottom, display: "flex", flexDirection: "column", justifyContent: visual ? "flex-start" : "center" }}>
          {s.title ? <Title text={s.title} size={size} tone={textTone} style={{ marginTop: visual ? 40 : 0 }} /> : null}
          {s.body ? <Body text={s.body} size={36} tone={bodyTone} style={{ marginTop: 22 }} /> : null}
          {s.bullets ? <CheckList items={s.bullets} size={36} gap={30} style={{ marginTop: 56 }} /> : null}
          {s.button ? (
            <div style={{ marginTop: 64 }}>
              <CtaButton text={s.button} icon={s.buttonIcon ?? "chevron"} />
            </div>
          ) : null}
          {s.sub ? <Body text={s.sub} size={30} tone="muted" style={{ marginTop: 22 }} /> : null}
          {visual || s.note ? <div style={{ flex: 1 }} /> : null}
          {visual ? <div style={{ display: "flex", justifyContent: "center" }}>{visual}</div> : null}
          {s.note ? <div style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 22, color: INK.muted, marginTop: 20, lineHeight: 1.4 }}>{fr(s.note)}</div> : null}
        </div>
      );
      break;
    }
    case "cta": {
      const size = s.titleSize ?? fitTitle(s.title ?? "", 116, W - 2 * M);
      content = (
        <div style={{ position: "absolute", left: M, right: M, top: 150, bottom: H - bottom, display: "flex", flexDirection: "column", justifyContent: "center" }}>
          {s.title ? <Title text={s.title} size={size} tone={textTone} onRed={red} /> : null}
          {s.body ? <Body text={s.body} size={38} tone={bodyTone} style={{ marginTop: 28, maxWidth: 900 }} /> : null}
          {s.button ? (
            <div style={{ marginTop: 64 }}>
              <CtaButton text={s.button} icon={s.buttonIcon ?? "chevron"} light={red} />
            </div>
          ) : null}
          {s.sub ? <Body text={s.sub} size={32} tone={red ? "white" : "muted"} style={{ marginTop: 26 }} /> : null}
          {visual ? <div style={{ display: "flex", justifyContent: "center", marginTop: 60 }}>{visual}</div> : null}
          <div style={{ position: "absolute", left: 0, bottom: 10 }}>
            <Lockup height={58} variant={red ? "mono-white" : "h-dark"} />
          </div>
        </div>
      );
      break;
    }
  }

  return (
    <AbsoluteFill style={{ width: W, height: H }}>
      {red ? <RedPanel width={W} height={H} /> : null}
      {header}
      {content}
      <Footer index={index + 1} total={total > 1 ? total : undefined} light={light} />
    </AbsoluteFill>
  );
};
