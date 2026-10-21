import { RefObject, useEffect, useRef, useState } from "react";

/**
 * Outils d'animation partagés par les sections de la page d'accueil.
 *
 * Règle commune : rien ne s'anime hors de l'écran. Chaque aperçu reçoit un
 * drapeau « visible » et ne démarre (ou ne boucle) que tant qu'il l'est —
 * c'est ce qui garde le défilement fluide sur un téléphone d'entrée de gamme.
 */

interface InViewOptions {
  /** Marge autour de l'écran, pour anticiper (ex. « 200px »). */
  rootMargin?: string;
  /** Part de l'élément qui doit être visible (0 à 1). */
  threshold?: number;
  /** Ne signale l'entrée qu'une fois, sans jamais repasser à faux. */
  once?: boolean;
}

/** Vrai tant que l'élément est (au moins en partie) dans l'écran. */
export function useInViewFlag<T extends Element = HTMLDivElement>({
  rootMargin = "0px",
  threshold = 0.15,
  once = false,
}: InViewOptions = {}): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (once) io.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { rootMargin, threshold }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin, threshold, once]);

  return [ref, inView];
}

/**
 * Boucle d'animation image par image, sans re-rendu React : le callback
 * reçoit le temps écoulé (secondes) depuis le démarrage et écrit directement
 * dans le DOM (attributs SVG, textContent…).
 */
export function useFrameLoop(active: boolean, onFrame: (elapsedSeconds: number) => void) {
  const cb = useRef(onFrame);
  cb.current = onFrame;

  useEffect(() => {
    if (!active) return;
    let raf = 0;
    let start = 0;
    const tick = (now: number) => {
      if (!start) start = now;
      cb.current((now - start) / 1000);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active]);
}

/** Courbe d'arrivée douce : démarrage vif, fin longue (easeOutExpo). */
export const easeOutExpo = (t: number) => (t >= 1 ? 1 : 1 - Math.pow(2, -10 * t));
export const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
