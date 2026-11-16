import React from "react";
import { evolvePath } from "@remotion/paths";
import { Brain, Calendar, ChevronLeft, ChevronRight, CircleDot, Flame, HeartPulse, List, LayoutGrid, LoaderCircle, MapPin, Plus, Wrench, Zap } from "lucide-react";
import { C, G, BODY, DISPLAY } from "../theme";
import ui from "../data/ui-data.json";
import { CORNERS, N, PTS } from "../lib/track";

const f = (fam: "d" | "b", size: number, weight: number): React.CSSProperties => ({
  fontFamily: fam === "d" ? `'${DISPLAY}', sans-serif` : `'${BODY}', sans-serif`,
  fontSize: size,
  fontWeight: weight,
});

const panel = (k: number, border = "#262626"): React.CSSProperties => ({
  borderRadius: 14 * k,
  background: "rgba(17,17,17,0.94)",
  border: `${Math.max(1, k)}px solid ${border}`,
  boxShadow: "0 40px 80px -30px rgba(0,0,0,0.85)",
  boxSizing: "border-box",
});

/* ───────────────────────── Conseil de coaching ───────────────────────── */

export const CoachingCard: React.FC<{
  k: number;
  width: number;
  index: 0 | 1;
  /** apparition du titre mot à mot (0→1) */
  title?: number;
  /** apparition des lignes du corps (0→1) */
  body?: number;
  /** balayage du surligneur (0→1) */
  highlight?: number;
  lostGlow?: number;
  accent?: boolean;
  style?: React.CSSProperties;
}> = ({ k, width, index, title = 1, body = 1, highlight = 0, lostGlow = 0, accent = false, style }) => {
  const c = ui.coaching.cards[index];
  const words = c.title.split(" ");
  const nShow = Math.ceil(words.length * title);
  const hl = (c as { highlight?: string }).highlight;
  const bodyParts = hl && c.body.includes(hl) ? c.body.split(hl) : [c.body];
  const badge = (txt: string, red = false, icon = false) => (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5 * k,
        ...f("b", 11.5 * k, 600),
        color: red ? C.primary : "#E5E5E5",
        border: `${k}px solid rgba(255,255,255,0.12)`,
        borderRadius: 999,
        padding: `${3 * k}px ${10 * k}px`,
      }}
    >
      {txt}
      {icon ? <MapPin size={12 * k} color={C.primary} strokeWidth={2.4} /> : null}
    </span>
  );
  return (
    <div style={{ width, ...panel(k, accent ? "rgba(255,66,66,0.32)" : "rgba(255,255,255,0.09)"), padding: `${18 * k}px ${20 * k}px`, ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 * k }}>
        <div style={{ display: "flex", gap: 7 * k }}>
          {badge(c.priority)}
          {badge(c.category)}
          {badge(c.corner, true, true)}
        </div>
        <span style={{ ...f("b", 12.5 * k, 500), color: C.muted }}>
          {c.lostLabel}
          <b
            style={{
              color: C.success,
              fontWeight: 700,
              textShadow: lostGlow > 0 ? `0 0 ${16 * lostGlow}px rgba(34,197,94,${0.9 * lostGlow})` : undefined,
            }}
          >
            {c.lost}
          </b>
          {c.lostSuffix}
        </span>
      </div>
      <div style={{ ...f("b", 18.5 * k, 700), color: C.text, lineHeight: 1.3, marginBottom: 8 * k, minHeight: 24 * k }}>
        {words.map((w, i) => (
          <span key={i} style={{ opacity: i < nShow ? 1 : 0 }}>
            {w}
            {i < words.length - 1 ? " " : ""}
          </span>
        ))}
      </div>
      <div
        style={{
          ...f("b", 14 * k, 400),
          color: "#A3A3A3",
          lineHeight: 1.6,
          maxHeight: 14 * k * 1.6 * 3,
          overflow: "hidden",
          WebkitMaskImage: "linear-gradient(180deg, #000 55%, transparent 100%)",
          maskImage: "linear-gradient(180deg, #000 55%, transparent 100%)",
          opacity: body,
          transform: `translateY(${(1 - body) * 10}px)`,
        }}
      >
        {bodyParts.length === 2 ? (
          <>
            {bodyParts[0]}
            <span
              style={{
                color: "#F5F5F5",
                backgroundImage: `linear-gradient(90deg, rgba(250,204,21,0.26) ${highlight * 100}%, rgba(250,204,21,0) ${highlight * 100}%)`,
                borderRadius: 3 * k,
                padding: `0 ${2 * k}px`,
              }}
            >
              {hl}
            </span>
            {bodyParts[1]}
          </>
        ) : (
          c.body
        )}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 8 * k, marginTop: 10 * k }}>
        <span style={{ ...f("b", 10 * k, 700), color: C.muted, letterSpacing: "0.08em" }}>DIFFICULTÉ :</span>
        <span style={{ ...f("b", 10 * k, 700), color: "#E5E5E5", background: "#262626", borderRadius: 6 * k, padding: `${2 * k}px ${7 * k}px` }}>
          {c.difficulty}
        </span>
      </div>
    </div>
  );
};

