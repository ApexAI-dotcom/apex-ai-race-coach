import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getPart, type CatalogPart, type PartMaintenance } from "@/lib/api";
import { intervalLabel, lifeLabel, maintenanceSources, sortMaintenance, specRows } from "./partFormat";

/**
 * Ce que disent des pilotes sur des forums publics : à part, étiqueté, avec le
 * lien. Ce n'est pas une donnée constructeur et ça ne règle aucune jauge.
 */
export function ForumTips({ part }: { part: CatalogPart }) {
  const tips = part.forum || [];
  if (!tips.length) return null;
  const links = [...new Map(tips.map((t) => [t.url, t.source])).entries()];
  return (
    <div className="space-y-2 rounded-xl border border-dashed border-white/15 p-3">
      <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Avis de pilotes · forum</p>
      <ul className="space-y-1.5">
        {tips.map((t, i) => (
          <li key={i} className="flex items-start justify-between gap-3 text-sm">
            <span className="min-w-0">
              <span className="text-foreground">{t.element}</span>
              <span className="text-xs text-muted-foreground"> · {t.action.toLowerCase()}{t.usage && t.usage !== "tous" ? ` en ${t.usage}` : ""}</span>
            </span>
            <span className="shrink-0 text-xs tabular-nums text-muted-foreground">{intervalLabel({ ...t, source: "", kind: "" })}</span>
          </li>
        ))}
      </ul>
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Ce n'est pas une donnée du constructeur : un repère de terrain, à confirmer avec ton préparateur.{" "}
        {links.map(([url, label], i) => (
          <span key={url}>
            {i > 0 ? " ; " : ""}
            <a href={url} target="_blank" rel="noreferrer" className="underline decoration-white/20 underline-offset-2 hover:text-foreground">
              {label}
            </a>
          </span>
        ))}
      </p>
    </div>
  );
}

/**
 * Opérations d'entretien du constructeur : quoi, quand, et le document d'où
 * ça vient (avec la page). Pas d'échéance inventée, pas de case vide.
 */
export function MaintenanceList({ part, items, limit }: { part: CatalogPart; items: PartMaintenance[]; limit?: number }) {
  const sorted = sortMaintenance(items);
  const shown = limit ? sorted.slice(0, limit) : sorted;
  const sources = maintenanceSources(part, shown);
  return (
    <div className="space-y-2">
      <ul className="divide-y divide-border rounded-xl border border-border">
        {shown.map((m, i) => (
          <li key={i} className="grid grid-cols-1 items-start gap-x-3 px-3 py-2.5 text-sm sm:grid-cols-[1fr_auto]">
            <span className="min-w-0">
              <span className="block font-medium text-foreground">{m.element}</span>
              <span className="block text-xs font-medium text-foreground/90 sm:hidden">{intervalLabel(m)}</span>
              <span className="block text-xs text-muted-foreground">
                {m.action}
                {m.usage && m.usage !== "tous" ? ` · en ${m.usage}` : ""}
              </span>
            </span>
            <span className="hidden max-w-[11rem] text-right text-xs font-medium tabular-nums text-foreground sm:block">{intervalLabel(m)}</span>
          </li>
        ))}
      </ul>
      {sources.length > 0 && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Source :{" "}
          {sources.map((s, i) => (
            <span key={s.label}>
              {i > 0 ? " ; " : ""}
              {s.url ? (
                <a href={s.url} target="_blank" rel="noreferrer" className="underline decoration-white/20 underline-offset-2 hover:text-foreground">
                  {s.label}
                </a>
              ) : (
                s.label
              )}
              {s.refs.length ? `, ${s.refs.join(", ")}` : ""}
            </span>
          ))}
        </p>
      )}
    </div>
  );
}

/** Fiche complète d'une pièce : caractéristiques, usages, entretien et sources. */
export function PartDetailDialog({
  partId,
  onClose,
  onFit,
  fitLabel = "Je monte cette pièce",
}: {
  /** Libellé du bouton de montage (ex. « J'en monte une neuve » pour une pièce déjà montée). */
  fitLabel?: string;
  partId: string | null;
  onClose: () => void;
  /** « Je monte cette pièce » : ouvre le journal d'entretien pré-rempli. */
  onFit?: (part: CatalogPart) => void;
}) {
  const [part, setPart] = useState<CatalogPart | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!partId) return;
    let alive = true;
    setLoading(true);
    setPart(null);
    getPart(partId)
      .then((p) => alive && setPart(p))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [partId]);

  const specs = part ? specRows(part) : [];
  const life = part ? lifeLabel(part) : null;

  return (
    <Dialog open={!!partId} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto sm:max-w-lg">
        {loading || !part ? (
          <div className="flex items-center justify-center py-16">
            {loading ? <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /> : <p className="text-sm text-muted-foreground">Fiche introuvable.</p>}
          </div>
        ) : (
          <>
            <DialogHeader>
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{part.category_label}</p>
              <DialogTitle className="text-xl">
                {part.brand} {part.name}
              </DialogTitle>
              <DialogDescription>
                {[part.subcategory, part.homologation].filter(Boolean).join(" · ") || "Fiche de la base ApexAI"}
              </DialogDescription>
            </DialogHeader>

            {part.uses && part.uses.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {part.uses.map((u) => (
                  <span key={u} className="rounded-full bg-muted px-2.5 py-1 text-xs text-foreground">{u}</span>
                ))}
              </div>
            )}

            {(specs.length > 0 || life) && (
              <dl className="grid grid-cols-1 gap-x-4 gap-y-2 rounded-xl border border-border p-3 text-sm sm:grid-cols-2">
                {life && (
                  <div>
                    <dt className="text-xs text-muted-foreground">Avant révision (manuel)</dt>
                    <dd className="font-medium tabular-nums">{life}</dd>
                  </div>
                )}
                {specs.map(([k, v]) => (
                  <div key={k} className={v.length > 40 ? "sm:col-span-2" : ""}>
                    <dt className="text-xs text-muted-foreground">{k}</dt>
                    <dd className="font-medium">{v}</dd>
                  </div>
                ))}
              </dl>
            )}

            {part.notes && <p className="text-sm leading-relaxed text-muted-foreground">{part.notes}</p>}

            {part.maintenance && part.maintenance.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-semibold">Entretien</h3>
                <MaintenanceList part={part} items={part.maintenance} />
              </section>
            )}

            <ForumTips part={part} />

            {part.sources && part.sources.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-semibold">Sources</h3>
                <ul className="space-y-1.5 text-xs">
                  {part.sources.map((s) => (
                    <li key={s.key}>
                      {s.url ? (
                        <a href={s.url} target="_blank" rel="noreferrer" className="inline-flex items-start gap-1 text-muted-foreground hover:text-foreground">
                          {s.label}
                          <ExternalLink className="mt-0.5 h-3 w-3 shrink-0" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">{s.label}</span>
                      )}
                    </li>
                  ))}
                </ul>
                <p className="mt-3 text-[11px] text-muted-foreground/80">
                  Chaque valeur vient d'un document cité. Quand le constructeur ne donne pas d'échéance, ApexAI n'en invente pas : c'est toi qui la fixes.
                </p>
              </section>
            )}
          </>
        )}
      {onFit && part && (
          <div className="mt-2 space-y-1.5">
            <Button
              className="h-11 w-full"
              onClick={() => {
                onFit(part);
                onClose();
              }}
            >
              {fitLabel}
            </Button>
            <p className="text-center text-[11px] text-muted-foreground">Notée dans tes interventions, la pièce rejoint « Mes pièces ».</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
