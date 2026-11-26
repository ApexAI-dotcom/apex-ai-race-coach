import React from "react";
import { MapPin, Zap } from "lucide-react";
import { C, FONT, GRAD, INK, alpha } from "../kit/tokens";
import { fr } from "../kit/text";
import { LogoIcon } from "../../components/Logo";
import { E, prog, reveal } from "../../lib/anim";
import { gradientText } from "../../theme";
import { KLine, ZONE } from "./common";
import DATA from "../../data/analysis-2211.json";

/**
 * Reel « 12 virages notés, une priorité » (26/11).
 * Données : analyse du 22/11 (tracé, notes, ordre des priorités). Ni temps, ni vitesse, ni score.
 */
export type NotesView = "hero" | "all" | "b" | "rank" | "absent" | "subtitle" | "rule" | "end";

const Z = ZONE.reel;
const W = Z.x1 - Z.x0;
const SUBTITLE = "Classés par temps réellement perdu, mesuré sur tes chronos";
const gradeColor = (g: string) => (g === "A" ? C.text : C.orange);

const Grade: React.FC<{ g: string; size: number; style?: React.CSSProperties }> = ({ g, size, style }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      width: size,
      height: size,
      borderRadius: size * 0.28,
      background: gradeColor(g),
      color: "#0A0A0A",
      fontFamily: FONT.display,
      fontWeight: 700,
      fontSize: size * 0.68,
      lineHeight: 1,
      flexShrink: 0,
      ...style,
    }}
  >
    {g}
  </span>
);

/** Carte du circuit : 12 virages avec numéro et note. mode : virage 7 seul, tous, ou B en avant. */
const NotesMap: React.FC<{ T: number; t0: number; mode: "hero" | "all" | "b" }> = ({ T, t0, mode }) => {
  const H = 760;
  const s = H / 1000;
  const left = (W - 1000 * s) / 2;
  const d = "M" + DATA.track.map((p) => `${p[0]},${p[1]}`).join("L");
  const pulse = 0.5 + 0.5 * Math.sin(T * 5);
  return (
    <div style={{ position: "relative", width: W, height: H }}>
      <svg width={H} height={H} viewBox="0 0 1000 1000" style={{ position: "absolute", left, top: 0, overflow: "visible" }}>
        <path d={d} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth={64} strokeLinejoin="round" strokeLinecap="round" />
        <path d={d} fill="none" stroke="rgba(255,255,255,0.26)" strokeWidth={34} strokeLinejoin="round" strokeLinecap="round" />
        <path d={d} fill="none" stroke="#161616" strokeWidth={28} strokeLinejoin="round" strokeLinecap="round" />
      </svg>
      {DATA.corners.map((c, i) => {
        const hero = mode === "hero" && c.n === 7;
        const isB = c.grade === "B";
        const dim = mode === "hero" ? (hero ? 1 : 0.3) : mode === "b" ? (isB ? 1 : 0.28) : 1;
        const lit = hero || (mode === "b" && isB);
        const r = hero ? 44 : 29;
        const x = left + c.x * s;
        const y = c.y * s;
        const inK = mode === "all" ? prog(T, t0 + 0.05 + i * 0.09, t0 + 0.35 + i * 0.09, E.outExpo) : 1;
        const showGrade = mode !== "hero" || hero;
        return (
          <div key={c.n} style={{ position: "absolute", left: x - r, top: y - r, width: r * 2, height: r * 2, opacity: dim, zIndex: lit ? 2 : 1 }}>
            <div
              style={{
                width: "100%",
                height: "100%",
                boxSizing: "border-box",
                borderRadius: "50%",
                border: "3px solid transparent",
                background: lit ? `${GRAD.primary} border-box` : `linear-gradient(#000,#000) padding-box, linear-gradient(135deg,#F97316,#FF0000) border-box`,
                boxShadow: lit ? `0 0 ${(24 + 22 * pulse).toFixed(0)}px ${alpha(C.primary, 0.85)}` : undefined,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: FONT.display,
                fontWeight: 700,
                fontSize: hero ? 46 : 30,
                color: C.text,
              }}
            >
              {c.n}
            </div>
            {showGrade ? (
              <Grade g={c.grade} size={hero ? 62 : 40} style={{ position: "absolute", left: r * 2 - (hero ? 20 : 15), top: hero ? -38 : -22, opacity: inK, transform: `scale(${0.5 + 0.5 * inK})`, boxShadow: "0 4px 14px rgba(0,0,0,0.6)" }} />
            ) : null}
          </div>
        );
      })}
    </div>
  );
};

