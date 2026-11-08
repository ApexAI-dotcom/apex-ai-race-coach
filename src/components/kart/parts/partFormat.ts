import type { CatalogPart, PartMaintenance } from "@/lib/api";

const SPEC_LABELS: Record<string, string> = {
  displacement_cc: "Cylindrée (cm³)",
  stroke: "Cycle",
  cooling: "Refroidissement",
  gearbox: "Boîte",
  fuel_mix: "Mélange",
  spark_plug: "Bougie",
  gearbox_oil: "Huile de boîte",
  rpm: "Régime",
  technical: "Données techniques",
  weight_kg: "Poids (kg)",
  tubes_mm: "Tubes (mm)",
  wheelbase_mm: "Empattement (mm)",
  axle: "Axe",
  brakes: "Freins",
  position: "Montage",
  detail: "Détail",
  venturi_mm: "Venturi (mm)",
  diameter_mm: "Diamètre (mm)",
  use: "Usage",
  cik_type: "Type CIK-FIA",
  compound: "Gomme",
  price_eur_set: "Prix du train (€ TTC)",
  gap_mm: "Écartement (mm)",
  torque_nm: "Serrage (Nm)",
  volume_ml: "Quantité (ml)",
  volume_l: "Quantité (L)",
  advance_deg: "Avance (°)",
  water_temp_c: "Température d'eau (°C)",
  restricted: "Version bridée",
  group: "Groupe",
  grade: "Grade",
  effect: "Effet",
  spec: "Norme",
};

const VALUE_LABELS: Record<string, Record<string, string>> = {
  use: { slick: "Sec (slick)", rain: "Pluie" },
  compound: { soft: "Tendre", medium: "Medium", hard: "Dure", wet: "Pluie" },
  stroke: { "2T": "2 temps", "4T": "4 temps" },
};

/** Caractéristiques lisibles d'une fiche (les valeurs internes d'ApexAI restent cachées). */
export function specRows(part: CatalogPart): [string, string][] {
  const specs = part.specs || {};
  return Object.entries(SPEC_LABELS)
    .filter(([k]) => specs[k] !== undefined && specs[k] !== null && specs[k] !== "")
    .map(([k, label]) => {
      const v = specs[k];
      if (typeof v === "boolean") return [label, v ? "oui" : "non"];
      return [label, VALUE_LABELS[k]?.[String(v)] ?? String(v)];
    });
}

const UNIT_SHORT: Record<string, string> = { hours: "h", laps: "tours", sessions: "séances", litres: "L de mélange" };

/** Durée avant révision, seulement quand le constructeur la donne. */
export function lifeLabel(part: CatalogPart): string | null {
  if (part.default_life == null || !part.life_ref) return null;
  return `${String(part.default_life).replace(".", ",")} ${UNIT_SHORT[part.life_unit || ""] ?? part.life_unit ?? ""}`.trim();
}

/** Quand faire l'opération, en clair : « Toutes les 5 h », « Avant chaque roulage ». */
export function intervalLabel(m: PartMaintenance): string {
  if (m.interval == null || m.interval === "") return "";
  const unit = m.unit === "heures" ? "h" : m.unit === "séance" ? "séances" : m.unit || "";
  const v = String(m.interval).replace(".", ",");
  if (typeof m.interval === "number" || /^[\d≈ à,.]+$/.test(v)) return `Toutes les ${v} ${unit}`.trim();
  return v.charAt(0).toUpperCase() + v.slice(1);
}

/** Les documents cités par une liste d'opérations, avec leurs pages. */
export function maintenanceSources(part: CatalogPart, items: PartMaintenance[]): { label: string; url?: string | null; refs: string[] }[] {
  const out = new Map<string, { label: string; url?: string | null; refs: string[] }>();
  for (const m of items) {
    const s = (part.sources || []).find((x) => x.key === m.source);
    if (!s) continue;
    const e = out.get(s.key) ?? { label: s.label, url: s.url, refs: [] };
    if (m.ref && !e.refs.includes(m.ref)) e.refs.push(m.ref);
    out.set(s.key, e);
  }
  return [...out.values()];
}

/** Ordre de lecture : avant / après chaque roulage, puis les intervalles croissants. */
export function sortMaintenance(items: PartMaintenance[]): PartMaintenance[] {
  const rank = (m: PartMaintenance) => {
    const v = String(m.interval ?? "");
    if (/chaque|avant|après/i.test(v)) return -1;
    const n = parseFloat(v.replace(",", ".").replace(/[^\d.]/g, " ").trim().split(" ")[0]);
    if (Number.isNaN(n)) return 1e6;
    return n;
  };
  return [...items].sort((a, b) => rank(a) - rank(b));
}
