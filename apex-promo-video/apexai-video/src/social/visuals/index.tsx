import React from "react";
import { CircleDot, Flame, LoaderCircle, Wrench } from "lucide-react";
import { C, FONT, INK, alpha } from "../kit/tokens";
import { fr } from "../kit/text";
import { FloatingCard, SectorBar } from "../kit/elements";
import { TrackMap } from "../../components/TrackMap";
import { CORNERS, LOSS, PTS, speedToColor } from "../../lib/track";
import { PerfectLapBanner, ScoreCard, StatCards } from "../../ui/AppUI";
import { CalendarCard, CoachingCard, DeltaChart, KartHealthCard, KartSchematic, RadarChart, SetupTiresCard, SpeedTraceChart } from "../../ui/InsightsUI";
import { AnalyzeButton, AnalyzingCard, DropZone, FileVignette, UploadHeader } from "../../ui/UploadUI";
import ui from "../../data/ui-data.json";

export const VISUAL_IDS = [
  "none",
  "score",
  "stats",
  "perfect-lap",
  "coaching-1",
  "coaching-2",
  "coaching-stack",
  "upload",
  "analyzing",
  "file",
  "delta",
  "speed",
  "speed-dip",
  "speed-exit",
  "radar",
  "kart",
  "gauges",
  "setup",
  "calendar",
  "trace",
  "trace-gold",
  "trace-duel",
  "trace-v10",
  "trace-v6",
  "trace-loss",
  "trace-zoom",
  "trace-spot",
  "braking",
  "sectors",
  "trio",
] as const;
export type VisualId = (typeof VISUAL_IDS)[number];

const ALL = CORNERS.map(() => 1);

/** Carte du circuit recadrée sur un virage (zoom autour de son marqueur). */
const TraceZoom: React.FC<{ width: number; height: number; n: number; zoom: number; children: (size: number) => React.ReactNode }> = ({ width, height, n, zoom, children }) => {
  const c = CORNERS.find((cc) => cc.n === n)!;
  const size = width * zoom;
  const left = width / 2 - (c.x / 1000) * size;
  const top = height / 2 - (c.y / 1000) * size;
  return (
    <div style={{ position: "relative", width, height, overflow: "hidden", borderRadius: 28, WebkitMaskImage: "radial-gradient(ellipse at center, black 45%, transparent 72%)", maskImage: "radial-gradient(ellipse at center, black 45%, transparent 72%)" }}>
      <div style={{ position: "absolute", left, top }}>{children(size)}</div>
    </div>
  );
};


/**
 * Extrait de courbe de vitesse (sans légende de tours) : le creux au virage 1 (deux passages superposés,
 * écart des vitesses mini annoté) ou la pente de réaccélération après le virage 5 (un seul passage).
 * Source : adria-lap.json (points[i][2] = vitesse du meilleur tour, [5] = tour comparé).
 */
