/**
 * Apex AI — Rapport d'Analyse Télémétrie (PDF A4, « Esprit Paddock »)
 *
 * Document de travail hors-ligne pour le pilote et son ingénieur :
 * tout ce qui est nécessaire pour débriefer, réviser et brainstormer
 * entre deux sessions, sans écran.
 *
 *  P1 — Synthèse : score, chronos, conditions, tracé GPS annoté, signature piste
 *  P2 — Virage par virage : table complète + points forts / axes de travail
 *  P3 — Plan de travail : conseils priorisés + zone de notes manuscrites
 */
import {
  createApexDoc, addApexPage, sectionTitle, kvGrid, apexTable,
  noteBox, kpiRow, circuitMap, notesArea, finalizeAndSave, PDF_COLORS,
} from "./apexPdf";

const COND_LABELS: Record<string, string> = {
  dry: "Sec", damp: "Humide", wet: "Mouillée", rain: "Pluie",
};
const RATIO_LABELS: Record<string, string> = {
  sinueux: "Sinueux", mixte: "Mixte", rapide: "Rapide",
};

function fmtTime(s?: number | null): string {
  if (s === null || s === undefined || !Number.isFinite(s)) return "—";
  return `${s.toFixed(2)} s`;
}

export interface PdfChartCapture {
  id: string;
  title: string;
  dataUrl: string;
  aspect: number; // largeur / hauteur
}

/**
 * Capture les graphiques réellement affichés dans l'app (sections marquées
 * data-pdf-chart) en images haute résolution, pour les embarquer tels quels
 * dans le rapport — fidélité totale avec ce que voit le pilote à l'écran.
 */
export async function captureAnalysisCharts(): Promise<PdfChartCapture[]> {
  const nodes = Array.from(document.querySelectorAll<HTMLElement>("[data-pdf-chart]"));
  if (!nodes.length) return [];
  const html2canvas = (await import("html2canvas")).default;
  const out: PdfChartCapture[] = [];

  for (const el of nodes) {
    try {
      const canvas = await html2canvas(el, {
        backgroundColor: "#0b0b0e",
        scale: 3, // rendu net à l'impression (≈300 dpi une fois réduit en A4)
        logging: false,
        useCORS: true,
        /**
         * On ne garde QUE le graphique : les titres et paragraphes explicatifs
         * de l'app feraient doublon avec la mise en page du PDF, et les
         * encarts d'abonnement n'ont rien à faire dans un document imprimé.
         */
        ignoreElements: (node) => {
          const tag = node.tagName?.toLowerCase();
          if (tag === "h2" || tag === "p") return true;
          if (tag === "button" || tag === "a") return true;
          const cls = typeof node.className === "string" ? node.className : "";
          return /backdrop-blur|cta|upgrade|locked/i.test(cls);
        },
      });

      // Rogne les marges vides laissées par les éléments ignorés
      const trimmed = trimCanvas(canvas, "#0b0b0e");
      out.push({
        id: el.dataset.pdfChart || "chart",
        title: el.dataset.pdfTitle || "",
        dataUrl: trimmed.toDataURL("image/jpeg", 0.95),
        aspect: trimmed.width / Math.max(trimmed.height, 1),
      });
    } catch {
      // un graphique qui échoue ne bloque pas le rapport
    }
  }
  return out;
}

/** Retire les bandes de fond uniformes autour du contenu réel. */
function trimCanvas(canvas: HTMLCanvasElement, bg: string): HTMLCanvasElement {
  const ctx = canvas.getContext("2d");
  if (!ctx) return canvas;
  const { width, height } = canvas;
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(0, 0, width, height).data;
  } catch {
    return canvas;
  }
  const br = parseInt(bg.slice(1, 3), 16);
  const bgv = parseInt(bg.slice(3, 5), 16);
  const bb = parseInt(bg.slice(5, 7), 16);
  const isBg = (i: number) =>
    Math.abs(data[i] - br) < 10 && Math.abs(data[i + 1] - bgv) < 10 && Math.abs(data[i + 2] - bb) < 10;

  let top = 0, bottom = height - 1;
  scanTop: for (; top < height; top++) {
    for (let x = 0; x < width; x++) if (!isBg((top * width + x) * 4)) break scanTop;
  }
  scanBottom: for (; bottom > top; bottom--) {
    for (let x = 0; x < width; x++) if (!isBg((bottom * width + x) * 4)) break scanBottom;
  }
  const pad = Math.round(canvas.width * 0.008);
  const newTop = Math.max(0, top - pad);
  const newH = Math.min(height - newTop, bottom - newTop + 1 + pad);
  if (newH <= 0 || newH === height) return canvas;

  const out = document.createElement("canvas");
  out.width = width;
  out.height = newH;
  const octx = out.getContext("2d");
  if (!octx) return canvas;
  octx.fillStyle = bg;
  octx.fillRect(0, 0, width, newH);
  octx.drawImage(canvas, 0, newTop, width, newH, 0, 0, width, newH);
  return out;
}

