import React from "react";
import { AbsoluteFill } from "remotion";
import { Send } from "lucide-react";
import { C, FONT, GRAD, INK, alpha } from "../kit/tokens";
import { fr } from "../kit/text";
import { SocialBackground } from "../kit/Background";
import { Footer } from "../kit/elements";
import { E, kf, mix, prog, reveal } from "../../lib/anim";
import { KLine, ZONE } from "./common";
import DATA from "../../data/virage6-g.json";

/**
 * Reel « Plus de 2 g au virage 6 » (27/11).
 * Données : tour 4 pour le passage animé, g latéral GPS en moyenne glissante sur 0,5 s ; barres des 10 tours, sans valeurs.
 * Un seul chiffre mis en avant : 2 g.
 */
export type V6View = "hook" | "turn" | "helmet" | "neck" | "bars" | "slow" | "rule" | "end";

const Z = ZONE.reel;
const W = Z.x1 - Z.x0;
const MENTION = "g latéral du kart, calculé au GPS";
const box = (top: number): React.CSSProperties => ({ position: "absolute", left: Z.x0, width: W, top });

const RUN = DATA.run;
const sample = (t: number) => {
  if (t <= RUN[0].t) return RUN[0];
  for (let i = 1; i < RUN.length; i++) {
    if (t <= RUN[i].t) {
      const a = RUN[i - 1];
      const b = RUN[i];
      const k = (t - a.t) / (b.t - a.t);
      return { t, p: [mix(a.p[0], b.p[0], k), mix(a.p[1], b.p[1], k)], g: mix(a.g, b.g, k) };
    }
  }
  return RUN[RUN.length - 1];
};
/** premier instant (avant le pic) à partir duquel le g reste au-dessus de 2 jusqu'au pic */
const CROSS = (() => {
  let t = 0;
  for (let i = RUN.length - 1; i >= 0; i--) {
    if (RUN[i].t > 0) continue;
    if (RUN[i].g < 2) break;
    t = RUN[i].t;
  }
  return t;
})();

const path = (pts: number[][]) => "M" + pts.map((p) => `${p[0]},${p[1]}`).join("L");
const TRACK = path(DATA.track) + "Z";
const CORNER = path(RUN.filter((r) => r.t >= -0.9 && r.t <= 0.8).map((r) => r.p));

/** Vue du circuit. zoom > 1 : la caméra se resserre sur le virage 6. */
const Map6: React.FC<{ T: number; width: number; height: number; zoom?: number; dot?: number[]; trail?: number[][]; label?: boolean }> = ({ T, width, height, zoom = 1, dot, trail, label }) => {
  const k = Math.min(1, Math.max(0, zoom - 1));
  const cx = mix(500, DATA.v6[0], k);
  const cy = mix(500, DATA.v6[1], k);
  const base = Math.min(width, height) / 1000;
  const s = base * zoom;
  const tx = width / 2 - cx * s;
  const ty = height / 2 - cy * s;
  const pulse = 0.5 + 0.5 * Math.sin(T * 6);
  const mx = tx + DATA.v6[0] * s;
  const my = ty + DATA.v6[1] * s;
  const lw = 1 / Math.sqrt(zoom);
  return (
    <svg width={width} height={height} style={{ display: "block", overflow: zoom > 1 ? "hidden" : "visible" }}>
      <g transform={`translate(${tx} ${ty}) scale(${s})`} fill="none" strokeLinejoin="round" strokeLinecap="round">
        <path d={TRACK} stroke="rgba(255,255,255,0.05)" strokeWidth={66 * lw} />
        <path d={TRACK} stroke="rgba(255,255,255,0.3)" strokeWidth={34 * lw} />
        <path d={TRACK} stroke="#161616" strokeWidth={27 * lw} />
        <path d={CORNER} stroke={C.primary} strokeWidth={27 * lw} style={{ filter: `drop-shadow(0 0 14px ${alpha(C.primary, 0.9)})` }} />
        {trail && trail.length > 1 ? <path d={path(trail)} stroke="#FFFFFF" strokeOpacity={0.75} strokeWidth={10 * lw} /> : null}
      </g>
      {dot ? (
        <g>
          <circle cx={tx + dot[0] * s} cy={ty + dot[1] * s} r={34} fill={alpha("#FFFFFF", 0.18)} />
          <circle cx={tx + dot[0] * s} cy={ty + dot[1] * s} r={18} fill="#FFFFFF" stroke={C.orange} strokeWidth={5} />
        </g>
      ) : (
        <g>
          <circle cx={mx} cy={my} r={48 + 22 * pulse} fill="none" stroke={C.orange} strokeWidth={6} opacity={0.9 - 0.55 * pulse} />
          <circle cx={mx} cy={my} r={44} fill="none" stroke="#FFFFFF" strokeWidth={7} />
        </g>
      )}
      {label ? (
        <g transform={`translate(${mx + 78} ${my - 42})`}>
          <rect width={236} height={84} rx={42} fill="#0A0A0A" stroke={C.orange} strokeWidth={4} />
          <text x={118} y={57} textAnchor="middle" fill="#FFFFFF" fontFamily={FONT.display} fontWeight={700} fontSize={46}>
            Virage 6
          </text>
        </g>
      ) : null}
    </svg>
  );
};

