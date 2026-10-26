import { useEffect, useState } from "react";
import { BookOpen } from "lucide-react";
import { matchPart, searchParts, type CatalogPart } from "@/lib/api";

const STOP = new Set(["moteur", "rotax", "iame", "vortex", "version", "ffsa", "max", "evo", "125", "les", "des", "pour", "eurocup", "cup", "challenge", "senior", "junior", "master", "gentleman", "lady", "kart"]);
const tokens = (s: string) =>
  s
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((t) => t.length >= 3 && !STOP.has(t));

/**
 * Rappel des données constructeur et règlement du moteur déclaré : mélange,
 * bougie, huile de boîte et pignons autorisés quand un règlement les fixe.
 */
export function EngineFactsHint({ engineLabel }: { engineLabel?: string | null }) {
  const [engine, setEngine] = useState<CatalogPart | null>(null);
  const [sprockets, setSprockets] = useState<CatalogPart[]>([]);

  useEffect(() => {
    let alive = true;
    if (!engineLabel) return;
    matchPart(engineLabel, "engine").then(async (p) => {
      if (!alive || !p) return;
      setEngine(p);
      const keys = new Set(tokens([p.name, ...(p.aliases || []), ...(p.uses || [])].join(" ")));
      const { parts } = await searchParts("", "sprocket", 50);
      if (!alive) return;
      setSprockets(parts.filter((s) => tokens([s.name, ...(s.uses || [])].join(" ")).some((t) => keys.has(t))));
    });
    return () => {
      alive = false;
    };
  }, [engineLabel]);

  if (!engine) return null;
  const facts: [string, string][] = [
    ["Mélange", engine.specs?.fuel_mix],
    ["Bougie", engine.specs?.spark_plug],
    ["Huile de boîte", engine.specs?.gearbox_oil],
  ].filter((f): f is [string, string] => !!f[1]);
  if (!facts.length && !sprockets.length) return null;

  return (
    <div className="rounded-xl border border-border bg-muted/20 p-3 text-xs">
      <p className="mb-1.5 flex items-center gap-1.5 font-semibold text-foreground">
        <BookOpen className="h-3.5 w-3.5 text-primary" />
        {engine.brand} {engine.name} : constructeur et règlement
      </p>
      <dl className="space-y-1">
        {sprockets.map((s) => (
          <div key={s.id} className="flex gap-2">
            <dt className="shrink-0 text-muted-foreground">Pignon</dt>
            <dd>
              {s.name}
              {s.uses?.length ? <span className="text-muted-foreground"> · {s.uses.join(", ")}</span> : null}
            </dd>
          </div>
        ))}
        {facts.map(([k, v]) => (
          <div key={k} className="flex gap-2">
            <dt className="shrink-0 text-muted-foreground">{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