/* ───────────────────────── Graphiques ───────────────────────── */

const ChartFrame: React.FC<{ k: number; width: number; title: string; desc: string; children: React.ReactNode; style?: React.CSSProperties }> = ({
  k,
  width,
  title,
  desc,
  children,
  style,
}) => (
  <div style={{ width, ...panel(k), padding: `${16 * k}px ${18 * k}px`, ...style }}>
    <div style={{ ...f("d", 16 * k, 700), color: C.text }}>{title}</div>
    <div style={{ ...f("b", 10.5 * k, 400), color: C.muted, marginTop: 4 * k, lineHeight: 1.45 }}>{desc}</div>
    <div style={{ marginTop: 10 * k }}>{children}</div>
  </div>
);

const cornerBands = (w: number, h: number, k: number) =>
  CORNERS.map((c) => {
    const x = (c.i / N) * w;
    // Zone de virage : plus large quand le virage est lent (comme dans l'app).
    const bw = ((6 + Math.max(0, 120 - c.apexKmh) / 7) / N) * w;
    return (
      <g key={`b${c.n}`}>
        <rect x={x - bw / 2} y={0} width={bw} height={h} fill="rgba(249,115,22,0.12)" />
        <text x={x} y={11 * k} textAnchor="middle" fill={C.orangeChart} fontSize={8.5 * k} fontWeight={700} fontFamily={`'${BODY}', sans-serif`}>
          V{c.n}
        </text>
      </g>
    );
  });

export const DeltaChart: React.FC<{ k: number; width: number; draw: number; style?: React.CSSProperties }> = ({ k, width, draw, style }) => {
  const d = ui.charts.deltaTime;
  const w = width - 36 * k - 34 * k;
  const h = 170 * k;
  const y = (v: number) => h - ((v + 0.3) / 1.1) * h;
  const path = `M${PTS.map((p, i) => `${((i / (N - 1)) * w).toFixed(1)},${y(p[4] - p[3]).toFixed(1)}`).join(" L")}`;
  const ev = evolvePath(draw, path);
  return (
    <ChartFrame k={k} width={width} title={d.title} desc={d.description} style={style}>
      <svg width={w + 34 * k} height={h + 34 * k} style={{ overflow: "visible" }}>
        <g transform={`translate(${30 * k}, 4)`}>
          {cornerBands(w, h, k)}
          {[-0.3, 0, 0.3, 0.5, 0.8].map((v) => (
            <g key={v}>
              <line x1={0} x2={w} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 4" />
              <text x={-6 * k} y={y(v) + 3 * k} textAnchor="end" fill={C.dim} fontSize={8.5 * k} fontFamily={`'${BODY}', sans-serif`}>
                {v.toFixed(1)}s
              </text>
            </g>
          ))}
          <line x1={0} x2={w} y1={y(0)} y2={y(0)} stroke={C.success} strokeWidth={2 * k} />
          <path d={path} fill="none" stroke={C.blue} strokeWidth={2.2 * k} strokeDasharray={ev.strokeDasharray} strokeDashoffset={ev.strokeDashoffset} />
          {["0m", "350m", "700m", "1225m"].map((t, i) => (
            <text key={t} x={(i === 3 ? 1 : i * 0.2857) * w} y={h + 14 * k} textAnchor="middle" fill={C.dim} fontSize={8.5 * k} fontFamily={`'${BODY}', sans-serif`}>
              {t}
            </text>
          ))}
        </g>
      </svg>
      <div style={{ display: "flex", justifyContent: "center", gap: 18 * k, ...f("b", 11 * k, 600) }}>
        <span style={{ color: C.success }}>— T4 (Meilleur)</span>
        <span style={{ color: C.blue }}>— T9</span>
      </div>
    </ChartFrame>
  );
};

