import React from "react";
import { Brain, Check, CloudRain, Droplets, FileSpreadsheet, Flag, Sun, Timer, Trophy, Upload, Waves, X } from "lucide-react";
import { C, G, BODY, DISPLAY } from "../theme";
import ui from "../data/ui-data.json";
import { LogoIcon } from "../components/Logo";

/** Écrans « Analyser » : barre de navigation, import, informations de session, analyse en cours. Tailles de l'app × k. */

const f = (fam: "d" | "b", size: number, weight: number): React.CSSProperties => ({
  fontFamily: fam === "d" ? `'${DISPLAY}', sans-serif` : `'${BODY}', sans-serif`,
  fontSize: size,
  fontWeight: weight,
});

/* ───────────────────────── Barre de navigation ───────────────────────── */

export const AppNavbar: React.FC<{ k: number; width: number; active?: string; style?: React.CSSProperties }> = ({ k, width, active = "Analyser", style }) => (
  <div
    style={{
      width,
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: `${10 * k}px ${16 * k}px`,
      borderRadius: 16 * k,
      background: "rgba(14,14,14,0.85)",
      border: `${k}px solid rgba(255,255,255,0.06)`,
      boxSizing: "border-box",
      ...style,
    }}
  >
    <div style={{ display: "flex", alignItems: "center", gap: 8 * k }}>
      <LogoIcon size={30 * k} glow={0.4} />
      <span style={{ ...f("d", 17 * k, 700), color: C.text, letterSpacing: "-0.01em" }}>
        APEX<span style={{ color: C.primary }}>AI</span>
      </span>
    </div>
    <div style={{ display: "flex", alignItems: "center", gap: 22 * k }}>
      {ui.navbar.items.map((it) =>
        it === active ? (
          <span
            key={it}
            style={{
              ...f("b", 12.5 * k, 600),
              color: "#FFFFFF",
              padding: `${6 * k}px ${14 * k}px`,
              borderRadius: 999,
              background: G.primary,
              boxShadow: "0 0 18px -4px rgba(255,66,66,0.7)",
            }}
          >
            {it}
          </span>
        ) : (
          <span key={it} style={{ ...f("b", 12.5 * k, 500), color: C.muted }}>
            {it}
          </span>
        ),
      )}
    </div>
    <div
      style={{
        width: 28 * k,
        height: 28 * k,
        borderRadius: 999,
        background: "#2A2A2A",
        border: `${k}px solid #3A3A3A`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        ...f("b", 12 * k, 700),
        color: C.text,
      }}
    >
      {ui.navbar.user.avatarInitial}
    </div>
  </div>
);

/* ───────────────────────── Titre de la page « Analyser » ───────────────────────── */

export const UploadHeader: React.FC<{ k: number; width: number; style?: React.CSSProperties }> = ({ k, width, style }) => (
  <div style={{ width, textAlign: "center", ...style }}>
    <div style={{ ...f("d", 40 * k, 700), color: C.text, letterSpacing: "-0.02em", lineHeight: 1.1 }}>
      Analysez votre{" "}
      <span
        style={{
          backgroundImage: G.textPrimary,
          WebkitBackgroundClip: "text",
          backgroundClip: "text",
          color: "transparent",
        }}
      >
        session
      </span>
    </div>
    <div style={{ ...f("b", 14 * k, 400), color: C.muted, marginTop: 10 * k, lineHeight: 1.5 }}>{ui.upload.subtitle}</div>
  </div>
);

/* ───────────────────────── Zone de dépôt ───────────────────────── */

