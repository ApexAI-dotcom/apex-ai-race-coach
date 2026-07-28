import { useCallback, useEffect, useMemo, useRef, useState } from "react";

/**
 * Zoom et déplacement sur l'axe des distances d'un graphique.
 *
 * Gestes natifs, sans bouton : molette sur ordinateur, pincement à deux doigts
 * sur téléphone, glisser pour déplacer une fois zoomé, double-clic ou
 * double-tape pour revenir au tour complet.
 *
 * Le zoom est centré sur le curseur (ou sur le milieu des deux doigts) : le
 * point visé reste sous le doigt pendant qu'on zoome, sinon on perd le virage
 * qu'on cherchait.
 *
 * `touch-action: pan-y` sur le conteneur laisse le défilement vertical de la
 * page fonctionner normalement tout en nous réservant le pincement.
 */

/** Fenêtre minimale : en deçà, on grossit du bruit, pas de l'information. */
const MIN_SPAN_M = 25;
/** Largeur approximative de l'axe Y et de la marge droite, en pixels. */
const AXIS_INSET_PX = 44;
const RIGHT_INSET_PX = 12;

export interface ChartZoom {
  domain: [number, number];
  isZoomed: boolean;
  reset: () => void;
  containerRef: React.RefObject<HTMLDivElement>;
  /** Niveau de zoom, pour l'afficher au pilote. */
  zoomLabel: string;
}

export function useChartZoom(min: number, max: number): ChartZoom {
  const containerRef = useRef<HTMLDivElement>(null);
  const [window_, setWindowState] = useState<[number, number] | null>(null);
  // Les gestes lisent la fenêtre courante via une ref : sans elle, l'effet se
  // réabonnerait à chaque déplacement et le glissement en cours serait perdu.
  const windowRef = useRef<[number, number] | null>(null);

  const full = useMemo<[number, number]>(() => {
    const lo = Number.isFinite(min) ? min : 0;
    const hi = Number.isFinite(max) && max > lo ? max : lo + 1;
    return [lo, hi];
  }, [min, max]);

  const setWindow = useCallback((v: [number, number] | null) => {
    windowRef.current = v;
    setWindowState(v);
  }, []);

  const reset = useCallback(() => setWindow(null), [setWindow]);

  // Le pilote change de tour : une fenêtre calculée sur l'ancien n'a plus de
  // sens, on repart du tour complet.
  useEffect(() => {
    setWindow(null);
  }, [full, setWindow]);

  const clamp = useCallback(
    (lo: number, hi: number): [number, number] => {
      const [fLo, fHi] = full;
      const span = Math.min(Math.max(hi - lo, MIN_SPAN_M), fHi - fLo);
      const start = Math.max(fLo, Math.min(lo, fHi - span));
      return [start, start + span];
    },
    [full]
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const isFull = (w: [number, number]) => w[1] - w[0] >= full[1] - full[0] - 1e-6;
    const current = () => windowRef.current ?? full;

    /** Abscisse du pointeur convertie en distance, axe Y déduit. */
    const toValue = (clientX: number, win: [number, number]) => {
      const rect = el.getBoundingClientRect();
      const left = rect.left + AXIS_INSET_PX;
      const width = Math.max(1, rect.width - AXIS_INSET_PX - RIGHT_INSET_PX);
      const ratio = Math.min(1, Math.max(0, (clientX - left) / width));
      return win[0] + ratio * (win[1] - win[0]);
    };

    const applyZoom = (clientX: number, factor: number) => {
      const win = current();
      const anchor = toValue(clientX, win);
      const ratio = (anchor - win[0]) / Math.max(1e-6, win[1] - win[0]);
      const span = (win[1] - win[0]) * factor;
      const next = clamp(anchor - ratio * span, anchor + (1 - ratio) * span);
      setWindow(isFull(next) ? null : next);
    };

    // `passive: false` est indispensable : sans lui le navigateur ignore le
    // preventDefault et la page défile au lieu de zoomer.
    const onWheel = (e: WheelEvent) => {
      if (Math.abs(e.deltaY) < 1) return;
      e.preventDefault();
      applyZoom(e.clientX, e.deltaY > 0 ? 1.25 : 0.8);
    };

    const pointers = new Map<number, number>();
    let pinch: { dist: number; span: number; center: number } | null = null;
    let pan: { x: number; win: [number, number] } | null = null;

    const onPointerDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, e.clientX);
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const win = current();
        pinch = { dist: Math.abs(a - b), span: win[1] - win[0], center: toValue((a + b) / 2, win) };
        pan = null;
      } else if (pointers.size === 1 && windowRef.current) {
        pan = { x: e.clientX, win: windowRef.current };
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, e.clientX);

      if (pointers.size === 2 && pinch) {
        e.preventDefault();
        const [a, b] = [...pointers.values()];
        const dist = Math.abs(a - b);
        if (dist < 10) return;
        const span = pinch.span * (pinch.dist / dist);
        const next = clamp(pinch.center - span / 2, pinch.center + span / 2);
        setWindow(isFull(next) ? null : next);
        return;
      }

      if (pointers.size === 1 && pan) {
        const rect = el.getBoundingClientRect();
        const width = Math.max(1, rect.width - AXIS_INSET_PX - RIGHT_INSET_PX);
        const span = pan.win[1] - pan.win[0];
        const shift = ((pan.x - e.clientX) / width) * span;
        if (Math.abs(shift) < 0.5) return;
        e.preventDefault();
        setWindow(clamp(pan.win[0] + shift, pan.win[1] + shift));
      }
    };

    const endPointer = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) pan = null;
    };

    let lastTap = 0;
    const onPointerUp = (e: PointerEvent) => {
      const now = Date.now();
      // Double-tape : même geste que le double-clic, retour au tour complet.
      if (now - lastTap < 300) reset();
      lastTap = now;
      endPointer(e);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove, { passive: false });
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", endPointer);
    el.addEventListener("pointerleave", endPointer);
    el.addEventListener("dblclick", reset);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", endPointer);
      el.removeEventListener("pointerleave", endPointer);
      el.removeEventListener("dblclick", reset);
    };
  }, [full, clamp, reset, setWindow]);

  const domain = window_ ?? full;
  const ratio = (domain[1] - domain[0]) / Math.max(1e-6, full[1] - full[0]);

  return {
    domain,
    isZoomed: window_ !== null,
    reset,
    containerRef,
    zoomLabel: `×${(1 / ratio).toFixed(1)}`,
  };
}

/**
 * Restreint une série à la fenêtre visible AVANT de la sous-échantillonner.
 *
 * C'est ce qui donne son intérêt au zoom : en resserrant sur un virage on ne
 * grossit pas des points déjà jetés, on en recalcule autant sur une portion
 * plus courte. Le détail apparaît réellement.
 */
export function sliceToDomain(
  distances: number[],
  domain: [number, number]
): [number, number] {
  const [lo, hi] = domain;
  let start = 0;
  let end = distances.length - 1;
  while (start < end && distances[start] < lo) start++;
  while (end > start && distances[end] > hi) end--;
  // Un point de marge de chaque côté pour que la courbe touche les bords.
  return [Math.max(0, start - 1), Math.min(distances.length - 1, end + 1)];
}
