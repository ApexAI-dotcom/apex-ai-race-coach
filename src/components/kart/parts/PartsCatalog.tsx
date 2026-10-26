import { useEffect, useState } from "react";
import { Loader2, Search, Package } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { searchParts, type CatalogPart } from "@/lib/api";
import { KindBadge, PartDetailDialog } from "./PartDetailDialog";
import { lifeLabel, trustBadges } from "./partFormat";

const MAIN = ["engine", "tire", "chassis", "brake", "carburetor", "axle", "spark_plug", "engine_part", "clutch", "lubricant", "sprocket"];

/**
 * Base des composants 2026-2027 : du pignon au châssis complet. Le pilote
 * cherche par marque, modèle, catégorie ou championnat et ouvre la fiche
 * (entretien constructeur, retours de pilotes, sources).
 */
export function PartsCatalog() {
  const [q, setQ] = useState("");
  const [category, setCategory] = useState<string | null>(null);
  const [parts, setParts] = useState<CatalogPart[]>([]);
  const [labels, setLabels] = useState<Record<string, string>>({});
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [busy, setBusy] = useState(true);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    setBusy(true);
    const t = window.setTimeout(() => {
      searchParts(q.trim(), category ?? undefined, q.trim() || category ? 300 : 12)
        .then((r) => {
          if (!alive) return;
          setParts(r.parts);
          if (Object.keys(r.categories).length) setLabels(r.categories);
          if (!category) {
            setCounts(r.counts);
            setTotal(r.total);
          }
        })
        .finally(() => alive && setBusy(false));
    }, q ? 250 : 0);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [q, category]);

  const chips = Object.keys(labels)
    .filter((k) => counts[k])
    .sort((a, b) => (MAIN.indexOf(a) === -1 ? 99 : MAIN.indexOf(a)) - (MAIN.indexOf(b) === -1 ? 99 : MAIN.indexOf(b)));

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Package className="h-5 w-5 text-primary" />
          Catalogue des pièces
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {total ? `${total.toLocaleString("fr-FR")} fiches 2026-2027` : "Fiches 2026-2027"}, du pignon au châssis : entretien constructeur, retours de pilotes et règlements, avec leurs sources.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Ex. DD2, XH4, bougie X30, KZ2, Tony Kart"
            className="h-10 pl-9"
            aria-label="Chercher une pièce"
          />
        </div>

        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]">
          <button
            type="button"
            onClick={() => setCategory(null)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs ${!category ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
          >
            Tout
          </button>
          {chips.map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setCategory(category === k ? null : k)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-xs ${category === k ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground"}`}
            >
              {labels[k]} <span className="tabular-nums opacity-70">{counts[k]}</span>
            </button>
          ))}
        </div>

        <ul className="max-h-[420px] divide-y divide-border overflow-y-auto rounded-xl border border-border">
          {busy && parts.length === 0 && (
            <li className="flex justify-center py-8">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </li>
          )}
          {!busy && parts.length === 0 && (
            <li className="px-3 py-6 text-center text-sm text-muted-foreground">Aucune pièce trouvée pour « {q} ».</li>
          )}
          {parts.map((p) => {
            const life = lifeLabel(p);
            return (
              <li key={p.id}>
                <button type="button" onClick={() => setOpenId(p.id)} className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left hover:bg-muted/50">
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-foreground">
                      {p.brand} {p.name}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[p.category_label, p.subcategory, (p.uses || [])[0]].filter(Boolean).join(" · ")}
                    </span>
                  </span>
                  <span className="flex shrink-0 flex-col items-end gap-1">
                    {life && <span className="text-xs tabular-nums text-foreground">{life}</span>}
                    <span className="flex gap-1">
                      {trustBadges(p).slice(0, 1).map((k) => (
                        <KindBadge key={k} kind={k} />
                      ))}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
        {!q && !category && parts.length > 0 && (
          <p className="text-[11px] text-muted-foreground">Tape un nom ou choisis une catégorie pour parcourir toute la base.</p>
        )}
      </CardContent>
      <PartDetailDialog partId={openId} onClose={() => setOpenId(null)} />
    </Card>
  );
}
