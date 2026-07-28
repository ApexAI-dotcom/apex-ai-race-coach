import { useEffect, useState } from "react";
import { Share, X, Plus } from "lucide-react";

/**
 * Invite discrète à installer ApexAI sur l'écran d'accueil (iOS).
 *
 * Contrairement à Android, iOS ne déclenche aucune invite automatique : il faut
 * passer par Partager → « Sur l'écran d'accueil ». Personne ne le devine seul,
 * et c'est pourtant précisément ce que les pilotes demandent — ouvrir leur
 * téléphone et accéder à ApexAI sans chercher l'adresse du site.
 *
 * Trois précautions pour que ce ne soit pas une nuisance :
 *   — jamais affichée si l'app est déjà installée ;
 *   — jamais avant que l'utilisateur ait passé un moment sur le site ;
 *   — refusée une fois, plus jamais reproposée.
 */

const DISMISS_KEY = "apexai:a2hs-dismissed";
const DELAY_MS = 20_000;
/** Rappel manuel depuis le menu, une fois l'invite refusée. */
export const SHOW_A2HS_EVENT = "apexai:show-a2hs";

function isStandalone(): boolean {
  // `navigator.standalone` est la propriété historique d'iOS ; le media query
  // couvre les navigateurs modernes.
  const legacy = (window.navigator as unknown as { standalone?: boolean }).standalone;
  return Boolean(legacy) || window.matchMedia("(display-mode: standalone)").matches;
}

/**
 * L'appareil peut-il installer ApexAI sur son écran d'accueil ?
 *
 * Exporté pour que le menu n'affiche l'entrée « Ajouter à l'écran d'accueil »
 * que là où elle a un sens : proposer un geste impossible ailleurs serait pire
 * que de ne rien proposer.
 */
export function canAddToHomeScreen(): boolean {
  try {
    return !isStandalone() && isIosSafari();
  } catch {
    return false;
  }
}

/** Réaffiche l'invite, même refusée auparavant. */
export function requestAddToHomeScreenHint(): void {
  try {
    localStorage.removeItem(DISMISS_KEY);
  } catch {
    /* sans stockage, l'invite s'affichera quand même */
  }
  window.dispatchEvent(new CustomEvent(SHOW_A2HS_EVENT));
}

function isIosSafari(): boolean {
  const ua = window.navigator.userAgent;
  const iOS =
    /iPad|iPhone|iPod/.test(ua) ||
    // iPadOS 13+ se présente comme un Mac : on le distingue au tactile.
    (/Macintosh/.test(ua) && navigator.maxTouchPoints > 1);
  if (!iOS) return false;
  // Chrome, Firefox et Edge sur iOS ne savent pas installer une PWA :
  // leur proposer serait un conseil impossible à suivre.
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

export function AddToHomeScreenHint() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (isStandalone()) return;
      if (!isIosSafari()) return;
      if (localStorage.getItem(DISMISS_KEY)) return;
    } catch {
      return; // stockage indisponible (navigation privée) : on s'abstient
    }
    const t = window.setTimeout(() => setVisible(true), DELAY_MS);
    return () => window.clearTimeout(t);
  }, []);

  // Rappel depuis le menu : le pilote qui a refusé une fois doit pouvoir
  // revenir sur sa décision sans avoir à vider les données de Safari.
  useEffect(() => {
    const onRequest = () => {
      if (canAddToHomeScreen()) setVisible(true);
    };
    window.addEventListener(SHOW_A2HS_EVENT, onRequest);
    return () => window.removeEventListener(SHOW_A2HS_EVENT, onRequest);
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    try {
      localStorage.setItem(DISMISS_KEY, "1");
    } catch {
      /* sans stockage, l'invite réapparaîtra : moindre mal */
    }
  };

  return (
    <div
      role="dialog"
      aria-label="Installer ApexAI sur l'écran d'accueil"
      className="fixed inset-x-3 z-[120] bottom-[calc(0.75rem+var(--safe-bottom))]
                 rounded-2xl border border-primary/30 bg-background/95 backdrop-blur-xl
                 shadow-2xl shadow-black/50 p-3 flex items-start gap-3
                 animate-in slide-in-from-bottom-4 duration-300"
    >
      <div className="w-10 h-10 shrink-0 rounded-xl gradient-primary flex items-center justify-center">
        <Plus className="w-5 h-5 text-primary-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-foreground">ApexAI sur ton écran d'accueil</p>
        <p className="text-[13px] text-muted-foreground leading-snug mt-0.5">
          Accès direct, sans passer par le navigateur. Touche{" "}
          <Share className="inline w-3.5 h-3.5 -mt-0.5 text-primary" /> puis{" "}
          <span className="text-foreground">« Sur l'écran d'accueil »</span>.
        </p>
      </div>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Ne plus proposer"
        className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center
                   text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
