import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE_URL } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";

/**
 * Suivi de navigation pour le back-office : une vue par page, le temps passé
 * (départ de page), et le contexte de la visite (provenance, appareil).
 *
 * - Navigateur : identifiant persistant (localStorage) → un visiteur compte
 *   une fois, quel que soit le nombre de pages vues.
 * - Visite : identifiant renouvelé après 30 minutes sans activité.
 * - Provenance : site d'origine et paramètres utm_* du premier écran de la visite.
 * Non bloquant : sendBeacon au départ, fetch keepalive sinon.
 */
const VISIT_GAP_MS = 30 * 60 * 1000;

function store(kind: "local" | "session") {
  try {
    return kind === "local" ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

function getVisitorId(): string {
  const ls = store("local");
  let sid = ls?.getItem("apexai_sid") ?? null;
  if (!sid) {
    sid = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
    ls?.setItem("apexai_sid", sid);
  }
  return sid ?? "anon";
}

interface VisitContext {
  id: string;
  last: number;
  referrer?: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
}

/** Visite en cours, ou nouvelle visite après 30 minutes d'inactivité. */
function getVisit(): { visit: VisitContext; isNew: boolean } {
  const ss = store("local");
  const now = Date.now();
  let visit: VisitContext | null = null;
  try {
    visit = JSON.parse(ss?.getItem("apexai_visit") || "null");
  } catch {
    visit = null;
  }
  if (visit && now - visit.last < VISIT_GAP_MS) {
    visit.last = now;
    ss?.setItem("apexai_visit", JSON.stringify(visit));
    return { visit, isNew: false };
  }
  const params = new URLSearchParams(window.location.search);
  const ref = document.referrer && !document.referrer.startsWith(window.location.origin) ? document.referrer : undefined;
  visit = {
    id: typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(now),
    last: now,
    referrer: ref,
    utmSource: params.get("utm_source") || params.get("src") || undefined,
    utmMedium: params.get("utm_medium") || undefined,
    utmCampaign: params.get("utm_campaign") || undefined,
  };
  ss?.setItem("apexai_visit", JSON.stringify(visit));
  return { visit, isNew: true };
}

function deviceKind(): string {
  const ua = navigator.userAgent || "";
  if (/iPad|Tablet/i.test(ua) || (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1)) return "tablette";
  if (/Mobi|Android|iPhone/i.test(ua)) return "mobile";
  return "ordinateur";
}

export function usePageTracking() {
  const location = useLocation();
  const { session } = useAuth();
  const tokenRef = useRef<string | undefined>(undefined);
  const userRef = useRef<string | undefined>(undefined);
  const current = useRef<{ path: string; start: number } | null>(null);

  tokenRef.current = session?.access_token;
  userRef.current = session?.user?.id;

  useEffect(() => {
    const path = location.pathname;
    const sessionId = getVisitorId();
    const { visit, isNew } = getVisit();
    const token = tokenRef.current;

    const base = {
      sessionId,
      visitId: visit.id,
      userId: userRef.current,
      device: deviceKind(),
    };

    const send = (body: Record<string, unknown>, useBeacon = false) => {
      try {
        const url = `${API_BASE_URL}/api/analytics/track`;
        const payload = JSON.stringify({ ...base, ...body });
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
      });
    }

    // Nouvelle vue ; la provenance n'accompagne que le premier écran de la visite.
    send({
      path,
      eventType: "view",
      ...(isNew
        ? {
            referrer: visit.referrer,
            utmSource: visit.utmSource,
            utmMedium: visit.utmMedium,
            utmCampaign: visit.utmCampaign,
            tz: Intl.DateTimeFormat().resolvedOptions().timeZone,
            lang: navigator.language,
          }
        : {}),
    });
    current.current = { path, start: Date.now() };

    // Départ du site (fermeture de l'onglet) : temps passé sur la page courante
    const onHide = () => {
      if (current.current) {
        send(
          {
            path: current.current.path,
            eventType: "leave",
            durationMs: Date.now() - current.current.start,
          },
          true
        );
        current.current = { path: current.current.path, start: Date.now() };
      }
    };
    window.addEventListener("pagehide", onHide);
    return () => window.removeEventListener("pagehide", onHide);
  }, [location.pathname]);
}
