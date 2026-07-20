/**
 * Apex AI — Moteur PDF partagé « Esprit Paddock »
 *
 * Charte unique pour tous les exports A4 de l'app (Setup Sheet, rapports).
 * Style "Fiche de Course Écurie Officielle" : papier blanc imprimable dans
 * les stands, bandeau noir, accents rouge ApexAI, typographie compacte,
 * signature officielle en pied de page.
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Palette de marque (RGB)
export const PDF_COLORS = {
  black: [10, 10, 12] as [number, number, number],
  red: [239, 68, 68] as [number, number, number],
  text: [24, 24, 27] as [number, number, number],
  muted: [113, 113, 122] as [number, number, number],
  line: [228, 228, 231] as [number, number, number],
  panel: [244, 244, 245] as [number, number, number],
};

const PAGE_W = 210;
const MARGIN = 14;

export interface PdfHeaderOpts {
  docType: string;      // "FICHE DE RÉGLAGES", "RAPPORT D'ANALYSE"...
  title?: string;       // ex: nom du réglage / de la session
  rightLines?: string[]; // ex: [circuit, date]
}

/** Crée le document A4 avec le bandeau d'en-tête ApexAI. Retourne le doc et le Y de départ. */
export function createApexDoc(opts: PdfHeaderOpts): { doc: jsPDF; y: number } {
  const doc = new jsPDF("p", "mm", "a4");

  // Bandeau noir
  doc.setFillColor(...PDF_COLORS.black);
  doc.rect(0, 0, PAGE_W, 26, "F");
  // Liseré rouge sous le bandeau
  doc.setFillColor(...PDF_COLORS.red);
  doc.rect(0, 26, PAGE_W, 1.2, "F");

  // Wordmark APEX AI
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...PDF_COLORS.red);
  doc.text("APEX", MARGIN, 12);
  const apexW = doc.getTextWidth("APEX");
  doc.setTextColor(255, 255, 255);
  doc.text("AI", MARGIN + apexW + 1, 12);

  // Type de document
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text(opts.docType.toUpperCase(), MARGIN, 20);
  if (opts.title) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 185);
    doc.text(`— ${opts.title}`, MARGIN + doc.getTextWidth(opts.docType.toUpperCase()) + 3, 20);
  }

  // Bloc droit (circuit / date)
  if (opts.rightLines?.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(200, 200, 205);
    opts.rightLines.forEach((line, i) => {
      doc.text(line, PAGE_W - MARGIN, 11 + i * 5, { align: "right" });
    });
  }

  return { doc, y: 36 };
}

/** Titre de section avec puce rouge et filet. */
export function sectionTitle(doc: jsPDF, y: number, label: string): number {
  doc.setFillColor(...PDF_COLORS.red);
  doc.rect(MARGIN, y - 3, 1.6, 4.5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10.5);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(label.toUpperCase(), MARGIN + 4, y);
  doc.setDrawColor(...PDF_COLORS.line);
  doc.setLineWidth(0.3);
  doc.line(MARGIN, y + 2.2, PAGE_W - MARGIN, y + 2.2);
  return y + 7;
}

/** Grille clé/valeur sur 2 colonnes. Retourne le nouveau Y. */
export function kvGrid(
  doc: jsPDF,
  y: number,
  entries: Array<[string, string | number | null | undefined]>,
  cols = 2
): number {
  const colW = (PAGE_W - 2 * MARGIN) / cols;
  const rowH = 8.6;
  entries.forEach(([key, value], i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const x = MARGIN + col * colW;
    const yy = y + row * rowH;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.2);
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(key.toUpperCase(), x, yy);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...PDF_COLORS.text);
    const display = value === null || value === undefined || value === "" ? "—" : String(value);
    doc.text(display, x, yy + 4.4);
  });
  const rows = Math.ceil(entries.length / cols);
  return y + rows * rowH + 4;
}

