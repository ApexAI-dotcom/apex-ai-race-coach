import type { CatalogPart, PartMaintenance } from "@/lib/api";

/** Nature d'une source, telle qu'on l'affiche au pilote. */
export const KIND_LABELS: Record<string, string> = {
  constructeur: "Constructeur",
  "retour pilotes": "Pilotes",
  règlement: "Règlement",
  homologation: "Homologation",
  "presse spécialisée": "Presse",
  revendeur: "Revendeur",
  "base ApexAI": "Estimation",
};

export const KIND_STYLES: Record<string, string> = {
  constructeur: "border-primary/30 bg-primary/10 text-primary",
  "retour pilotes": "border-sky-500/30 bg-sky-500/10 text-sky-500",
  règlement: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  homologation: "border-emerald-500/30 bg-emerald-500/10 text-emerald-500",
  "presse spécialisée": "border-border bg-muted text-muted-foreground",
  revendeur: "border-border bg-muted text-muted-foreground",
  "base ApexAI": "border-amber-500/30 bg-amber-500/10 text-amber-500",
};

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

export function lifeLabel(part: CatalogPart): string | null {
  if (part.default_life == null) return null;
  return `${String(part.default_life).replace(".", ",")} ${UNIT_SHORT[part.life_unit || ""] ?? part.life_unit ?? ""}`.trim();
}

export function intervalLabel(m: PartMaintenance): string {
  if (m.interval == null || m.interval === "") return "—";
  const unit = m.unit === "heures" ? "h" : m.unit || "";
  return typeof m.interval === "number" || /^[\d≈ à,.]+$/.test(String(m.interval))
    ? `${m.interval} ${unit}`.trim()
    : String(m.interval);
}

/** Badges de confiance d'une fiche : d'où viennent ses données. */
export function trustBadges(part: CatalogPart): string[] {
  const order = ["constructeur", "règlement", "homologation", "retour pilotes", "presse spécialisée", "revendeur", "base ApexAI"];
  const types = part.source_types || [];
  return order.filter((t) => types.includes(t)).slice(0, 3);
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
