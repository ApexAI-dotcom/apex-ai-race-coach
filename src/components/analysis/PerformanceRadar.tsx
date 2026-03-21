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
import { BlurOverlay } from "../ui/BlurOverlay";
import { useSubscription } from "@/hooks/useSubscription";
import { useNavigate } from "react-router-dom";

interface PerformanceRadarProps {
  data: RadarData;
  circuitName?: string | null;
  hideCta?: boolean;
}

export function PerformanceRadar({ data, circuitName = null, hideCta = false }: PerformanceRadarProps) {
  const navigate = useNavigate();
  const { isChartVisible, getCtaDetails } = useSubscription();
  const visible = isChartVisible("radar", circuitName);
  const cta = getCtaDetails(circuitName);

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
    <BlurOverlay
      isLocked={!visible}
      ctaTitle={cta.title}
      ctaButtonText={cta.buttonText}
      onCtaClick={() => navigate(cta.buttonText.includes("compte") ? "/login?mode=register" : "/pricing")}
      hideButton={hideCta}
    >
      <div className="h-[260px] w-full" aria-label="Performance radar">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={chartData} margin={{ top: 32, right: 32, left: 32, bottom: 32 }}>
            <PolarGrid stroke="hsl(var(--border))" />
            <PolarAngleAxis dataKey="subject" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 100]}
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
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
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              formatter={(value: number, _name: string, props: { payload: { raw?: number; max?: number } }) => [
                `${value}%${props.payload?.raw != null && props.payload?.max != null ? ` (${props.payload.raw.toFixed(1)} / ${props.payload.max})` : ""}`,
                "",
              ]}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
    </BlurOverlay>
  );
}
