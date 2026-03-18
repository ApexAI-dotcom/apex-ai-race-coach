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
} from "recharts";
import type { SpeedTraceData } from "@/types/analysis";
import { downsample, downsamplePair } from "./utils";

interface SpeedTraceChartProps {
  data: SpeedTraceData;
  selectedLaps: number[];
  bestLapNumber?: number;
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

  // Use the first selected lap as the distance reference
  const referenceLap = selectedLaps[0];
  const dist = referenceLap.distance_m;
  const len = dist.length;
  
  const needDownsample = len > maxPoints;
  const distOut = needDownsample ? downsample(dist, maxPoints) : dist;

  const series = distOut.map((d, i) => {
    const point: any = { distance_m: Math.round(d * 10) / 10 };
    
    selectedLaps.forEach(lap => {
      // Linear interpolation or simple nearest neighbor for speed
      // Since distance arrays might differ slightly in length/sampling
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

export function SpeedTraceChart({ data, selectedLaps, bestLapNumber }: SpeedTraceChartProps) {
  const { series, sectors, activeLaps } = useMemo(
    () => buildSeries(data.laps, data.sectors ?? [], selectedLaps, 100),
    [data.laps, data.sectors, selectedLaps]
  );

  if (series.length === 0) return null;

  return (
    <div className="h-[320px] w-full" aria-label="Speed trace by distance">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={series}
          margin={{ top: 8, right: 8, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          {sectors?.map((s, i) => (
            <ReferenceArea
              key={s.name}
              x1={s.start_m}
              x2={s.end_m}
              fill={i === 0 ? "#3b82f620" : i === 1 ? "#22c55e20" : "#f9731620"}
              fillOpacity={0.4}
            />
          ))}
          <XAxis
            dataKey="distance_m"
            stroke="#e6edf3"
            tick={{ fill: "#e6edf3", fontSize: 11, opacity: 0.8 }}
            tickFormatter={(v) => `${v}m`}
            domain={["dataMin", "dataMax"]}
          />
          <YAxis
            stroke="#e6edf3"
            tick={{ fill: "#e6edf3", fontSize: 11, opacity: 0.8 }}
            tickFormatter={(v) => `${v}`}
            label={{ value: "km/h", angle: -90, position: "insideLeft", fill: "#e6edf3", opacity: 0.8 }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#161b22", border: "1px solid #30363d", color: "#ffffff" }}
            itemStyle={{ color: "#ffffff" }}
            labelStyle={{ color: "#e6edf3" }}
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
  );
}
