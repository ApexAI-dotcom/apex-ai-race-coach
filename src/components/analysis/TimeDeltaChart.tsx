import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import type { TimeDeltaData } from "@/types/analysis";
import { downsamplePair } from "./utils";

interface TimeDeltaChartProps {
  data: TimeDeltaData;
}

export function TimeDeltaChart({ data }: TimeDeltaChartProps) {
  const series = useMemo(() => {
    const { a: dist, b: delta } = downsamplePair(data.distance_m, data.delta_s, 100);
    return dist.map((d, i) => ({
      distance_m: Math.round(d * 10) / 10,
      delta_s: Math.round((delta[i] ?? 0) * 1000) / 1000,
    }));
  }, [data.distance_m, data.delta_s]);

  if (series.length === 0) return null;

  return (
    <div className="h-[240px] w-full" aria-label="Time delta by distance">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          <ReferenceLine y={0} stroke="#8b949e" strokeDasharray="2 2" />
          <XAxis
            dataKey="distance_m"
            stroke="#e6edf3"
            tick={{ fill: "#e6edf3", fontSize: 11, opacity: 0.8 }}
            tickFormatter={(v) => `${v}m`}
          />
          <YAxis
            stroke="#e6edf3"
            tick={{ fill: "#e6edf3", fontSize: 11, opacity: 0.8 }}
            tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v}s`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#161b22", border: "1px solid #30363d", borderRadius: 8 }}
            itemStyle={{ color: "#ffffff" }}
            labelStyle={{ color: "#e6edf3" }}
            formatter={(value: number) => [
              `${value >= 0 ? "+" : ""}${value.toFixed(3)} s`,
              "Delta",
            ]}
            labelFormatter={(label) => `Distance: ${label} m`}
          />
          <Area
            type="monotone"
            dataKey="delta_s"
            stroke="#f97316"
            fill="#f9731640"
            strokeWidth={1.5}
            name="Delta"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
