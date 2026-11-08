/**
 * ApexAI — Rapport d'analyse (PDF A4, vectoriel)
 *
 * Un document de travail, pas une capture d'écran : tout est dessiné à partir
 * des données de l'analyse (texte sélectionnable, net à l'impression, léger).
 * Pensé pour le débrief au stand, imprimé ou sur téléphone :
 *
 *  1. Débrief — chronos, potentiel, les points à travailler, carte du circuit
 *     colorée par le temps perdu, temps au tour.
 *  2. Virage par virage — tableau complet, où se cache le temps, secteurs.
 *  3. Le meilleur tour en courbes — vitesse (contre le 2e meilleur tour),
 *     gaz et frein, puis les freinages.
 *  4. Plan de séance — les conseils détaillés et la place pour noter.
 */
import type jsPDF from "jspdf";
import { addApexPage, apexTable, createApexDoc, finalizeAndSave, finalizeDoc, notesArea, PDF_COLORS } from "./apexPdf";

type RGB = [number, number, number];
const C = {
  ...PDF_COLORS,
  orange: [249, 115, 22] as RGB,
  green: [22, 163, 74] as RGB,
  amber: [217, 119, 6] as RGB,
  grey: [161, 161, 170] as RGB,
  light: [212, 212, 216] as RGB,
};
const PAGE_W = 210;
const M = 14;
const W = PAGE_W - 2 * M;
const BOTTOM = 270;
/** Hauteur de ligne jsPDF (facteur 1,15) en mm par point de corps. */
const LH = 0.406;

// ───────────────────────────────────────────────────────────── formats

const num = (v: unknown): number | null => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const fr = (v: number, d = 1) => v.toFixed(d).replace(".", ",");
/** 55,193 s → « 55,193 » ; 62,197 → « 1:02,197 ». */
const lapStr = (s?: number | null) => {
  if (s == null || !Number.isFinite(s)) return "-";
  if (s < 60) return fr(s, 3);
  const m = Math.floor(s / 60);
  return `${m}:${fr(s - m * 60, 3).padStart(6, "0")}`;
};
const gainStr = (s: number) => `${s >= 0 ? "-" : "+"}${fr(Math.abs(s), 2)} s`;
/** Helvetica (WinAnsi) n'a pas certains signes : on les remplace. */
const clean = (s: unknown) =>
  String(s ?? "")
    .replace(/[−–—]/g, "-")
    .replace(/[→➡]/g, ">")
    .replace(/≈/g, "~")
    .replace(/\u2009|\u202f/g, " ")
    .replace(/[\u{1F300}-\u{1FAFF}☀-➿]/gu, "")
    .trim();

function text(doc: jsPDF, s: string | string[], x: number, y: number, o: { size?: number; bold?: boolean; color?: RGB; align?: "left" | "right" | "center" } = {}) {
  doc.setFont("helvetica", o.bold ? "bold" : "normal");
  doc.setFontSize(o.size ?? 9);
  doc.setTextColor(...(o.color ?? C.text));
  doc.text(Array.isArray(s) ? s.map(clean) : clean(s), x, y, o.align ? { align: o.align } : undefined);
}

function heading(doc: jsPDF, y: number, title: string, sub?: string): number {
  doc.setFillColor(...C.red);
  doc.rect(M, y - 3.4, 1.6, 4.8, "F");
  text(doc, title, M + 4, y, { size: 11.5, bold: true });
  if (sub) text(doc, sub, PAGE_W - M, y, { size: 7.5, color: C.muted, align: "right" });
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.25);
  doc.line(M, y + 2.6, PAGE_W - M, y + 2.6);
  return y + 8;
}

/** Couleur d'un virage selon son temps perdu (vert / ambre / rouge). */
function lossColor(loss: number, max: number): RGB {
  if (max <= 0 || loss < 0.03) return C.green;
  return loss >= max * 0.6 ? C.red : loss >= max * 0.25 ? C.amber : C.green;
}

// ───────────────────────────────────────────────────────────── données

interface Lap {
  lap: number;
  time: number;
  used: boolean;
  best: boolean;
}

function lapsOf(a: any): Lap[] {
  const used: number[] = a.ideal_lap?.laps_used || a.plot_data?.racing_line_meta?.laps_used || [];
  const report = a.plot_data?.lap_report;
  let laps: Lap[] = [];
  if (report?.available && Array.isArray(report.laps)) {
    laps = report.laps
      .map((l: any) => ({ lap: Number(l.lap), time: Number(l.time_s), used: used.length ? used.includes(Number(l.lap)) : true, best: !!l.is_best }))
      .filter((l: Lap) => Number.isFinite(l.time) && l.time > 0);
  } else if (Array.isArray(a.lap_times)) {
    laps = a.lap_times
      .map((t: number, i: number) => ({ lap: i + 1, time: Number(t), used: used.length ? used.includes(i + 1) : true, best: false }))
      .filter((l: Lap) => Number.isFinite(l.time) && l.time > 0);
  }
  if (laps.length && !laps.some((l) => l.best)) {
    const b = laps.filter((l) => l.used).sort((x, y) => x.time - y.time)[0] ?? laps[0];
    b.best = true;
  }
  return laps;
}

