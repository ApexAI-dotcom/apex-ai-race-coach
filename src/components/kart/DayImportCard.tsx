import { useRef, useState } from "react";
import { CheckCircle2, Loader2, Lock, UploadCloud, X } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import api, { TELEMETRY_ACCEPT, isTelemetryFile } from "@/lib/api";

interface FileResult {
  filename: string;
  success: boolean;
  is_new?: boolean;
  error?: string;
  duration_hours?: number;
  laps_count?: number;
  session_date?: string | null;
  circuit_name?: string | null;
}

export interface DaySummary {
  added: number;
  already: number;
  failed: number;
  hours: number;
  laps: number;
  dates: string[];
  circuits: string[];
}

const n1 = (v: number) => (Math.round(v * 10) / 10).toString().replace(".", ",");
const hm = (h: number) => {
  const m = Math.round(h * 60);
  return m >= 60 ? `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, "0")}` : `${m} min`;
};

function summarize(results: FileResult[]): DaySummary {
  const fresh = results.filter((r) => r.success && r.is_new);
  return {
    added: fresh.length,
    already: results.filter((r) => r.success && !r.is_new).length,
    failed: results.filter((r) => !r.success).length,
    hours: fresh.reduce((s, r) => s + (r.duration_hours || 0), 0),
    laps: fresh.reduce((s, r) => s + (r.laps_count || 0), 0),
    dates: [...new Set(results.map((r) => r.session_date).filter(Boolean) as string[])],
    circuits: [...new Set(results.map((r) => r.circuit_name).filter(Boolean) as string[])],
  };
}

/**
 * « Importer ma journée » : LA porte d'entrée de Mon Kart. Les fichiers de la
 * journée (toutes les séances, telles que sorties de Race Studio ou du
 * boîtier) font avancer les compteurs sans être analysés : ils ne comptent
 * pas dans les analyses et une séance déjà importée n'est jamais comptée deux
 * fois. Envoi séance par séance, avec la progression réelle.
 */
