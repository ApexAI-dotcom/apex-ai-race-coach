import React from "react";
import { C, FONT, GRAD, INK, alpha } from "../kit/tokens";
import { fr } from "../kit/text";
import { E, prog, reveal } from "../../lib/anim";

/**
 * Temps perdu à chaque passage dans un même virage (ordre de la séance, sans numéro de tour).
 * cues (s depuis le début du temps) : [la grosse barre monte, le chiffre apparaît].
 */
export const CornerPasses: React.FC<{ T: number; t0: number; width: number; values: number[]; cues: number[] }> = ({ T, t0, width, values, cues }) => {
  const H = 440;
  const max = Math.max(...values);
  const big = values.indexOf(max);
  const [riseAt, numAt] = [t0 + (cues[0] ?? 2.6), t0 + (cues[1] ?? 3.6)];
  const gap = 18;
  const bw = (width - gap * (values.length - 1)) / values.length;
  const dim = 1 - 0.55 * prog(T, numAt, numAt + 0.5, E.inOut);
  return (
    <div style={{ width }}>
      <div style={{ position: "relative", height: H + 170 }}>
        {values.map((v, i) => {
          const isBig = i === big;
          // les petites barres entrent une à une, la grosse attend son signal
          const k = isBig ? prog(T, riseAt, riseAt + 0.7, E.outExpo) : prog(T, t0 + 0.25 + i * 0.13, t0 + 0.7 + i * 0.13, E.outExpo);
          const h = Math.max(8, (v / max) * H * k);
          return (
            <div key={i} style={{ position: "absolute", left: i * (bw + gap), bottom: 0, width: bw }}>
              <div style={{ position: "absolute", left: 0, bottom: 0, width: bw, height: H, borderRadius: 14, background: alpha(C.text, 0.05) }} />
              <div
                style={{
                  position: "relative",
                  width: bw,
                  height: h,
                  borderRadius: 14,
                  background: isBig ? GRAD.primary : alpha(C.text, 0.7),
                  opacity: isBig ? 1 : dim,
                  boxShadow: isBig && k > 0 ? `0 0 ${(46 * k).toFixed(0)}px -6px ${alpha(C.primary, 0.85)}` : undefined,
                }}
              />
            </div>
          );
        })}
        <div style={{ position: "absolute", left: Math.min(width - 330, big * (bw + gap) + bw / 2 - 165), width: 330, bottom: H + 28, display: "flex", justifyContent: "center" }}>
          {T >= numAt ? (
            // chiffre affiché d'un bloc : aucun défilement de fausses valeurs
            <div style={reveal(T, numAt, { dur: 0.25, blur: 6, y: 14 })}>
            <span style={{ display: "inline-flex", alignItems: "baseline", fontFamily: FONT.display, fontWeight: 700, fontSize: 130, letterSpacing: "-0.045em", lineHeight: 0.9, color: C.primary, filter: `drop-shadow(0 0 8px ${alpha(C.primary, 0.5)})` }}>
              0,26<span style={{ fontSize: 88, marginLeft: 14 }}>s</span>
            </span>
            </div>
          ) : null}
        </div>
      </div>
      <div style={{ height: 3, background: alpha(C.text, 0.22), marginTop: 12 }} />
      <div style={{ marginTop: 26, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 34, lineHeight: 1.35, color: INK.soft, ...reveal(T, t0 + 0.5, { dur: 0.5, blur: 8, y: 10 }) }}>
        {fr("Virage 10 · une barre = un passage")}
        <br />
        {fr("Temps perdu face au meilleur passage")}
      </div>
    </div>
  );
};

/** Écran « règle à garder » : deux cartes, la seconde arrive à `second` s après le début du temps. */
export const RuleCards: React.FC<{ T: number; t0: number; width: number; out: number; second: number }> = ({ T, t0, width, out, second }) => {
  const cards = [
    { at: t0 + 0.1, label: "Une erreur isolée", action: "Oublie-la.", color: C.success },
    { at: t0 + second, label: "Une erreur qui revient", action: "Travaille-la.", color: C.primary },
  ];
  return (
    <div style={{ width, display: "flex", flexDirection: "column", gap: 48 }}>
      {cards.map((c) => (
        <div
          key={c.label}
          style={{
            boxSizing: "border-box",
            width,
            padding: "52px 56px",
            borderRadius: 34,
            background: alpha(C.text, 0.05),
            border: `3px solid ${alpha(c.color, 0.75)}`,
            boxShadow: `0 0 60px -22px ${alpha(c.color, 0.8)}`,
            ...reveal(T, c.at, { dur: 0.5, blur: 14, y: 34 }, out),
          }}
        >
          <div style={{ fontFamily: FONT.body, fontWeight: 600, fontSize: 46, color: alpha(C.text, 0.82) }}>{fr(c.label)}</div>
          <div style={{ marginTop: 18, fontFamily: FONT.display, fontWeight: 700, fontSize: 112, letterSpacing: "-0.035em", lineHeight: 1, color: c.color }}>{fr(c.action)}</div>
        </div>
      ))}
    </div>
  );
};
