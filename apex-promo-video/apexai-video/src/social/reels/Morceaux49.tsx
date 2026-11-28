import React from "react";
import { AbsoluteFill } from "remotion";
import { Send } from "lucide-react";
import { C, FONT, GRAD, INK, alpha } from "../kit/tokens";
import { fr } from "../kit/text";
import { SocialBackground } from "../kit/Background";
import { Footer } from "../kit/elements";
import { E, mix, prog, reveal } from "../../lib/anim";
import { KLine, ZONE } from "./common";
import DATA from "../../data/morceaux49.json";

/**
 * Reel « 9 sur 49 » (28/11) : le tour 8 découpé en 49 secteurs, colorés selon le tour d'origine du tour idéal.
 * Un seul chiffre mis en avant : « 9 sur 49 ». Aucun chrono, gain ni numéro de virage à l'écran.
 */
export type M49View = "hook" | "others" | "cut" | "zoom" | "yours" | "end";

const Z = ZONE.reel;
const W = Z.x1 - Z.x0;
const box = (top: number): React.CSSProperties => ({ position: "absolute", left: Z.x0, width: W, top });
const GREY = alpha(C.text, 0.24);
const BEST = C.orange;
/** teinte de chaque tour d'origine (le tour 8, meilleur tour, reste seul en orange) */
const LAP: Record<number, string> = {
  1: alpha(C.success, 0.55),
  2: alpha(C.primary, 0.45),
  3: C.success,
  4: alpha(C.primary, 0.7),
  5: C.text,
  6: alpha(C.success, 0.75),
  7: C.primary,
  9: alpha(C.text, 0.68),
};

type Seg = (typeof DATA.segs)[number];
type Style = { color: string; width?: number; glow?: boolean; opacity?: number };

const path = (pts: number[][]) => "M" + pts.map((p) => `${p[0]},${p[1]}`).join("L");

/** Trace en 49 segments. gap : 0 = trace continue, 1 = morceaux séparés. cam : centre et zoom. */
const Track: React.FC<{ width: number; height: number; style: (s: Seg) => Style; gap?: number; cam?: { x: number; y: number; z: number } }> = ({ width, height, style, gap = 1, cam }) => {
  const pad = 36;
  const base = Math.min((width - 2 * pad) / DATA.w, (height - 2 * pad) / DATA.h);
  const z = cam?.z ?? 1;
  const s = base * z;
  const tx = width / 2 - (cam?.x ?? DATA.w / 2) * s;
  const ty = height / 2 - (cam?.y ?? DATA.h / 2) * s;
  const lw = 34 / Math.pow(z, 0.62);
  const segs = DATA.segs.map((q) => ({ q, st: style(q) }));
  // les morceaux mis en avant passent au premier plan
  segs.sort((a, b) => Number(!!a.st.glow) - Number(!!b.st.glow));
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: z > 1.01 ? "hidden" : "visible" }}>
      <g transform={`translate(${tx} ${ty}) scale(${s})`} fill="none" strokeLinejoin="round">
        {segs.map(({ q, st }) => {
          const n = q.pts.length - 1;
          const cut = 1.05 * gap;
          const at = (u: number) => {
            const i = Math.min(n - 1, Math.floor(u));
            const k = u - i;
            return [mix(q.pts[i][0], q.pts[i + 1][0], k), mix(q.pts[i][1], q.pts[i + 1][1], k)];
          };
          const pts = [at(cut), ...q.pts.slice(Math.floor(cut) + 1, Math.ceil(n - cut)), at(n - cut)];
          return (
            <path
              key={q.i}
              d={path(pts)}
              stroke={st.color}
              strokeWidth={lw * (st.width ?? 1)}
              strokeLinecap="butt"
              opacity={st.opacity ?? 1}
              style={st.glow ? { filter: `drop-shadow(0 0 ${12 / s}px ${st.color})` } : undefined}
            />
          );
        })}
      </g>
    </svg>
  );
};

const Big: React.FC<{ size: number }> = ({ size }) => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "baseline", gap: size * 0.2, fontFamily: FONT.display, fontWeight: 700, lineHeight: 0.95, letterSpacing: "-0.045em", color: C.text, whiteSpace: "pre" }}>
    <span style={{ fontSize: size * 1.18, color: BEST, textShadow: `0 0 60px ${alpha(BEST, 0.55)}` }}>9</span>
    <span style={{ fontSize: size * 0.7 }}>sur</span>
    <span style={{ fontSize: size * 1.18 }}>49</span>
  </div>
);

const Sub: React.FC<{ children: string; top: number; size?: number; style?: React.CSSProperties }> = ({ children, top, size = 42, style }) => (
  <div style={{ ...box(top), textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: size, lineHeight: 1.25, color: alpha(C.text, 0.86), ...style }}>{fr(children)}</div>
);