/** Table avec le style maison. Retourne le Y après la table. */
export function apexTable(
  doc: jsPDF,
  y: number,
  head: string[],
  body: (string | number)[][]
): number {
  autoTable(doc, {
    startY: y,
    head: [head],
    body: body.map((r) => r.map(String)),
    theme: "plain",
    styles: {
      fontSize: 8.5,
      cellPadding: 2.2,
      textColor: PDF_COLORS.text,
      lineColor: PDF_COLORS.line,
      lineWidth: { bottom: 0.2 },
    },
    headStyles: {
      fillColor: PDF_COLORS.black,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 8,
    },
    alternateRowStyles: { fillColor: PDF_COLORS.panel },
    margin: { left: MARGIN, right: MARGIN },
  });
  return (doc as any).lastAutoTable.finalY + 6;
}

/** Encart "note ingénieur" (fond gris, liseré rouge). */
export function noteBox(doc: jsPDF, y: number, text: string): number {
  const w = PAGE_W - 2 * MARGIN;
  const lines = doc.splitTextToSize(text, w - 8);
  const h = lines.length * 3.9 + 5;
  doc.setFillColor(...PDF_COLORS.panel);
  doc.rect(MARGIN, y, w, h, "F");
  doc.setFillColor(...PDF_COLORS.red);
  doc.rect(MARGIN, y, 1.2, h, "F");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...PDF_COLORS.text);
  doc.text(lines, MARGIN + 4, y + 4.5);
  return y + h + 5;
}

/**
 * Dessine le tracé GPS du circuit en vectoriel, avec les apex numérotés.
 * Projection équirectangulaire corrigée en longitude (cos lat) pour éviter
 * la déformation. Retourne le Y sous le bloc.
 */
export function circuitMap(
  doc: jsPDF,
  y: number,
  lat: number[],
  lon: number[],
  corners: Array<{ lat: number; lon: number; label?: string; grade?: string }> = [],
  opts?: { x?: number; width?: number; height?: number }
): number {
  const x0 = opts?.x ?? MARGIN;
  const boxW = opts?.width ?? PAGE_W - 2 * MARGIN;
  const boxH = opts?.height ?? 62;

  const pts = lat
    .map((la, i) => ({ la, lo: lon[i] }))
    .filter((p) => Number.isFinite(p.la) && Number.isFinite(p.lo) && p.la !== 0 && p.lo !== 0);
  if (pts.length < 10) return y;

  const latMin = Math.min(...pts.map((p) => p.la));
  const latMax = Math.max(...pts.map((p) => p.la));
  const lonMin = Math.min(...pts.map((p) => p.lo));
  const lonMax = Math.max(...pts.map((p) => p.lo));
  const latMid = (latMin + latMax) / 2;
  const kx = Math.cos((latMid * Math.PI) / 180); // correction longitude

  const spanX = Math.max((lonMax - lonMin) * kx, 1e-9);
  const spanY = Math.max(latMax - latMin, 1e-9);
  const pad = 6;
  const scale = Math.min((boxW - 2 * pad) / spanX, (boxH - 2 * pad) / spanY);
  // Centrage dans la boîte
  const offX = x0 + (boxW - spanX * scale) / 2;
  const offY = y + (boxH - spanY * scale) / 2;

  const project = (la: number, lo: number): [number, number] => [
    offX + (lo - lonMin) * kx * scale,
    offY + (latMax - la) * scale, // Y inversé (nord en haut)
  ];

  // Fond de carte
  doc.setFillColor(...PDF_COLORS.panel);
  doc.rect(x0, y, boxW, boxH, "F");

  // Tracé — rouge marque, comme dans l'app
  doc.setDrawColor(...PDF_COLORS.red);
  doc.setLineWidth(1.1);
  doc.setLineCap("round");
  doc.setLineJoin("round");
  let prev = project(pts[0].la, pts[0].lo);
  // Décimation : ~600 segments max pour un PDF léger
  const step = Math.max(1, Math.floor(pts.length / 600));
  for (let i = step; i < pts.length; i += step) {
    const cur = project(pts[i].la, pts[i].lo);
    doc.line(prev[0], prev[1], cur[0], cur[1]);
    prev = cur;
  }
  // Boucle fermée
  const first = project(pts[0].la, pts[0].lo);
  doc.line(prev[0], prev[1], first[0], first[1]);

  // Apex numérotés (pastilles noires pour contraster avec le tracé rouge)
  doc.setLineWidth(0.3);
  corners.forEach((c, i) => {
    if (!Number.isFinite(c.lat) || !Number.isFinite(c.lon)) return;
    const [cx, cy] = project(c.lat, c.lon);
    doc.setFillColor(...PDF_COLORS.black);
    doc.circle(cx, cy, 2.2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(5.5);
    doc.text(String(c.label || i + 1).replace(/^V/, ""), cx, cy + 1, { align: "center" });
  });

  // Légende
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text("Tracé GPS réel · apex numérotés", x0 + 3, y + boxH - 2.5);

  return y + boxH + 5;
}

/** Bandeau de KPI (grandes valeurs) sur une ligne. */
export function kpiRow(
  doc: jsPDF,
  y: number,
  items: Array<{ label: string; value: string; accent?: boolean }>
): number {
  const w = (PAGE_W - 2 * MARGIN) / items.length;
  const h = 17;
  items.forEach((it, i) => {
    const x = MARGIN + i * w;
    doc.setFillColor(...(it.accent ? PDF_COLORS.black : PDF_COLORS.panel));
    doc.rect(x + (i === 0 ? 0 : 1), y, w - 1, h, "F");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(...(it.accent ? [170, 170, 175] as [number, number, number] : PDF_COLORS.muted));
    doc.text(it.label.toUpperCase(), x + 4, y + 5.5);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...(it.accent ? PDF_COLORS.red : PDF_COLORS.text));
    doc.text(it.value, x + 4, y + 13);
  });
  return y + h + 6;
}