function bestLapNumber(a: any, laps: Lap[]): number | null {
  return laps.find((l) => l.best)?.lap ?? num(a.statistics?.fastest_lap_number) ?? num(a.ideal_lap?.best_lap_number);
}

/** Courbe d'un tour (distance remise à 0 au début du tour). */
function lapSeries(laps: any[] | undefined, lapNumber: number | null, key: string): { d: number[]; v: number[] } | null {
  if (!laps || lapNumber == null) return null;
  const l = laps.find((x) => Number(x.lap_number) === lapNumber);
  if (!l?.distance_m?.length || !l[key]?.length) return null;
  const d0 = Number(l.distance_m[0]) || 0;
  return { d: l.distance_m.map((x: number) => Number(x) - d0), v: l[key].map(Number) };
}

/** Position des virages le long du tour, d'après le tracé GPS du meilleur tour. */
function cornerDistances(a: any, lapNumber: number | null, lapLength: number): Record<number, number> {
  const traj = a.plot_data?.trajectory_2d;
  const lap = traj?.laps?.find((l: any) => Number(l.lap_number) === lapNumber && !l.is_synthetic);
  const out: Record<number, number> = {};
  if (!lap?.lat?.length || !lapLength) return out;
  const n = lap.lat.length;
  const k = Math.cos(((lap.lat[0] || 0) * Math.PI) / 180);
  for (const c of a.corner_analysis || []) {
    const la = num(c.apex_lat);
    const lo = num(c.apex_lon);
    if (la == null || lo == null) continue;
    let best = -1;
    let bd = Infinity;
    for (let i = 0; i < n; i++) {
      const dx = (lap.lon[i] - lo) * k;
      const dy = lap.lat[i] - la;
      const dd = dx * dx + dy * dy;
      if (dd < bd) {
        bd = dd;
        best = i;
      }
    }
    if (best >= 0) out[Number(c.corner_id)] = (best / Math.max(1, n - 1)) * lapLength;
  }
  return out;
}

// ───────────────────────────────────────────────────────────── dessins

function kpis(doc: jsPDF, y: number, items: { label: string; value: string; sub?: string; accent?: boolean }[]): number {
  const gap = 2.5;
  const w = (W - gap * (items.length - 1)) / items.length;
  const h = 21;
  items.forEach((it, i) => {
    const x = M + i * (w + gap);
    doc.setFillColor(...(it.accent ? C.black : C.panel));
    doc.roundedRect(x, y, w, h, 1.5, 1.5, "F");
    text(doc, it.label.toUpperCase(), x + 3.5, y + 5.5, { size: 6.3, color: it.accent ? [170, 170, 175] : C.muted });
    text(doc, it.value, x + 3.5, y + 13.2, { size: 14, bold: true, color: it.accent ? [255, 255, 255] : C.text });
    if (it.sub) text(doc, it.sub, x + 3.5, y + 18, { size: 6.8, color: it.accent ? C.orange : C.muted });
  });
  return y + h + 7;
}

