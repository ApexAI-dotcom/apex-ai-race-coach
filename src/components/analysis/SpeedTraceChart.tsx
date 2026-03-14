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
}

function buildSeries(
  laps: SpeedTraceData["laps"],
  sectors: SpeedTraceData["sectors"],
  maxPoints: number
) {
  const mainLap = laps.find((l) => l.is_reference) ?? laps[0];
  const refLap = laps.find((l) => !l.is_reference && l !== mainLap) ?? laps[1];
  if (!mainLap) return { series: [], sectors };

  const dist = mainLap.distance_m;
  const speed = mainLap.speed_kmh;
  const len = Math.min(dist.length, speed.length);
  const needDownsample = len > maxPoints;
  const distOut = needDownsample ? downsample(dist.slice(0, len), maxPoints) : dist.slice(0, len);
  const speedOut = needDownsample ? downsample(speed.slice(0, len), maxPoints) : speed.slice(0, len);

  const series: { distance_m: number; speed_kmh: number; ref_kmh?: number }[] = distOut.map(
    (d, i) => ({
      distance_m: Math.round(d * 10) / 10,
      speed_kmh: Math.round((speedOut[i] ?? 0) * 10) / 10,
      ref_kmh:
        refLap && refLap.distance_m.length > 0
          ? (() => {
              const j = Math.min(
                Math.round((i / (distOut.length - 1 || 1)) * (refLap.distance_m.length - 1)),
                refLap.distance_m.length - 1
              );
              return Math.round((refLap.speed_kmh[j] ?? 0) * 10) / 10;
            })()
          : undefined,
    })
  );

  return { series, sectors };
}

export function SpeedTraceChart({ data }: SpeedTraceChartProps) {
  const { series, sectors } = useMemo(
    () => buildSeries(data.laps, data.sectors ?? [], 100),
    [data.laps, data.sectors]
  );

  if (series.length === 0) return null;

  return (
    <div className="h-[280px] w-full" aria-label="Speed trace by distance">
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
            type="number"
            stroke="#8b949e"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v}m`}
          />
          <YAxis
            stroke="#8b949e"
            tick={{ fontSize: 11 }}
            tickFormatter={(v) => `${v}`}
            label={{ value: "km/h", angle: -90, position: "insideLeft", fill: "#8b949e" }}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
            labelStyle={{ color: "#e6edf3" }}
            formatter={(value: number) => [value, "km/h"]}
            labelFormatter={(label) => `Distance: ${label} m`}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="speed_kmh"
            stroke="#f97316"
            strokeWidth={2}
            dot={false}
            name="Tour"
          />
          {series[0]?.ref_kmh != null && (
            <Line
              type="monotone"
              dataKey="ref_kmh"
              stroke="#3b82f6"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={false}
              name="Référence"
            />
          )}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
