import type { CatalogCircuit } from "@/lib/api";

const SURFACES: Record<string, string> = { asphalt: "enrobé", paved: "revêtu", concrete: "béton" };

/**
 * Le circuit reconnu dans la base des circuits de France, à partir des
 * points GPS de la séance : nom officiel, commune, longueur et répartition
 * des virages mesurées sur le tracé.
 */
export function CircuitIdentity({ circuit }: { circuit?: CatalogCircuit | null }) {
  if (!circuit || !circuit.name || circuit.confident === false) return null;
  const parts: string[] = [];
  if (circuit.length_m) parts.push(`${circuit.length_m.toLocaleString("fr-FR")} m`);
  if (circuit.corners_count) {
    const detail = [
      circuit.hairpins_count != null ? `${circuit.hairpins_count} épingle${circuit.hairpins_count > 1 ? "s" : ""}` : null,
      circuit.medium_count != null ? `${circuit.medium_count} moyen${circuit.medium_count > 1 ? "s" : ""}` : null,
      circuit.fast_corners_count != null ? `${circuit.fast_corners_count} rapide${circuit.fast_corners_count > 1 ? "s" : ""}` : null,
    ].filter(Boolean);
    parts.push(`${circuit.corners_count} virages${detail.length ? ` (${detail.join(", ")})` : ""}`);
  }
  if (circuit.rotation) parts.push(`sens ${circuit.rotation}`);
  if (circuit.surface) parts.push(SURFACES[circuit.surface] ?? circuit.surface);
  const place = [circuit.city, circuit.department ? `${circuit.department}` : null].filter(Boolean).join(", ");

  return (
    <section className="mb-6 rounded-xl border border-border bg-card px-4 py-3 text-sm">
      <p className="text-foreground">
        <span className="text-muted-foreground">Circuit reconnu : </span>
        <span className="font-medium">{circuit.name}</span>
        {place && <span className="text-muted-foreground">, {place}</span>}
      </p>
      {parts.length > 0 && <p className="mt-0.5 text-muted-foreground">{parts.join(", ")}</p>}
      {circuit.has_trace && <p className="mt-1 text-[11px] text-muted-foreground/80">Tracé de référence © contributeurs OpenStreetMap</p>}
    </section>
  );
}