export const SpeedTraceChart: React.FC<{ k: number; width: number; draw: number; style?: React.CSSProperties }> = ({ k, width, draw, style }) => {
  const d = ui.charts.speedTrace;
  const w = width - 36 * k - 34 * k;
  const h = 170 * k;
  const y = (v: number) => h - (v / 125) * h;
  const mk = (col: 2 | 5) => `M${PTS.map((p, i) => `${((i / (N - 1)) * w).toFixed(1)},${y(p[col]).toFixed(1)}`).join(" L")}`;
  const p4 = mk(2);
  const p9 = mk(5);
  const e4 = evolvePath(draw, p4);
  const e9 = evolvePath(Math.max(0, draw * 1.05 - 0.05), p9);
  return (
    <ChartFrame k={k} width={width} title={d.title} desc={d.description} style={style}>
      <svg width={w + 34 * k} height={h + 34 * k} style={{ overflow: "visible" }}>
        <g transform={`translate(${30 * k}, 4)`}>
          {cornerBands(w, h, k)}
          {[0, 30, 60, 90, 120].map((v) => (
            <g key={v}>
              <line x1={0} x2={w} y1={y(v)} y2={y(v)} stroke="rgba(255,255,255,0.07)" strokeDasharray="3 4" />
              <text x={-6 * k} y={y(v) + 3 * k} textAnchor="end" fill={C.dim} fontSize={8.5 * k} fontFamily={`'${BODY}', sans-serif`}>
                {v}
              </text>
            </g>
          ))}
          <path d={p9} fill="none" stroke={C.blue} strokeWidth={1.8 * k} strokeDasharray={e9.strokeDasharray} strokeDashoffset={e9.strokeDashoffset} opacity={0.9} />
          <path d={p4} fill="none" stroke={C.orangeChart} strokeWidth={2.2 * k} strokeDasharray={e4.strokeDasharray} strokeDashoffset={e4.strokeDashoffset} />
        </g>
      </svg>
      <div style={{ display: "flex", justifyContent: "center", gap: 18 * k, ...f("b", 11 * k, 600) }}>
        <span style={{ color: C.orangeChart }}>— Tour 4 (Best)</span>
        <span style={{ color: C.blue }}>— Tour 9</span>
      </div>
    </ChartFrame>
  );
};

export const RadarChart: React.FC<{ k: number; width: number; grow: number; style?: React.CSSProperties }> = ({ k, width, grow, style }) => {
  const r = ui.charts.radar;
  const size = width - 36 * k;
  const R = size * 0.32;
  const cx = size / 2;
  const cy = R + 22 * k;
  const ang = [-90, 0, 90, 180].map((a) => (a * Math.PI) / 180);
  const pt = (i: number, v: number) => [cx + Math.cos(ang[i]) * R * v, cy + Math.sin(ang[i]) * R * v];
  const poly = r.values.map((v, i) => pt(i, v * grow).join(",")).join(" ");
  const labels = [
    { t: r.axes[0], x: cx, y: cy - R - 10 * k, a: "middle" },
    { t: r.axes[1], x: cx + R + 8 * k, y: cy + 4 * k, a: "start" },
    { t: r.axes[2], x: cx, y: cy + R + 18 * k, a: "middle" },
    { t: r.axes[3], x: cx - R - 8 * k, y: cy + 4 * k, a: "end" },
  ];
  return (
    <div style={{ width, ...panel(k), padding: `${16 * k}px ${18 * k}px`, ...style }}>
      <div style={{ ...f("d", 16 * k, 700), color: C.text }}>{r.title}</div>
      <svg width={size} height={2 * R + 50 * k} style={{ overflow: "visible", marginTop: 6 * k }}>
        {[0.25, 0.5, 0.75, 1].map((s) => (
          <polygon key={s} points={[0, 1, 2, 3].map((i) => pt(i, s).join(",")).join(" ")} fill="none" stroke="rgba(255,255,255,0.09)" />
        ))}
        {[0, 1, 2, 3].map((i) => {
          const [x, y] = pt(i, 1);
          return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.09)" />;
        })}
        <polygon points={poly} fill={r.fill} stroke={r.stroke} strokeWidth={2 * k} />
        {labels.map((l) => (
          <text key={l.t} x={l.x} y={l.y} textAnchor={l.a as "middle" | "start" | "end"} fill={C.muted} fontSize={10.5 * k} fontFamily={`'${BODY}', sans-serif`}>
            {l.t}
          </text>
        ))}
      </svg>
    </div>
  );
};

