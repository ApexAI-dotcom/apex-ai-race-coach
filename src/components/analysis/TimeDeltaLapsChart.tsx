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
} from "recharts";
import { downsample } from "./utils";

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
}

const LAP_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#eab308", "#ec4899", "#06b6d4"];

export function TimeDeltaLapsChart({ data, selectedLaps }: TimeDeltaLapsChartProps) {
  const { series, activeLaps } = useMemo(() => {
    const selectedLapData = data.laps.filter(l => selectedLaps.includes(l.lap_number));
    if (selectedLapData.length === 0) return { series: [], activeLaps: [] };

    // Use best lap distance as reference axis
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
    <div className="h-[260px] w-full" aria-label="Time delta by distance">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          <XAxis
            dataKey="distance_m"
            stroke="#8b949e"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v}m`}
          />
          <YAxis
            stroke="#8b949e"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v.toFixed(1)}s`}
            label={{
              value: "Delta (s)",
              angle: -90,
              position: "insideLeft",
              fill: "#8b949e",
              fontSize: 11,
            }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: 8 }}
            formatter={(value: number, name: string) => [
              `${value > 0 ? "+" : ""}${value.toFixed(3)}s`,
              name,
            ]}
            labelFormatter={(label) => `Position: ${label} m`}
          />
          <Legend />
          <ReferenceLine y={0} stroke="#8b949e" strokeWidth={1.5} strokeDasharray="4 4" />
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
  );
}
