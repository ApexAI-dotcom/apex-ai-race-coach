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
import { BlurOverlay } from "../ui/BlurOverlay";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

interface TimeDeltaChartProps {
  data: TimeDeltaData;
  circuitName?: string | null;
}

export function TimeDeltaChart({ data, circuitName = null }: TimeDeltaChartProps) {
  const navigate = useNavigate();
  const { isChartVisible, getCtaDetails } = useSubscription();
  const visible = isChartVisible("delta_time", circuitName);
  const cta = getCtaDetails(circuitName);

  const series = useMemo(() => {
    const { a: dist, b: delta } = downsamplePair(data.distance_m, data.delta_s, 100);
    return dist.map((d, i) => ({
      distance_m: Math.round(d * 10) / 10,
      delta_s: Math.round((delta[i] ?? 0) * 1000) / 1000,
    }));
  }, [data.distance_m, data.delta_s]);

  if (series.length === 0) return null;

  return (
    <BlurOverlay
      isLocked={!visible}
      ctaTitle={cta.title}
      ctaButtonText={cta.buttonText}
      onCtaClick={() => navigate(cta.buttonText.includes("compte") ? "/auth" : "/pricing")}
    >
      <div className="h-[240px] w-full" aria-label="Time delta by distance">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="2 2" />
            <XAxis
              dataKey="distance_m"
              stroke="hsl(var(--border))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickFormatter={(v) => `${v}m`}
            />
            <YAxis
              stroke="hsl(var(--border))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickFormatter={(v) => `${v >= 0 ? "+" : ""}${v}s`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
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
    </BlurOverlay>
  );
}
