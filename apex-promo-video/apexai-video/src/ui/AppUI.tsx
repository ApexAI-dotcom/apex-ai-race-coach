import React from "react";
import { Activity, Clock, Gauge, GitCompare, Target, Timer, TrendingUp, Zap } from "lucide-react";
import { C, G, gradientText, BODY, DISPLAY } from "../theme";
import ui from "../data/ui-data.json";

/**
 * Écrans de l'app recréés en vectoriel, fidèles à CSVUploader.tsx / TrackMapPro.
 * Toutes les tailles sont celles de l'app multipliées par k (échelle d'affichage).
 */

const font = (fam: "d" | "b", size: number, weight: number): React.CSSProperties => ({
  fontFamily: fam === "d" ? `'${DISPLAY}', sans-serif` : `'${BODY}', sans-serif`,
  fontSize: size,
  fontWeight: weight,
});

export const glassCard = (k: number, border = C.border): React.CSSProperties => ({
  background: "rgba(18,18,18,0.86)",
  border: `${Math.max(1, k)}px solid ${border}`,
  borderRadius: 12 * k,
  boxShadow: "0 30px 60px -20px rgba(0,0,0,0.7)",
});

/* ───────────────────────── Score de Performance ───────────────────────── */

export const ScoreCard: React.FC<{
  k: number;
  width: number;
  score: number;
  /** Apparition de chaque tuile 0→1. */
  tiles: number[];
  /** Valeur affichée de chaque tuile (comptage). */
  tileValues?: number[];
  style?: React.CSSProperties;
}> = ({ k, width, score, tiles, tileValues, style }) => {
  const b = ui.score.breakdown;
  return (
    <div style={{ width, ...glassCard(k, "rgba(255,66,66,0.28)"), padding: 24 * k, ...style }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 * k }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 * k }}>
          <TrendingUp size={20 * k} color={C.primary} strokeWidth={2.2} />
          <span style={{ ...font("d", 21 * k, 700), color: C.text, letterSpacing: "-0.01em" }}>{ui.score.title}</span>
        </div>
        <span
          style={{
            ...font("b", 12 * k, 700),
            color: "#93C5FD",
            background: "rgba(59,130,246,0.18)",
            border: `${k}px solid rgba(59,130,246,0.45)`,
            borderRadius: 999,
            padding: `${2 * k}px ${9 * k}px`,
          }}
        >
          {ui.score.grade}
        </span>
      </div>
      <div style={{ textAlign: "center", marginBottom: 24 * k }}>
        <div
          style={{
            ...font("d", 60 * k, 700),
            letterSpacing: "-0.02em",
            lineHeight: 1.05,
            display: "inline-block",
            ...gradientText(G.score),
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {Math.round(score)}/{ui.score.max}
        </div>
        <div style={{ ...font("b", 14 * k, 400), color: C.muted, marginTop: 8 * k }}>{ui.score.caption}</div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 * k }}>
        {b.map((t, i) => {
          const a = tiles[i] ?? 1;
          const v = tileValues ? tileValues[i] : t.value;
          return (
            <div
              key={t.label}
              style={{
                textAlign: "center",
                padding: 12 * k,
                borderRadius: 10 * k,
                background: "rgba(31,31,31,0.6)",
                opacity: a,
                transform: `scale(${0.85 + 0.15 * a})`,
              }}
            >
              <div style={{ ...font("b", 12.5 * k, 500), color: C.muted, marginBottom: 4 * k }}>{t.label}</div>
              <div style={{ ...font("b", 18 * k, 700), color: C.text, fontVariantNumeric: "tabular-nums" }}>
                {Math.round(v)}/{t.max}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ───────────────────────── Cartes de stats ───────────────────────── */

const STAT_ICONS = { Clock, Zap, Target, TrendingUp } as const;
const STAT_ICON_COLORS: Record<string, string> = { Clock: C.success, Zap: C.primary, Target: C.primary, TrendingUp: C.primary };

export const StatCards: React.FC<{
  k: number;
  width: number;
  appear: number[];
  glowFirst?: number;
  style?: React.CSSProperties;
}> = ({ k, width, appear, glowFirst = 0, style }) => {
  return (
    <div style={{ width, display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16 * k, ...style }}>
      {ui.score.stats.map((s, i) => {
        const Icon = STAT_ICONS[s.icon as keyof typeof STAT_ICONS];
        const a = appear[i] ?? 1;
        return (
          <div
            key={s.label}
            style={{
              ...glassCard(k),
              padding: 20 * k,
              opacity: a,
              filter: a < 0.99 ? `blur(${((1 - a) * 12).toFixed(2)}px)` : undefined,
              transform: `translateY(${(1 - a) * 24}px)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 * k, marginBottom: 8 * k }}>
              <Icon size={16 * k} color={STAT_ICON_COLORS[s.icon]} strokeWidth={2.2} />
              <span style={{ ...font("b", 12.5 * k, 500), color: C.muted }}>{s.label}</span>
            </div>
            <div
              style={{
                ...font("b", 24 * k, 700),
                color: s.valueColor ?? C.text,
                lineHeight: 1.15,
                textShadow: i === 0 && glowFirst > 0 ? `0 0 ${24 * glowFirst}px rgba(34,197,94,${0.8 * glowFirst})` : undefined,
              }}
            >
              {s.value}
            </div>
            <div style={{ ...font("b", 14 * k, 400), color: C.muted, marginTop: 2 * k }}>{s.sub}</div>
          </div>
        );
      })}
    </div>
  );
};

/* ───────────────────────── Bandeau Tour Parfait IA ───────────────────────── */

export const PerfectLapBanner: React.FC<{
  k: number;
  width: number;
  /** Apparition des 4 éléments de la ligne + explication (5 valeurs 0→1). */
  items: number[];
  toGain: string;
  gainGlow?: number;
  /** « row » : une ligne + explication (app). « stacked » : deux lignes, sans explication (9:16). */
  layout?: "row" | "stacked";
  style?: React.CSSProperties;
}> = ({ k, width, items, toGain, gainGlow = 0, layout = "row", style }) => {
  const p = ui.perfectLap;
  const it = (i: number): React.CSSProperties => {
    const a = items[i] ?? 1;
    return {
      opacity: a,
      filter: a < 0.99 ? `blur(${((1 - a) * 10).toFixed(2)}px)` : undefined,
      transform: `translateX(${(1 - a) * -16}px)`,
      display: "inline-block",
    };
  };
  return (
    <div
      style={{
        width,
        borderRadius: 12 * k,
        border: `${k}px solid rgba(234,179,8,0.28)`,
        background: "rgba(234,179,8,0.06)",
        padding: `${10 * k}px ${16 * k}px`,
        boxSizing: "border-box",
        ...style,
      }}
    >
      {(() => {
        const label = (
          <span key="l" style={{ ...it(0), ...font("d", 11.5 * k, 700), letterSpacing: "0.08em", textTransform: "uppercase", color: C.gold }}>
            {p.label}
          </span>
        );
        const best = (
          <span key="b" style={{ ...it(1), ...font("b", 12.5 * k, 400), color: C.muted }}>
            {p.best.label} <b style={{ color: C.text, fontWeight: 700 }}>{p.best.value}</b> {p.best.sub}
          </span>
        );
        const ideal = (
          <span key="i" style={{ ...it(2), ...font("b", 12.5 * k, 400), color: C.muted }}>
            {p.ideal.label} <b style={{ color: C.text, fontWeight: 700 }}>{p.ideal.value}</b>
          </span>
        );
        const gain = (
          <span key="g" style={{ ...it(3), ...font("b", 12.5 * k, 400), color: C.muted }}>
            {p.toGain.label}{" "}
            <b
              style={{
                color: C.emerald,
                fontWeight: 700,
                fontVariantNumeric: "tabular-nums",
                textShadow: gainGlow > 0 ? `0 0 ${18 * gainGlow}px rgba(52,211,153,${0.9 * gainGlow})` : undefined,
              }}
            >
              {toGain}
            </b>
          </span>
        );
        const row: React.CSSProperties = {
          display: "flex",
          alignItems: "baseline",
          columnGap: (layout === "stacked" ? 12 : 18) * k,
          flexWrap: "nowrap",
          whiteSpace: "nowrap",
        };
        if (layout === "stacked") {
          return (
            <>
              <div style={row}>
                {label}
                {best}
              </div>
              <div style={{ ...row, marginTop: 6 * k }}>
                {ideal}
                {gain}
              </div>
            </>
          );
        }
        return (
          <>
            <div style={row}>
              {label}
              {best}
              {ideal}
              {gain}
            </div>
            <p style={{ ...it(4), ...font("b", 10.5 * k, 400), color: C.muted, margin: `${4 * k}px 0 0`, lineHeight: 1.35, whiteSpace: "normal" }}>
              {p.explanation}
            </p>
          </>
        );
      })()}
    </div>
  );
};

/* ───────────────────────── Onglets de la carte ───────────────────────── */

const TAB_ICONS = [Gauge, Activity, Timer, GitCompare];

export const MapTabs: React.FC<{ k: number; width: number; active?: number; style?: React.CSSProperties }> = ({ k, width, active = 0, style }) => (
  <div
    style={{
      width,
      display: "flex",
      gap: 4 * k,
      padding: 4 * k,
      borderRadius: 12 * k,
      background: "rgba(31,31,31,0.6)",
      boxSizing: "border-box",
      ...style,
    }}
  >
    {ui.perfectLap.tabs.map((t, i) => {
      const Icon = TAB_ICONS[i];
      const on = i === active;
      return (
        <div
          key={t}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6 * k,
            padding: `${6 * k}px ${12 * k}px`,
            borderRadius: 8 * k,
            ...font("b", 12.5 * k, 500),
            color: on ? "#FFFFFF" : C.muted,
            whiteSpace: "nowrap",
            background: on ? G.primary : "transparent",
            boxShadow: on ? "0 0 20px -5px rgba(255,66,66,0.5)" : undefined,
          }}
        >
          <Icon size={16 * k} strokeWidth={2} />
          {t}
        </div>
      );
    })}
  </div>
);

export const AiToggle: React.FC<{ k: number; style?: React.CSSProperties }> = ({ k, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6 * k,
      padding: `${6 * k}px ${10 * k}px`,
      borderRadius: 7 * k,
      background: "rgba(234,179,8,0.92)",
      border: `${k}px solid #EAB308`,
      color: "#422006",
      ...font("b", 10.5 * k, 800),
      letterSpacing: "0.02em",
      boxShadow: "0 4px 12px rgba(0,0,0,0.35)",
      ...style,
    }}
  >
    <svg width={14 * k} height={14 * k} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="m12 14 4-4" />
      <path d="M3.34 19a10 10 0 1 1 17.32 0" />
    </svg>
    {ui.perfectLap.aiToggle}
  </div>
);