/** Temps des passages sur un morceau (barres sans valeurs) : le plus court est gardé. */
const Passes: React.FC<{ T: number; start: number; times: number[] }> = ({ T, start, times }) => {
  const max = Math.max(...times);
  const min = Math.min(...times);
  const pick = prog(T, start + 1.5, start + 1.9, E.outExpo);
  return (
    <div style={{ width: W, display: "flex", flexDirection: "column", gap: 10 }}>
      {times.map((v, i) => {
        const grow = prog(T, start + 0.1 + i * 0.09, start + 0.55 + i * 0.09, E.outExpo);
        const best = v === min;
        return (
          <div key={i} style={{ height: 32, borderRadius: 10, background: alpha(C.text, 0.06), opacity: best ? 1 : 1 - 0.55 * pick }}>
            <div
              style={{
                height: "100%",
                width: (v / max) * W * grow,
                borderRadius: 10,
                background: best && pick > 0.2 ? LAP[7] : alpha(C.text, 0.5),
                boxShadow: best && pick > 0.2 ? `0 0 ${34 * pick}px ${alpha(LAP[7], 0.95)}` : undefined,
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

const Tag: React.FC<{ T: number; at: number; color: string; text: string }> = ({ T, at, color, text }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 24, boxSizing: "border-box", padding: "24px 34px", borderRadius: 28, background: alpha(C.text, 0.06), border: `4px solid ${color}`, ...reveal(T, at, { dur: 0.35, blur: 10, y: 18 }) }}>
    <span style={{ width: 76, height: 26, borderRadius: 8, background: color, flex: "none" }} />
    <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 52, color: C.text }}>{fr(text)}</span>
  </div>
);

export const Morceaux49: React.FC<{ T: number; t0: number; t1: number; view: M49View; cue?: number }> = ({ T, t0, t1, view, cue = 2 }) => {
  if (view === "hook") {
    const pulse = 0.5 + 0.5 * Math.sin(T * 7);
    const k = prog(T, t0, t1, E.inOut);
    return (
      <>
        <div style={box(Z.y0 + 20)}>
          <Big size={172} />
        </div>
        <Sub top={505}>morceaux gardés du meilleur tour</Sub>
        <div style={{ ...box(585), transform: `scale(${1 + 0.035 * k})` }}>
          <Track width={W} height={725} style={(q) => (q.lap === DATA.best ? { color: BEST, width: 1.15 + 0.3 * pulse, glow: true } : { color: GREY })} />
        </div>
      </>
    );
  }
  if (view === "others") {
    const go = t0 + cue - 0.25;
    return (
      <>
        <div style={{ ...box(Z.y0 + 10), height: 240 }}>
          <KLine T={T} text="D'où viennent *les autres ?*" start={t0} size={100} />
        </div>
        <div style={box(520)}>
          <Track
            width={W}
            height={790}
            style={(q) => {
              if (q.lap === DATA.best) return { color: BEST, width: 1.15 };
              const on = T >= go + (q.i / DATA.segs.length) * 1.3;
              return on ? { color: LAP[q.lap], width: 1.15 } : { color: GREY };
            }}
          />
        </div>
      </>
    );
  }
  if (view === "cut") {
    const second = t0 + cue;
    if (T < second) {
      const gap = prog(T, t0 + 0.35, t0 + 1.3, E.inOut);
      return (
        <>
          <div style={{ ...box(Z.y0 + 10), height: 240 }}>
            <KLine T={T} text="La piste en *petits bouts*" start={t0} size={100} />
          </div>
          <div style={box(520)}>
            <Track
              width={W}
              height={790}
              gap={gap}
              style={(q) => {
                const head = prog(T, t0 + 0.35, second - 0.2) * DATA.segs.length;
                const d = head - q.i;
                return d >= 0 && d < 4 ? { color: C.text, width: 1.35, glow: true } : { color: alpha(C.text, 0.42) };
              }}
            />
          </div>
        </>
      );
    }
    return (
      <>
        <div style={{ ...box(Z.y0 + 10), height: 240 }}>
          <KLine T={T} key="fast" text="Le passage *le plus rapide*" start={second} size={96} />
        </div>
        <div style={{ ...box(490), height: 330, borderRadius: 32, overflow: "hidden", ...reveal(T, second, { dur: 0.3, blur: 8 }) }}>
          <Track width={W} height={330} cam={{ x: 590, y: 905, z: 4.6 }} style={(q) => (q.i === 37 ? { color: LAP[7], width: 1.25, glow: true } : { color: GREY })} />
        </div>
        <div style={box(850)}>
          <Passes T={T} start={second} times={DATA.zoom["37"]} />
        </div>
        <Sub top={1245} size={34} style={reveal(T, second + 0.3, { dur: 0.3 })}>
          chaque passage sur ce bout : barre courte = rapide
        </Sub>
      </>
    );
  }
  if (view === "zoom") {
    const second = t0 + cue;
    const k = prog(T, t0, t0 + 0.9, E.inOut);
    const slide = prog(T, second - 0.25, second + 0.35, E.inOut);
    return (
      <>
        <div style={{ ...box(Z.y0), height: 730, borderRadius: 36, overflow: "hidden" }}>
          <Track
            width={W}
            height={730}
            cam={{ x: mix(DATA.w / 2, mix(590, 602, slide), k), y: mix(DATA.h / 2, mix(918, 945, slide), k), z: mix(1, 3.5, k) }}
            style={(q) => {
              if (q.i === 37) return { color: C.primary, width: 1.35, glow: true };
              if (q.i === 38 && T >= second) return { color: C.text, width: 1.35, glow: true };
              return { color: GREY };
            }}
          />
        </div>
        <div style={box(1040)}>
          <Tag T={T} at={t0 + 0.35} color={C.primary} text="Ce bout : un tour" />
        </div>
        <div style={box(1180)}>
          <Tag T={T} at={second} color={C.text} text="Le suivant : un autre" />
        </div>
      </>
    );
  }
  if (view === "yours") {
    return (
      <>
        <div style={{ ...box(Z.y0 + 10), height: 240 }}>
          <KLine T={T} text="Chaque bout, tu l'as *déjà roulé.*" start={t0} size={96} />
        </div>
        <div style={box(520)}>
          <Track
            width={W}
            height={790}
            gap={1 - prog(T, t1 - 0.9, t1 - 0.2, E.inOut)}
            style={(q) => {
              const on = T >= t0 + 0.15 + (q.i / DATA.segs.length) * 1.8;
              return on ? { color: q.lap === DATA.best ? BEST : LAP[q.lap], width: 1.15 } : { color: GREY };
            }}
          />
        </div>
      </>
    );
  }
  const send = t0 + cue;
  const k = prog(T, send, send + 0.45, E.outExpo);
  const fly = Math.sin((T - t0) * 3.2);
  return (
    <>
      <div style={box(Z.y0 + 40)}>
        <div style={{ boxSizing: "border-box", padding: "54px 36px 62px", borderRadius: 40, background: alpha(C.text, 0.05), border: `4px solid ${alpha(C.primary, 0.85)}`, boxShadow: `0 0 70px -20px ${alpha(C.primary, 0.85)}`, ...reveal(T, t0, { dur: 0.35, blur: 12, y: 24 }) }}>
          <KLine T={T} text="Vise d'abord *ton propre tour parfait.*" start={t0 + 0.05} size={104} />
        </div>
      </div>
      <div style={{ ...box(820), display: "flex", flexDirection: "column", alignItems: "center", gap: 44 }}>
        <div style={{ width: 220, height: 220, borderRadius: "50%", background: GRAD.primary, boxShadow: `0 0 90px -10px ${alpha(C.primary, 0.85)}`, display: "flex", alignItems: "center", justifyContent: "center", opacity: k, transform: `scale(${mix(0.5, 1, k)}) translate(${fly * 7}px, ${-fly * 7}px)` }}>
          <Send size={112} color={C.text} strokeWidth={2.2} style={{ marginLeft: -10, marginTop: 10 }} />
        </div>
        <div style={{ width: W }}>{T >= send ? <KLine T={T} text="Envoie à *ton pote*" start={send} size={100} /> : null}</div>
      </div>
      {T < send ? (
        <div style={{ ...box(760), opacity: 1 - prog(T, send - 0.25, send), display: "flex", justifyContent: "center", color: INK.soft }}>
          <Track width={560} height={540} style={(q) => (q.lap === DATA.best ? { color: BEST, width: 1.15 } : { color: LAP[q.lap], width: 1.15 })} />
        </div>
      ) : null}
    </>
  );
};

/** Miniature choisie : « 9 sur 49 » + trace, contenu dans le recadrage de la grille du profil. */
export const Morceaux49Cover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <SocialBackground width={1080} height={1920} preset="top" />
    <div style={{ position: "absolute", left: 80, width: 920, top: 330 }}>
      <Big size={210} />
    </div>
    <div style={{ position: "absolute", left: 80, width: 920, top: 620 }}>
      <KLine T={5} text="Ton tour *parfait*" start={0} size={104} noIn />
    </div>
    <div style={{ position: "absolute", left: 130, top: 800 }}>
      <Track width={820} height={790} style={(q) => (q.lap === DATA.best ? { color: BEST, width: 1.35, glow: true } : { color: GREY })} />
    </div>
    <Footer y={1800} />
  </AbsoluteFill>
);