/** Zone de notes manuscrites (lignes) — pour annoter en stand. */
export function notesArea(doc: jsPDF, y: number, lines = 4, label = "Notes"): number {
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.setTextColor(...PDF_COLORS.muted);
  doc.text(label.toUpperCase(), MARGIN, y);
  doc.setDrawColor(...PDF_COLORS.line);
  doc.setLineWidth(0.25);
  for (let i = 0; i < lines; i++) {
    const ly = y + 5 + i * 6.5;
    doc.line(MARGIN, ly, PAGE_W - MARGIN, ly);
  }
  return y + 5 + lines * 6.5 + 3;
}

/** Ajoute une page en conservant le bandeau d'en-tête. */
export function addApexPage(doc: jsPDF, opts: PdfHeaderOpts): number {
  doc.addPage();
  doc.setFillColor(...PDF_COLORS.black);
  doc.rect(0, 0, PAGE_W, 26, "F");
  doc.setFillColor(...PDF_COLORS.red);
  doc.rect(0, 26, PAGE_W, 1.2, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...PDF_COLORS.red);
  doc.text("APEX", MARGIN, 12);
  const apexW = doc.getTextWidth("APEX");
  doc.setTextColor(255, 255, 255);
  doc.text("AI", MARGIN + apexW + 1, 12);
  doc.setFontSize(9);
  doc.text(opts.docType.toUpperCase(), MARGIN, 20);
  if (opts.title) {
    doc.setFont("helvetica", "normal");
    doc.setTextColor(180, 180, 185);
    doc.text(`— ${opts.title}`, MARGIN + doc.getTextWidth(opts.docType.toUpperCase()) + 3, 20);
  }
  if (opts.rightLines?.length) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(200, 200, 205);
    opts.rightLines.forEach((line, i) => {
      doc.text(line, PAGE_W - MARGIN, 11 + i * 5, { align: "right" });
    });
  }
  return 36;
}

/** Signature officielle + pagination sur toutes les pages, puis sauvegarde. */
export function finalizeAndSave(doc: jsPDF, filename: string): void {
  const pageCount = (doc as any).internal.getNumberOfPages();
  const pageH = doc.internal.pageSize.height;
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setDrawColor(...PDF_COLORS.line);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, pageH - 14, PAGE_W - MARGIN, pageH - 14);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...PDF_COLORS.red);
    doc.text("APEX", MARGIN, pageH - 9);
    doc.setTextColor(...PDF_COLORS.text);
    doc.text("AI", MARGIN + doc.getTextWidth("APEX") + 0.6, pageH - 9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text("· L'Ingénieur de Course IA — apexai.racing", MARGIN + doc.getTextWidth("APEXAI") + 2.5, pageH - 9);
    doc.text(
      `Généré le ${new Date().toLocaleDateString("fr-FR")} · Page ${i}/${pageCount}`,
      PAGE_W - MARGIN,
      pageH - 9,
      { align: "right" }
    );
  }
  doc.save(filename);
}