const SpeedCrop: React.FC<{ width: number; mode: "dip" | "exit" }> = ({ width, mode }) => {
  const [a, b] = mode === "dip" ? [2, 66] : [178, 228];
  const h = width * 0.66;
  const padL = 70, padR = 28, padT = 40, padB = 36;
  const w = width - padL - padR, ih = h - padT - padB;
  const idx = Array.from({ length: b - a + 1 }, (_, k) => a + k);
  const vals = idx.flatMap((i) => (mode === "dip" ? [PTS[i][2], PTS[i][5]] : [PTS[i][2]]));
  const vmin = Math.floor((Math.min(...vals) - 4) / 10) * 10;
  const vmax = Math.ceil((Math.max(...vals) + 4) / 10) * 10;
  const X = (i: number) => padL + ((i - a) / (b - a)) * w;
  const Y = (v: number) => padT + ih * (1 - (v - vmin) / (vmax - vmin));
  const path = (col: 2 | 5) => `M${idx.map((i) => `${X(i).toFixed(1)},${Y(PTS[i][col]).toFixed(1)}`).join(" L")}`;
  const grid: number[] = [];
  for (let v = vmin; v <= vmax; v += 10) grid.push(v);
  // Creux (vitesse mini) des deux passages entre les indices 11 et 56 (segment de perte du virage 1).
  const argmin = (col: 2 | 5) => idx.filter((i) => i >= 11 && i <= 56).reduce((m, i) => (PTS[i][col] < PTS[m][col] ? i : m), 11);
  const i4 = argmin(2), i9 = argmin(5);
  const v4 = PTS[i4][2], v9 = PTS[i9][5];
  const ax = X(i9);
  return (
    <div style={{ width, height: h, borderRadius: 28, background: alpha(C.card, 0.94), border: `1px solid ${C.border}`, boxShadow: `0 40px 80px -30px ${alpha(C.bgDeep, 0.85)}` }}>
      <svg width={width} height={h} style={{ overflow: "visible" }}>
        {grid.map((v) => (
          <g key={v}>
            <line x1={padL} x2={padL + w} y1={Y(v)} y2={Y(v)} stroke={alpha(C.text, 0.08)} strokeDasharray="4 8" strokeWidth={2} />
            <text x={padL - 14} y={Y(v) + 7} textAnchor="end" fill={INK.muted} fontFamily={FONT.body} fontSize={22}>{v}</text>
          </g>
        ))}
        <text x={padL} y={26} fill={INK.muted} fontFamily={FONT.body} fontSize={22} fontWeight={600}>km/h</text>
        {mode === "dip" ? (
          <>
            <path d={path(5)} fill="none" stroke={C.blue} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" opacity={0.95} />
            <path d={path(2)} fill="none" stroke={C.orangeChart} strokeWidth={7} strokeLinecap="round" strokeLinejoin="round" />
            <line x1={X(i4)} x2={ax + 40} y1={Y(v4)} y2={Y(v4)} stroke={alpha(C.text, 0.55)} strokeWidth={2} strokeDasharray="6 6" />
            <line x1={ax} x2={ax} y1={Y(v4) + 4} y2={Y(v9) - 6} stroke={C.primary} strokeWidth={5} />
            <circle cx={ax} cy={Y(v9)} r={10} fill={C.primary} />
            <text x={ax} y={Y(v9) + 66} textAnchor="middle" fill={C.primary} fontFamily={FONT.display} fontWeight={700} fontSize={46}>−10 km/h</text>
          </>
        ) : (
          <>
            {idx.slice(0, -1).map((i, k) => (
              <line key={i} x1={X(i)} y1={Y(PTS[i][2])} x2={X(idx[k + 1])} y2={Y(PTS[idx[k + 1]][2])} stroke={speedToColor(PTS[i][2])} strokeWidth={8} strokeLinecap="round" />
            ))}
            <line x1={X(190)} y1={Y(PTS[190][2])} x2={X(218)} y2={Y(PTS[218][2])} stroke={alpha(C.text, 0.6)} strokeWidth={3} strokeDasharray="8 8" />
            <circle cx={X(190)} cy={Y(PTS[190][2])} r={10} fill={C.text} />
            <text x={X(203)} y={Y(82)} textAnchor="end" fill={C.text} fontFamily={FONT.display} fontWeight={700} fontSize={34}>la pente</text>
          </>
        )}
      </svg>
    </div>
  );
};