/** Carte vectorielle : tracé du meilleur tour, virages colorés par le temps perdu. */
function trackMap(doc: jsPDF, a: any, x0: number, y: number, boxW: number, boxH: number, bestLap: number | null) {
  const traj = a.plot_data?.trajectory_2d;
  const lap =
    traj?.laps?.find((l: any) => Number(l.lap_number) === bestLap && !l.is_synthetic) ||
    traj?.laps?.find((l: any) => l.is_best && !l.is_synthetic) ||
    traj?.laps?.find((l: any) => !l.is_synthetic);
  doc.setFillColor(...C.panel);
  doc.roundedRect(x0, y, boxW, boxH, 1.5, 1.5, "F");
  if (!lap?.lat?.length) {
    text(doc, "Tracé GPS indisponible pour cette séance.", x0 + boxW / 2, y + boxH / 2, { size: 8, color: C.muted, align: "center" });
    return;
  }
  const pts = lap.lat
    .map((la: number, i: number) => ({ la: Number(la), lo: Number(lap.lon[i]) }))
    .filter((p: any) => Number.isFinite(p.la) && Number.isFinite(p.lo) && p.la && p.lo);
  if (pts.length < 10) return;
  const lats = pts.map((p: any) => p.la);
  const lons = pts.map((p: any) => p.lo);
  const latMin = Math.min(...lats);
  const latMax = Math.max(...lats);
  const lonMin = Math.min(...lons);
  const kx = Math.cos((((latMin + latMax) / 2) * Math.PI) / 180);
  const spanX = Math.max((Math.max(...lons) - lonMin) * kx, 1e-9);
  const spanY = Math.max(latMax - latMin, 1e-9);
  const pad = 9;
  const s = Math.min((boxW - 2 * pad) / spanX, (boxH - 2 * pad - 5) / spanY);
  const ox = x0 + (boxW - spanX * s) / 2;
  const oy = y + (boxH - 5 - spanY * s) / 2;
  const P = (la: number, lo: number): [number, number] => [ox + (lo - lonMin) * kx * s, oy + (latMax - la) * s];

  const path = (width: number, color: RGB) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(width);
    doc.setLineCap("round");
    doc.setLineJoin("round");
    let prev = P(pts[0].la, pts[0].lo);
    for (let i = 1; i < pts.length; i++) {
      const cur = P(pts[i].la, pts[i].lo);
      doc.line(prev[0], prev[1], cur[0], cur[1]);
      prev = cur;
    }
    const first = P(pts[0].la, pts[0].lo);
    doc.line(prev[0], prev[1], first[0], first[1]);
  };
  path(3.2, C.light);
  path(0.7, C.black);

  // Ligne de départ
  const [sx, sy] = P(pts[0].la, pts[0].lo);
  doc.setFillColor(...C.black);
  doc.rect(sx - 1.4, sy - 1.4, 2.8, 2.8, "F");
  doc.setFillColor(255, 255, 255);
  doc.rect(sx - 1.4, sy - 1.4, 1.4, 1.4, "F");
  doc.rect(sx, sy, 1.4, 1.4, "F");

  // Virages
  const corners: any[] = a.corner_analysis || [];
  const maxLoss = Math.max(0, ...corners.map((c) => Number(c.time_lost) || 0));
  const cx0 = ox + (spanX * s) / 2;
  const cy0 = oy + (spanY * s) / 2;
  for (const c of corners) {
    const la = num(c.apex_lat);
    const lo = num(c.apex_lon);
    if (la == null || lo == null) continue;
    const [px, py] = P(la, lo);
    // Étiquette poussée vers l'extérieur du circuit pour ne pas masquer le tracé
    const dx = px - cx0;
    const dy = py - cy0;
    const dn = Math.hypot(dx, dy) || 1;
    const lx = px + (dx / dn) * 4.2;
    const ly = py + (dy / dn) * 4.2;
    doc.setFillColor(...lossColor(Number(c.time_lost) || 0, maxLoss));
    doc.circle(lx, ly, 2.5, "F");
    text(doc, String(c.corner_number ?? c.corner_id), lx, ly + 1.05, { size: 6.2, bold: true, color: [255, 255, 255], align: "center" });
  }

  // Légende
  const ly = y + boxH - 3.5;
  let lx = x0 + 4;
  for (const [label, col] of [
    ["peu de temps perdu", C.green],
    ["à travailler", C.amber],
    ["le plus coûteux", C.red],
  ] as [string, RGB][]) {
    doc.setFillColor(...col);
    doc.circle(lx + 1.2, ly - 1, 1.2, "F");
    text(doc, label, lx + 3.3, ly, { size: 6.5, color: C.muted });
    lx += doc.getTextWidth(label) + 9;
  }
}

/** Temps au tour : barres, meilleur tour en rouge, tours écartés en clair. */
function lapBars(doc: jsPDF, laps: Lap[], x0: number, y: number, w: number, h: number) {
  const used = laps.filter((l) => l.used);
  if (!laps.length) return;
  const best = Math.min(...(used.length ? used : laps).map((l) => l.time));
  const worstUsed = Math.max(...(used.length ? used : laps).map((l) => l.time));
  // Échelle serrée sur les tours représentatifs : les écarts se voient.
  const lo = best - Math.max(0.4, (worstUsed - best) * 0.35);
  const hi = worstUsed + Math.max(0.2, (worstUsed - best) * 0.15);
  const n = laps.length;
  const slot = w / n;
  const bw = Math.min(9, slot * 0.68);
  doc.setDrawColor(...C.line);
  doc.setLineWidth(0.2);
  doc.line(x0, y + h, x0 + w, y + h);
  laps.forEach((l, i) => {
    const t = Math.min(l.time, hi);
    const bh = Math.max(1.2, ((t - lo) / (hi - lo)) * (h - 7));
    const bx = x0 + i * slot + (slot - bw) / 2;
    const col: RGB = l.best ? C.red : l.used ? C.grey : C.light;
    doc.setFillColor(...col);
    doc.rect(bx, y + h - bh, bw, bh, "F");
    if (l.time > hi) {
      // tour hors échelle (stands, drapeau) : coupé
      doc.setFillColor(255, 255, 255);
      doc.rect(bx - 0.3, y + h - bh + 1.4, bw + 0.6, 0.7, "F");
    }
    text(doc, l.used ? lapStr(l.time).replace(/(\d)$/, "") : "écarté", bx + bw / 2, y + h - bh - 1.3, {
      size: n > 14 ? 5 : 5.8,
      bold: l.best,
      color: l.best ? C.red : C.muted,
      align: "center",
    });
    text(doc, `T${l.lap}`, bx + bw / 2, y + h + 3.6, { size: 6, color: C.muted, align: "center" });
  });
}

interface Series {
  d: number[];
  v: number[];
  color: RGB;
  width: number;
}