export function exportAnalysisReportPDF(analysis: any, opts?: { charts?: PdfChartCapture[] }): void {
  const sc = analysis.session_conditions || {};
  const ps = analysis.performance_score || {};
  const stats = analysis.statistics || {};
  const tf = analysis.track_features || {};
  const diag = analysis.import_diagnostics || {};
  const corners: any[] = analysis.corner_analysis || [];
  const advice: any[] = analysis.coaching_advice || [];

  const circuitName = sc.circuit_name || "Circuit non identifié";
  const dateStr = analysis.timestamp
    ? new Date(analysis.timestamp).toLocaleDateString("fr-FR")
    : new Date().toLocaleDateString("fr-FR");
  const header = {
    docType: "Rapport d'Analyse",
    title: circuitName,
    rightLines: [sc.session_name || "Session télémétrie", dateStr],
  };

  const { doc, y: y0 } = createApexDoc(header);
  let y = y0;

  // ── P1 : KPI de session ──
  y = kpiRow(doc, y, [
    { label: "Score global", value: `${Math.round(ps.overall_score ?? 0)}/100`, accent: true },
    { label: "Grade", value: String(ps.grade ?? "—"), accent: true },
    { label: "Meilleur tour", value: fmtTime(analysis.best_lap_time ?? analysis.lap_time) },
    { label: "Virages", value: String(analysis.corners_detected ?? corners.length) },
    { label: "Tours analysés", value: String(stats.laps_analyzed ?? "—") },
  ]);

  // ── Tracé du circuit : capture exacte de l'app si dispo, sinon vectoriel ──
  const charts = opts?.charts || [];
  const mapChart = charts.find((ch) => ch.id === "track_map");
  const traj = analysis.plot_data?.trajectory_2d;
  if (mapChart) {
    y = sectionTitle(doc, y, "Carte du Circuit");
    const w = 182;
    const h = Math.min(w / mapChart.aspect, 92);
    doc.setDrawColor(...PDF_COLORS.line);
    doc.setLineWidth(0.3);
    doc.rect(14, y, w, h);
    doc.addImage(mapChart.dataUrl, "JPEG", 14, y, w, h, undefined, "FAST");
    y += h + 6;
  } else {
    const bestLap = traj?.laps?.find((l: any) => l.is_best && !l.is_synthetic)
      || traj?.laps?.find((l: any) => !l.is_synthetic)
      || traj?.laps?.[0];
    if (bestLap?.lat?.length) {
      y = sectionTitle(doc, y, "Tracé du Circuit");
      y = circuitMap(
        doc, y, bestLap.lat, bestLap.lon,
        (traj?.corners || []).map((c: any) => ({ lat: c.lat, lon: c.lon, label: c.label, grade: c.grade })),
        { height: 66 }
      );
    }
  }

  // ── Signature de piste + conditions ──
  y = sectionTitle(doc, y, "Signature de Piste & Conditions");
  y = kvGrid(doc, y, [
    ["Caractère du tracé", tf.speed_ratio ? RATIO_LABELS[tf.speed_ratio] || tf.speed_ratio : "—"],
    ["Sens de rotation", tf.rotation === "anti-horaire" ? "Anti-horaire" : tf.rotation === "horaire" ? "Horaire" : "—"],
    ["Épingles / courbes rapides", tf.hairpins_count != null ? `${tf.hairpins_count} / ${tf.fast_corners_count ?? "—"}` : "—"],
    ["Longueur du tour", tf.track_length_m ? `${Math.round(tf.track_length_m)} m` : "—"],
    ["Vitesse apex moyenne", tf.avg_apex_speed_kmh ? `${tf.avg_apex_speed_kmh} km/h` : "—"],
    ["Vitesse max relevée", stats.max_speed ? `${Math.round(stats.max_speed)} km/h` : "—"],
    ["Conditions piste", COND_LABELS[sc.track_condition] || sc.track_condition || "—"],
    ["Température piste", sc.track_temperature != null ? `${sc.track_temperature} °C` : "—"],
    ["Régularité (écart)", stats.consistency_gap != null ? fmtTime(stats.consistency_gap) : "—"],
    ["Acquisition", diag.device ? `${diag.device}${diag.sample_rate_hz ? ` · ${diag.sample_rate_hz} Hz` : ""}` : "—"],
  ]);

  // ── Détail du score ──
  const bd = ps.breakdown || {};
  const bdMax: Record<string, number> = {
    apex_precision: 30, trajectory_consistency: 25, apex_speed: 25, sector_times: 20,
  };
  const bdLabels: Record<string, string> = {
    apex_precision: "Précision aux apex",
    trajectory_consistency: "Régularité de trajectoire",
    apex_speed: "Vitesse de passage",
    sector_times: "Temps par secteur",
  };
  if (Object.keys(bd).length) {
    y = sectionTitle(doc, y, "Détail du Score");
    y = apexTable(
      doc, y,
      ["Critère", "Obtenu", "Maximum", "Réussite"],
      Object.keys(bdLabels).map((k) => {
        const val = Number(bd[k] ?? 0);
        const max = bdMax[k] ?? 25;
        return [bdLabels[k], val.toFixed(1), String(max), `${Math.round((val / max) * 100)} %`];
      })
    );
  }

  // ── Pages Graphiques : les visuels exacts affichés dans l'app ──
  const graphCharts = charts.filter((ch) => ch.id !== "track_map");
  if (graphCharts.length) {
    y = addApexPage(doc, header);
    for (const ch of graphCharts) {
      const w = 182;
      const h = Math.min(w / ch.aspect, 105);
      // Titre + graphique restent solidaires : saut de page si besoin
      if (y + h + 10 > 268) y = addApexPage(doc, header);
      y = sectionTitle(doc, y, ch.title || "Graphique");
      // Cadre discret autour du visuel sombre pour le détacher du papier
      doc.setDrawColor(...PDF_COLORS.line);
      doc.setLineWidth(0.3);
      doc.rect(14, y, w, h);
      doc.addImage(ch.dataUrl, "JPEG", 14, y, w, h, undefined, "FAST");
      y += h + 8;
    }
  }

  // ── P2 : virage par virage ──
  if (corners.length) {
    y = addApexPage(doc, header);
    y = sectionTitle(doc, y, "Analyse Virage par Virage");
    y = apexTable(
      doc, y,
      ["Virage", "Type", "Apex réel", "Apex cible", "Rendement", "G lat.", "Temps perdu", "Note"],
      corners.map((c) => [
        c.label || `V${c.corner_number ?? c.corner_id}`,
        c.corner_type === "left" ? "Gauche" : c.corner_type === "right" ? "Droite" : "—",
        `${Math.round(c.apex_speed_real ?? 0)} km/h`,
        `${Math.round(c.apex_speed_optimal ?? 0)} km/h`,
        `${Math.round((c.speed_efficiency ?? 0) * (c.speed_efficiency <= 1 ? 100 : 1))} %`,
        (c.lateral_g_max ?? 0).toFixed(2),
        `${(c.time_lost ?? 0).toFixed(2)} s`,
        c.grade ?? "—",
      ])
    );

    const best = (stats.best_corners || []).join(", ");
    const worst = (stats.worst_corners || []).join(", ");
    if (best || worst) {
      y = kvGrid(doc, y, [
        ["Virages les mieux négociés", best ? `V${best.split(", ").join(", V")}` : "—"],
        ["Axes de travail prioritaires", worst ? `V${worst.split(", ").join(", V")}` : "—"],
      ], 2);
    }
    const totalLost = corners.reduce((a, c) => a + (Number(c.time_lost) || 0), 0);
    if (totalLost > 0) {
      y = noteBox(doc, y,
        `Potentiel cumulé sur ce tour : ${totalLost.toFixed(2)} s. Ce chiffre additionne le temps perdu virage par virage face à la trajectoire optimale calculée — il représente la marge de progression théorique, pas un objectif immédiat.`);
    }
    y = notesArea(doc, y, 3, "Observations pilote / ingénieur");
  }

  // ── P3 : plan de travail ──
  if (advice.length) {
    y = addApexPage(doc, header);
    y = sectionTitle(doc, y, "Plan de Travail — Conseils Priorisés");
    advice.slice(0, 6).forEach((a, i) => {
      const gain = Number(a.impact_seconds) || 0;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9.5);
      doc.setTextColor(...PDF_COLORS.text);
      const title = `${i + 1}. ${a.message || "Conseil"}`;
      const titleLines = doc.splitTextToSize(title, 150);
      doc.text(titleLines, 14, y);
      if (gain) {
        doc.setTextColor(...PDF_COLORS.red);
        doc.setFontSize(9);
        doc.text(`${gain > 0 ? "-" : "+"}${Math.abs(gain).toFixed(2)} s`, 196, y, { align: "right" });
      }
      y += titleLines.length * 4.2 + 1;
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...PDF_COLORS.muted);
      const meta = [
        a.corner ? `Virage ${a.corner}` : null,
        a.category ? String(a.category) : null,
        a.difficulty ? `difficulté : ${a.difficulty}` : null,
      ].filter(Boolean).join(" · ");
      if (meta) { doc.text(meta, 14, y); y += 4; }
      if (a.explanation) {
        doc.setTextColor(...PDF_COLORS.text);
        doc.setFontSize(8.2);
        const expl = doc.splitTextToSize(String(a.explanation), 182);
        doc.text(expl, 14, y);
        y += expl.length * 3.9;
      }
      y += 4.5;
      if (y > 250 && i < advice.length - 1) {
        y = addApexPage(doc, header);
        y = sectionTitle(doc, y, "Plan de Travail (suite)");
      }
    });
    y = notesArea(doc, Math.min(y + 2, 250), 4, "Objectifs prochaine session");
  }

  const safe = circuitName.replace(/[^a-z0-9-_]/gi, "_");
  finalizeAndSave(doc, `ApexAI-Analyse-${safe}-${dateStr.replace(/\//g, "-")}.pdf`);
}