/* ───────────────────────── Mon Kart ───────────────────────── */

type Node = { x: number; y: number; icon: React.ElementType; color?: string };
const KART_NODES: Node[] = [
  { x: 52, y: 64, icon: CircleDot },
  { x: 248, y: 64, icon: CircleDot },
  { x: 150, y: 70, icon: Zap, color: C.gold },
  { x: 196, y: 70, icon: Wrench },
  { x: 222, y: 152, icon: Flame },
  { x: 86, y: 146, icon: Zap },
  { x: 52, y: 270, icon: CircleDot },
  { x: 248, y: 270, icon: CircleDot },
];

/** Schéma du kart vu de dessus (style de KartSchematic.tsx) : traits clairs, nœuds verts lumineux. */
export const KartSchematic: React.FC<{ k: number; lit: number[]; style?: React.CSSProperties }> = ({ k, lit, style }) => {
  const W = 300;
  const H = 330;
  return (
    <svg width={W * k} height={H * k} viewBox={`0 0 ${W} ${H}`} style={{ overflow: "visible", ...style }}>
      <defs>
        <pattern id="kgrid" width="20" height="20" patternUnits="userSpaceOnUse">
          <path d="M20 0 L0 0 0 20" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
        </pattern>
      </defs>
      <rect x="-30" y="-20" width={W + 60} height={H + 40} fill="url(#kgrid)" />
      <g fill="none" stroke="rgba(230,230,230,0.42)" strokeWidth="2.2" strokeLinejoin="round" strokeLinecap="round">
        {/* roues */}
        <rect x="26" y="30" width="52" height="68" rx="12" />
        <rect x="222" y="30" width="52" height="68" rx="12" />
        <rect x="26" y="236" width="52" height="68" rx="12" />
        <rect x="222" y="236" width="52" height="68" rx="12" />
        {/* essieux et châssis */}
        <path d="M78 64 H222" />
        <path d="M78 270 H222" />
        <path d="M100 64 L112 270" />
        <path d="M200 64 L188 270" />
        {/* siège */}
        <path d="M118 110 Q150 92 182 110 L176 200 Q150 214 124 200 Z" />
        {/* volant / colonne */}
        <path d="M128 228 Q150 216 172 228" />
        <path d="M150 222 V272" />
        {/* pare-chocs avant */}
        <path d="M70 312 Q150 340 230 312" />
        <path d="M112 270 L96 312 M188 270 L204 312" />
      </g>
      <polygon points="150,150 143,163 157,163" fill="rgba(255,66,66,0.9)" />
      {KART_NODES.map((n, i) => {
        const l = lit[i] ?? 0;
        const Icon = n.icon;
        return (
          <g key={i} transform={`translate(${n.x} ${n.y})`}>
            <circle r={22} fill="#22C55E" opacity={0.28 * l} style={{ filter: "blur(8px)" }} />
            <circle r={15} fill="#0B0F0C" stroke={l > 0.05 ? `rgba(34,197,94,${(0.35 + 0.65 * l).toFixed(2)})` : "rgba(255,255,255,0.2)"} strokeWidth={2} />
            <foreignObject x={-9} y={-9} width={18} height={18}>
              <Icon size={18} color={l > 0.5 ? n.color ?? "#22C55E" : "rgba(255,255,255,0.35)"} strokeWidth={2.2} />
            </foreignObject>
          </g>
        );
      })}
      <g transform="translate(150 300)">
        <circle r={15} fill="#0B0F0C" stroke="rgba(34,197,94,0.8)" strokeWidth={2} />
        <text y={4.5} textAnchor="middle" fill="#22C55E" fontSize={11} fontWeight={800} fontFamily={`'${BODY}', sans-serif`}>
          AV
        </text>
      </g>
    </svg>
  );
};