const Mention: React.FC<{ T: number; t0: number; top: number }> = ({ T, t0, top }) => (
  <div style={{ ...box(top), textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 34, color: alpha(C.text, 0.85), ...reveal(T, t0 + 0.1, { dur: 0.3 }) }}>{fr(MENTION)}</div>
);

const GMAX = 2.5;
const Gauge: React.FC<{ g: number }> = ({ g }) => {
  const over = g >= 2;
  const lx = (2 / GMAX) * W;
  return (
    <div style={{ position: "relative", width: W, height: 190 }}>
      <div style={{ position: "absolute", left: lx - 110, width: 220, top: 0, textAlign: "center", fontFamily: FONT.display, fontWeight: 700, fontSize: 76, lineHeight: 1, color: over ? C.orange : C.text }}>{fr("2 g")}</div>
      <div style={{ position: "absolute", left: 0, top: 100, width: W, height: 70, borderRadius: 20, background: alpha(C.text, 0.08), overflow: "hidden" }}>
        <div style={{ width: (Math.min(g, GMAX) / GMAX) * W, height: "100%", background: over ? GRAD.primary : alpha(C.text, 0.55) }} />
      </div>
      <div style={{ position: "absolute", left: lx - 4, top: 84, width: 8, height: 102, borderRadius: 4, background: "#FFFFFF", boxShadow: over ? `0 0 34px ${C.orange}` : undefined }} />
    </div>
  );
};

/** Pilote vu de face : casque poussé vers l'extérieur du virage (virage à droite : extérieur = droite de l'écran). */
const Helmet: React.FC<{ lean: number; neck: number; arrow: number }> = ({ lean, neck, arrow }) => {
  const dir = DATA.right ? 1 : -1;
  return (
    <svg width={W} height={640} viewBox="0 0 860 640" style={{ display: "block", overflow: "visible" }}>
      <g transform={DATA.right ? "" : "translate(860 0) scale(-1 1)"}>
        <path d="M80 640 C100 540 200 505 300 490 L440 490 C540 505 640 540 660 640 Z" fill="#1B1B1B" stroke={alpha("#FFFFFF", 0.35)} strokeWidth={5} />
        <g transform={`rotate(${lean * 7 * dir * dir} 370 490)`}>
          <path d="M320 380 L420 380 L430 500 L310 500 Z" fill={neck > 0 ? C.primary : "#2A2A2A"} opacity={neck > 0 ? 0.55 + 0.45 * neck : 1} style={{ filter: neck > 0 ? `drop-shadow(0 0 ${30 * neck}px ${C.primary})` : undefined }} />
          <path d="M170 250 C170 110 260 40 370 40 C480 40 570 110 570 250 L555 360 C540 405 470 425 370 425 C270 425 200 405 185 360 Z" fill="#141414" stroke="#FFFFFF" strokeWidth={9} />
          <path d="M205 200 C260 170 480 170 535 200 L525 285 C470 305 270 305 215 285 Z" fill="#26262B" stroke={C.orange} strokeWidth={7} />
          <path d="M345 44 L395 44 L400 172 L340 172 Z" fill={C.primary} />
          <path d="M300 355 L440 355" stroke={alpha("#FFFFFF", 0.5)} strokeWidth={12} strokeLinecap="round" />
        </g>
        <g opacity={arrow} transform={`translate(${mix(-60, 0, arrow)} 0)`}>
          <path d="M610 205 L730 205 L730 160 L850 240 L730 320 L730 275 L610 275 Z" fill={C.orange} style={{ filter: `drop-shadow(0 0 24px ${alpha(C.orange, 0.9)})` }} />
        </g>
      </g>
    </svg>
  );
};