export const DropZone: React.FC<{
  k: number;
  /** 0 = vide, 1 = survol (rouge) */
  hover: number;
  /** 0→1 passage à l'état « fichier sélectionné » (vert) */
  selected: number;
  style?: React.CSSProperties;
}> = ({ k, hover, selected, style }) => {
  const empty = 1 - selected;
  const border =
    selected > 0.5
      ? `${2 * k}px dashed rgba(34,197,94,0.55)`
      : `${2 * k}px dashed ${hover > 0.5 ? "rgba(255,66,66,0.85)" : "#333333"}`;
  const bg =
    selected > 0.5 ? "rgba(34,197,94,0.06)" : `rgba(255,66,66,${(0.06 * hover).toFixed(3)})`;
  return (
    <div
      style={{
        position: "relative",
        border,
        borderRadius: 12 * k,
        background: bg,
        height: 190 * k,
        boxSizing: "border-box",
        overflow: "hidden",
        transform: `scale(${1 + 0.02 * hover * empty})`,
        ...style,
      }}
    >
      {/* État vide */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8 * k,
          opacity: empty,
          filter: selected > 0.02 ? `blur(${(selected * 8).toFixed(2)}px)` : undefined,
        }}
      >
        <div
          style={{
            width: 44 * k,
            height: 44 * k,
            borderRadius: 10 * k,
            background: "#1F1F1F",
            border: `${k}px solid #2E2E2E`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Upload size={20 * k} color={hover > 0.5 ? C.primary : "#BDBDBD"} strokeWidth={2} />
        </div>
        <div style={{ ...f("b", 15 * k, 600), color: C.text }}>{ui.upload.dropTitle}</div>
        <div style={{ ...f("b", 12.5 * k, 400), color: C.muted }}>{ui.upload.dropSubtitle}</div>
        <div style={{ display: "flex", gap: 6 * k, marginTop: 6 * k }}>
          {ui.upload.formats.map((fm) => (
            <span
              key={fm}
              style={{
                ...f("b", 10.5 * k, 500),
                color: "#BDBDBD",
                background: "#1A1A1A",
                border: `${k}px solid #2A2A2A`,
                borderRadius: 6 * k,
                padding: `${3 * k}px ${8 * k}px`,
              }}
            >
              {fm}
            </span>
          ))}
        </div>
      </div>
      {/* État fichier sélectionné */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 10 * k,
          opacity: selected,
          transform: `scale(${0.92 + 0.08 * selected})`,
        }}
      >
        <div
          style={{
            width: 52 * k,
            height: 52 * k,
            borderRadius: 12 * k,
            background: G.success,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 30px -6px rgba(0,255,128,0.55)",
          }}
        >
          <FileSpreadsheet size={26 * k} color="#04140A" strokeWidth={2.2} />
        </div>
        <div style={{ ...f("b", 15 * k, 700), color: C.text }}>{ui.upload.file.name}</div>
        <div style={{ ...f("b", 12 * k, 400), color: C.muted }}>{ui.upload.file.size}</div>
        <X size={16 * k} color={C.muted} style={{ position: "absolute", right: 16 * k, top: 14 * k }} />
      </div>
    </div>
  );
};

/* ───────────────────────── Vignette fichier (glisser-déposer) ───────────────────────── */

