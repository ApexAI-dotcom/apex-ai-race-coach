import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

/**
 * Tracking léger de navigation : une vue par changement de route, et le temps
 * passé sur la page précédente (event 'leave'). Best-effort, non bloquant —
 * utilise sendBeacon quand c'est possible pour ne pas ralentir l'app.
 */
function getSessionId(): string {
  try {
    let sid = localStorage.getItem("apexai_sid");
    if (!sid) {
      sid = crypto.randomUUID();
      localStorage.setItem("apexai_sid", sid);
    }
    return sid;
  } catch {
    return "anon";
  }
}

export function usePageTracking() {
  const location = useLocation();
  const { session } = useAuth();
  const tokenRef = useRef<string | undefined>(undefined);
  const current = useRef<{ path: string; start: number } | null>(null);

  tokenRef.current = session?.access_token;

  useEffect(() => {
    const path = location.pathname;
    const sessionId = getSessionId();
    const token = tokenRef.current;

    const send = (body: any, useBeacon = false) => {
      try {
        const url = `${API_BASE_URL}/api/analytics/track`;
        const payload = JSON.stringify(body);
        if (useBeacon && navigator.sendBeacon) {
          navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
          return;
        }
        fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: payload,
          keepalive: true,
        }).catch(() => undefined);
      } catch {
        /* jamais bloquant */
      }
    };

    // Clôture de la page précédente (temps passé)
    if (current.current && current.current.path !== path) {
      send({
        path: current.current.path,
        eventType: "leave",
        durationMs: Date.now() - current.current.start,
        sessionId,
      });
    }

    // Nouvelle vue
    send({ path, eventType: "view", sessionId, referrer: document.referrer || undefined });
    current.current = { path, start: Date.now() };

    // Départ du site (fermeture onglet) : envoyer le temps de la page courante
    const onHide = () => {
      if (current.current) {
        send({
          path: current.current.path,
          eventType: "leave",
          durationMs: Date.now() - current.current.start,
          sessionId,
        }, true);
      }
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [location.pathname]);
}
