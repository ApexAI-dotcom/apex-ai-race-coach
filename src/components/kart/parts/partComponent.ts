import type { CatalogPart } from "@/lib/api";

export type WearComponent = "engine" | "tires" | "brakes" | "chain" | "general";

/** Quel compteur d'usure de Mon Kart une pièce du catalogue fait repartir à zéro. */
export function wearComponentOf(category?: string | null): WearComponent {
  switch (category) {
    case "engine":
    case "engine_part":
    case "carburetor":
    case "ignition":
    case "spark_plug":
    case "exhaust":
    case "cooling":
    case "clutch":
      return "engine";
    case "tire":
      return "tires";
    case "brake":
    case "brake_part":
      return "brakes";
    case "chain":
    case "sprocket":
      return "chain";
    default:
      return "general";
  }
}

export const partLabel = (p: Pick<CatalogPart, "brand" | "name">) => [p.brand, p.name].filter(Boolean).join(" ");
