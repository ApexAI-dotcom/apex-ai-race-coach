import { useEffect, useState } from "react";
import { ChevronDown, History, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getPart, matchPart, type CatalogPart } from "@/lib/api";
import { MaintenanceList, PartDetailDialog } from "./PartDetailDialog";
import { lifeLabel } from "./partFormat";
import type { MountedPart, MountedParts } from "./MountedPartsCard";

const day = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};
const n1 = (v: number) => String(Math.round(v * 10) / 10).replace(".", ",");

interface Row {
  key: string;
  family: string;
  title: string;
  /** Fiche du catalogue (chargée à l'ouverture si besoin). */
  partId?: string;
  part?: CatalogPart | null;
  fittedAt?: string;
  previous?: MountedPart[];
  all?: MountedPart[];
}

/**
 * « Mes pièces » : une ligne par pièce du kart (le moteur déclaré, puis les
 * pièces montées), et en l'ouvrant, son entretien d'après le manuel du
 * constructeur, source et page comprises. Rien d'inventé : quand le
 * constructeur ne donne pas d'échéance, la ligne le dit et le pilote garde la
 * main sur sa jauge.
 */
export function KartPartsList({
  engineLabel,
  engineHoursLife,
  mounted,
  onApplyEngineLife,
  onFit,
}: {
  engineLabel?: string | null;
  engineHoursLife?: number | null;
  mounted: MountedParts;
  onApplyEngineLife?: (hours: number) => void;
  onFit?: (part: CatalogPart) => void;
}) {
  const [engine, setEngine] = useState<CatalogPart | null>(null);
  const [engineLoading, setEngineLoading] = useState(false);

  useEffect(() => {
    let alive = true;
    if (!engineLabel || engineLabel === "Standard") {
      setEngine(null);
      return;
    }
    setEngineLoading(true);
    matchPart(engineLabel, "engine")
      .then((p) => alive && setEngine(p))
      .finally(() => alive && setEngineLoading(false));
    return () => {
      alive = false;
    };
  }, [engineLabel]);

  const families = Object.entries(mounted || {})
    .filter(([cat, list]) => list?.length && cat !== "engine")
    .sort(([, a], [, b]) => new Date(b[0].fitted_at).getTime() - new Date(a[0].fitted_at).getTime());

  const rows: Row[] = [];
  if (engineLabel && engineLabel !== "Standard") {
    rows.push({
      key: "engine",
      family: "Moteur",
      title: engine ? `${engine.brand} ${engine.name}` : engineLabel,
      part: engine,
      partId: engine?.id,
      fittedAt: mounted?.engine?.[0]?.fitted_at,
    });
  }
  for (const [cat, list] of families) {
    rows.push({
      key: cat,
      family: list[0].category_label ?? cat,
      title: [list[0].brand, list[0].name].filter(Boolean).join(" "),
      partId: list[0].id,
      fittedAt: list[0].fitted_at,
      previous: list.slice(1),
      all: list,
    });
  }

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Les pièces de ton kart. Ouvre-en une pour voir son entretien d'après le manuel du constructeur, avec la page d'où vient chaque échéance.
      </p>

      {engineLoading && rows.length === 0 && <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />}

      {rows.length === 0 && !engineLoading ? (
        <p className="rounded-xl border border-border bg-muted/30 px-4 py-6 text-center text-sm text-muted-foreground">
          Aucune pièce enregistrée pour l'instant. Ajoute ton moteur dans l'identité du kart, ou monte une pièce depuis le catalogue.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <PartRow
              key={r.key}
              row={r}
              engineHoursLife={r.key === "engine" ? engineHoursLife : undefined}
              onApplyEngineLife={r.key === "engine" ? onApplyEngineLife : undefined}
              onFit={onFit}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function PartRow({
  row,
  engineHoursLife,
  onApplyEngineLife,
  onFit,
}: {
  row: Row;
  engineHoursLife?: number | null;
  onApplyEngineLife?: (hours: number) => void;
  onFit?: (part: CatalogPart) => void;
}) {
  const [open, setOpen] = useState(false);
  const [part, setPart] = useState<CatalogPart | null>(row.part ?? null);
  const [loading, setLoading] = useState(false);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);

  useEffect(() => setPart(row.part ?? null), [row.part]);

  useEffect(() => {
    if (!open || part || !row.partId) return;
    let alive = true;
    setLoading(true);
    getPart(row.partId)
      .then((p) => alive && setPart(p))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [open, part, row.partId]);

  const items = part?.maintenance || [];
  const life = part ? lifeLabel(part) : null;
  const recommended = part?.life_ref && part.life_unit === "hours" && part.default_life ? Number(part.default_life) : null;
  const gap = recommended != null && engineHoursLife != null && Math.abs(Number(engineHoursLife) - recommended) >= 0.5;

  return (
    <li className="rounded-xl border border-border bg-secondary/30">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-3 px-4 py-3 text-left" aria-expanded={open}>
        <span className="min-w-0 flex-1">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{row.family}</span>
          <span className="block truncate font-medium text-foreground">{row.title}</span>
          <span className="block text-xs text-muted-foreground">
            {[row.fittedAt ? `Monté le ${day(row.fittedAt)}` : null, life ? `Révision toutes les ${life}` : null].filter(Boolean).join(" · ") || "Voir l'entretien"}
          </span>
        </span>
        <ChevronDown className={cn("h-4 w-4 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="space-y-3 border-t border-border px-4 pb-4 pt-3">
          {loading ? (
            <Loader2 className="mx-auto h-4 w-4 animate-spin text-muted-foreground" />
          ) : !part ? (
            <p className="text-sm text-muted-foreground">Cette pièce n'est pas dans le catalogue : son entretien se suit dans tes interventions.</p>
          ) : (
            <>
              {gap && onApplyEngineLife && (
                <div className="flex flex-col gap-2 rounded-xl border border-primary/30 bg-primary/5 p-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <span>
                    Ta jauge moteur est réglée sur {n1(Number(engineHoursLife))} h. Le manuel prévoit {n1(recommended!)} h.
                  </span>
                  <Button size="sm" className="shrink-0" onClick={() => onApplyEngineLife(recommended!)}>
                    Régler sur {n1(recommended!)} h
                  </Button>
                </div>
              )}
              {part.notes && <p className="text-sm leading-relaxed text-muted-foreground">{part.notes}</p>}
              {items.length > 0 ? (
                <>
                  <MaintenanceList part={part} items={items} limit={showAll ? undefined : 6} />
                  {items.length > 6 && (
                    <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => setShowAll((v) => !v)}>
                      {showAll ? "Réduire" : `Voir les ${items.length} opérations`}
                    </Button>
                  )}
                </>
              ) : (
                !part.notes && (
                  <p className="text-sm text-muted-foreground">
                    Le constructeur ne publie pas d'entretien pour cette pièce : note tes contrôles dans les interventions.
                  </p>
                )
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" className="h-8" onClick={() => setDetailId(part.id)}>
                  Fiche complète
                </Button>
                {row.previous && row.previous.length > 0 && (
                  <Button variant="ghost" size="sm" className="h-8 gap-1.5 px-2 text-muted-foreground" onClick={() => setHistoryOpen((v) => !v)}>
                    <History className="h-3.5 w-3.5" />
                    {row.previous.length} pièce{row.previous.length > 1 ? "s" : ""} avant
                  </Button>
                )}
              </div>
              {historyOpen && row.previous && row.all && (
                <ul className="space-y-1 border-l border-white/10 pl-3">
                  {row.previous.map((p, i) => {
                    const next = row.all![i];
                    return (
                      <li key={`${p.id}-${p.fitted_at}`} className="text-xs text-muted-foreground">
                        <span className="text-foreground">{[p.brand, p.name].filter(Boolean).join(" ")}</span> · du {day(p.fitted_at)} au {day(next.fitted_at)}
                      </li>
                    );
                  })}
                </ul>
              )}
            </>
          )}
        </div>
      )}

      <PartDetailDialog
        partId={detailId}
        onClose={() => setDetailId(null)}
        onFit={
          onFit
            ? (p) => {
                setDetailId(null);
                onFit(p);
              }
            : undefined
        }
      />
    </li>
  );
}