export const KartHealthCard: React.FC<{ k: number; width: number; score: number; tiles: number; style?: React.CSSProperties }> = ({ k, width, score, tiles, style }) => {
  const h = ui.monKart.health;
  const icons = [Flame, CircleDot, LoaderCircle, Wrench];
  return (
    <div style={{ width, ...panel(k), borderTop: `${3 * k}px solid ${C.success}`, padding: `${14 * k}px ${16 * k}px`, ...style }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8 * k }}>
        <HeartPulse size={17 * k} color={C.success} strokeWidth={2.2} />
        <span style={{ ...f("d", 15 * k, 700), color: C.text }}>{h.title}</span>
      </div>
      <div style={{ textAlign: "center", marginTop: 6 * k }}>
        <div style={{ ...f("d", 44 * k, 700), color: C.success, lineHeight: 1.05, textShadow: "0 0 24px rgba(34,197,94,0.45)", fontVariantNumeric: "tabular-nums" }}>
          {Math.round(score)}
        </div>
        <div style={{ ...f("b", 10.5 * k, 600), color: C.muted, letterSpacing: "0.12em" }}>{h.caption}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 6 * k, marginTop: 10 * k, opacity: tiles }}>
        {h.tiles.map((t, i) => {
          const Icon = icons[i];
          return (
            <div key={t.label} style={{ textAlign: "center", background: "#161616", border: `${k}px solid #262626`, borderRadius: 8 * k, padding: `${7 * k}px 0` }}>
              <Icon size={13 * k} color={t.iconColor} strokeWidth={2.2} />
              <div style={{ ...f("b", 11.5 * k, 700), color: C.text, marginTop: 2 * k }}>{t.value}</div>
              <div style={{ ...f("b", 8 * k, 600), color: C.muted, letterSpacing: "0.06em" }}>{t.label}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ───────────────────────── Carnet d'ingénieur : pneumatiques ───────────────────────── */

export const SetupTiresCard: React.FC<{ k: number; width: number; reco: number[]; style?: React.CSSProperties }> = ({ k, width, reco, style }) => {
  const s = ui.setup;
  const groups = ["Pressions à Froid", "Pressions à Chaud (Cible)"];
  return (
    <div style={{ width, ...panel(k), padding: `${16 * k}px ${18 * k}px`, ...style }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 * k }}>
          <CircleDot size={17 * k} color={C.primary} strokeWidth={2.2} />
          <span style={{ ...f("d", 16 * k, 700), color: C.text }}>{s.card}</span>
        </div>
        <span style={{ ...f("b", 11 * k, 500), color: C.muted }}>{s.pageTitle}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 * k, marginTop: 12 * k }}>
        {groups.map((g, gi) => (
          <div key={g}>
            <div style={{ ...f("b", 11.5 * k, 700), color: C.text, marginBottom: 8 * k }}>{g}</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 * k }}>
              {s.fields
                .filter((x) => x.group === g)
                .map((x, i) => {
                  const r = reco[gi * 2 + i] ?? 1;
                  return (
                    <div key={x.label}>
                      <div style={{ ...f("b", 10 * k, 500), color: C.muted, marginBottom: 4 * k }}>{x.label}</div>
                      <div
                        style={{
                          ...f("b", 13 * k, 600),
                          color: C.text,
                          background: "#121212",
                          border: `${k}px solid #2A2A2A`,
                          borderRadius: 8 * k,
                          padding: `${7 * k}px ${10 * k}px`,
                        }}
                      >
                        {x.value}
                      </div>
                      <div
                        style={{
                          marginTop: 6 * k,
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4 * k,
                          ...f("b", 9 * k, 600),
                          color: C.primary,
                          border: `${k}px solid rgba(255,66,66,0.5)`,
                          borderRadius: 999,
                          padding: `${2 * k}px ${7 * k}px`,
                          opacity: r,
                          transform: `scale(${0.8 + 0.2 * r})`,
                          transformOrigin: "0% 50%",
                        }}
                      >
                        <Brain size={10 * k} strokeWidth={2.2} />
                        {x.reco}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ───────────────────────── Calendrier ───────────────────────── */

export const CalendarCard: React.FC<{ k: number; width: number; events: number[]; style?: React.CSSProperties }> = ({ k, width, events, style }) => {
  const c = ui.calendar;
  const cells: Array<{ d: number; muted: boolean }> = [];
  for (let i = 0; i < c.firstDayOffset; i++) cells.push({ d: 28 + i, muted: true });
  for (let d = 1; d <= 31; d++) cells.push({ d, muted: false });
  while (cells.length < 35) cells.push({ d: cells.length - 30 - c.firstDayOffset + 1, muted: true });
  return (
    <div style={{ width, ...panel(k), padding: `${14 * k}px ${16 * k}px`, ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 * k }}>
          <Calendar size={17 * k} color={C.primary} strokeWidth={2.2} />
          <span style={{ ...f("d", 16 * k, 700), color: C.text }}>{c.title}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 * k }}>
          <span style={{ display: "inline-flex", gap: 4 * k, background: "#161616", borderRadius: 8 * k, padding: 3 * k }}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 * k, ...f("b", 10 * k, 600), color: "#fff", background: C.primary, borderRadius: 6 * k, padding: `${3 * k}px ${8 * k}px` }}>
              <LayoutGrid size={10 * k} /> {c.views[0]}
            </span>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4 * k, ...f("b", 10 * k, 500), color: C.muted, padding: `${3 * k}px ${8 * k}px` }}>
              <List size={10 * k} /> {c.views[1]}
            </span>
          </span>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 4 * k, ...f("b", 10.5 * k, 700), color: "#fff", background: G.primary, borderRadius: 8 * k, padding: `${4 * k}px ${10 * k}px` }}>
            <Plus size={11 * k} strokeWidth={2.6} /> Ajouter
          </span>
        </div>
      </div>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: `${10 * k}px ${4 * k}px ${6 * k}px` }}>
        <ChevronLeft size={13 * k} color={C.muted} />
        <span style={{ ...f("b", 12 * k, 700), color: C.text }}>{c.month}</span>
        <ChevronRight size={13 * k} color={C.muted} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4 * k }}>
        {c.weekdays.map((w, i) => (
          <div key={`w${i}`} style={{ textAlign: "center", ...f("b", 9 * k, 700), color: C.muted }}>
            {w}
          </div>
        ))}
        {cells.map((cell, i) => {
          const ev = !cell.muted ? c.events.findIndex((e) => e.day === cell.d) : -1;
          const evP = ev >= 0 ? events[ev] ?? 0 : 0;
          const today = !cell.muted && cell.d === c.today;
          return (
            <div
              key={`c${i}`}
              style={{
                height: 30 * k,
                borderRadius: 6 * k,
                background: "#0E0E0E",
                border: `${k}px solid ${evP > 0.5 ? "rgba(255,255,255,0.14)" : "#1E1E1E"}`,
                padding: `${3 * k}px ${4 * k}px`,
                boxSizing: "border-box",
                position: "relative",
              }}
            >
              <span style={{ ...f("b", 8.5 * k, 700), color: cell.muted ? "#444" : today ? C.primary : "#D4D4D4" }}>{cell.d}</span>
              {ev >= 0 ? (
                <div
                  style={{
                    position: "absolute",
                    left: 3 * k,
                    right: 3 * k,
                    bottom: 3 * k,
                    height: 11 * k,
                    borderRadius: 3 * k,
                    background: `${c.events[ev].color}33`,
                    borderLeft: `${2 * k}px solid ${c.events[ev].color}`,
                    ...f("b", 6.8 * k, 700),
                    color: "#F5F5F5",
                    paddingLeft: 3 * k,
                    lineHeight: `${11 * k}px`,
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    opacity: evP,
                    transform: `scale(${0.6 + 0.4 * evP})`,
                    transformOrigin: "0% 50%",
                  }}
                >
                  {c.events[ev].label}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
};