/** Jauges d'usure de Mon Kart (style de WearGauge.tsx). */
export const WearGauges: React.FC<{ k: number; width: number }> = ({ k, width }) => {
  const icons = [
    { I: Flame, col: C.primary },
    { I: CircleDot, col: C.purple },
    { I: LoaderCircle, col: C.orangeChart },
    { I: Wrench, col: C.blue },
  ];
  const ratio = (v: string, unit: string) => {
    const max = parseFloat(unit.replace(/[^0-9.]/g, "")) || 1;
    return Math.min(1, parseFloat(v) / max);
  };
  const R = 34 * k;
  return (
    <div style={{ width, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 * k }}>
      {ui.monKart.gauges.map((g, i) => {
        const { I, col } = icons[i];
        const p = ratio(g.value, g.unit);
        const circ = 2 * Math.PI * R;
        return (
          <div key={g.label} style={{ borderRadius: 14 * k, background: alpha(C.card, 0.96), border: `${Math.max(1, k)}px solid ${C.border}`, padding: `${14 * k}px ${16 * k}px`, boxShadow: `0 30px 60px -24px ${alpha(C.bgDeep, 0.85)}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 * k }}>
              <I size={16 * k} color={col} strokeWidth={2.2} />
              <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 14 * k, color: alpha(C.text, 0.8) }}>{g.label}</span>
            </div>
            <div style={{ position: "relative", width: 2 * R + 10 * k, height: 2 * R + 10 * k, margin: `${10 * k}px auto ${10 * k}px` }}>
              <svg width={2 * R + 10 * k} height={2 * R + 10 * k} style={{ position: "absolute", inset: 0 }}>
                <circle cx={R + 5 * k} cy={R + 5 * k} r={R} fill="none" stroke={C.secondary} strokeWidth={6 * k} />
                <circle
                  cx={R + 5 * k}
                  cy={R + 5 * k}
                  r={R}
                  fill="none"
                  stroke={C.success}
                  strokeWidth={6 * k}
                  strokeLinecap="round"
                  strokeDasharray={`${circ * Math.max(0.012, p)} ${circ}`}
                  transform={`rotate(-90 ${R + 5 * k} ${R + 5 * k})`}
                />
              </svg>
              <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <span style={{ fontFamily: FONT.display, fontWeight: 700, fontSize: 22 * k, color: C.text, lineHeight: 1 }}>{g.value}</span>
                <span style={{ fontFamily: FONT.body, fontWeight: 500, fontSize: 9 * k, color: INK.muted, marginTop: 2 * k }}>{g.unit}</span>
              </div>
            </div>
            <div style={{ textAlign: "center", fontFamily: FONT.body, fontWeight: 700, fontSize: 10.5 * k, color: alpha(C.text, 0.9), background: C.cardInner, border: `${Math.max(1, k)}px solid ${C.border}`, borderRadius: 8 * k, padding: `${7 * k}px 0` }}>
              {g.action}
            </div>
          </div>
        );
      })}
    </div>
  );
};

/** Schéma de freinage du virage 6 : repère du meilleur passage (43 m) contre celui du tour (17 m). */
export const BrakingDiagram: React.FC<{ width: number }> = ({ width }) => {
  const h = width * 0.5;
  const x0 = width * 0.06;
  const x1 = width * 0.86; // apex
  const maxM = 60;
  const xm = (m: number) => x1 - (m / maxM) * (x1 - x0);
  const y = h * 0.62;
  const flag = (m: number, col: string, label: string, sub: string, up: boolean) => {
    const x = xm(m);
    const top = up ? y - h * 0.46 : y + h * 0.1;
    return (
      <g>
        {/* pointillés arrêtés avant les textes : ils ne traversent ni le chiffre ni sa légende */}
        <line x1={x} x2={x} y1={up ? top + width * 0.075 : y} y2={up ? y : y + h * 0.4 - width * 0.075 * 0.88} stroke={col} strokeWidth={3} strokeDasharray="8 7" />
        <circle cx={x} cy={y} r={11} fill={C.bg} stroke={col} strokeWidth={4} />
        <circle cx={x} cy={y} r={26} fill={col} opacity={0.18} />
        <text x={x} y={top + (up ? 0 : h * 0.3)} textAnchor="middle" fill={col} fontFamily={FONT.display} fontWeight={700} fontSize={width * 0.075}>
          {label}
        </text>
        <text x={x} y={top + (up ? width * 0.05 : h * 0.3 + width * 0.05)} textAnchor="middle" fill={INK.soft} fontFamily={FONT.body} fontWeight={500} fontSize={width * 0.03}>
          {sub}
        </text>
      </g>
    );
  };
  return (
    <svg width={width} height={h} viewBox={`0 0 ${width} ${h}`} style={{ overflow: "visible" }}>
      <defs>
        <linearGradient id="brk-road" x1="0" x2="1">
          <stop offset="0%" stopColor={C.text} stopOpacity={0.02} />
          <stop offset="100%" stopColor={C.text} stopOpacity={0.1} />
        </linearGradient>
      </defs>
      <rect x={x0 - 20} y={y - 26} width={x1 - x0 + 40} height={52} rx={26} fill="url(#brk-road)" stroke={alpha(C.text, 0.1)} strokeWidth={2} />
      {[60, 50, 40, 30, 20, 10, 0].map((m) => (
        <g key={m}>
          <line x1={xm(m)} x2={xm(m)} y1={y + 34} y2={y + 46} stroke={alpha(C.text, 0.25)} strokeWidth={2} />
          <text x={xm(m)} y={y + 74} textAnchor="middle" fill={INK.muted} fontFamily={FONT.body} fontWeight={500} fontSize={width * 0.026}>
            {m === 0 ? "apex" : `${m} m`}
          </text>
        </g>
      ))}
      {/* zone de freinage du meilleur passage (43 → 0 m) */}
      <rect x={xm(43)} y={y - 8} width={x1 - xm(43)} height={16} rx={8} fill={alpha(C.success, 0.22)} />
      <rect x={xm(17)} y={y - 8} width={x1 - xm(17)} height={16} rx={8} fill={alpha(C.primary, 0.32)} />
      {flag(43, C.success, "43 m", fr("meilleur passage"), true)}
      {flag(17, C.primary, "17 m", fr("ce tour"), false)}
      {/* marqueur du virage 6 */}
      <g transform={`translate(${x1 + 34} ${y})`}>
        <circle r={30} fill={C.bgDeep} stroke={C.primary} strokeWidth={4} />
        <text y={10} textAnchor="middle" fill={C.text} fontFamily={FONT.display} fontWeight={700} fontSize={26}>
          6
        </text>
        <polygon points="0,-38 -8,-48 8,-48" fill={C.text} />
      </g>
    </svg>
  );
};

/**
 * Rendu d'un visuel d'interface à la largeur demandée.
 * `tilt` place la carte dans l'espace (signature « carte flottante »).
 */
export const Visual: React.FC<{ id: VisualId; width: number; height?: number; tilt?: boolean; rx?: number; ry?: number; corner?: number; style?: React.CSSProperties }> = ({
  id,
  width,
  height,
  tilt = true,
  rx = 8,
  ry = -9,
  corner = 10,
  style,
}) => {
  const wrap = (node: React.ReactNode, glow: string = C.primary) =>
    tilt ? (
      <FloatingCard rx={rx} ry={ry} glow={glow} style={style}>
        {node}
      </FloatingCard>
    ) : (
      <div style={style}>{node}</div>
    );
  switch (id) {
    case "none":
      return null;
    case "score":
      return wrap(<ScoreCard k={width / 560} width={width} score={ui.score.value} tiles={[1, 1, 1, 1]} />);
    case "stats":
      return wrap(<StatCards k={width / 470} width={width} appear={[1, 1, 1, 1]} glowFirst={0.6} style={{ gridTemplateColumns: "repeat(2, 1fr)" }} />);
    case "perfect-lap": {
      const h = height ?? width * 1.05;
      return wrap(
        <div style={{ width, height: h, position: "relative" }}>
          <PerfectLapBanner k={width / 400} width={width} items={[1, 1, 1, 1, 1]} toGain="−1.23s" gainGlow={0.4} layout="stacked" />
          <div style={{ position: "absolute", left: (width - h * 0.78) / 2, top: h * 0.24 }}>
            <TrackMap id="vpl" size={h * 0.78} speedLine={1} goldLine={1} markers={ALL} startFinish={1} />
          </div>
        </div>,
        C.gold,
      );
    }
    case "coaching-1":
      return wrap(<CoachingCard k={width / 500} width={width} index={0} highlight={1} lostGlow={0.6} accent />);
    case "coaching-2":
      return wrap(<CoachingCard k={width / 500} width={width} index={1} lostGlow={0.4} />);
    case "coaching-stack":
      return wrap(
        <div style={{ width, position: "relative" }}>
          <CoachingCard k={width / 560} width={width} index={0} highlight={1} lostGlow={0.6} accent />
          <div style={{ marginTop: 18, opacity: 0.85, transform: "scale(0.97)", transformOrigin: "50% 0%" }}>
            <CoachingCard k={width / 560} width={width} index={1} />
          </div>
        </div>,
      );
    case "upload": {
      const k = width / 520;
      return wrap(
        <div style={{ width, borderRadius: 16 * k, background: alpha(C.card, 0.94), border: `${Math.max(1, k)}px solid ${C.border}`, padding: 22 * k, boxSizing: "border-box", boxShadow: `0 40px 80px -30px ${alpha(C.bgDeep, 0.85)}` }}>
          <UploadHeader k={k * 0.82} width={width - 44 * k} />
          <div style={{ height: 18 * k }} />
          <DropZone k={k} hover={0} selected={1} />
          <div style={{ height: 16 * k }} />
          <AnalyzeButton k={k} glow={0.6} />
        </div>,
      );
    }
    case "analyzing": {
      const k = width / 420;
      return wrap(<AnalyzingCard k={k} width={width} progress={0.6} spin={40} step={2} stepBlend={1} done={0} check={0} burst={0} />);
    }
    case "file":
      return wrap(<FileVignette k={width / 230} />, C.success);
    case "delta":
      return wrap(<DeltaChart k={width / 520} width={width} draw={1} />, C.blue);
    case "speed":
      return wrap(<SpeedTraceChart k={width / 520} width={width} draw={1} />, C.orangeChart);
    case "speed-dip":
      return wrap(<SpeedCrop width={width} mode="dip" />, C.primary);
    case "speed-exit":
      return wrap(<SpeedCrop width={width} mode="exit" />, C.orangeChart);
    case "radar":
      return wrap(<RadarChart k={width / 380} width={width} grow={1} />, C.orangeChart);
    case "kart": {
      const k = width / 520;
      return wrap(
        <div style={{ width, display: "flex", gap: 16 * k, alignItems: "center" }}>
          <div style={{ borderRadius: 14 * k, background: alpha(C.card, 0.94), border: `${Math.max(1, k)}px solid ${C.border}`, padding: 14 * k }}>
            <KartSchematic k={k * 0.82} lit={[1, 1, 1, 1, 1, 1, 1, 1]} />
          </div>
          <KartHealthCard k={k} width={width * 0.46} score={ui.monKart.health.value} tiles={1} />
        </div>,
        C.success,
      );
    }
    case "gauges":
      return wrap(<WearGauges k={width / 440} width={width} />, C.success);
    case "setup":
      return wrap(<SetupTiresCard k={width / 470} width={width} reco={[1, 1, 1, 1]} />);
    case "calendar":
      return wrap(<CalendarCard k={width / 470} width={width} events={[1, 1, 1]} />);
    case "trace":
    case "trace-gold":
    case "trace-duel": {
      const size = height ? Math.min(width, height) : width;
      return (
        <div style={{ width, height: height ?? size, display: "flex", justifyContent: "center", ...style }}>
          <TrackMap
            id={`v-${id}`}
            size={size}
            speedLine={id === "trace-duel" ? 0 : 1}
            whiteTrace={id === "trace-duel" ? 1 : 0}
            goldLine={id === "trace-gold" ? 1 : 0}
            lossLit={id === "trace-duel" ? undefined : undefined}
            markers={ALL}
            startFinish={1}
            grid={0.6}
          />
        </div>
      );
    }
    case "trace-loss": {
      const size = height ? Math.min(width, height) : width;
      return (
        <div style={{ width, height: height ?? size, display: "flex", justifyContent: "center", ...style }}>
          <TrackMap id="v-loss" size={size} whiteTrace={1} lossLit={LOSS.map(() => 1)} lossPulse={1.2} markers={ALL} startFinish={1} grid={0.6} />
        </div>
      );
    }
    case "trace-spot":
      // Zoom sur un virage, sans ligne idéale ni étiquette : seul le tracé mesuré est montré.
      return (
        <div style={style}>
          <TraceZoom width={width} height={height ?? width * 0.8} n={corner} zoom={2.6}>
            {(size) => <TrackMap id={`vs-${corner}`} size={size} speedLine={1} markers={ALL} highlight={{ n: corner, glow: 1 }} pulses={{ n: corner, p: [0.35, 0.7] }} grid={0.7} />}
          </TraceZoom>
        </div>
      );
    case "trace-v10":
    case "trace-v6":
    case "trace-zoom": {
      const n = id === "trace-v10" ? 10 : id === "trace-v6" ? 6 : corner;
      const h = height ?? width * 0.8;
      return (
        <div style={style}>
          <TraceZoom width={width} height={h} n={n} zoom={2.6}>
            {(size) => (
              <TrackMap
                id={`vz-${n}`}
                size={size}
                speedLine={1}
                goldLine={1}
                markers={ALL}
                highlight={{ n, glow: 1 }}
                pulses={{ n, p: [0.35, 0.7] }}
                pill={{ n, text: `Virage ${n}`, p: 1 }}
                grid={0.7}
              />
            )}
          </TraceZoom>
        </div>
      );
    }
    case "trio": {
      const k = width / 520;
      const cw = width * 0.62;
      return (
        <div style={{ position: "relative", width, height: height ?? width * 0.78, perspective: 1600, ...style }}>
          <div style={{ position: "absolute", left: 0, top: width * 0.02, transform: "rotateY(14deg) rotateX(6deg) rotateZ(-3deg)", transformOrigin: "0% 50%" }}>
            <KartHealthCard k={k * 0.95} width={cw * 0.8} score={ui.monKart.health.value} tiles={1} />
          </div>
          <div style={{ position: "absolute", right: 0, top: 0, transform: "rotateY(-14deg) rotateX(6deg) rotateZ(3deg)", transformOrigin: "100% 50%" }}>
            <CalendarCard k={k * 0.62} width={cw * 0.82} events={[1, 1, 1]} />
          </div>
          <div style={{ position: "absolute", left: (width - cw) / 2, top: width * 0.3, transform: "rotateX(8deg)", filter: `drop-shadow(0 30px 40px ${alpha(C.bgDeep, 0.8)})` }}>
            <SetupTiresCard k={k * 0.66} width={cw} reco={[1, 1, 1, 1]} />
          </div>
        </div>
      );
    }
    case "braking":
      return (
        <div style={style}>
          <BrakingDiagram width={width} />
        </div>
      );
    case "sectors":
      return (
        <div style={style}>
          <SectorBar statuses={["best", "ok", "best", "slow", "ok", "best", "ok", "slow", "best", "ok", "best", "ok"]} width={width} labels />
        </div>
      );
    default:
      return null;
  }
};
