/**
 * Apex AI — Export "Fiche de Réglages" (Setup Sheet) A4
 * Compile toutes les constantes de la session (contexte, pneus, châssis,
 * transmission, masses) pour impression ou consultation dans les stands.
 */
import { createApexDoc, sectionTitle, kvGrid, noteBox, finalizeAndSave } from "./apexPdf";

const WEATHER_LABELS: Record<string, string> = { sec: "Sec", humide: "Humide", pluie: "Pluie" };
const MODE_LABELS: Record<string, string> = { warmup: "Warm-up", qualif: "Qualifications", course: "Course" };

function fmt(v: unknown, unit = ""): string {
  if (v === null || v === undefined || v === "") return "—";
  return `${v}${unit}`;
}

export function exportSetupSheetPDF(setup: any, opts?: {
  circuitName?: string;
  mountedTireLabel?: string;
  engineerNote?: string;
}): void {
  const circuitName = opts?.circuitName || setup.circuit?.name || "Circuit non défini";
  const { doc, y: y0 } = createApexDoc({
    docType: "Fiche de Réglages",
    title: setup.setupName || "Réglage sans nom",
    rightLines: [circuitName, new Date().toLocaleDateString("fr-FR")],
  });
  let y = y0;

  // Contexte de session
  y = sectionTitle(doc, y, "Contexte & Piste");
  y = kvGrid(doc, y, [
    ["Circuit", circuitName],
    ["Mode de session", MODE_LABELS[setup.mode] || fmt(setup.mode)],
    ["Météo", WEATHER_LABELS[setup.weather] || fmt(setup.weather)],
    ["Grip piste", fmt(setup.grip)],
    ["Température air", fmt(setup.airTemp, " °C")],
    ["Température piste", fmt(setup.trackTemp, " °C")],
  ]);

  // Pneumatiques
  y = sectionTitle(doc, y, "Pneumatiques");
  y = kvGrid(doc, y, [
    ["Train / Modèle", opts?.mountedTireLabel || fmt(setup.tireModel)],
    ["", ""],
    ["Pression à froid AV", fmt(setup.coldPressureFront, " bar")],
    ["Pression à froid AR", fmt(setup.coldPressureRear, " bar")],
    ["Cible à chaud AV", fmt(setup.hotPressureFront, " bar")],
    ["Cible à chaud AR", fmt(setup.hotPressureRear, " bar")],
  ]);

  // Châssis & géométrie
  y = sectionTitle(doc, y, "Châssis & Géométrie");
  y = kvGrid(doc, y, [
    ["Voie avant", fmt(setup.trackWidthFront, " cm")],
    ["Voie arrière", fmt(setup.trackWidthRear, " mm")],
    ["Hauteur avant", fmt(setup.rideHeightFront)],
    ["Hauteur arrière", fmt(setup.rideHeightRear)],
    ["Carrossage (camber)", fmt(setup.camber)],
    ["Chasse (caster)", fmt(setup.caster)],
    ["Arbre arrière", fmt(setup.rearAxle)],
    ["", ""],
  ]);

  // Transmission & carburation
  y = sectionTitle(doc, y, "Transmission & Carburation");
  const carb = setup.carbConfig || {};
  const carbLabel = carb.mainJet
    ? `Gicleur ${carb.mainJet} / ralenti ${carb.pilotJet ?? "—"}`
    : carb.highSpeedScrew
      ? `H ${carb.highSpeedScrew} / L ${carb.lowSpeedScrew ?? "—"}`
      : "—";
  const ratio =
    Number(setup.sprocketFront) > 0 && Number(setup.sprocketRear) > 0
      ? (Number(setup.sprocketRear) / Number(setup.sprocketFront)).toFixed(2)
      : "—";
  y = kvGrid(doc, y, [
    ["Pignon", fmt(setup.sprocketFront, " dents")],
    ["Couronne", fmt(setup.sprocketRear, " dents")],
    ["Rapport", ratio],
    ["Carburation", carbLabel],
  ]);

  // Masses
  y = sectionTitle(doc, y, "Bilan des Masses");
  const total =
    (Number(setup.kartWeight) || 0) + (Number(setup.driverWeight) || 0) + (Number(setup.ballast) || 0);
  const mini = Number(setup.targetWeight) || 0;
  const delta = mini > 0 ? total - mini : null;
  y = kvGrid(doc, y, [
    ["Kart à vide", fmt(setup.kartWeight, " kg")],
    ["Pilote + équipement", fmt(setup.driverWeight, " kg")],
    ["Lest", fmt(setup.ballast, " kg")],
    ["Poids mini règlement", fmt(setup.targetWeight, " kg")],
    ["TOTAL", total > 0 ? `${total.toFixed(1)} kg` : "—"],
    ["Marge", delta === null ? "—" : `${delta >= 0 ? "+" : ""}${delta.toFixed(1)} kg ${delta >= 0 ? "(conforme)" : "(SOUS-POIDS)"}`],
  ]);

  // Note ingénieur (recommandation clé figée avec le réglage)
  if (opts?.engineerNote) {
    y = sectionTitle(doc, y, "Note de l'Ingénieur ApexAI");
    y = noteBox(doc, y, opts.engineerNote);
  }

  const safeName = (setup.setupName || "reglage").replace(/[^a-z0-9-_]/gi, "_");
  finalizeAndSave(doc, `ApexAI-Setup-${safeName}-${new Date().toISOString().split("T")[0]}.pdf`);
}
