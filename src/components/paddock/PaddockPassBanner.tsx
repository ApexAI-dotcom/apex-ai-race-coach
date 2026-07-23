import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Ticket, X } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

/**
 * Bandeau discret affiché quand un Paddock Pass est actif : compte à rebours
 * en temps réel pour que le pilote ressente son accès premium temporaire.
 */
function fmt(seconds: number): string {
  if (seconds <= 0) return "expiré";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m.toString().padStart(2, "0")}m`;
  if (m > 0) return `${m}m ${s.toString().padStart(2, "0")}s`;
  return `${s}s`;
}

export function PaddockPassBanner() {
  const { session } = useAuth();
  const token = session?.access_token;
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [tier, setTier] = useState<string>("");
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!token) { setSecondsLeft(null); return; }
    let alive = true;
    api.getPaddockPassStatus(token)
      .then((r) => {
        if (!alive) return;
        if (r.active && r.seconds_left > 0) {
          setSecondsLeft(r.seconds_left);
          setTier(r.tier || "premium");
        } else {
          setSecondsLeft(null);
        }
      })
      .catch(() => setSecondsLeft(null));
    return () => { alive = false; };
  }, [token]);

  useEffect(() => {
    if (secondsLeft === null) return;
    const id = setInterval(() => {
      setSecondsLeft((s) => (s === null ? null : Math.max(0, s - 1)));
    }, 1000);
    return () => clearInterval(id);
  }, [secondsLeft !== null]);

  if (secondsLeft === null || dismissed) return null;

  const expired = secondsLeft <= 0;

  return (
    <div className={`w-full text-sm ${expired ? "bg-muted" : "bg-primary/10 border-b border-primary/20"}`}>
      <div className="container mx-auto px-4 py-2 flex items-center justify-center gap-3 relative">
        <Ticket className={`w-4 h-4 shrink-0 ${expired ? "text-muted-foreground" : "text-primary"}`} />
        {expired ? (
          <span className="text-muted-foreground">
            Ton Paddock Pass est terminé.{" "}
            <Link to="/pricing" className="text-primary font-semibold hover:underline">Passe à l'offre complète →</Link>
          </span>
        ) : (
          <span className="text-foreground">
            <span className="font-semibold capitalize">{tier}</span> actif via Paddock Pass —
            <span className="text-primary font-semibold"> expire dans {fmt(secondsLeft)}</span>
          </span>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="absolute right-3 p-1 rounded-md text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Masquer"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
