import { useEffect, useState } from "react";
import { Wrench } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { matchPart, type CatalogPart } from "@/lib/api";
import { KindBadge, PartDetailDialog } from "./PartDetailDialog";
import { intervalLabel, sortMaintenance } from "./partFormat";

interface Props {
  engineLabel?: string | null;
  hoursLife?: number | null;
  onApplyLife?: (hours: number) => void;
}

/**
 * Entretien du moteur déclaré dans Mon Kart, d'après la base des composants :
 * ce que dit le constructeur et ce que font les pilotes (ex. DD2 révisé vers
 * 25 h), avec la possibilité d'aligner la jauge moteur.
 */
export function EngineMaintenanceCard({ engineLabel, hoursLife, onApplyLife }: Props) {
  const [part, setPart] = useState<CatalogPart | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!engineLabel || engineLabel === "Standard") {
      setPart(null);
      return;
    }
    matchPart(engineLabel, "engine").then((p) => alive && setPart(p));
    return () => {
      alive = false;
    };
  }, [engineLabel]);

  if (!part) return null;
  const items = sortMaintenance(part.maintenance || []);
  const shown = showAll ? items : items.slice(0, 6);
  const recommended = part.life_unit === "hours" && part.default_life ? Number(part.default_life) : null;
  const gap = recommended != null && hoursLife != null && Math.abs(Number(hoursLife) - recommended) >= 0.5;

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Wrench className="h-5 w-5 text-primary" />
          Entretien conseillé
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          {part.brand} {part.name}
          {recommended != null ? ` · révision conseillée toutes les ${String(recommended).replace(".", ",")} h` : ""}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {gap && onApplyLife && (
          <div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
            <span>
              Ta jauge moteur est réglée sur {String(hoursLife).replace(".", ",")} h. La base conseille {String(recommended).replace(".", ",")} h pour ce moteur.
            </span>
            <Button size="sm" className="shrink-0" onClick={() => onApplyLife(recommended!)}>
              Régler sur {String(recommended).replace(".", ",")} h
            </Button>
          </div>
        )}
        {part.notes && <p className="text-sm leading-relaxed text-muted-foreground">{part.notes}</p>}
        {items.length > 0 ? (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {shown.map((m, i) => (
              <li key={i} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                <span className="min-w-0">
                  <span className="block font-medium">{m.element}</span>
                  <span className="block text-xs text-muted-foreground">
                    {m.action}
                    {m.usage && m.usage !== "tous" ? ` · ${m.usage}` : ""}
                  </span>
                </span>
                <span className="flex shrink-0 flex-col items-end gap-1">
                  <span className="tabular-nums">{intervalLabel(m)}</span>
                  <KindBadge kind={m.kind} />
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">Aucun intervalle publié pour ce moteur dans les documents consultés.</p>
        )}
        <div className="flex flex-wrap gap-2">
          {items.length > 6 && (
            <Button variant="ghost" size="sm" onClick={() => setShowAll((v) => !v)}>
              {showAll ? "Réduire" : `Voir les ${items.length} opérations`}
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => setOpenId(part.id)}>
            Fiche et sources
          </Button>
        </div>
      </CardContent>
      <PartDetailDialog partId={openId} onClose={() => setOpenId(null)} />
    </Card>
  );
}
