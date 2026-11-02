import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { FileUp, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import { TELEMETRY_ACCEPT, TELEMETRY_FORMAT_ERROR, isTelemetryFile, uploadAndAnalyzeCSV, type AnalysisResult, type ApiError } from "@/lib/api";
import { getAllAnalyses, getAnalysisById, saveAnalysis, type AnalysisSummary } from "@/lib/storage";
import { CompareResults, COLOR_A, COLOR_B } from "./CompareResults";
import { AnalysisProgress, type AnalysisStep } from "@/components/upload/AnalysisProgress";
import { BarChart3, Brain, GitCompareArrows, Upload as UploadIcon, Wifi } from "lucide-react";

const COMPARE_STEPS: AnalysisStep[] = [
  { icon: Wifi, message: "Connexion au serveur…", duration: 1500 },
  { icon: UploadIcon, message: "Envoi des deux fichiers…", duration: 4000 },
  { icon: Brain, message: "L'IA analyse les points de corde et les freinages…", duration: 15000 },
  { icon: BarChart3, message: "Calcul des chronos tour par tour…", duration: 15000 },
  { icon: GitCompareArrows, message: "Mise en face des deux tours, virage par virage…", duration: 20000 },
];
import { cn } from "@/lib/utils";

interface Slot {
  name: string;
  file: File | null;
  sessionId: string;
  /** Le fichier est une séance du pilote : elle rejoint ses sessions. */
  mine: boolean;
}

function SlotCard({
  slot,
  onChange,
  sessions,
  color,
  title,
  mineLabel,
}: {
  slot: Slot;
  onChange: (s: Slot) => void;
  sessions: AnalysisSummary[];
  color: string;
  title: string;
  mineLabel?: string;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [drag, setDrag] = useState(false);
  const pick = (f: File | undefined) => {
    if (f) onChange({ ...slot, file: f, sessionId: "" });
  };
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2">
        <span className="h-2.5 w-2.5 rounded-full" style={{ background: color }} />
        <h3 className="font-display text-base font-semibold text-foreground">{title}</h3>
      </div>
      <label className="mt-3 block text-xs text-muted-foreground">
        Nom affiché
        <Input value={slot.name} onChange={(e) => onChange({ ...slot, name: e.target.value })} className="mt-1" maxLength={24} />
      </label>

      <div
        className={cn(
          "mt-3 flex min-h-[96px] cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center text-sm transition-colors",
          drag ? "border-primary bg-primary/5" : "border-border hover:border-foreground/30"
        )}
        onClick={() => input.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          pick(e.dataTransfer.files?.[0]);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && input.current?.click()}
      >
        <input ref={input} type="file" accept={TELEMETRY_ACCEPT} className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
        {slot.file ? (
          <span className="flex items-center gap-2 text-foreground">
            <FileUp className="h-4 w-4" />
            <span className="max-w-[220px] truncate">{slot.file.name}</span>
            <button
              type="button"
              aria-label="Retirer le fichier"
              onClick={(e) => {
                e.stopPropagation();
                onChange({ ...slot, file: null });
              }}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="h-4 w-4" />
            </button>
          </span>
        ) : (
          <>
            <FileUp className="mb-1 h-5 w-5 text-muted-foreground" />
            <span className="text-foreground">Dépose le fichier de session</span>
            <span className="text-xs text-muted-foreground">.xrk, .xrz ou .csv de ton boîtier d'acquisition</span>
          </>
        )}
      </div>

      {sessions.length > 0 && (
        <label className="mt-3 block text-xs text-muted-foreground">
          ou une séance déjà analysée
          <select
            value={slot.sessionId}
            onChange={(e) => onChange({ ...slot, sessionId: e.target.value, file: e.target.value ? null : slot.file })}
            className="mt-1 h-10 w-full rounded-md border border-border bg-background px-2 text-sm text-foreground"
          >
            <option value="">Choisir une séance…</option>
            {sessions.slice(0, 40).map((s) => (
              <option key={s.id} value={s.id}>
                {new Date(s.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}, {s.circuit_name || "circuit non renseigné"}
                {s.lap_time ? `, ${s.lap_time.toFixed(3).replace(".", ",")}` : ""}
              </option>
            ))}
          </select>
        </label>
      )}

      {mineLabel && slot.file && (
        <label className="mt-3 flex items-center gap-2 text-sm text-muted-foreground">
          <input type="checkbox" checked={slot.mine} onChange={(e) => onChange({ ...slot, mine: e.target.checked })} />
          {mineLabel}
        </label>
      )}
    </div>
  );
}

/**
 * Comparer deux fichiers : le sien et celui d'un coéquipier, ou deux séances
 * du même pilote. Le fichier du pilote rejoint ses sessions ; celui du
 * coéquipier n'est gardé que le temps de la comparaison (sauf s'il est coché
 * comme une séance du pilote).
 */
export function CompareUploader() {
  const { user, session, isAuthenticated } = useAuth();
  const [sessions, setSessions] = useState<AnalysisSummary[]>([]);
  // Prénom du pilote plutôt que « Toi » : les phrases du résultat sont à la
  // 3e personne (« Léo est devant »), « Toi est devant » ne voulait rien dire.
  const myName = ((user?.user_metadata?.full_name as string | undefined)?.split(" ")[0] || "").trim() || "Pilote 1";
  const [a, setA] = useState<Slot>({ name: myName, file: null, sessionId: "", mine: true });
  const [b, setB] = useState<Slot>({ name: "Coéquipier", file: null, sessionId: "", mine: false });
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<{ ra: AnalysisResult; rb: AnalysisResult; names: [string, string] } | null>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (user?.id) getAllAnalyses(user.id).then(setSessions).catch(() => setSessions([]));
  }, [user?.id]);

  // Ouvert depuis Sessions (« Comparer ») : la séance choisie est déjà dans
  // la première case, il ne reste qu'à choisir l'autre.
  const [params] = useSearchParams();
  const preset = params.get("seance");
  useEffect(() => {
    if (preset) setA((x) => (x.sessionId || x.file ? x : { ...x, sessionId: preset }));
  }, [preset]);

  if (!isAuthenticated) {
    return (
      <div className="rounded-2xl border border-border bg-card p-6 text-center">
        <p className="text-foreground">La comparaison de deux pilotes est réservée aux comptes ApexAI.</p>
        <Button asChild className="mt-4">
          <Link to="/login?mode=signup">Créer mon compte</Link>
        </Button>
      </div>
    );
  }

  const load = async (slot: Slot, label: string): Promise<AnalysisResult> => {
    if (slot.sessionId) {
      setBusy(`Chargement de la séance de ${label}…`);
      const r = await getAnalysisById(slot.sessionId, user?.id);
      if (!r) throw new Error(`Séance de ${label} introuvable.`);
      return r;
    }
    if (!slot.file) throw new Error(`Il manque le fichier de ${label}.`);
    if (!isTelemetryFile(slot.file.name)) throw new Error(TELEMETRY_FORMAT_ERROR);
    const file = slot.file;
    const once = () => uploadAndAnalyzeCSV(file, { accessToken: session?.access_token ?? null, track_condition: "auto" } as any);
    // Un nouvel essai automatique si le serveur a mis trop de temps : la
    // seconde demande profite du travail déjà fait (cache) et aboutit.
    let r: AnalysisResult;
    try {
      r = await once();
    } catch (e) {
      const code = (e as ApiError)?.error;
      if (code !== "timeout" && code !== "network_error" && code !== "backend_unavailable") throw e;
      r = await once();
    }
    if (slot.mine) {
      try {
        await saveAnalysis(r, user?.id);
      } catch {
        /* la comparaison reste affichée même si l'enregistrement échoue */
      }
    }
    return r;
  };

  const run = async (sameFile = false) => {
    setError(null);
    setResults(null);
    try {
      setBusy(sameFile ? "Analyse du fichier…" : "Analyse des deux séances…");
      // Les deux analyses tournent en même temps : deux fois moins d'attente.
      const [ra, rb] = sameFile
        ? await load(a, a.name || myName).then((x) => [x, x] as const)
        : await Promise.all([load(a, a.name || myName), load(b, b.name || "Coéquipier")]);
      const nameA = (a.name || myName).trim();
      let nameB = (b.name || "Coéquipier").trim();
      if (nameB.toLowerCase() === nameA.toLowerCase()) nameB = `${nameB} (2)`;
      const names: [string, string] = sameFile ? ["Tour A", "Tour B"] : [nameA, nameB];
      setResults({ ra, rb, names });
      window.setTimeout(() => resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
    } catch (e) {
      const msg = (e as ApiError)?.message ?? (e instanceof Error ? e.message : "La comparaison a échoué.");
      setError(msg);
    } finally {
      setBusy(null);
    }
  };

  const aReady = !!(a.file || a.sessionId);
  const bReady = !!(b.file || b.sessionId);

  return (
    <div className="space-y-6">
      {busy ? (
        <div className="rounded-2xl border border-border bg-card">
          <AnalysisProgress
            steps={COMPARE_STEPS}
            title={busy}
            subtitle="L'IA analyse chaque tour, chaque freinage et chaque virage des deux séances. Compte une à deux minutes."
          />
        </div>
      ) : results ? (
        <div className="flex justify-center">
          <Button variant="outline" className="h-11" onClick={() => setResults(null)}>
            Nouvelle comparaison
          </Button>
        </div>
      ) : (
        <>
      <div className="grid gap-4 md:grid-cols-2">
        <SlotCard slot={a} onChange={setA} sessions={sessions} color={COLOR_A} title="Premier fichier" />
        <SlotCard slot={b} onChange={setB} sessions={sessions} color={COLOR_B} title="Fichier à comparer" mineLabel="C'est aussi une de mes séances (l'ajouter à mes sessions)" />
      </div>

      <div className="flex flex-col items-center gap-2">
        <div className="flex flex-wrap justify-center gap-2">
          <Button size="lg" disabled={!aReady || !bReady || !!busy} onClick={() => run(false)}>
            {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Comparer les deux
          </Button>
          <Button size="lg" variant="outline" disabled={!aReady || !!busy} onClick={() => run(true)}>
            Comparer deux tours du premier fichier
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Chaque nouveau fichier compte comme une analyse. Le fichier du coéquipier n'est pas ajouté à tes sessions.
        </p>
        {error && <p className="text-sm text-[hsl(var(--loss))]">{error}</p>}
      </div>
        </>
      )}

      <div ref={resultsRef}>{results && <CompareResults key={`${results.names.join()}-${results.ra.analysis_id}-${results.rb.analysis_id}`} {...results} />}</div>
    </div>
  );
}
