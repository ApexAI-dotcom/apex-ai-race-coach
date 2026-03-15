import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { CornerMargin } from "@/types/analysis";
import { STATUS_COLORS } from "./utils";

function statusFromMargin(margin_kmh: number): "optimal" | "good" | "warning" {
  if (margin_kmh <= 0.5) return "optimal";
  if (margin_kmh <= 3) return "good";
  return "warning";
}

interface ApexMarginChartProps {
  data: CornerMargin[];
}

export function ApexMarginChart({ data }: ApexMarginChartProps) {
  const series = data.map((c) => {
    const status = c.status ?? statusFromMargin(c.margin_kmh ?? 0);
    const fill = STATUS_COLORS[status] ?? "#8b949e";
    return {
      label: c.label,
      margin_kmh: Math.round((c.margin_kmh ?? 0) * 10) / 10,
      status,
      fill,
      apex_speed_real: c.apex_speed_real,
      apex_speed_optimal: c.apex_speed_optimal,
      grade: c.grade,
      score: c.score,
    };
  });

  if (series.length === 0) return null;

  return (
    <div className="h-[260px] w-full" aria-label="Apex margin by corner">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={series}
          margin={{ top: 8, right: 8, left: 8, bottom: 24 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
          <XAxis
            type="category"
            dataKey="label"
            stroke="#8b949e"
            tick={{ fontSize: 11 }}
          />
          <YAxis
            type="number"
            stroke="#8b949e"
            tick={{ fontSize: 11 }}
            unit=" km/h"
            width={36}
          />
          <Tooltip
            contentStyle={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
            formatter={(value: number, _name: string, props: { payload: (typeof series)[0] }) => {
              const p = props.payload;
              return [
                `Marge: ${value} km/h | Réel: ${p?.apex_speed_real != null ? p.apex_speed_real.toFixed(1) : "—"} | Optimal: ${p?.apex_speed_optimal != null ? p.apex_speed_optimal.toFixed(1) : "—"} | Grade: ${p?.grade ?? "—"} | Score: ${p?.score ?? "—"}`,
                "",
              ];
            }}
          />
          <Bar dataKey="margin_kmh" radius={[4, 4, 0, 0]}>
            {series.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
