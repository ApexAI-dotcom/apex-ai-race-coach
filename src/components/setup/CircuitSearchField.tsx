import { useEffect, useMemo, useRef, useState } from "react";
import { Loader2, MapPin, Plus, Search, Star } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchCatalogCircuits, type CatalogCircuit } from "@/lib/api";
import { cn } from "@/lib/utils";

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

interface Props {
  /** Circuits déjà enregistrés par le pilote. */
  saved: any[];
  loadingSaved?: boolean;
  onPickSaved: (circuit: any) => void;
  onPickCatalog: (circuit: CatalogCircuit) => void;
  /** « Autre circuit » : saisie libre, avec le nom tapé. */
  onOther: (name: string) => void;
}

/**
 * Un seul champ « Circuit » : les circuits du pilote d'abord, puis la base des
 * circuits de France (nom, commune ou département), et en dernier recours
 * « Autre circuit » pour le créer à la main. Liste dans la page (pas de
 * fenêtre flottante) pour rester lisible et cliquable au téléphone.
 */
export function CircuitSearchField({ saved, loadingSaved, onPickSaved, onPickCatalog, onOther }: Props) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [results, setResults] = useState<CatalogCircuit[]>([]);
  const [busy, setBusy] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  // Fermer la liste quand on touche ailleurs.
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, [open]);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      setBusy(false);
      return;
    }
    let alive = true;
    setBusy(true);
    const t = window.setTimeout(() => {
      const dept = /^\d{2,3}$|^2[ab]$/i.test(term) ? term.toUpperCase() : undefined;
      searchCatalogCircuits(dept ? "" : term, dept, 8)
        .then((r) => alive && setResults(r))
        .catch(() => alive && setResults([]))
        .finally(() => alive && setBusy(false));
    }, 220);
    return () => {
      alive = false;
      window.clearTimeout(t);
    };
  }, [q]);

  const term = norm(q);
  const mine = useMemo(() => {
    const list = term ? saved.filter((c) => norm(c.name || "").includes(term)) : saved;
    return list.slice(0, term ? 6 : 5);
  }, [saved, term]);
  // Un circuit de la base déjà enregistré par le pilote n'apparaît qu'une fois.
  const savedNames = useMemo(() => new Set(saved.map((c) => norm(c.name || ""))), [saved]);
  const france = results.filter((c) => !savedNames.has(norm(c.name)));
  const exact = term && (saved.some((c) => norm(c.name || "") === term) || results.some((c) => norm(c.name) === term));

  const pick = (fn: () => void) => {
    fn();
    setQ("");
    setOpen(false);
  };

  const Row = ({ children, onClick, className }: { children: React.ReactNode; onClick: () => void; className?: string }) => (
    <li>
      <button
        type="button"
        // pointerdown plutôt que click : la liste ne se ferme pas avant le choix.
        onPointerDown={(e) => e.preventDefault()}
        onClick={onClick}
        className={cn("flex min-h-12 w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors hover:bg-muted/50 active:bg-muted", className)}
      >
        {children}
      </button>
    </li>
  );

  return (
    <div ref={boxRef} className="relative">
      <label htmlFor="circuit-search" className="mb-2 block text-xs font-semibold text-muted-foreground">
        Circuit
      </label>
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          id="circuit-search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Nom du circuit, commune ou département (ex. 44)"
          className="h-12 pl-9 text-base sm:text-sm"
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-controls="circuit-results"
        />
        {busy && <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />}
      </div>

      {open && (
        <div id="circuit-results" className="mt-2 overflow-hidden rounded-xl border border-border bg-card">
          <ul className="max-h-[50vh] divide-y divide-border overflow-y-auto overscroll-contain sm:max-h-[320px]">
            {mine.length > 0 && (
              <li className="bg-muted/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Tes circuits
              </li>
            )}
            {loadingSaved && !mine.length && (
              <li className="px-3 py-3 text-xs text-muted-foreground">Chargement de tes circuits…</li>
            )}
            {mine.map((c) => (
              <Row key={c.id} onClick={() => pick(() => onPickSaved(c))}>
                <Star className="h-4 w-4 shrink-0 text-primary" />
                <span className="min-w-0 flex-1 truncate font-medium text-foreground">{c.name}</span>
              </Row>
            ))}

            {term.length >= 2 && france.length > 0 && (
              <li className="bg-muted/30 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-muted-foreground">
                Circuits de France
              </li>
            )}
            {term.length >= 2 &&
              france.map((c) => (
                <Row key={c.slug} onClick={() => pick(() => onPickCatalog(c))}>
                  <MapPin className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{c.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">
                      {[c.city, c.department_code ? `(${c.department_code})` : null].filter(Boolean).join(" ")}
                      {c.length_m ? ` · ${c.length_m.toLocaleString("fr-FR")} m` : ""}
                      {c.corners_count ? ` · ${c.corners_count} virages` : ""}
                    </span>
                  </span>
                </Row>
              ))}

            {term.length < 2 && !mine.length && !loadingSaved && (
              <li className="px-3 py-3 text-xs text-muted-foreground">Tape le nom du circuit, sa commune ou son département.</li>
            )}
            {term.length >= 2 && !busy && !mine.length && !france.length && (
              <li className="px-3 py-3 text-xs text-muted-foreground">Aucun circuit trouvé pour « {q.trim()} ».</li>
            )}

            {term.length >= 2 && !exact && (
              <Row onClick={() => pick(() => onOther(q.trim()))} className="text-primary">
                <Plus className="h-4 w-4 shrink-0" />
                <span className="min-w-0 flex-1 truncate">
                  Autre circuit : <span className="font-medium">« {q.trim()} »</span>
                </span>
              </Row>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
