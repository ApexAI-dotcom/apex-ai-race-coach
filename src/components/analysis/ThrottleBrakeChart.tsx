import { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ThrottleBrakeLap } from "@/types/analysis";
import { downsample } from "./utils";

interface ThrottleBrakeChartProps {
  data: ThrottleBrakeLap;
}

export function ThrottleBrakeChart({ data }: ThrottleBrakeChartProps) {
  const series = useMemo(() => {
    const len = Math.min(
      data.distance_m.length,
      data.throttle_pct.length,
      data.brake_pct.length
    );
    const dist = downsample(data.distance_m.slice(0, len), 100);
    const throttle = downsample(data.throttle_pct.slice(0, len), 100);
    const brake = downsample(data.brake_pct.slice(0, len), 100);
    return dist.map((d, i) => ({
      distance_m: Math.round(d * 10) / 10,
      throttle_pct: Math.round((throttle[i] ?? 0) * 10) / 10,
      brake_pct: Math.round((brake[i] ?? 0) * 10) / 10,
    }));
  }, [data]);

  if (series.length === 0) return null;

  return (
    <div className="h-[240px] w-full" aria-label="Throttle and brake by distance">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
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
            domain={[0, 100]}
            tickFormatter={(v) => `${v}%`}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
            formatter={(value: number) => [`${value}%`, ""]}
            labelFormatter={(label) => `Position: ${label} m`}
          />
          <Area
            type="monotone"
            dataKey="throttle_pct"
            stroke="#22c55e"
            fill="#22c55e40"
            strokeWidth={1.5}
            name="Throttle"
          />
          <Area
            type="monotone"
            dataKey="brake_pct"
            stroke="#ef4444"
            fill="#ef444440"
            strokeWidth={1.5}
            name="Brake"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
