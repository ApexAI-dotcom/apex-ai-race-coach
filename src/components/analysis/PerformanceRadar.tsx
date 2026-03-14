import { useMemo } from "react";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { RadarData } from "@/types/analysis";

interface PerformanceRadarProps {
  data: RadarData;
}

export function PerformanceRadar({ data }: PerformanceRadarProps) {
  const chartData = useMemo(() => {
    return (data.axes ?? []).map((name, i) => {
      const value = data.values?.[i] ?? 0;
      const max = data.max_values?.[i] ?? 100;
      const pct = max > 0 ? Math.round((value / max) * 100) : 0;
      return {
        subject: name,
        value: Math.min(100, pct),
        fullMark: 100,
        raw: value,
        max,
      };
    });
  }, [data.axes, data.values, data.max_values]);

  if (chartData.length === 0) return null;

  return (
    <div className="h-[260px] w-full" aria-label="Performance radar">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} margin={{ top: 16, right: 16, left: 16, bottom: 16 }}>
          <PolarGrid stroke="#30363d" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: "#8b949e", fontSize: 11 }} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: "#8b949e", fontSize: 10 }}
          />
          <Radar
            name="Score"
            dataKey="value"
            stroke="#f97316"
            fill="#f97316"
            fillOpacity={0.4}
            strokeWidth={1.5}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
            formatter={(value: number, _name: string, props: { payload: { raw?: number; max?: number } }) => [
              `${value}%${props.payload?.raw != null && props.payload?.max != null ? ` (${props.payload.raw.toFixed(1)} / ${props.payload.max})` : ""}`,
              "",
            ]}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
