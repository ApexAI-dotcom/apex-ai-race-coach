import { useMemo } from "react";
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
  sectors: SpeedTraceData["sectors"],
  selectedLapNumbers: number[],
  maxPoints: number
) {
  const selectedLaps = laps.filter(l => selectedLapNumbers.includes(l.lap_number));
  if (selectedLaps.length === 0) return { series: [], sectors, activeLaps: [] };

  const referenceLap = selectedLaps[0];
  const dist = referenceLap.distance_m;
  const len = dist.length;
  
  const needDownsample = len > maxPoints;
  const distOut = needDownsample ? downsample(dist, maxPoints) : dist;

  const series = distOut.map((d, i) => {
    const point: any = { distance_m: Math.round(d * 10) / 10 };
    
    selectedLaps.forEach(lap => {
      const idx = Math.min(
        Math.round((i / (distOut.length - 1 || 1)) * (lap.distance_m.length - 1)),
        lap.distance_m.length - 1
      );
      point[`speed_lap_${lap.lap_number}`] = Math.round((lap.speed_kmh[idx] ?? 0) * 10) / 10;
    });
    
    return point;
  });

  return { series, sectors, activeLaps: selectedLaps };
}

export function SpeedTraceChart({
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

  const { series, sectors, activeLaps } = useMemo(
    () => buildSeries(data.laps, data.sectors ?? [], selectedLaps, 100),
    [data.laps, data.sectors, selectedLaps]
  );

  if (series.length === 0) return null;

  const lapStart = series[0]?.distance_m ?? 0;

  return (
    <BlurOverlay
      isLocked={!visible}
      ctaTitle={cta.title}
      ctaButtonText={cta.buttonText}
      onCtaClick={() => navigate(cta.buttonText.includes("compte") ? "/login?mode=register" : "/pricing")}
      hideButton={hideCta}
    >
      <div className="w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
        <div className="h-[320px] sm:h-[350px] w-[800px] md:w-full" aria-label="Speed trace by distance">
          <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={series}
            margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            {sectors?.map((s, i) => (
              <ReferenceArea
                key={s.name}
                x1={lapStart + s.start_m}
                x2={lapStart + s.end_m}
                fill={i === 0 ? "#3b82f6" : i === 1 ? "#22c55e" : "#f97316"}
                fillOpacity={0.1}
                ifOverflow="hidden"
              />
            ))}
            {cornerOverlays.map((corner) => {
              return (
                <ReferenceArea 
                  key={corner.id}
                  x1={corner.x1}
                  x2={corner.x2}
                  fill="#f97316" 
                  fillOpacity={0.15}
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
              tickFormatter={(v) => `${v}m`}
              domain={["dataMin", "dataMax"]}
            />
            <YAxis
              stroke="hsl(var(--border))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickFormatter={(v) => `${v}`}
              label={{ value: "km/h", angle: -90, position: "insideLeft", fill: "hsl(var(--muted-foreground))" }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", color: "hsl(var(--foreground))", borderRadius: "8px" }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              formatter={(value: number, name: string) => [value, name]}
              labelFormatter={(label) => `Distance: ${label} m`}
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
      </div>
      </div>
    </BlurOverlay>
  );
}
