import { useState } from "react";
import { ChevronDown, History } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CatalogPart } from "@/lib/api";
import { PartDetailDialog } from "./PartDetailDialog";

/** Pièce montée, telle qu'enregistrée dans le profil (setup_json.mounted_parts). */
export interface MountedPart {
  id: string;
  brand?: string;
  name: string;
  category: string;
  category_label?: string;
  default_life?: number | null;
  life_unit?: string | null;
  has_maintenance?: boolean;
  /** Date de montage (ISO). */
  fitted_at: string;
}

/** Historique par famille de pièce, la plus récente en tête. */
export type MountedParts = Record<string, MountedPart[]>;

const UNIT: Record<string, string> = { hours: "h", laps: "tours", sessions: "séances", km: "km", races: "courses" };

function lifeText(p: MountedPart) {
  if (!p.default_life) return null;
  const v = String(p.default_life).replace(".", ",");
  return `durée de vie conseillée : ${v} ${UNIT[p.life_unit ?? ""] ?? p.life_unit ?? ""}`.trim();
}

const day = (iso: string) => {
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "" : d.toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" });
};

/**
 * Les pièces montées sur le kart, une ligne par famille (carbu, chaîne,
 * pignon, bougie…), avec l'entretien conseillé de chacune et l'historique des
 * pièces qui l'ont précédée. Alimentée par « Je monte cette pièce » et par le
 * journal d'entretien.
 */
export function MountedPartsCard({ parts, onFit }: { parts: MountedParts; onFit?: (part: CatalogPart) => void }) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const families = Object.entries(parts)
    .filter(([, list]) => list?.length)
    .sort(([, a], [, b]) => new Date(b[0].fitted_at).getTime() - new Date(a[0].fitted_at).getTime());

  return (
    <Card className="rounded-2xl border border-border bg-card shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">Pièces montées</CardTitle>
        <p className="text-xs text-muted-foreground">
          {families.length
            ? "Chaque pièce garde son entretien conseillé et l'historique de celles qu'elle a remplacées."
            : "Monte une pièce depuis le catalogue ou le journal : elle apparaît ici avec son entretien conseillé."}
        </p>
      </CardHeader>
      {families.length > 0 && (
        <CardContent className="space-y-2">
          {families.map(([cat, list]) => {
            const current = list[0];
            const previous = list.slice(1);
            const isOpen = expanded === cat;
            const life = lifeText(current);
            return (
              <div key={cat} className="rounded-xl border border-white/5 bg-secondary/40 p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      {current.category_label ?? cat}
                    </div>
                    <div className="truncate font-medium text-foreground">{[current.brand, current.name].filter(Boolean).join(" ")}</div>
                    <div className="text-xs text-muted-foreground">
                      Monté le {day(current.fitted_at)}
                      {life ? ` · ${life}` : ""}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setOpenId(current.id)}
                    className="shrink-0 rounded-lg border border-white/10 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-white/5"
                  >
                    Entretien
                  </button>
                </div>
                {previous.length > 0 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setExpanded(isOpen ? null : cat)}
                      className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                      aria-expanded={isOpen}
                    >
                      <History className="h-3.5 w-3.5" />
                      {previous.length} pièce{previous.length > 1 ? "s" : ""} avant
                      <ChevronDown className={`h-3.5 w-3.5 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                    </button>
                    {isOpen && (
                      <ul className="mt-2 space-y-1 border-l border-white/10 pl-3">
                        {previous.map((p, i) => {
                          // Durée de service : jusqu'au montage de la pièce suivante.
                          const next = list[i];
                          const days = Math.round((new Date(next.fitted_at).getTime() - new Date(p.fitted_at).getTime()) / 86400000);
                          return (
                            <li key={`${p.id}-${p.fitted_at}`} className="text-xs text-muted-foreground">
                              <span className="text-foreground">{[p.brand, p.name].filter(Boolean).join(" ")}</span> · du {day(p.fitted_at)} au {day(next.fitted_at)}
                              {days > 0 ? ` (${days} j)` : ""}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </>
                )}
              </div>
            );
          })}
        </CardContent>
      )}
      <PartDetailDialog
        partId={openId}
        onClose={() => setOpenId(null)}
        onFit={
          onFit
            ? (p) => {
                setOpenId(null);
                onFit(p);
              }
            : undefined
        }
      />
    </Card>
  );
}

/** Entrée d'historique à partir d'une pièce du catalogue. */
export function toMountedPart(p: CatalogPart, fittedAt: string): MountedPart {
  return {
    id: p.id,
    brand: p.brand,
    name: p.name,
    category: p.category,
    category_label: p.category_label,
    default_life: p.default_life ?? null,
    life_unit: p.life_unit ?? null,
    has_maintenance: p.has_maintenance,
    fitted_at: fittedAt,
  };
}
