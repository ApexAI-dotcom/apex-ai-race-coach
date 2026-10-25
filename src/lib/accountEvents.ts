import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

/**
 * Signale au serveur une VRAIE connexion (pas une session restaurée), pour :
 *  - le mail de bienvenue (une fois par compte, géré côté serveur) ;
 *  - l'alerte « nouvelle connexion » si l'appareil est inconnu.
 *
 * L'appareil est un identifiant aléatoire gardé dans ce navigateur. Aucun
 * appel ne bloque l'interface : en cas d'échec, on ne fait rien.
 */

const DEVICE_KEY = "apexai_device_id";
const NOTIFIED_KEY = "apexai_signin_notified";

// Retour de Google (?code=<uuid>) ou d'un ancien lien de mail
// (#access_token=…) : relevé au chargement, avant que Supabase ne nettoie
// l'URL. Le code d'échange est un UUID (les codes Paddock Pass n'en sont pas).
export const ARRIVED_FROM_AUTH_REDIRECT =
  typeof window !== "undefined" &&
  (/[?&]code=[0-9a-f]{8}-[0-9a-f]{4}-/i.test(window.location.search) || /access_token=/.test(window.location.hash));

function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(DEVICE_KEY, id);
    }
    return id;
  } catch {
    return "";
  }
}

export function notifySignIn(session: Session | null) {
  if (!session?.access_token) return;
  // Une fois par session de connexion (le rendu en double de React ou un
  // rechargement ne renvoient rien).
  const marker = `${session.user.id}:${session.user.last_sign_in_at ?? ""}`;
  try {
    if (sessionStorage.getItem(NOTIFIED_KEY) === marker) return;
    sessionStorage.setItem(NOTIFIED_KEY, marker);
  } catch {
    /* stockage indisponible : on envoie quand même */
  }
  supabase.functions
    .invoke("account-events", { body: { device_id: deviceId(), reason: "signin" } })
    .catch(() => {});
}
