import { useMemo } from "react";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { ThrottleBrakeLap } from "@/types/analysis";
import { downsample } from "./utils";
import { BlurOverlay } from "../ui/BlurOverlay";
import { useSubscription } from "@/hooks/useSubscription.tsx";
import { useNavigate } from "react-router-dom";

type ThrottleBrakeData = { laps: ThrottleBrakeLap[] };

interface ThrottleBrakeChartProps {
  data: ThrottleBrakeData;
  selectedLaps: number[];
  circuitName?: string | null;
  hideCta?: boolean;
}

const LAP_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#eab308", "#ec4899", "#06b6d4"];

export function ThrottleBrakeChart({ data, selectedLaps, circuitName = null, hideCta = false }: ThrottleBrakeChartProps) {
  const navigate = useNavigate();
  const { isChartVisible, getCtaDetails } = useSubscription();
  const visible = isChartVisible("throttle_brake", circuitName);
  const cta = getCtaDetails(circuitName);

  const { series, activeLaps, isSingleLap } = useMemo(() => {
    const selectedLapData = data.laps.filter(l => selectedLaps.includes(l.lap_number));
    if (selectedLapData.length === 0) return { series: [], activeLaps: [], isSingleLap: true };

    const referenceLap = selectedLapData[0];
    const dist = referenceLap.distance_m;
    const distOut = downsample(dist, 100);

    const series = distOut.map((d, i) => {
      const point: any = { distance_m: Math.round(d * 10) / 10 };

      selectedLapData.forEach(lap => {
        const idx = Math.min(
          Math.round((i / (distOut.length - 1 || 1)) * (lap.distance_m.length - 1)),
          lap.distance_m.length - 1
        );
        if (selectedLapData.length === 1) {
          point["throttle_pct"] = Math.round((lap.throttle_pct[idx] ?? 0) * 10) / 10;
          point["brake_pct"] = Math.round((lap.brake_pct[idx] ?? 0) * 10) / 10;
        } else {
          point[`throttle_lap_${lap.lap_number}`] = Math.round((lap.throttle_pct[idx] ?? 0) * 10) / 10;
          point[`brake_lap_${lap.lap_number}`] = Math.round((lap.brake_pct[idx] ?? 0) * 10) / 10;
        }
      });

      return point;
    });

    return { series, activeLaps: selectedLapData, isSingleLap: selectedLapData.length === 1 };
  }, [data, selectedLaps]);

  if (series.length === 0) return null;

  const renderContent = () => {
    if (isSingleLap) {
      return (
        <div className="h-[240px] w-full" aria-label="Throttle and brake by distance">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis
                dataKey="distance_m"
                stroke="hsl(var(--border))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                tickFormatter={(v) => `${v}m`}
              />
              <YAxis
                stroke="hsl(var(--border))"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
                itemStyle={{ color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--muted-foreground))" }}
                formatter={(value: number) => [`${value}%`, ""]}
                labelFormatter={(label) => `Position: ${label} m`}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="throttle_pct"
                stroke="#22c55e"
                fill="#22c55e40"
                strokeWidth={1.5}
                name="Accélérateur"
              />
              <Area
                type="monotone"
                dataKey="brake_pct"
                stroke="#ef4444"
                fill="#ef444440"
                strokeWidth={1.5}
                name="Frein"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return (
      <div className="h-[280px] w-full" aria-label="Throttle and brake by distance (multi-lap)">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="distance_m"
              stroke="hsl(var(--border))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              tickFormatter={(v) => `${v}m`}
            />
            <YAxis
              stroke="hsl(var(--border))"
              tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
              domain={[0, 100]}
              tickFormatter={(v) => `${v}%`}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, color: "hsl(var(--foreground))" }}
              itemStyle={{ color: "hsl(var(--foreground))" }}
              labelStyle={{ color: "hsl(var(--muted-foreground))" }}
              formatter={(value: number) => [`${value}%`, ""]}
            />
            <Legend />
            {activeLaps.map((lap, idx) => {
              const color = LAP_COLORS[idx % LAP_COLORS.length];
              return (
                <Line
                  key={`throttle_${lap.lap_number}`}
                  type="monotone"
                  dataKey={`throttle_lap_${lap.lap_number}`}
                  stroke={color}
                  strokeWidth={1.5}
                  dot={false}
                  name={`T${lap.lap_number} Accél.`}
                  animationDuration={300}
                />
              );
            })}
            {activeLaps.map((lap, idx) => {
              const color = LAP_COLORS[idx % LAP_COLORS.length];
              return (
                <Line
                  key={`brake_${lap.lap_number}`}
                  type="monotone"
                  dataKey={`brake_lap_${lap.lap_number}`}
                  stroke={color}
                  strokeWidth={1.5}
                  strokeDasharray="5 3"
                  dot={false}
                  name={`T${lap.lap_number} Frein`}
                  animationDuration={300}
                />
              );
            })}
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <BlurOverlay
      isLocked={!visible}
      ctaTitle={cta.title}
      ctaButtonText={cta.buttonText}
      onCtaClick={() => navigate(cta.buttonText.includes("compte") ? "/login?mode=register" : "/pricing")}
      hideButton={hideCta}
    >
      {renderContent()}
    </BlurOverlay>
  );
}
