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
import { BlurOverlay } from "../ui/BlurOverlay";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

function statusFromMargin(margin_kmh: number): "optimal" | "good" | "warning" {
  if (margin_kmh <= 0.5) return "optimal";
  if (margin_kmh <= 3) return "good";
  return "warning";
}

interface ApexMarginChartProps {
  data: CornerMargin[];
  circuitName?: string | null;
}

export function ApexMarginChart({ data, circuitName = null }: ApexMarginChartProps) {
  const navigate = useNavigate();
  const { isChartVisible, getCtaDetails } = useSubscription();
  const visible = isChartVisible("apex_margin", circuitName);
  const cta = getCtaDetails(circuitName);

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
    <BlurOverlay
      isLocked={!visible}
      ctaTitle={cta.title}
      ctaButtonText={cta.buttonText}
      onCtaClick={() => navigate(cta.buttonText.includes("compte") ? "/auth" : "/pricing")}
    >
      <div className="h-[260px] w-full" aria-label="Apex margin by corner">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={series}
            margin={{ top: 8, right: 8, left: 8, bottom: 24 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              type="category"
              dataKey="label"
              stroke="hsl(var(--border))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
            />
            <YAxis
              type="number"
              stroke="hsl(var(--border))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              unit=" km/h"
              width={36}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
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
    </BlurOverlay>
  );
}
