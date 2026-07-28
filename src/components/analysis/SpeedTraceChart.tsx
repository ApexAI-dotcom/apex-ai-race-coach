import React, { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceArea,
  Legend,
  Label,
} from "recharts";
import type { SpeedTraceData } from "@/types/analysis";
import { downsample } from "./utils";
import { useChartZoom, sliceToDomain } from "./useChartZoom";
import { ChartZoomFrame } from "./ChartZoomFrame";
import { BlurOverlay } from "../ui/BlurOverlay";
import { useSubscription } from "@/hooks/useSubscription.tsx";
import { useNavigate } from "react-router-dom";
import type { CornerOverlay } from "./cornerOverlays";

interface SpeedTraceChartProps {
  data: SpeedTraceData;
  selectedLaps: number[];
  bestLapNumber?: number;
  variant?: "points" | "line";
  circuitName?: string | null;
  hideCta?: boolean;
  cornerOverlays?: CornerOverlay[];
}

const LAP_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#eab308", "#ec4899", "#06b6d4"];

function buildSeries(
  laps: SpeedTraceData["laps"],
  selectedLapNumbers: number[],
  maxPoints: number,
  domain?: [number, number]
) {
  const selectedLaps = laps.filter((l) => selectedLapNumbers.includes(l.lap_number));
  if (selectedLaps.length === 0) return { series: [], activeLaps: [], bounds: [0, 1] as [number, number] };

  const referenceLap = selectedLaps[0];
  const dist = referenceLap.distance_m;
  const bounds: [number, number] = [dist[0] ?? 0, dist[dist.length - 1] ?? 1];

  // On restreint AVANT de sous-échantillonner : en zoomant sur un virage, le
  // pilote obtient réellement plus de points, pas la même courbe grossie.
  const [i0, i1] = domain ? sliceToDomain(dist, domain) : [0, dist.length - 1];
  const windowDist = dist.slice(i0, i1 + 1);
  const distOut = windowDist.length > maxPoints ? downsample(windowDist, maxPoints) : windowDist;

  const series = distOut.map((d, i) => {
    const point: any = { distance_m: Math.round(d * 10) / 10 };

    selectedLaps.forEach((lap) => {
      // Chaque tour a sa propre grille : on cherche l'échantillon à la même
      // distance plutôt qu'au même rang, sinon les tours se décalent entre eux.
      const n = lap.distance_m.length;
      const frac = (d - bounds[0]) / Math.max(1e-6, bounds[1] - bounds[0]);
      const idx = Math.min(n - 1, Math.max(0, Math.round(frac * (n - 1))));
      point[`speed_lap_${lap.lap_number}`] = Math.round((lap.speed_kmh[idx] ?? 0) * 10) / 10;
    });

    return point;
  });

  return { series, activeLaps: selectedLaps, bounds };
}

function SpeedTraceChartComponent({
  data,
  bestLapNumber,
  selectedLaps,
  variant = "line",
  circuitName = null,
  hideCta = false,
  cornerOverlays = [],
}: SpeedTraceChartProps) {
  const navigate = useNavigate();
  const { isChartVisible, getCtaDetails } = useSubscription();

  const visible = isChartVisible("speed_trace", circuitName);
  const cta = getCtaDetails(circuitName);

  const bounds = useMemo(() => {
    const ref = data.laps.find((l) => selectedLaps.includes(l.lap_number));
    const d = ref?.distance_m ?? [];
    return { min: d[0] ?? 0, max: d[d.length - 1] ?? 1 };
  }, [data.laps, selectedLaps]);

  const zoom = useChartZoom(bounds.min, bounds.max);

  // 100 points sur tout le tour, 220 dès qu'on zoome : la fenêtre est plus
  // courte, on peut donc y mettre plus de détail sans alourdir le rendu.
  const { series, activeLaps } = useMemo(
    () => buildSeries(data.laps, selectedLaps, zoom.isZoomed ? 220 : 100, zoom.domain),
    [data.laps, selectedLaps, zoom.domain, zoom.isZoomed]
  );

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
      {/* Plus de largeur fixe à 800 px : le zoom remplace le défilement
          horizontal, qui obligeait à pousser la courbe du doigt sur téléphone. */}
      <div className="w-full" aria-label="Speed trace by distance">
        <ChartZoomFrame zoom={zoom}>
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
                // Distance affichée depuis le DÉBUT DU TOUR. Les valeurs
                // internes restent absolues : elles servent à positionner les
                // zones de virages. Seul l'affichage est recalé, sinon le
                // pilote lisait « 5 000 m » sur un tour de 1 225 m.
                tickFormatter={(v) => `${Math.round(v - bounds.min)}m`}
              />
              <YAxis
                stroke="hsl(var(--border))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                label={{
                  value: "Vitesse (km/h)",
                  angle: -90,
                  position: "insideLeft",
                  fill: "hsl(var(--muted-foreground))",
                  fontSize: 11,
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  color: "hsl(var(--foreground))",
                }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(value: number, name: string) => [value, name]}
                labelFormatter={(label) => `Distance : ${Math.round(Number(label) - bounds.min)} m`}
              />
              <Legend />

              {activeLaps.map((lap, idx) => {
                const isBest = lap.lap_number === bestLapNumber;
                const color = LAP_COLORS[idx % LAP_COLORS.length];
                return (
                  <Line
                    key={lap.lap_number}
                    type="monotone"
                    dataKey={`speed_lap_${lap.lap_number}`}
                    stroke={color}
                    strokeWidth={isBest ? 3 : 1.5}
                    strokeDasharray={isBest ? "" : "3 3"}
                    dot={false}
                    name={`Tour ${lap.lap_number} ${isBest ? "(Best)" : ""}`}
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

export const SpeedTraceChart = React.memo(SpeedTraceChartComponent);