const Pill: React.FC<{ children: React.ReactNode; strong?: boolean; size: number }> = ({ children, strong, size }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      padding: `${size * 0.26}px ${size * 0.62}px`,
      borderRadius: 999,
      background: strong ? GRAD.primary : alpha(C.text, 0.07),
      border: `2px solid ${strong ? "transparent" : alpha(C.text, 0.16)}`,
      fontFamily: FONT.body,
      fontWeight: 600,
      fontSize: size,
      color: C.text,
      whiteSpace: "nowrap",
    }}
  >
    {children}
  </span>
);

const Row: React.FC<{ a: (typeof DATA.priorities)[number]; hl: boolean; compact?: boolean }> = ({ a, hl, compact }) => (
  <div
    style={{
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      boxSizing: "border-box",
      height: compact ? 104 : 150,
      padding: "0 28px",
      borderRadius: 24,
      background: hl ? alpha(C.primary, 0.13) : alpha(C.text, 0.035),
      border: `3px solid ${hl ? C.primary : alpha(C.text, 0.1)}`,
      boxShadow: hl ? `0 0 44px -14px ${alpha(C.primary, 0.9)}` : undefined,
    }}
  >
    <div style={{ display: "flex", flexDirection: compact ? "row" : "column", alignItems: compact ? "center" : "flex-start", gap: compact ? 26 : 12 }}>
      <div style={{ display: "flex", gap: 14 }}>
        <Pill size={compact ? 30 : 28} strong={hl}>{`Priorité ${a.p}`}</Pill>
        {compact ? null : <Pill size={28}>{a.category.charAt(0).toUpperCase() + a.category.slice(1)}</Pill>}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10, fontFamily: FONT.display, fontWeight: 700, fontSize: compact ? 44 : 46, color: C.primary }}>
        <MapPin size={36} color={C.primary} strokeWidth={2.4} />
        {`Virage ${a.n}`}
      </div>
    </div>
    <Grade g={a.grade} size={compact ? 62 : 80} />
  </div>
);

/** Carte « Conseils de Coaching » de l'app, sans message ni chiffre de temps. */
const CoachingCard: React.FC<{ T: number; t0: number; big?: boolean; stagger?: boolean }> = ({ T, t0, big, stagger }) => (
  <div style={{ boxSizing: "border-box", width: W, padding: "30px 28px", borderRadius: 34, background: "#141414", border: `2px solid ${alpha(C.text, 0.1)}` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 16, fontFamily: FONT.display, fontWeight: 700, fontSize: 46, color: C.text }}>
      <Zap size={44} color={C.primary} fill={C.primary} />
      Conseils de Coaching
    </div>
    <div
      style={{
        marginTop: 14,
        marginBottom: 24,
        fontFamily: FONT.body,
        fontWeight: big ? 700 : 500,
        fontSize: big ? 48 : 26,
        lineHeight: 1.28,
        color: big ? C.text : INK.soft,
        padding: big ? "18px 22px" : 0,
        borderRadius: 20,
        background: big ? alpha(C.primary, 0.14) : "transparent",
        border: big ? `3px solid ${alpha(C.orange, 0.85)}` : "none",
      }}
    >
      {fr(SUBTITLE)}
    </div>
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {DATA.priorities.map((a, i) => (
        <div key={a.p} style={stagger ? reveal(T, t0 + 0.05 + i * 0.12, { dur: 0.4, blur: 10, y: 22 }) : undefined}>
          <Row a={a} hl={!big && a.p === 1} />
        </div>
      ))}
    </div>
  </div>
);

