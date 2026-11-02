import { useRef, useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type {
  TrajectoryCorner,
  TrajectoryLap,
  CornerMargin,
  TrackEdges,
  RacingLineMeta,
  IdealLap,
  TrackMapProfile,
} from "@/types/analysis";
import { useTrackMap } from "./useTrackMapData";
import { TrackMapProfiles } from "./TrackMapProfiles";
import { TrackMapCanvas } from "./TrackMapCanvas";
import {
  cumulativeFractions,
  getAnalysisCursor,
  indexAtFraction,
  setAnalysisCursor,
  useAnalysisCursor,
} from "../analysisCursor";
import { TrackMapLegend } from "./TrackMapLegend";
import { TrackMapTooltip } from "./TrackMapTooltip";
import { TrackMapCornerPanel } from "./TrackMapCornerPanel";
import { TrackMapFullscreen } from "./TrackMapFullscreen";

const noop = () => {};

interface TrackMapProProps {
  corners: TrajectoryCorner[];
  laps?: TrajectoryLap[];
  margins?: CornerMargin[];
  cornerAnalysis?: unknown[];
  bestLapNumber: number;
  selectedLapNumbers?: number[];
  onReferenceChange?: (lapNumber: number | null, isSynthetic: boolean) => void;
  /** Vue active de la carte, remontée au parent (vitesse / freinage / …). */
  onProfileSelect?: (profile: TrackMapProfile) => void;
  /** Bords de piste estimés (ruban à l'échelle réelle). */
  trackEdges?: TrackEdges | null;
  /** Métadonnées du Tour Parfait IA. */
  racingLineMeta?: RacingLineMeta | null;
  /** Tour idéal mesuré (mini-secteurs + gain potentiel). */
  idealLap?: IdealLap | null;
  /** Virage à mettre en avant (clic sur un conseil de coaching). */
  focusCorner?: { id: number; token: number } | null;
  /** Vues proposées (aperçu de l'accueil) ; absent = toutes. */
  profiles?: TrackMapProfile[];
  /** Aperçu fixe (accueil) : pas de zoom, de plein écran ni de détail de virage. */
  readOnly?: boolean;
  /** Vue d'ouverture (comparaison de deux séances : « compare »). */
  initialProfile?: TrackMapProfile;
  /** Tour de référence affiché d'emblée en vue « compare ». */
  initialComparisonLap?: number | null;
}

type MapChannel = "speed" | "rpm" | "lateral_g";
const CHANNELS: { id: MapChannel; label: string; unit: string }[] = [
  { id: "speed", label: "Vitesse", unit: "km/h" },
  { id: "rpm", label: "Régime", unit: "tr/min" },
  { id: "lateral_g", label: "G latéral", unit: "g" },
];

export function TrackMapPro({
  corners,
  laps = [],
  margins = [],
  cornerAnalysis = [],
  bestLapNumber,
  selectedLapNumbers = [],
  onReferenceChange,
  onProfileSelect,
  trackEdges = null,
  racingLineMeta = null,
  idealLap = null,
  focusCorner = null,
  profiles,
  readOnly = false,
  initialProfile,
  initialComparisonLap = null,
}: TrackMapProProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  /*
   * Vue Vitesse : la trace peut aussi être colorée par le régime ou par
   * l'accélération latérale, comme la carte de Race Studio. On remplace
   * simplement la série qui sert à colorer ; le reste (phases, virages,
   * infobulle, qui relit le tour d'origine) ne change pas.
   */
  const [channel, setChannel] = useState<MapChannel>("speed");
  const channels = useMemo(() => {
    const has = (k: "rpm" | "lateral_g") => laps.some((l) => !l.is_synthetic && (l[k]?.some((v) => Number.isFinite(v) && v !== 0) ?? false));
    return CHANNELS.filter((c) => c.id === "speed" || has(c.id));
  }, [laps]);
  const colorLaps = useMemo(() => {
    if (channel === "speed") return laps;
    return laps.map((l) => {
      const src = l[channel];
      if (!src?.length) return l;
      // G latéral en centièmes : l'échelle de couleur écarte les valeurs sous 10.
      return { ...l, speed_kmh: channel === "lateral_g" ? src.map((v) => Math.abs(v) * 100) : src };
    });
  }, [laps, channel]);

  // Use the new custom hook acting as a controller
  const { state, handlers, data } = useTrackMap(
    corners,
    colorLaps,
    margins,
    cornerAnalysis,
    selectedLapNumbers[0] ?? bestLapNumber,
    trackEdges,
    idealLap,
    initialProfile,
    initialComparisonLap
  );

  // Proxy the `onReferenceChange` for the UI Profiles
  const onProfileChange = (p: any) => {
    handlers.handleProfileChange(p, onReferenceChange);
    if (p !== "speed") setChannel("speed");
    // Le parent en a besoin pour n'afficher le détail des freinages que sur la
    // vue concernée : ce panneau est long, il encombrerait les autres vues.
    onProfileSelect?.(p);
  };
  const onCompareChange = (lap: number | null) => {
    state.setComparisonLap(lap);
    if (onReferenceChange) onReferenceChange(lap, lap === -1);
  };

  // ── Curseur commun avec les graphiques ──
  const cursor = useAnalysisCursor();
  const primaryPoints = data?.primary?.points;
  const fracs = useMemo(() => (primaryPoints ? cumulativeFractions(primaryPoints) : []), [primaryPoints]);
  const chartIndex =
    cursor?.source === "chart" && fracs.length > 1 && state.profile !== "sectors" ? indexAtFraction(fracs, cursor.frac) : null;
  const handleMapHover = (index: number | null, clientX: number, clientY: number) => {
    handlers.handlePointHover(index, clientX, clientY);
    if (index !== null && fracs.length > 1) setAnalysisCursor({ frac: fracs[Math.min(index, fracs.length - 1)], source: "map" });
    else if (getAnalysisCursor()?.source === "map") setAnalysisCursor(null);
  };
  // Valeurs lues au curseur venu des graphiques : vitesse, régime, eau.
  const readout = (() => {
    if (chartIndex === null || !data?.primary) return null;
    const lap = laps.find((l) => l.lap_number === data.primary!.lap.lap_number && !l.is_synthetic) ?? data.primary.lap;
    const v = (arr?: (number | null)[]) => {
      const x = arr?.[chartIndex];
      return typeof x === "number" && Number.isFinite(x) ? x : null;
    };
    return { speed: v(lap.speed_kmh), rpm: v(lap.rpm), water: v(lap.water_temp) };
  })();

  // ── Tooltip data ──
  const tooltipData = (() => {
    if (!state.hoveredPoint || !data || !data.primary) return null;
    const { index } = state.hoveredPoint;
    // Tour d'origine : la série de couleur a pu remplacer la vitesse.
    const lap = laps.find((l) => l.lap_number === data.primary!.lap.lap_number && !l.is_synthetic) ?? data.primary.lap;
    return {
      speed: lap.speed_kmh?.[index],
      throttle: lap.throttle_pct?.[index],
      brake: lap.brake_pct?.[index],
      rpm: lap.rpm?.[index],
      lateralG: lap.lateral_g?.[index],
    };
  })();

  const tooltipPos = (() => {
    if (!state.hoveredPoint || !containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: state.hoveredPoint.clientX - rect.left,
      y: state.hoveredPoint.clientY - rect.top,
    };
  })();

  const selectedCorner =
    state.selectedCornerId !== null && data
      ? (data.cornerDetails.find((c) => c.id === state.selectedCornerId) ?? null)
      : null;

  const sectorsAvailable = !!data?.sectorSegments?.length;

  const comparisonLabel = (() => {
    if (!data?.reference) return undefined;
    if (data.reference.isSynthetic) return "Modèle ApexAI — ligne calculée";
    const rLap = data.reference.lap;
    return rLap.label ?? `Tour ${rLap.lap_number}${rLap.is_best ? " (meilleur)" : ""}`;
  })();

  // Apply Fullscreen correctly using a strict Portal-ready structure (handled in a parent div wrapping this or strictly by CSS)
  // Instead of hacky class additions, we apply inline-level classes cleanly.
  useEffect(() => {
    if (state.isFullscreen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
  }, [state.isFullscreen]);

  // Un conseil vient d'être cliqué : on ouvre le virage concerné et on bascule
  // sur les mini-secteurs, la vue où le temps perdu se lit directement.
  // Le `token` permet de rejouer l'effet même si on reclique le même virage.
  const setSelectedCornerId = state.setSelectedCornerId;
  const setProfile = state.setProfile;
  useEffect(() => {
    if (!focusCorner) return;
    setSelectedCornerId(focusCorner.id);
    if (sectorsAvailable) setProfile("sectors");
    containerRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusCorner?.token]);

  if (!data?.primary && corners.length === 0) return null;

  const content = (
    <div
      ref={containerRef}
      className={`trackmap-pro w-full ${state.isFullscreen ? "fixed inset-0 z-[9999] bg-background flex flex-col p-4 pt-[calc(1rem+var(--safe-top))] pb-[calc(1rem+var(--safe-bottom))] m-0 max-w-none" : "relative rounded-xl overflow-hidden"}`}
    >
      {/* Bandeau Tour Parfait IA : l'objectif chiffré, immédiatement lisible.
          Tous les chronos sont mesurés sur les tours réellement exploitables. */}
      {idealLap?.available && (idealLap.potential_gain_s ?? 0) > 0 && (
        <div className="mx-3 mt-3 rounded-xl border border-yellow-500/25 bg-yellow-500/[0.06] px-3.5 py-2.5">
          <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
            <span className="text-[11px] font-bold uppercase tracking-wider text-yellow-400">
              Tour Parfait IA
            </span>
            <span className="text-xs text-muted-foreground">
              Meilleur tour{" "}
              <b className="text-foreground tabular-nums">
                {idealLap.best_real_lap_time_s?.toFixed(2)}s
              </b>
              {idealLap.best_lap_number != null && (
                <span className="text-muted-foreground"> (tour {idealLap.best_lap_number})</span>
              )}
            </span>
            <span className="text-xs text-muted-foreground">
              Tour idéal{" "}
              <b className="text-foreground tabular-nums">
                {idealLap.ideal_lap_time_s?.toFixed(2)}s
              </b>
            </span>
            <span className="text-xs">
              <span className="text-muted-foreground">À aller chercher </span>
              <b className="text-emerald-400 tabular-nums">
                −{idealLap.potential_gain_s?.toFixed(2)}s
              </b>
            </span>
          </div>
          <p className="mt-1 text-[10px] leading-snug text-muted-foreground">
            En enchaînant tes meilleurs mini-secteurs
            {idealLap.laps_used?.length
              ? ` (mesuré sur tes tours ${idealLap.laps_used.join(", ")})`
              : ""}
            . Tu l'as déjà fait — mais pas dans le même tour.
            {racingLineMeta?.corners_total != null &&
              racingLineMeta.corners_preserved === racingLineMeta.corners_total &&
              " La trajectoire jaune reste dans les limites de piste et ne raccourcit aucun virage."}
          </p>
        </div>
      )}

      <div className="p-3 pb-0 shrink-0">
        <TrackMapProfiles
          active={state.profile}
          onChange={onProfileChange}
          laps={laps}
          syntheticAvailable={!!data?.syntheticLap}
          selectedLapNumber={state.selectedLap}
          comparisonLapNumber={state.comparisonLap}
          onSelectedLapChange={state.setSelectedLap}
          onComparisonLapChange={onCompareChange}
          bestLapNumber={bestLapNumber}
          sectorsAvailable={!!data?.sectorSegments?.length}
          only={profiles}
        />
        {state.profile === "speed" && channels.length > 1 && (
          <div className="mt-2 flex items-center gap-1.5 px-1" role="radiogroup" aria-label="Colorer la trace par">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Couleur</span>
            {channels.map((c) => (
              <button
                key={c.id}
                type="button"
                role="radio"
                aria-checked={channel === c.id}
                onClick={() => setChannel(c.id)}
                className={`rounded-md border px-2 py-1 text-[11px] font-medium transition-colors ${
                  channel === c.id
                    ? "border-primary/50 bg-primary/15 text-foreground"
                    : "border-white/10 text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div
        className={`relative px-1 pt-2 ${state.isFullscreen ? "flex-1 w-full min-h-0 flex flex-col" : ""}`}
      >
        {data?.syntheticProjection && (
          <div className="absolute top-4 left-4 z-10">
            <button
              onClick={() => state.setShowSynthetic(!state.showSynthetic)}
              className={`flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1.5 rounded-md transition-all shadow-md backdrop-blur-sm ${
                state.showSynthetic
                  ? "bg-yellow-500/90 text-yellow-950 border border-yellow-500"
                  : "bg-black/60 text-yellow-400 hover:bg-black/80 border border-yellow-500/30"
              }`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 14 4-4" />
                <path d="M3.34 19a10 10 0 1 1 17.32 0" />
              </svg>
              {state.showSynthetic ? "MASQUER TOUR IA" : "AFFICHER TOUR IA"}
            </button>
          </div>
        )}

        {data && (
          <TrackMapCanvas
            primary={data.primary}
            reference={data.reference}
            syntheticProjection={data.syntheticProjection}
            showSynthetic={state.showSynthetic}
            corners={data.corners}
            profile={state.profile}
            hoveredIndex={state.hoveredPoint?.index ?? chartIndex}
            hoveredCornerId={state.hoveredCornerId}
            onPointHover={handleMapHover}
            onCornerClick={readOnly ? noop : handlers.handleCornerClick}
            onCornerHover={state.setHoveredCornerId}
            isFullscreen={state.isFullscreen}
            trackRibbonPath={data.trackRibbonPath}
            trackWidthM={racingLineMeta?.track_width_m}
            sectorSegments={data.sectorSegments}
            brakingZones={data.brakingZones}
            readOnly={readOnly}
          />
        )}

        {readout && !state.hoveredPoint && (
          <div className="pointer-events-none absolute bottom-3 left-3 z-10 flex gap-3 rounded-lg border border-white/10 bg-black/70 px-2.5 py-1.5 text-[11px] tabular-nums text-foreground backdrop-blur">
            {readout.speed !== null && <span>{Math.round(readout.speed)} km/h</span>}
            {readout.rpm !== null && <span>{Math.round(readout.rpm).toLocaleString("fr-FR")} tr/min</span>}
            {readout.water !== null && <span>Eau {readout.water.toFixed(1).replace(".", ",")} °C</span>}
          </div>
        )}

        <TrackMapTooltip
          visible={!!state.hoveredPoint && !!tooltipData}
          x={tooltipPos.x}
          y={tooltipPos.y}
          speed={tooltipData?.speed}
          throttle={tooltipData?.throttle}
          brake={tooltipData?.brake}
          rpm={tooltipData?.rpm}
          lateralG={tooltipData?.lateralG}
          containerRef={containerRef}
        />

        <TrackMapCornerPanel
          corner={selectedCorner}
          onClose={() => state.setSelectedCornerId(null)}
        />

        {!readOnly && (
          <TrackMapFullscreen
            isFullscreen={state.isFullscreen}
            toggle={() => state.setIsFullscreen(!state.isFullscreen)}
          />
        )}
      </div>

      <div className="px-3 pb-2 shrink-0">
        <TrackMapLegend
          profile={state.profile}
          unit={state.profile === "speed" ? CHANNELS.find((c) => c.id === channel)?.unit : undefined}
          decimals={state.profile === "speed" && channel === "lateral_g" ? 1 : 0}
          speedMin={(data?.globalSpeedMin ?? 0) / (state.profile === "speed" && channel === "lateral_g" ? 100 : 1)}
          speedMax={(data?.globalSpeedMax ?? 100) / (state.profile === "speed" && channel === "lateral_g" ? 100 : 1)}
          hasModel={data?.reference?.isSynthetic ?? false}
          comparisonLabel={comparisonLabel}
          primaryLabel={data?.primary?.lap?.label}
          showSynthetic={state.showSynthetic}
          trackWidthM={racingLineMeta?.track_width_m}
          trackWidthSource={racingLineMeta?.track_width_source}
          hasRibbon={!!data?.trackRibbonPath}
          hasBrakingPoints={!!data?.brakingZones?.length}
          compact={readOnly}
        />
      </div>
    </div>
  );

  if (state.isFullscreen && typeof document !== "undefined") {
    return createPortal(content, document.body);
  }

  return content;
}
