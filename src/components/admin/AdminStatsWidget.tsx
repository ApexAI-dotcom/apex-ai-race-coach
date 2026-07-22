import { useState, useEffect, useRef } from "react";
import { useLocation, Link } from "react-router-dom";
import { BarChart3, X, RefreshCw, ArrowUpRight, Loader2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

/**
 * Widget de stats CONTEXTUELLES flottant, réservé aux comptes admin.
 * Affiche, selon la page courante, quelques indicateurs pertinents — pour
 * suivre l'activité en se baladant dans l'app sans ouvrir le back-office.
 */
export function AdminStatsWidget() {
  const { session } = useAuth();
  const location = useLocation();
  const token = session?.access_token;

  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  const lastPath = useRef<string>("");

  // Vérifie une seule fois si le compte a la permission 'stats'
  useEffect(() => {
    if (!token) { setIsAdmin(false); return; }
    api.getAdminMe(token)
      .then((r) => setIsAdmin(!!r.permissions?.includes("stats")))
      .catch(() => setIsAdmin(false));
  }, [token]);

  const load = async (path: string) => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.getContextStats(token, path);
      setData(res);
      lastPath.current = path;
    } catch {
      setData(null);
    } finally {
      setLoading(false);
    }
  };

  // Recharge à l'ouverture et à chaque changement de page si le panneau est ouvert
  useEffect(() => {
    if (open && isAdmin && location.pathname !== lastPath.current) {
      load(location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, isAdmin, location.pathname]);

  if (!isAdmin) return null;

  // On masque le widget sur la page admin elle-même (redondant)
  if (location.pathname === "/admin") return null;

  return (
    <div className="fixed bottom-4 right-4 z-[90] print:hidden">
      {open ? (
        <div className="w-72 rounded-2xl border border-border bg-card/95 backdrop-blur-xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
            <div className="flex items-center gap-2 min-w-0">
              <BarChart3 className="w-4 h-4 text-primary shrink-0" />
              <span className="text-sm font-semibold truncate">{data?.title || "Stats"}</span>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => load(location.pathname)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                title="Actualiser"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              </button>
              <button
                onClick={() => setOpen(false)}
                className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3 space-y-1.5">
            {loading && !data ? (
              <div className="flex justify-center py-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
            ) : data?.stats?.length ? (
              data.stats.map((s: any, i: number) => (
                <div key={i} className="flex items-center justify-between gap-3 px-2.5 py-2 rounded-lg hover:bg-muted/40 transition-colors">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <span className="text-sm font-bold text-foreground tabular-nums">{s.value ?? "—"}</span>
                </div>
              ))
            ) : (
              <p className="text-xs text-muted-foreground text-center py-4">Aucune donnée.</p>
            )}
          </div>

          <Link
            to="/admin"
            className="flex items-center justify-between px-4 py-2.5 border-t border-border text-xs text-primary hover:bg-primary/5 transition-colors"
          >
            <span>Ouvrir le back-office complet</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <button
          onClick={() => setOpen(true)}
          className="w-11 h-11 rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/30 flex items-center justify-center hover:scale-105 transition-transform"
          title="Stats de la page (admin)"
        >
          <BarChart3 className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
