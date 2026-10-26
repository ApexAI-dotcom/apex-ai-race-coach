import { useEffect, useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getPart, type CatalogPart } from "@/lib/api";
import { intervalLabel, KIND_LABELS, KIND_STYLES, lifeLabel, sortMaintenance, specRows } from "./partFormat";

export function KindBadge({ kind }: { kind: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center rounded-full border px-2 py-0.5 text-[10px] font-medium ${KIND_STYLES[kind] ?? "border-border text-muted-foreground"}`}>
      {KIND_LABELS[kind] ?? kind}
    </span>
  );
}

/** Fiche complète d'une pièce : caractéristiques, usages, entretien et sources. */
export function PartDetailDialog({ partId, onClose }: { partId: string | null; onClose: () => void }) {
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
                    <dt className="text-xs text-muted-foreground">{part.category === "tire" ? "Durée de vie de départ" : "Avant révision"}</dt>
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
                <ul className="divide-y divide-border rounded-xl border border-border">
                  {sortMaintenance(part.maintenance).map((m, i) => (
                    <li key={i} className="flex items-start justify-between gap-3 px-3 py-2 text-sm">
                      <span className="min-w-0">
                        <span className="block font-medium">{m.element}</span>
                        <span className="block text-xs text-muted-foreground">
                          {m.action}
                          {m.usage && m.usage !== "tous" ? ` · ${m.usage}` : ""}
                          {m.ref ? ` · ${m.ref}` : ""}
                        </span>
                      </span>
                      <span className="flex shrink-0 flex-col items-end gap-1">
                        <span className="tabular-nums">{intervalLabel(m)}</span>
                        <KindBadge kind={m.kind} />
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {part.sources && part.sources.length > 0 && (
              <section>
                <h3 className="mb-2 text-sm font-semibold">Sources</h3>
                <ul className="space-y-1.5 text-xs">
                  {part.sources.map((s) => (
                    <li key={s.key} className="flex items-start gap-2">
                      <KindBadge kind={s.type} />
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
                  Valeurs relevées dans les documents cités. Une valeur qu'aucun document ne donne n'est pas estimée ; les estimations héritées sont signalées.
                </p>
              </section>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