export function DayImportCard({
  token,
  mountedTireLabel,
  readOnly = false,
  onLocked,
  onImported,
  firstTime = false,
}: {
  /** Aucune journée encore importée : la carte guide le premier pas. */
  firstTime?: boolean;
  token?: string | null;
  mountedTireLabel?: string | null;
  readOnly?: boolean;
  onLocked?: () => void;
  onImported?: (s: DaySummary) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState<{ i: number; n: number } | null>(null);
  const [summary, setSummary] = useState<DaySummary | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [drag, setDrag] = useState(false);

  const pick = (list: FileList | File[] | null) => {
    if (!list) return;
    const all = Array.from(list);
    const ok = all.filter((f) => isTelemetryFile(f.name));
    setErrors(all.length > ok.length ? [`${all.length - ok.length} fichier(s) ignoré(s) : formats acceptés .xrk, .xrz, export Race Studio, Alfano.`] : []);
    setFiles(ok);
    setSummary(null);
  };

  const run = async () => {
    if (!token || files.length === 0) return;
    const results: FileResult[] = [];
    for (let i = 0; i < files.length; i++) {
      setBusy({ i: i + 1, n: files.length });
      try {
        const res = await api.bulkImportKartSessions(token, [files[i]]);
        results.push(...((res?.results as FileResult[]) ?? []));
      } catch (e) {
        results.push({ filename: files[i].name, success: false, error: (e as Error)?.message || "Envoi impossible" });
      }
    }
    setBusy(null);
    const s = summarize(results);
    setSummary(s);
    setErrors(results.filter((r) => !r.success).map((r) => `${r.filename} : ${r.error || "fichier illisible"}`));
    setFiles([]);
    if (inputRef.current) inputRef.current.value = "";
    if (s.added > 0) onImported?.(s);
  };

  const dateLabel = (iso: string) => {
    const d = new Date(iso);
    return isNaN(d.getTime()) ? iso : d.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "long" });
  };

  return (
    <Card className={cn("relative overflow-hidden rounded-2xl border bg-card shadow-sm", firstTime ? "border-primary/40" : "border-border")}>
      {firstTime && <div className="absolute inset-x-0 top-0 h-[2px] bg-signature" aria-hidden />}
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <UploadCloud className="h-5 w-5 text-primary" />
          Importer ma journée
        </CardTitle>
        {firstTime && (
          <p className="text-sm font-semibold text-foreground">Premier pas : importe ta dernière journée de roulage, tes jauges se remplissent tout de suite.</p>
        )}
        <p className="text-sm text-muted-foreground">
          Les fichiers de toutes tes séances du jour (Race Studio, AiM, Alfano) : moteur, chaîne, pneus et freins avancent tout seuls. Sans
          analyse ni décompte, et jamais compté deux fois.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {readOnly ? (
          <button
            type="button"
            onClick={onLocked}
            className="flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-primary/40 bg-primary/5 px-4 py-6 text-center"
          >
            <Lock className="h-5 w-5 text-primary" />
            <span className="text-sm font-semibold text-foreground">Le suivi automatique de ton kart se débloque avec Racer</span>
            <span className="text-xs text-muted-foreground">Voir les offres</span>
          </button>
        ) : (
          <>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setDrag(true);
              }}
              onDragLeave={() => setDrag(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDrag(false);
                pick(e.dataTransfer.files);
              }}
              className={cn(
                "flex cursor-pointer flex-col items-center gap-1 rounded-xl border border-dashed px-4 py-5 text-center transition-colors",
                drag ? "border-primary bg-primary/10" : "border-border bg-background/40 hover:border-primary/50"
              )}
            >
              <input
                ref={inputRef}
                type="file"
                multiple
                accept={TELEMETRY_ACCEPT}
                className="sr-only"
                onChange={(e) => pick(e.target.files)}
                disabled={!!busy}
              />
              <span className="text-sm font-medium text-foreground">
                {files.length ? `${files.length} séance${files.length > 1 ? "s" : ""} prête${files.length > 1 ? "s" : ""}` : "Choisis ou dépose tes fichiers"}
              </span>
              <span className="text-xs text-muted-foreground">
                {files.length ? files.map((f) => f.name).slice(0, 3).join(", ") + (files.length > 3 ? "…" : "") : "Plusieurs fichiers à la fois"}
              </span>
            </label>
            {mountedTireLabel && (
              <p className="text-xs text-muted-foreground">
                Les tours s'ajoutent au train monté : <span className="text-foreground">{mountedTireLabel}</span>. Change de train dans le Stock de pneus avant
                d'importer si besoin.
              </p>
            )}
            <Button className="h-11 w-full" onClick={run} disabled={!!busy || files.length === 0}>
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {busy ? `Séance ${busy.i} sur ${busy.n}…` : "Importer ma journée"}
            </Button>
          </>
        )}

        {summary && (
          <div className="rounded-xl border border-green-500/25 bg-green-500/10 p-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-green-500" />
              <div className="min-w-0 space-y-1 text-sm">
                <p className="font-semibold text-foreground">
                  {summary.added > 0
                    ? `${summary.added} séance${summary.added > 1 ? "s" : ""} ajoutée${summary.added > 1 ? "s" : ""}`
                    : "Aucune nouvelle séance"}
                  {summary.dates[0] ? ` · ${dateLabel(summary.dates[0])}` : ""}
                  {summary.circuits[0] ? ` · ${summary.circuits[0]}` : ""}
                </p>
                {summary.added > 0 && (
                  <p className="text-muted-foreground">
                    {hm(summary.hours)} de roulage, {summary.laps} tours. Moteur et chaîne +{n1(summary.hours)} h · pneus et freins +{summary.laps} tours.
                  </p>
                )}
                {summary.already > 0 && (
                  <p className="text-muted-foreground">
                    {summary.already} séance{summary.already > 1 ? "s" : ""} déjà importée{summary.already > 1 ? "s" : ""} : non recomptée
                    {summary.already > 1 ? "s" : ""}.
                  </p>
                )}
              </div>
              <button type="button" aria-label="Fermer le bilan" className="ml-auto text-muted-foreground hover:text-foreground" onClick={() => setSummary(null)}>
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        {errors.length > 0 && (
          <ul className="space-y-1 text-xs text-orange-500">
            {errors.map((e, i) => (
              <li key={i}>{e}</li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