/** Courbe(s) en fonction de la distance, avec repères des virages. */
function lineChart(
  doc: jsPDF,
  x0: number,
  y: number,
  w: number,
  h: number,
  series: Series[],
  o: { xMax: number; yMin: number; yMax: number; yStep: number; yUnit: string; markers?: { d: number; label: string }[]; fill?: boolean }
) {
  const X = (d: number) => x0 + (Math.max(0, Math.min(o.xMax, d)) / o.xMax) * w;
  const Y = (v: number) => y + h - ((Math.max(o.yMin, Math.min(o.yMax, v)) - o.yMin) / (o.yMax - o.yMin)) * h;
  // grille
  doc.setLineWidth(0.15);
  doc.setDrawColor(...C.line);
  for (let v = Math.ceil(o.yMin / o.yStep) * o.yStep; v <= o.yMax + 1e-6; v += o.yStep) {
    doc.line(x0, Y(v), x0 + w, Y(v));
    text(doc, `${Math.round(v)}`, x0 - 1.5, Y(v) + 1, { size: 6, color: C.muted, align: "right" });
  }
  text(doc, o.yUnit, x0 - 1.5, y - 2.5, { size: 6, color: C.muted, align: "right" });
  // repères virages
  for (const m of o.markers || []) {
    const mx = X(m.d);
    doc.setDrawColor(...C.light);
    doc.setLineDashPattern([0.6, 0.8], 0);
    doc.line(mx, y, mx, y + h);
    doc.setLineDashPattern([], 0);
    text(doc, m.label, mx, y + h + 3.4, { size: 5.8, color: C.muted, align: "center" });
  }
  // courbes
  for (const s of series) {
    doc.setDrawColor(...s.color);
    doc.setLineWidth(s.width);
    doc.setLineJoin("round");
    for (let i = 1; i < s.d.length; i++) {
      if (!Number.isFinite(s.v[i]) || !Number.isFinite(s.v[i - 1])) continue;
      doc.line(X(s.d[i - 1]), Y(s.v[i - 1]), X(s.d[i]), Y(s.v[i]));
    }
  }
  // axe distance
  doc.setDrawColor(...C.grey);
  doc.setLineWidth(0.2);
  doc.line(x0, y + h, x0 + w, y + h);
  text(doc, `${Math.round(o.xMax)} m`, x0 + w, y + h + 7.2, { size: 6, color: C.muted, align: "right" });
  text(doc, "0 m", x0, y + h + 7.2, { size: 6, color: C.muted });
}

/** Barres horizontales : où se cache le temps. */
function lossBars(doc: jsPDF, rows: { label: string; loss: number }[], x0: number, y: number, w: number): number {
  const max = Math.max(...rows.map((r) => r.loss), 0.01);
  const rowH = 5.4;
  rows.forEach((r, i) => {
    const yy = y + i * rowH;
    text(doc, r.label, x0, yy + 3.4, { size: 7.5, bold: i < 3 });
    const bx = x0 + 14;
    const bwMax = w - 14 - 16;
    doc.setFillColor(...C.panel);
    doc.rect(bx, yy + 0.8, bwMax, 3.2, "F");
    doc.setFillColor(...lossColor(r.loss, max));
    doc.rect(bx, yy + 0.8, Math.max(0.6, (r.loss / max) * bwMax), 3.2, "F");
    text(doc, `${fr(r.loss, 2)} s`, x0 + w, yy + 3.4, { size: 7.5, bold: i < 3, align: "right" });
  });
  return y + rows.length * rowH + 4;
}

function measure(doc: jsPDF, s: string, w: number, size: number, bold = false): number {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  return doc.splitTextToSize(clean(s), w).length * size * LH;
}

function wrapBlock(doc: jsPDF, s: string, x: number, y: number, w: number, size: number, color: RGB = C.text, bold = false): number {
  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  const lines = doc.splitTextToSize(clean(s), w);
  text(doc, lines, x, y, { size, color, bold });
  return y + lines.length * size * LH;
}

// ───────────────────────────────────────────────────────────── rapport

