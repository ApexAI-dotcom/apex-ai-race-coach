import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchCatalogCircuits, type CatalogCircuit } from "@/lib/api";

/** Caractéristiques d'un circuit de la base, prêtes pour le formulaire de circuit. */
export function catalogToSignature(c: CatalogCircuit) {
  const hairpins = c.hairpins_count ?? 2;
  const fast = c.fast_corners_count ?? 3;
  const speedRatio = hairpins >= 5 && hairpins >= fast ? "sinueux" : fast >= 4 && fast > hairpins ? "rapide" : "mixte";
  return {
    name: c.name,
    speedRatio,
    rotation: c.rotation ?? "horaire",
    elevation: "plat",
    bumpiness: "lisse",
    hairpinsCount: hairpins,
    fastCornersCount: fast,
    cornersCount: c.corners_count ?? undefined,
    mediumCornersCount: c.medium_count ?? undefined,
  };
}

/**
 * Recherche dans la base des circuits de karting de France : le pilote tape
 * le nom, la commune ou le département, et retrouve longueur et virages
 * mesurés sur le tracé.
 */
export function CatalogCircuitSearch({ onPick }: { onPick: (c: CatalogCircuit) => void }) {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<CatalogCircuit[]>([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    let alive = true;
    setBusy(true);
    const t = window.setTimeout(() => {
      const dept = /^\d{2,3}$|^2[ab]$/i.test(term) ? term.toUpperCase() : undefined;
      searchCatalogCircuits(dept ? "" : term, dept, 8)
        .then((r) => alive && setResults(r))
        .finally(() => alive && setBusy(false));
    }, 250);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [q]);

  return (
    <div>
      <label className="mb-2 block text-xs font-semibold text-muted-foreground">Circuits de France</label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Nom du circuit, commune ou département (ex. 44)"
          className="h-10 pl-9"
          aria-label="Chercher un circuit"
        />
      </div>
      {q.trim().length >= 2 && (
        <ul className="mt-2 max-h-[240px] divide-y divide-border overflow-y-auto rounded-xl border border-border">
          {results.map((c) => (
            <li key={c.slug}>
              <button
                type="button"
                onClick={() => onPick(c)}
                className="flex w-full items-baseline justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-muted/50"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium text-foreground">{c.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {[c.city, c.department_code ? `(${c.department_code})` : null].filter(Boolean).join(" ")}
                  </span>
                </span>
                <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                  {c.length_m ? `${c.length_m.toLocaleString("fr-FR")} m` : "tracé à venir"}
                  {c.corners_count ? `, ${c.corners_count} virages` : ""}
                </span>
              </button>
            </li>
          ))}
          {!busy && results.length === 0 && <li className="px-3 py-3 text-xs text-muted-foreground">Aucun circuit trouvé. Crée-le avec « Nouveau circuit ».</li>}
        </ul>
      )}
    </div>
  );
}