export const NotesPriority: React.FC<{ T: number; t0: number; t1: number; view: NotesView }> = ({ T, t0, t1, view }) => {
  const box = (top: number): React.CSSProperties => ({ position: "absolute", left: Z.x0, width: W, top });

  if (view === "hero" || view === "all" || view === "b") {
    return (
      <>
        <div style={box(Z.y0)}>
          {view === "hero" ? (
            <>
              <KLine T={T} text="Noté *A.* À travailler en premier." start={t0} size={92} noIn />
              <div style={{ marginTop: 26, display: "flex", justifyContent: "center", alignItems: "center", gap: 22 }}>
                <Grade g="A" size={86} />
                <Pill size={44} strong>Priorité 1</Pill>
              </div>
            </>
          ) : view === "all" ? (
            <KLine T={T} text="*12* virages notés" start={t0} size={104} />
          ) : (
            <KLine T={T} text="Tu irais voir les *B ?*" start={t0} size={96} />
          )}
        </div>
        <div style={box(612)}>
          <NotesMap T={T} t0={t0} mode={view} />
        </div>
      </>
    );
  }
  if (view === "rank") {
    return (
      <div style={box(Z.y0)}>
        <div style={{ marginBottom: 30 }}>
          <KLine T={T} text="En priorité : le *virage 7*" start={t0} size={68} />
        </div>
        <CoachingCard T={T} t0={t0} stagger />
      </div>
    );
  }
  if (view === "absent") {
    return (
      <div style={box(Z.y0)}>
        <KLine T={T} text="Le moins bien noté : *absent*" start={t0} size={74} />
        <div
          style={{
            marginTop: 34,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxSizing: "border-box",
            width: W,
            height: 150,
            padding: "0 38px",
            borderRadius: 28,
            border: `4px dashed ${C.orange}`,
            ...reveal(T, t0 + 0.2, { dur: 0.45, blur: 12, y: 20 }),
          }}
        >
          <div>
            <div style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 58, color: C.text }}>{`Virage ${DATA.lowest}`}</div>
            <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 28, color: INK.soft }}>{fr("Le moins bien noté")}</div>
          </div>
          <Grade g="B" size={90} />
        </div>
        <div style={{ marginTop: 34, marginBottom: 16, fontFamily: FONT.body, fontWeight: 600, fontSize: 30, letterSpacing: "0.14em", textTransform: "uppercase", color: INK.soft, ...reveal(T, t0 + 0.6, { dur: 0.4 }) }}>
          Les 4 priorités
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {DATA.priorities.map((a, i) => (
            <div key={a.p} style={reveal(T, t0 + 0.7 + i * 0.12, { dur: 0.4, blur: 10, y: 18 })}>
              <Row a={a} hl={false} compact />
            </div>
          ))}
        </div>
      </div>
    );
  }
  if (view === "subtitle") {
    return (
      <div style={box(Z.y0 + 20)}>
        <CoachingCard T={T} t0={t0} big />
      </div>
    );
  }
  if (view === "rule") {
    return (
      <div style={box(Z.y0 + 230)}>
        <div style={{ marginBottom: 36, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 32, letterSpacing: "0.2em", textTransform: "uppercase", color: INK.soft, ...reveal(T, t0, { dur: 0.3 }) }}>
          La règle
        </div>
        <div style={{ boxSizing: "border-box", padding: "70px 44px", borderRadius: 40, background: alpha(C.text, 0.05), border: `4px solid ${alpha(C.primary, 0.85)}`, boxShadow: `0 0 70px -20px ${alpha(C.primary, 0.85)}`, ...reveal(T, t0 + 0.05, { dur: 0.45, blur: 14, y: 30 }, t1 - 0.2) }}>
          <KLine T={T} text="Regarde le *temps perdu* avant la note." start={t0 + 0.1} size={104} />
        </div>
      </div>
    );
  }
  // fin : la règle reste lisible, puis enregistrement et appel à essayer
  return (
    <div style={box(Z.y0 + 30)}>
      <div style={reveal(T, t0, { dur: 0.35, blur: 10 })}>
        <KLine T={T} text="Regarde le *temps perdu* avant la note." start={t0} size={66} />
      </div>
      <div style={{ marginTop: 60, display: "flex", justifyContent: "center", alignItems: "center", gap: 22, ...reveal(T, t0 + 0.3, { dur: 0.45, blur: 12, y: 18 }) }}>
        <LogoIcon size={80} />
        <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 92, letterSpacing: "-0.02em", lineHeight: 1, color: C.text }}>
          APEX<span style={gradientText(GRAD.keyword)}>AI</span>
        </span>
      </div>
      <div style={{ marginTop: 56, textAlign: "center", fontFamily: FONT.display, fontWeight: 600, fontSize: 50, lineHeight: 1.22, color: C.text, ...reveal(T, t0 + 0.5, { dur: 0.45, blur: 12, y: 18 }) }}>
        Enregistre-le
        <br />
        pour ta prochaine séance
      </div>
      <div style={{ marginTop: 56, boxSizing: "border-box", padding: "34px 30px", borderRadius: 40, background: GRAD.primary, boxShadow: `0 0 60px -10px ${alpha(C.primary, 0.75)}`, textAlign: "center", fontFamily: FONT.display, fontWeight: 700, fontSize: 52, lineHeight: 1.22, color: C.text, ...reveal(T, t0 + 0.7, { dur: 0.45, blur: 12, y: 20 }) }}>
        Inscris-toi et viens essayer.
        <br />
        Lien en bio.
      </div>
      <div style={{ marginTop: 40, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 40, color: C.text, ...reveal(T, t0 + 0.85, { dur: 0.45, blur: 10 }) }}>apexai.racing</div>
    </div>
  );
};