export function buildAnalysisReport(analysis: any): { doc: jsPDF; filename: string } {
  const a = analysis || {};
  const sc = a.session_conditions || {};
  const stats = a.statistics || {};
  const ps = a.performance_score || {};
  const corners: any[] = [...(a.corner_analysis || [])].sort((x, y) => (x.corner_number ?? x.corner_id) - (y.corner_number ?? y.corner_id));
  const advice: any[] = (a.coaching_advice || []).filter((x: any) => !x?.locked);
  const actions = advice.filter((x) => (Number(x.impact_seconds) || 0) > 0 || (x.category && x.category !== "info"));
  const notes = advice.filter((x) => !actions.includes(x));

  const circuit = clean(sc.circuit_name || a.circuit?.name || "Circuit non identifié");
  // Date de la séance (pas celle de l'analyse) quand le fichier la donne.
  const whenRaw = a.session_date || sc.session_date || sc.weather?.at || a.date || a.timestamp;
  const when = whenRaw && !isNaN(new Date(whenRaw).getTime()) ? new Date(whenRaw) : new Date();
  const dateStr = when.toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" });
  const header = { docType: "Rapport d'analyse", title: circuit, rightLines: [clean(sc.session_name || a.session_name || "Séance"), dateStr] };

  const laps = lapsOf(a);
  const bestNo = bestLapNumber(a, laps);
  const used = laps.filter((l) => l.used);
  const bestTime = num(a.best_lap_time) ?? laps.find((l) => l.best)?.time ?? null;
  const ideal = a.ideal_lap?.available ? num(a.ideal_lap.ideal_lap_time_s) : null;
  const theoSectors = num(a.plot_data?.lap_report?.sectors?.theoretical_s);
  const mean = used.length ? used.reduce((s, l) => s + l.time, 0) / used.length : null;
  const sd = used.length > 1 && mean != null ? Math.sqrt(used.reduce((s, l) => s + (l.time - mean) ** 2, 0) / (used.length - 1)) : null;

  const { doc, y: y0 } = createApexDoc(header);
  let y = y0 + 2;

  // ═══════════════ PAGE 1 — DÉBRIEF ═══════════════
  text(doc, circuit, M, y + 3, { size: 17, bold: true });
  const cond = [
    sc.resolved?.label || { dry: "Sec", damp: "Humide", wet: "Mouillé", rain: "Pluie" }[sc.track_condition as string],
    sc.track_temperature != null ? `piste ${Math.round(sc.track_temperature)} °C` : null,
    sc.air_temp != null ? `air ${Math.round(sc.air_temp)} °C` : null,
    a.import_diagnostics?.device ? clean(a.import_diagnostics.device) : null,
  ]
    .filter(Boolean)
    .join(" · ");
  text(doc, `${dateStr}${cond ? ` · ${cond}` : ""}`, M, y + 9, { size: 8.5, color: C.muted });
  y += 16;

  const potential = bestTime != null && ideal != null ? bestTime - ideal : null;
  y = kpis(doc, y, [
    { label: "Meilleur tour", value: lapStr(bestTime), sub: bestNo != null ? `tour ${bestNo}` : undefined, accent: true },
    {
      label: "Tour idéal",
      value: lapStr(ideal ?? theoSectors),
      sub: potential != null && potential > 0 ? `${fr(potential, 2)} s à aller chercher` : "meilleurs passages réunis",
    },
    { label: "Régularité", value: sd != null ? `± ${fr(sd, 2)} s` : "-", sub: mean != null ? `moyenne ${lapStr(mean)}` : undefined },
    { label: "Tours", value: `${used.length || laps.length}`, sub: laps.length > used.length ? `${laps.length - used.length} écarté(s)` : "tous retenus" },
    { label: "Score", value: ps.overall_score != null ? `${Math.round(ps.overall_score)}/100` : "-", sub: ps.grade ? `note ${ps.grade}` : undefined },
  ]);

  // À retenir
  y = heading(doc, y, "À retenir pour ta prochaine séance");
  const top = [...actions].sort((p, q) => (Number(q.impact_seconds) || 0) - (Number(p.impact_seconds) || 0)).slice(0, 3);
  if (!top.length) {
    y = wrapBlock(doc, "Aucun point chiffré à travailler sur cette séance : continue sur ce rythme.", M, y + 1, W, 9, C.muted) + 4;
  }
  top.forEach((t, i) => {
    doc.setFillColor(...C.black);
    doc.circle(M + 2.6, y + 0.9, 2.6, "F");
    text(doc, String(i + 1), M + 2.6, y + 2, { size: 8, bold: true, color: [255, 255, 255], align: "center" });
    const gain = Number(t.impact_seconds) || 0;
    if (gain > 0) text(doc, gainStr(gain), PAGE_W - M, y + 2, { size: 9.5, bold: true, color: C.red, align: "right" });
    const yy = wrapBlock(doc, t.message || "Conseil", M + 8, y + 2, W - 30, 9.3, C.text, true);
    y = Math.max(yy, y + 4) + 1.2;
  });
  y += 3;

  // Carte + temps au tour
  y = heading(doc, y, "Le circuit et tes tours", "virages colorés selon le temps perdu");
  const mapH = 88;
  trackMap(doc, a, M, y, W * 0.5 - 2, mapH, bestNo);
  const bx = M + W * 0.5 + 3;
  const bw = W * 0.5 - 3;
  text(doc, "Temps au tour", bx, y + 3, { size: 8, bold: true });
  text(doc, "en rouge : meilleur tour", bx + bw, y + 3, { size: 6.5, color: C.muted, align: "right" });
  lapBars(doc, laps, bx + 2, y + 9, bw - 2, mapH - 16);
  y += mapH + 6;

  if (a.plot_data?.lap_report?.sectors?.laps?.length) {
    const sec = a.plot_data.lap_report.sectors;
    const best: number[] = (sec.best || []).map(Number);
    const parts = best.map((b, i) => `S${i + 1} ${fr(b, 3)}`).join("  ·  ");
    text(doc, `Meilleurs secteurs : ${parts}  =  ${lapStr(theoSectors)} (tour théorique)`, M, y, { size: 7.5, color: C.muted });
    y += 5;
  }

  // Repères de la séance (relevés du boîtier)
  const lr = a.plot_data?.lap_report;
  const usedRows = (lr?.laps || []).filter((l: any) => !used.length || used.some((u) => u.lap === Number(l.lap)));
  const maxOf = (k: string) => {
    const v = usedRows.map((l: any) => Number(l[k])).filter((x: number) => Number.isFinite(x) && x > 0);
    return v.length ? Math.max(...v) : null;
  };
  const marks: [string, string][] = [];
  const vmax = num(stats.max_speed) ?? maxOf("speed_max");
  if (vmax) marks.push(["Vitesse max", `${Math.round(vmax)} km/h${stats.max_speed_lap ? ` (T${stats.max_speed_lap})` : ""}`]);
  const tl = num(a.track_features?.track_length_m) ?? num(a.ideal_lap?.track_length_m);
  if (tl) marks.push(["Longueur du tour", `${Math.round(tl)} m`]);
  const rpm = maxOf("rpm_max");
  if (rpm) marks.push(["Régime max", `${Math.round(rpm).toLocaleString("fr-FR").replace(/\u202f|\u00a0/g, " ")} tr/min`]);
  const water = maxOf("water_max");
  if (water) marks.push(["Eau max", `${Math.round(water)} °C`]);
  const brakeG = num(a.plot_data?.braking?.capability_g) ?? maxOf("brake_g_max");
  if (brakeG) marks.push(["Freinage max", `${fr(brakeG, 2)} g`]);
  if (marks.length && y < BOTTOM - 30) {
    y = heading(doc, y + 2, "Repères de la séance", "relevés du boîtier sur les tours retenus");
    const cols = 3;
    const cw = W / cols;
    marks.forEach(([k, v], i) => {
      const xx = M + (i % cols) * cw;
      const yy = y + Math.floor(i / cols) * 11;
      text(doc, k.toUpperCase(), xx, yy, { size: 6.5, color: C.muted });
      text(doc, v, xx, yy + 5, { size: 11, bold: true });
    });
    y += Math.ceil(marks.length / cols) * 11 + 2;
  }

  // ═══════════════ PAGE 2 — VIRAGE PAR VIRAGE ═══════════════
  if (corners.length) {
    y = addApexPage(doc, header);
    y = heading(doc, y, "Virage par virage", `valeurs moyennées sur ${used.length || laps.length} tours`);
    const maxLoss = Math.max(...corners.map((c) => Number(c.time_lost) || 0), 0);
    const ranked = [...corners].sort((p, q) => (Number(q.time_lost) || 0) - (Number(p.time_lost) || 0));
    const top3 = new Set(ranked.slice(0, 3).filter((c) => (Number(c.time_lost) || 0) > 0).map((c) => c.corner_id));
    const brakingById: Record<number, any> = {};
    for (const b of a.plot_data?.braking?.corners || []) brakingById[Number(b.corner_id)] = b;

    const body = corners.map((c) => {
      const b = brakingById[Number(c.corner_id)];
      return [
        `V${c.corner_number ?? c.corner_id}`,
        c.corner_type === "left" ? "Gauche" : c.corner_type === "right" ? "Droite" : "-",
        num(c.entry_speed) ? `${Math.round(c.entry_speed)}` : "-",
        `${Math.round(Number(c.apex_speed_real) || 0)}`,
        `${Math.round(Number(c.apex_speed_optimal) || 0)}`,
        num(c.exit_speed) ? `${Math.round(c.exit_speed)}` : "-",
        b ? `${Math.round(b.braking_point_distance)} m` : "à fond",
        c.best_lap_here ? `T${c.best_lap_here}` : "-",
        `${fr(Number(c.time_lost) || 0, 2)} s`,
        String(c.grade ?? "-"),
      ];
    });
    y = tableWithHighlights(doc, y, ["Virage", "Sens", "Entrée", "Corde", "Cible", "Sortie", "Freinage", "Meilleur", "Perdu", "Note"], body, (i) =>
      top3.has(corners[i].corner_id), undefined, header
    );
    text(doc, "Vitesses en km/h. « Cible » : vitesse au point de corde atteignable avec l'adhérence de la séance. Lignes surlignées : les 3 virages qui coûtent le plus.", M, y - 2, {
      size: 6.5,
      color: C.muted,
    });
    y += 4;

    y = heading(doc, y, "Où se cache le temps", maxLoss > 0 ? `${fr(corners.reduce((s, c) => s + (Number(c.time_lost) || 0), 0), 2)} s au total` : undefined);
    y = lossBars(
      doc,
      ranked.slice(0, 8).map((c) => ({ label: `V${c.corner_number ?? c.corner_id}`, loss: Number(c.time_lost) || 0 })),
      M,
      y,
      W
    );

    const sec = a.plot_data?.lap_report?.sectors;
    if (sec?.laps?.length) {
      if (y > BOTTOM - 50) y = addApexPage(doc, header);
      y = heading(doc, y, "Secteurs", "temps en secondes, meilleur secteur en gras");
      const n = Number(sec.n) || (sec.best || []).length;
      const rows = sec.laps
        .filter((l: any) => !used.length || used.some((u) => u.lap === Number(l.lap)))
        .map((l: any) => [`T${l.lap}`, ...l.times.map((t: number) => fr(Number(t), 3)), lapStr(Number(l.total_s))]);
      const bestS: string[] = (sec.best || []).map((t: number) => fr(Number(t), 3));
      y = tableWithHighlights(
        doc,
        y,
        ["Tour", ...Array.from({ length: n }, (_, i) => `S${i + 1}`), "Tour complet"],
        rows,
        () => false,
        (r, c) => c > 0 && c <= n && rows[r][c] === bestS[c - 1],
        header
      );
    }
  }

  // ═══════════════ PAGE 3 — LE MEILLEUR TOUR EN COURBES ═══════════════
  const st = a.plot_data?.speed_trace?.laps;
  const best = lapSeries(st, bestNo, "speed_kmh");
  if (best) {
    y = addApexPage(doc, header);
    const second = [...used].filter((l) => l.lap !== bestNo).sort((p, q) => p.time - q.time)[0];
    const sec2 = second ? lapSeries(st, second.lap, "speed_kmh") : null;
    const lapLen = Math.max(...best.d);
    const cd = cornerDistances(a, bestNo, lapLen);
    const markers = corners.filter((c) => cd[Number(c.corner_id)] != null).map((c) => ({ d: cd[Number(c.corner_id)], label: `V${c.corner_number ?? c.corner_id}` }));

    y = heading(doc, y, "Vitesse sur le tour", second ? `meilleur tour (T${bestNo}) contre le 2e meilleur (T${second.lap})` : `tour ${bestNo}`);
    const all = [...best.v, ...(sec2?.v || [])].filter(Number.isFinite);
    const vMin = Math.floor((Math.min(...all) - 5) / 10) * 10;
    const vMax = Math.ceil((Math.max(...all) + 3) / 10) * 10;
    const series: Series[] = [];
    if (sec2) series.push({ ...sec2, color: C.grey, width: 0.45 });
    series.push({ ...best, color: C.red, width: 0.7 });
    lineChart(doc, M + 8, y + 2, W - 8, 62, series, { xMax: lapLen, yMin: vMin, yMax: vMax, yStep: 20, yUnit: "km/h", markers });
    y += 78;
    // Lecture des écarts de vitesse au point de corde
    if (sec2 && markers.length) {
      const diffs = markers
        .map((m) => {
          const at = (s: { d: number[]; v: number[] }) => {
            let k = 0;
            while (k < s.d.length - 1 && s.d[k] < m.d) k++;
            return s.v[k];
          };
          return { label: m.label, diff: at(best) - at(sec2) };
        })
        .filter((x) => Number.isFinite(x.diff))
        .sort((p, q) => Math.abs(q.diff) - Math.abs(p.diff))
        .slice(0, 3);
      const msg = diffs.map((x) => `${x.label} : ${x.diff >= 0 ? "+" : "-"}${Math.abs(Math.round(x.diff))} km/h`).join("  ·  ");
      if (msg) {
        text(doc, `Plus gros écarts au point de corde (meilleur tour contre T${second!.lap}) : ${msg}`, M, y, { size: 7.5, color: C.muted });
        y += 7;
      }
    }

    const tb = a.plot_data?.throttle_brake?.laps;
    const thr = lapSeries(tb, bestNo, "throttle_pct");
    const brk = lapSeries(tb, bestNo, "brake_pct");
    if (thr && brk) {
      y = heading(doc, y + 2, "Gaz et frein", `tour ${bestNo} · vert : gaz · rouge : frein`);
      const len = Math.max(...thr.d);
      lineChart(
        doc,
        M + 8,
        y + 2,
        W - 8,
        34,
        [
          { ...thr, color: C.green, width: 0.55 },
          { ...brk, color: C.red, width: 0.55 },
        ],
        { xMax: len, yMin: 0, yMax: 100, yStep: 50, yUnit: "%", markers }
      );
      y += 50;
    }

    const braking = a.plot_data?.braking?.corners || [];
    if (braking.length) {
      if (y > BOTTOM - 45) y = addApexPage(doc, header);
      y = heading(doc, y, "Freinages", `capacité démontrée ${fr(Number(a.plot_data.braking.capability_g) || 0, 2)} g`);
      y = tableWithHighlights(
        doc,
        y,
        ["Virage", "Déclenchement", "Ton meilleur", "Décélération", "Durée", "Temps mort", "Régularité"],
        braking.map((b: any) => [
          `V${b.corner_id}`,
          `${Math.round(b.braking_point_distance)} m`,
          b.braking_best_point_m != null ? `${Math.round(b.braking_best_point_m)} m (T${b.braking_best_lap ?? "-"})` : "-",
          `${fr(Number(b.braking_peak_g) || 0, 2)} g`,
          `${fr(Number(b.braking_duration_s) || 0, 2)} s`,
          `${fr(Number(b.coasting_s) || 0, 2)} s`,
          `± ${Math.round(Number(b.braking_consistency_m) || 0)} m`,
        ]),
        () => false,
        undefined,
        header
      );
      text(doc, "Déclenchement : distance avant le virage. « Ton meilleur » : ton passage le plus rapide, donc un repère que tu as déjà réalisé. Temps mort : ni gaz ni frein.", M, y - 2, {
        size: 6.5,
        color: C.muted,
      });
      y += 4;
    }
  }

  // ═══════════════ PAGE 4 — PLAN DE SÉANCE ═══════════════
  y = addApexPage(doc, header);
  y = heading(doc, y, "Plan de séance", actions.length ? `${actions.length} point${actions.length > 1 ? "s" : ""} à travailler` : undefined);
  actions.slice(0, 8).forEach((t, i) => {
    if (y > BOTTOM - 26) {
      y = addApexPage(doc, header);
      y = heading(doc, y, "Plan de séance (suite)");
    }
    const gain = Number(t.impact_seconds) || 0;
    const startY = y;
    const meta = [t.corner ? `Virage ${t.corner}` : null, t.difficulty ? `difficulté : ${t.difficulty}` : null].filter(Boolean).join(" · ");
    // Hauteur mesurée d'abord, pour poser le fond sous le texte
    const h =
      5 +
      measure(doc, `${i + 1}. ${t.message || "Conseil"}`, W - 30, 9.5, true) +
      (meta ? 1 + measure(doc, meta, W - 8, 7.5) : 0) +
      (t.explanation ? 1.5 + measure(doc, t.explanation, W - 8, 8.3) : 0) +
      3;
    doc.setFillColor(...C.panel);
    doc.rect(M, startY, W, h, "F");
    doc.setFillColor(...C.red);
    doc.rect(M, startY, 1.2, h, "F");
    let yy = wrapBlock(doc, `${i + 1}. ${t.message || "Conseil"}`, M + 4, startY + 5, W - 30, 9.5, C.text, true);
    if (meta) yy = wrapBlock(doc, meta, M + 4, yy + 1, W - 8, 7.5, C.muted);
    if (t.explanation) wrapBlock(doc, t.explanation, M + 4, yy + 1.5, W - 8, 8.3, C.text);
    if (gain > 0) text(doc, gainStr(gain), PAGE_W - M - 3, startY + 5, { size: 10, bold: true, color: C.red, align: "right" });
    y = startY + h + 3;
  });
  if (!actions.length) y = wrapBlock(doc, "Pas de point chiffré à travailler sur cette séance.", M, y + 2, W, 9, C.muted) + 4;

  if (notes.length && y < BOTTOM - 25) {
    y = heading(doc, y + 2, "Conditions et contexte");
    for (const n of notes.slice(0, 4)) {
      if (y > BOTTOM - 14) break;
      y = wrapBlock(doc, n.message || "", M, y + 1, W, 8.3, C.text, true);
      if (n.explanation) y = wrapBlock(doc, n.explanation, M, y + 0.5, W, 7.8, C.muted);
      y += 2.5;
    }
  }

  if (y > BOTTOM - 45) y = addApexPage(doc, header);
  y = heading(doc, y + 2, "Pour la prochaine séance");
  notesArea(doc, y, 5, "Objectifs, réglages essayés, ressentis");

  const safe = circuit.replace(/[^a-z0-9-_]+/gi, "_");
  const d = when.toISOString().slice(0, 10);
  return { doc, filename: `ApexAI-Analyse-${safe}-${d}.pdf` };
}

