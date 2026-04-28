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

const LAP_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#eab308", "#ec4899", "#06b6d4"];

export function TimeDeltaLapsChart({ data, selectedLaps, circuitName = null, hideCta = false, cornerOverlays = [] }: TimeDeltaLapsChartProps) {
  const navigate = useNavigate();
  const { isChartVisible, getCtaDetails } = useSubscription();
  const visible = isChartVisible("delta_time", circuitName);
  const cta = getCtaDetails(circuitName);

  const { series, activeLaps } = useMemo(() => {
    const selectedLapData = data.laps.filter(l => selectedLaps.includes(l.lap_number));
    if (selectedLapData.length === 0) return { series: [], activeLaps: [] };

    const bestLap = data.laps.find(l => l.is_best);
    const refDist = bestLap ? bestLap.distance_m : selectedLapData[0].distance_m;
    const distOut = downsample(refDist, 120);

    const series = distOut.map((d, i) => {
      const point: Record<string, number> = { distance_m: Math.round(d * 10) / 10 };

      selectedLapData.forEach(lap => {
        const idx = Math.min(
          Math.round((i / (distOut.length - 1 || 1)) * (lap.distance_m.length - 1)),
          lap.distance_m.length - 1
        );
        point[`delta_lap_${lap.lap_number}`] = Math.round((lap.delta_s[idx] ?? 0) * 1000) / 1000;
      });

      return point;
    });

    return { series, activeLaps: selectedLapData };
  }, [data, selectedLaps]);

  if (series.length === 0) return null;

  return (
    <BlurOverlay
      isLocked={!visible}
      ctaTitle={cta.title}
      ctaButtonText={cta.buttonText}
      onCtaClick={() => navigate(cta.buttonText.includes("compte") ? "/login?mode=register" : "/pricing")}
      hideButton={hideCta}
    >
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="h-[280px] sm:h-[300px] w-[800px] md:w-full" aria-label="Time delta by distance">
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
                  <Label value={corner.label} position="insideTop" fill="#f97316" fontSize={11} fontWeight="bold" opacity={1} />
                </ReferenceArea>
              );
            })}
            <XAxis
              type="number"
              dataKey="distance_m"
              stroke="hsl(var(--border))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              domain={["dataMin", "dataMax"]}
              tickFormatter={(v) => `${v}m`}
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
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              formatter={(value: number, name: string) => [
                `${value > 0 ? "+" : ""}${value.toFixed(3)}s`,
                name,
              ]}
              labelFormatter={(label) => `Position: ${label} m`}
            />
            <Legend />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeWidth={1.5} strokeDasharray="4 4" />
            {activeLaps.map((lap, idx) => {
              const color = lap.is_best ? "#22c55e" : LAP_COLORS[idx % LAP_COLORS.length];
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
      </div>
      </div>
    </BlurOverlay>
  );
}