const Bars: React.FC<{ T: number; t0: number; litAt: number; slow: boolean }> = ({ T, t0, litAt, slow }) => {
  const H = 600;
  const left = 96;
  const step = (W - left) / 10;
  const lineY = H - (2 / GMAX) * H;
  return (
    <div style={{ position: "relative", width: W, height: H + 80 }}>
      {DATA.laps.map((l, i) => {
        const grow = slow ? 1 : prog(T, t0 + 0.04 + i * 0.05, t0 + 0.4 + i * 0.05, E.outExpo);
        const h = (l.g / GMAX) * H * grow;
        const over = l.g > 2;
        const lit = slow ? !over : over && T >= litAt;
        const pulse = 0.5 + 0.5 * Math.sin(T * 7);
        return (
          <React.Fragment key={l.n}>
            <div
              style={{
                position: "absolute",
                left: left + i * step + 8,
                width: step - 16,
                top: H - h,
                height: h,
                borderRadius: "14px 14px 4px 4px",
                background: lit ? (slow ? C.primary : GRAD.primary) : alpha(C.text, slow ? 0.14 : 0.35),
                boxShadow: lit && slow ? `0 0 ${20 + 20 * pulse}px ${alpha(C.primary, 0.9)}` : undefined,
                border: lit && slow ? "4px solid #FFFFFF" : undefined,
                boxSizing: "border-box",
              }}
            />
            <div style={{ position: "absolute", left: left + i * step, width: step, top: H + 18, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 30, color: lit ? C.text : INK.soft }}>{l.n}</div>
          </React.Fragment>
        );
      })}
      <svg width={W} height={8} style={{ position: "absolute", left: 0, top: lineY - 4 }}>
        <line x1={90} y1={4} x2={W} y2={4} stroke="#FFFFFF" strokeWidth={6} strokeDasharray="18 12" />
      </svg>
      <div style={{ position: "absolute", left: -4, top: lineY - 32, fontFamily: FONT.display, fontWeight: 700, fontSize: 54, lineHeight: "64px", color: C.text }}>{fr("2 g")}</div>
      <div style={{ position: "absolute", left, width: W - left, top: H + 60, textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 26, letterSpacing: "0.2em", textTransform: "uppercase", color: INK.soft }}>Tours</div>
    </div>
  );
};

