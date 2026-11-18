import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { PENDING_JOIN_KEY } from "@/lib/team";

/**
 * Un pilote qui ouvre un lien d'école sans compte s'inscrit, confirme son
 * mail et arrive sur le tableau de bord : on le ramène sur la page
 * « Rejoindre », où il donne son accord. Rien n'est accepté à sa place.
 */
export function PendingJoinRedirect() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user || pathname.startsWith("/rejoindre") || pathname.startsWith("/login") || pathname.startsWith("/auth")) return;
    let code: string | null = null;
    try {
      code = localStorage.getItem(PENDING_JOIN_KEY);
    } catch {
      return;
    }
    if (code && /^[A-Z0-9]{6,32}$/i.test(code)) {
      navigate(`/rejoindre/${encodeURIComponent(code)}`, { replace: true });
    }
  }, [user, pathname, navigate]);

  return null;
}
