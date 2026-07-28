import React from "react";
import { RotateCcw } from "lucide-react";
import type { ChartZoom } from "./useChartZoom";

interface ChartZoomFrameProps {
  zoom: ChartZoom;
  /** Classes de hauteur du graphique (identiques à celles d'avant le zoom). */
  heightClass?: string;
  children: React.ReactNode;
}

/**
 * Cadre commun aux graphiques zoomables.
 *
 * Le geste est la commande principale — molette, pincement, glisser — donc
 * aucun bouton « zoom ». Ne restent qu'une indication discrète tant que le
 * pilote n'a pas zoomé, puis un retour au tour complet une fois qu'il l'a fait :
 * sans lui, on peut rester coincé dans un virage sans savoir comment en sortir.
 */
export function ChartZoomFrame({
  zoom,
  heightClass = "h-[320px] sm:h-[350px]",
  children,
}: ChartZoomFrameProps) {
  return (
    <div className="relative">
      <div
        ref={zoom.containerRef}
        className={`${heightClass} w-full select-none`}
        // pan-y : le doigt fait toujours défiler la page verticalement, mais le
        // pincement et le déplacement horizontal nous reviennent.
        style={{ touchAction: "pan-y" }}
      >
        {children}
      </div>

      {zoom.isZoomed ? (
        <button
          type="button"
          onClick={zoom.reset}
          className="absolute top-1 right-1 z-10 flex items-center gap-1.5 rounded-md
                     bg-background/85 backdrop-blur px-2 py-1 text-[11px] font-medium
                     text-foreground border border-border hover:bg-muted transition-colors"
          aria-label="Revenir au tour complet"
        >
          <RotateCcw className="w-3 h-3" />
          {zoom.zoomLabel}
        </button>
      ) : (
        <span
          className="pointer-events-none absolute top-1 right-1 z-10 rounded-md
                     bg-background/70 px-2 py-1 text-[10px] text-muted-foreground
                     border border-border/60 hidden sm:block"
        >
          Molette ou pincement pour zoomer
        </span>
      )}
    </div>
  );
}