export const Virage6G: React.FC<{ T: number; t0: number; t1: number; view: V6View }> = ({ T, t0, t1, view }) => {
  if (view === "hook") {
    return (
      <>
        <div style={box(Z.y0 + 10)}>
          <KLine T={T} text="Ton cou *brûle* après la séance ?" start={t0} size={118} noIn />
        </div>
        <div style={box(660)}>
          <Map6 T={T} width={W} height={680} label />
        </div>
      </>
    );
  }
  if (view === "turn") {
    // temps vidéo vers temps réel du tour 4 : le franchissement des 2 g tombe sur « deux g » (4,65 s)
    const tr = kf(T, [t0, 4.65, 5.4, t1], [-2.6, CROSS, 0, 0.45], E.linear);
    const s = sample(tr);
    const trail = RUN.filter((r) => r.t <= tr && r.t >= tr - 0.9).map((r) => r.p).concat([s.p]);
    return (
      <>
        <div style={{ ...box(Z.y0), height: 690, borderRadius: 36, overflow: "hidden" }}>
          <Map6 T={T} width={W} height={690} zoom={kf(T, [t0, t0 + 1.8], [1, 2.1], E.inOut)} dot={s.p} trail={trail} />
        </div>
        <div style={box(990)}>
          <Gauge g={s.g} />
        </div>
        <Mention T={T} t0={t0} top={1212} />
      </>
    );
  }
  if (view === "helmet") {
    const k = prog(T, t0 + 0.2, t0 + 1.6, E.inOut);
    return (
      <>
        <div style={box(Z.y0 + 10)}>
          <KLine T={T} text="À plus de *2 g*" start={t0} size={104} />
        </div>
        <div style={box(470)}>
          <Helmet lean={k} neck={0} arrow={prog(T, 7.75, 8.25, E.outExpo)} />
        </div>
        {T >= 9.1 ? (
          <div style={box(1150)}>
            <KLine T={T} text="*2 ×* leur poids" start={9.15} size={112} />
          </div>
        ) : (
          <div style={{ ...box(1170), textAlign: "center", fontFamily: FONT.body, fontWeight: 600, fontSize: 48, color: INK.soft, ...reveal(T, t0 + 0.6, { dur: 0.4 }) }}>{fr("Ta tête et ton casque")}</div>
        )}
      </>
    );
  }
  if (view === "neck") {
    return (
      <>
        <div style={box(Z.y0 + 20)}>
          <KLine T={T} text="Ton cou *retient.*" start={t0} size={132} />
        </div>
        <div style={box(630)}>
          <Helmet lean={1} neck={prog(T, t0, t0 + 0.5, E.outExpo)} arrow={0} />
        </div>
      </>
    );
  }
  if (view === "bars" || view === "slow") {
    const slow = view === "slow";
    return (
      <>
        <div style={{ ...box(Z.y0 + 10), height: 220 }}>
          <KLine T={T} key={view} text={slow ? "*3 tours* les plus lents ici" : "Au virage 6, tour par tour"} start={t0} size={92} />
        </div>
        <div style={box(530)}>
          <Bars T={T} t0={t0} litAt={13.75} slow={slow} />
        </div>
        <Mention T={T} t0={slow ? t0 - 1 : t0} top={1262} />
      </>
    );
  }
  if (view === "rule") {
    return (
      <div style={box(Z.y0 + 190)}>
        <div style={{ boxSizing: "border-box", padding: "80px 44px", borderRadius: 40, background: alpha(C.text, 0.05), border: `4px solid ${alpha(C.primary, 0.85)}`, boxShadow: `0 0 70px -20px ${alpha(C.primary, 0.85)}`, ...reveal(T, t0, { dur: 0.4, blur: 14, y: 30 }) }}>
          <KLine T={T} text="Ton g baisse au même virage ?" start={t0 + 0.05} size={86} />
          <div style={{ height: 56 }} />
          <KLine T={T} text="*Regarde ta vitesse en courbe.*" start={t0 + 1.85} size={104} />
        </div>
      </div>
    );
  }
  const k = prog(T, t0 + 0.1, t0 + 0.6, E.outExpo);
  const fly = Math.sin((T - t0) * 3.2);
  return (
    <>
      <div style={{ ...box(Z.y0 + 120), display: "flex", justifyContent: "center" }}>
        <div style={{ width: 300, height: 300, borderRadius: "50%", background: GRAD.primary, boxShadow: `0 0 90px -10px ${alpha(C.primary, 0.85)}`, display: "flex", alignItems: "center", justifyContent: "center", transform: `scale(${mix(0.5, 1, k)}) translate(${fly * 8}px, ${-fly * 8}px)`, opacity: k }}>
          <Send size={150} color="#FFFFFF" strokeWidth={2.2} style={{ marginLeft: -14, marginTop: 14 }} />
        </div>
      </div>
      <div style={box(800)}>
        <KLine T={T} text="Envoie ça à ton pote qui se *plaint de son cou.*" start={t0 + 0.15} size={104} />
      </div>
    </>
  );
};

/** Miniature choisie : « Ton cou brûle ? » + « Virage 6 », contenu dans le recadrage de la grille du profil. */
export const Virage6Cover: React.FC = () => (
  <AbsoluteFill style={{ backgroundColor: C.bg }}>
    <SocialBackground width={1080} height={1920} preset="top" />
    <div style={{ position: "absolute", left: 80, width: 920, top: 400 }}>
      <KLine T={5} text="Ton cou *brûle ?*" start={0} size={176} noIn />
    </div>
    <div style={{ position: "absolute", left: 130, top: 800 }}>
      <Map6 T={0.25} width={820} height={660} label />
    </div>
    <Footer y={1800} />
  </AbsoluteFill>
);