/** Tableau maison, avec lignes ou cellules mises en avant. */
function tableWithHighlights(
  doc: jsPDF,
  y: number,
  head: string[],
  body: string[][],
  rowHighlight: (i: number) => boolean,
  cellBold?: (r: number, c: number) => boolean,
  header?: { docType: string; title?: string; rightLines?: string[] }
): number {
  // Le tableau reste d'un seul tenant : nouvelle page (avec bandeau) s'il ne tient pas.
  if (header && y + 8 + body.length * 5.3 > BOTTOM) y = addApexPage(doc, header);
  return apexTable(doc, y, head, body, {
    styles: { fontSize: 7.8, cellPadding: { top: 1.5, bottom: 1.5, left: 2, right: 2 } },
    didParseCell: (data: any) => {
      if (data.section !== "body") return;
      if (rowHighlight(data.row.index)) {
        data.cell.styles.fillColor = [254, 226, 226];
        data.cell.styles.fontStyle = "bold";
      }
      if (cellBold?.(data.row.index, data.column.index)) data.cell.styles.fontStyle = "bold";
    },
  });
}

/** Le rapport en mémoire (aperçu, partage, tests). */
export function analysisReportBlob(analysis: any): { blob: Blob; filename: string } {
  const { doc, filename } = buildAnalysisReport(analysis);
  finalizeDoc(doc);
  return { blob: doc.output("blob"), filename };
}

export function exportAnalysisReportPDF(analysis: any): void {
  const { doc, filename } = buildAnalysisReport(analysis);
  finalizeAndSave(doc, filename);
}
