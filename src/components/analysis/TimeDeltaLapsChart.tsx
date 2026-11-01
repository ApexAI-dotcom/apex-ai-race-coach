import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  ReferenceArea,
  Label,
} from "recharts";
import { downsample } from "./utils";
import { useChartZoom, sliceToDomain } from "./useChartZoom";
import { ChartZoomFrame } from "./ChartZoomFrame";
import { BlurOverlay } from "../ui/BlurOverlay";
import { useSubscription } from "@/hooks/useSubscription.tsx";
import { useNavigate } from "react-router-dom";
import type { CornerOverlay } from "./cornerOverlays";

interface TimeDeltaLap {
  lap_number: number;
  distance_m: number[];
  delta_s: number[];
  is_best: boolean;
}

interface TimeDeltaLapsData {
  best_lap_number: number;
  laps: TimeDeltaLap[];
}

interface TimeDeltaLapsChartProps {
  data: TimeDeltaLapsData;
  selectedLaps: number[];
  circuitName?: string | null;
  hideCta?: boolean;
  cornerOverlays?: CornerOverlay[];
}

const LAP_COLORS = ["#3b82f6", "#f97316", "#a855f7", "#eab308", "#ec4899", "#06b6d4"];
const BEST_GREEN = "#22c55e";

/** Longueur parcourue d'un tour (dernier point de distance). */
const lapLength = (l?: TimeDeltaLap) => (l?.distance_m?.length ? l.distance_m[l.distance_m.length - 1] - l.distance_m[0] : 0);

export function TimeDeltaLapsChart({
  data,
  selectedLaps,
  circuitName = null,
  hideCta = false,
  cornerOverlays = [],
}: TimeDeltaLapsChartProps) {
  const navigate = useNavigate();
  const { isChartVisible, getCtaDetails } = useSubscription();
  const visible = isChartVisible("delta_time", circuitName);
  const cta = getCtaDetails(circuitName);

  // Axe des distances : celui du meilleur tour, sauf s'il est tronqué (un tour
  // partiel marqué « meilleur » donnait un axe de 84 m et des deltas de 40 s).
  // On prend alors le tour sélectionné le plus long.
  const refDist = useMemo(() => {
    const sel = data.laps.filter((l) => selectedLaps.includes(l.lap_number));
    const longest = [...sel, ...data.laps].reduce<TimeDeltaLap | undefined>((a, l) => (lapLength(l) > lapLength(a) ? l : a), undefined);
    const best = data.laps.find((l) => l.is_best);
    const ref = best && lapLength(best) >= 0.8 * lapLength(longest) ? best : sel.sort((a, b) => lapLength(b) - lapLength(a))[0] ?? longest;
    return ref?.distance_m ?? [];
  }, [data, selectedLaps]);

  const zoom = useChartZoom(refDist[0] ?? 0, refDist[refDist.length - 1] ?? 1);

  const { series, activeLaps } = useMemo(() => {
    // Les tours tronqués (moins de 80 % du tour de référence) faussent le delta : écartés.
    const refLen = refDist.length ? refDist[refDist.length - 1] - refDist[0] : 0;
    const selectedLapData = data.laps.filter(
      (l) => selectedLaps.includes(l.lap_number) && (!refLen || lapLength(l) >= 0.8 * refLen)
    );
    if (selectedLapData.length === 0 || refDist.length === 0) {
      return { series: [], activeLaps: [] };
    }

    // Fenêtre d'abord, sous-échantillonnage ensuite : zoomer sur un virage doit
    // révéler du détail, pas agrandir les mêmes points.
    const span: [number, number] = [refDist[0], refDist[refDist.length - 1]];
    const [i0, i1] = sliceToDomain(refDist, zoom.domain);
    const windowDist = refDist.slice(i0, i1 + 1);
    const maxPoints = zoom.isZoomed ? 240 : 120;
    const distOut = windowDist.length > maxPoints ? downsample(windowDist, maxPoints) : windowDist;

    const series = distOut.map((d) => {
      const point: Record<string, number> = { distance_m: Math.round(d * 10) / 10 };

      selectedLapData.forEach((lap) => {
        // Repérage par DISTANCE et non par rang : les tours n'ont pas tous le
        // même nombre d'échantillons, un index commun les décalerait.
        const n = lap.distance_m.length;
        const frac = (d - span[0]) / Math.max(1e-6, span[1] - span[0]);
        const idx = Math.min(n - 1, Math.max(0, Math.round(frac * (n - 1))));
        point[`delta_lap_${lap.lap_number}`] = Math.round((lap.delta_s[idx] ?? 0) * 1000) / 1000;
      });

      return point;
    });

    return { series, activeLaps: selectedLapData };
  }, [data, selectedLaps, refDist, zoom.domain, zoom.isZoomed]);

  if (series.length === 0) return null;

  return (
    <BlurOverlay
      isLocked={!visible}
      ctaTitle={cta.title}
      ctaButtonText={cta.buttonText}
      onCtaClick={() =>
        navigate(cta.buttonText.includes("compte") ? "/login?mode=register" : "/pricing")
      }
      hideButton={hideCta}
    >
      <div className="w-full" aria-label="Time delta by distance">
        <ChartZoomFrame zoom={zoom} heightClass="h-[280px] sm:h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 20, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              {cornerOverlays.map((corner) => {
                return (
                  <ReferenceArea
                    key={corner.id}
                    x1={corner.x1}
                    x2={corner.x2}
                    fill="#f97316"
                    fillOpacity={0.15}
                    ifOverflow="visible"
                  >
                    <Label
                      value={corner.label}
                      position="insideTop"
                      fill="#f97316"
                      fontSize={11}
                      fontWeight="bold"
                      opacity={1}
                    />
                  </ReferenceArea>
                );
              })}
              <XAxis
                type="number"
                dataKey="distance_m"
                stroke="hsl(var(--border))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                domain={zoom.domain}
                allowDataOverflow
                tickFormatter={(v) => `${Math.round(v)}m`}
              />
              <YAxis
                stroke="hsl(var(--border))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(v) => `${v.toFixed(1)}s`}
                label={{
                  value: "Delta (s)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                }}
              />
              <Tooltip isAnimationActive={false}
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  color: "hsl(var(--foreground))",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(value: number, name: string) => [
                  `${value > 0 ? "+" : ""}${value.toFixed(3)}s`,
                  name,
                ]}
                labelFormatter={(label) => `Position: ${label} m`}
              />
              <Legend />
              {/* Zéro = le meilleur tour : la référence, en vert. */}
              <ReferenceLine y={0} stroke={BEST_GREEN} strokeWidth={2}>
                <Label value={`Meilleur tour (T${data.best_lap_number})`} position="insideBottomRight" fill={BEST_GREEN} fontSize={11} />
              </ReferenceLine>
              {activeLaps.map((lap, idx) => {
                const color = lap.is_best ? BEST_GREEN : LAP_COLORS[idx % LAP_COLORS.length];
                return (
                  <Line
                    key={lap.lap_number}
                    type="monotone"
                    dataKey={`delta_lap_${lap.lap_number}`}
                    stroke={color}
                    strokeWidth={lap.is_best ? 2 : 1.5}
                    dot={false}
                    name={`T${lap.lap_number}${lap.is_best ? " (Meilleur)" : ""}`}
                    animationDuration={300}
                  />
                );
              })}
            </LineChart>
          </ResponsiveContainer>
        </ChartZoomFrame>
      </div>
    </BlurOverlay>
  );
}