export const FileVignette: React.FC<{ k: number; style?: React.CSSProperties }> = ({ k, style }) => (
  <div
    style={{
      width: 230 * k,
      height: 64 * k,
      borderRadius: 12 * k,
      background: "#181818",
      border: `${k}px solid #2E2E2E`,
      boxShadow: "0 24px 50px -14px rgba(0,0,0,0.75), 0 0 0 1px rgba(255,255,255,0.03)",
      display: "flex",
      alignItems: "center",
      gap: 12 * k,
      padding: `0 ${14 * k}px`,
      boxSizing: "border-box",
      ...style,
    }}
  >
    <div
      style={{
        width: 38 * k,
        height: 38 * k,
        borderRadius: 9 * k,
        background: G.success,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <FileSpreadsheet size={20 * k} color="#04140A" strokeWidth={2.2} />
    </div>
    <div style={{ display: "flex", flexDirection: "column" }}>
      <span style={{ ...f("b", 13.5 * k, 700), color: C.text }}>{ui.upload.file.name}</span>
      <span style={{ ...f("b", 11.5 * k, 400), color: C.muted }}>{ui.upload.file.size}</span>
    </div>
  </div>
);

/* ───────────────────────── Informations de session ───────────────────────── */

const CONDITION_ICONS = [Sun, Droplets, Waves, CloudRain];
const TYPE_ICONS = [Timer, Flag, Trophy];

const Chip: React.FC<{ k: number; label: string; on: boolean; Icon: React.ElementType; pop: number }> = ({ k, label, on, Icon, pop }) => (
  <span
    style={{
      display: "inline-flex",
      alignItems: "center",
      gap: 6 * k,
      padding: `${6 * k}px ${12 * k}px`,
      borderRadius: 999,
      ...f("b", 12 * k, 600),
      color: on ? "#FFFFFF" : "#BDBDBD",
      background: on ? C.orangeForm : "#1C1C1C",
      border: `${k}px solid ${on ? C.orangeForm : "#2C2C2C"}`,
      boxShadow: on ? "0 0 18px -4px rgba(255,107,53,0.7)" : undefined,
      transform: `scale(${pop})`,
      opacity: Math.min(1, pop * 1.2),
    }}
  >
    <Icon size={13 * k} strokeWidth={2.2} />
    {label}
  </span>
);

export const SessionInfo: React.FC<{ k: number; pops: number[]; style?: React.CSSProperties }> = ({ k, pops, style }) => {
  const s = ui.upload.sessionInfo;
  let idx = 0;
  const next = () => pops[idx++] ?? 1;
  return (
    <div
      style={{
        borderRadius: 12 * k,
        background: "#141414",
        border: `${k}px solid #262626`,
        padding: `${16 * k}px ${18 * k}px`,
        boxSizing: "border-box",
        ...style,
      }}
    >
      <div style={{ ...f("d", 15 * k, 700), color: C.text }}>{s.title}</div>
      <div style={{ ...f("b", 11.5 * k, 400), color: C.muted, marginTop: 2 * k }}>{s.subtitle}</div>
      <div style={{ ...f("b", 11.5 * k, 700), color: C.text, marginTop: 14 * k, marginBottom: 8 * k }}>{s.conditionsLabel}</div>
      <div style={{ display: "flex", gap: 8 * k }}>
        {s.conditions.map((c, i) => (
          <Chip key={c} k={k} label={c} on={c === s.conditionSelected} Icon={CONDITION_ICONS[i]} pop={next()} />
        ))}
      </div>
      <div style={{ ...f("b", 11.5 * k, 700), color: C.text, marginTop: 14 * k, marginBottom: 8 * k }}>{s.typeLabel}</div>
      <div style={{ display: "flex", gap: 8 * k }}>
        {s.types.map((t, i) => (
          <Chip key={t} k={k} label={t} on={t === s.typeSelected} Icon={TYPE_ICONS[i]} pop={next()} />
        ))}
      </div>
    </div>
  );
};

export const AnalyzeButton: React.FC<{ k: number; press?: number; glow?: number; style?: React.CSSProperties }> = ({ k, press = 0, glow = 0, style }) => (
  <div
    style={{
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: `${11 * k}px ${26 * k}px`,
      borderRadius: 10 * k,
      background: G.primary,
      ...f("b", 14 * k, 700),
      color: "#FFFFFF",
      boxShadow: `0 0 ${24 + 30 * glow}px -6px rgba(255,66,66,${0.55 + 0.4 * glow})`,
      transform: `scale(${1 - 0.05 * press})`,
      ...style,
    }}
  >
    {ui.upload.cta}
  </div>
);

/* ───────────────────────── Analyse en cours / terminée ───────────────────────── */

export const AnalyzingCard: React.FC<{
  k: number;
  width: number;
  /** 0→1 progression */
  progress: number;
  /** rotation de l'arc (degrés) */
  spin: number;
  /** index de l'étape affichée + transition 0→1 */
  step: number;
  stepBlend: number;
  /** 0→1 passage à l'état « terminée » */
  done: number;
  check: number;
  burst: number;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}> = ({ k, width, progress, spin, step, stepBlend, done, check, burst, children, style }) => {
  const a = ui.analyzing;
  const R = 46 * k;
  const circ = 2 * Math.PI * R;
  const arc = done > 0 ? 1 : 0.28;
  const cur = a.steps[Math.min(a.steps.length - 1, step)];
  const prev = a.steps[Math.max(0, step - 1)];
  return (
    <div
      style={{
        position: "relative",
        width,
        borderRadius: 16 * k,
        background: "rgba(16,16,16,0.92)",
        border: `${k}px solid #262626`,
        boxShadow: "0 40px 80px -30px rgba(0,0,0,0.8)",
        padding: `${30 * k}px ${28 * k}px ${26 * k}px`,
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        overflow: "hidden",
        ...style,
      }}
    >
      {/* Anneau / disque de succès */}
      <div style={{ position: "relative", width: 2 * R + 8 * k, height: 2 * R + 8 * k }}>
        <svg width={2 * R + 8 * k} height={2 * R + 8 * k} style={{ position: "absolute", inset: 0 }}>
          <circle cx={R + 4 * k} cy={R + 4 * k} r={R} fill="none" stroke="#262626" strokeWidth={4 * k} opacity={1 - done} />
          <circle
            cx={R + 4 * k}
            cy={R + 4 * k}
            r={R}
            fill="none"
            stroke={C.primary}
            strokeWidth={4 * k}
            strokeLinecap="round"
            strokeDasharray={`${circ * arc} ${circ}`}
            transform={`rotate(${spin - 90} ${R + 4 * k} ${R + 4 * k})`}
            opacity={1 - done}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 4 * k + R * (1 - 0.72),
            borderRadius: "50%",
            background: G.success,
            opacity: done,
            transform: `scale(${0.6 + 0.4 * done})`,
            boxShadow: `0 0 ${40 * done}px -4px rgba(0,255,128,0.7)`,
          }}
        />
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Brain size={34 * k} color={C.primary} strokeWidth={1.8} style={{ opacity: 1 - done }} />
        </div>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", opacity: done }}>
          <svg width={40 * k} height={40 * k} viewBox="0 0 24 24">
            <path
              d="M5 12.5 L10 17.5 L19 7.5"
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={2.8}
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="24"
              strokeDashoffset={24 * (1 - check)}
            />
          </svg>
        </div>
        {/* Éclat */}
        {burst > 0 && burst < 1
          ? Array.from({ length: 8 }, (_, i) => {
              const ang = (i / 8) * Math.PI * 2;
              const r0 = R * (1 + 0.15 + burst * 0.5);
              const len = 14 * k * (1 - burst);
              const cx = R + 4 * k;
              return (
                <div
                  key={i}
                  style={{
                    position: "absolute",
                    left: cx + Math.cos(ang) * r0 - 1.5 * k,
                    top: cx + Math.sin(ang) * r0 - len / 2,
                    width: 3 * k,
                    height: len,
                    borderRadius: 2 * k,
                    background: C.success,
                    transform: `rotate(${(ang * 180) / Math.PI + 90}deg)`,
                    opacity: 1 - burst,
                  }}
                />
              );
            })
          : null}
      </div>

      {/* Titres */}
      <div style={{ position: "relative", height: 30 * k, marginTop: 18 * k, width: "100%" }}>
        <div style={{ position: "absolute", inset: 0, textAlign: "center", ...f("d", 21 * k, 700), color: C.text, opacity: 1 - done }}>{a.title}</div>
        <div style={{ position: "absolute", inset: 0, textAlign: "center", ...f("d", 21 * k, 700), color: C.text, opacity: done }}>{a.doneTitle}</div>
      </div>
      <div style={{ position: "relative", height: 22 * k, marginTop: 4 * k, width: "100%" }}>
        <div style={{ position: "absolute", inset: 0, textAlign: "center", ...f("b", 13.5 * k, 400), color: C.muted, opacity: 1 - done }}>{a.subtitle}</div>
        <div style={{ position: "absolute", inset: 0, textAlign: "center", ...f("b", 13.5 * k, 400), color: C.muted, opacity: done }}>{a.doneSubtitle}</div>
      </div>

      {/* Étape en cours */}
      <div style={{ position: "relative", height: 22 * k, marginTop: 12 * k, width: "100%", opacity: 1 - done }}>
        <div
          style={{
            position: "absolute",
            inset: 0,
            textAlign: "center",
            ...f("b", 12.5 * k, 500),
            color: C.primary,
            opacity: 1 - stepBlend,
            filter: stepBlend > 0.01 ? `blur(${(stepBlend * 5).toFixed(2)}px)` : undefined,
          }}
        >
          {stepBlend < 1 ? prev : cur}
        </div>
        <div
          style={{
            position: "absolute",
            inset: 0,
            textAlign: "center",
            ...f("b", 12.5 * k, 500),
            color: C.primary,
            opacity: stepBlend,
            filter: stepBlend < 0.99 ? `blur(${((1 - stepBlend) * 5).toFixed(2)}px)` : undefined,
          }}
        >
          {cur}
        </div>
      </div>

      {/* Barre de progression */}
      <div style={{ width: 300 * k, marginTop: 12 * k, opacity: 1 - done }}>
        <div style={{ height: 6 * k, borderRadius: 999, background: "#262626", overflow: "hidden" }}>
          <div
            style={{
              width: `${(progress * 100).toFixed(2)}%`,
              height: "100%",
              borderRadius: 999,
              background: G.primary,
              boxShadow: "0 0 12px rgba(255,66,66,0.7)",
            }}
          />
        </div>
        <div style={{ textAlign: "right", ...f("b", 10.5 * k, 500), color: C.muted, marginTop: 5 * k, fontVariantNumeric: "tabular-nums" }}>
          {Math.round(progress * 100)}%
        </div>
      </div>

      {/* Pastille « Conditions : Sec » */}
      <div
        style={{
          marginTop: -18 * k,
          display: "inline-flex",
          alignItems: "center",
          gap: 8 * k,
          padding: `${5 * k}px ${12 * k}px`,
          borderRadius: 999,
          background: "#1C1C1C",
          border: `${k}px solid #2C2C2C`,
          ...f("b", 11.5 * k, 500),
          color: "#D4D4D4",
          opacity: done,
          transform: `translateY(${(1 - done) * 10}px)`,
        }}
      >
        <span style={{ width: 8 * k, height: 8 * k, borderRadius: 999, background: C.gold }} />
        {a.doneChip}
        <Check size={12 * k} color={C.success} strokeWidth={3} />
      </div>
      {children}
    </div>
  );
};
