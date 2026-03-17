import { useMemo } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { ThrottleBrakeLap } from "@/types/analysis";
import { downsample } from "./utils";

interface ThrottleBrakeChartProps {
  data: { laps: ThrottleBrakeLap[] };
  selectedLaps: number[];
}

const LAP_COLORS = ["#f97316", "#3b82f6", "#22c55e", "#a855f7", "#eab308", "#ec4899", "#06b6d4"];

export function ThrottleBrakeChart({ data, selectedLaps }: ThrottleBrakeChartProps) {
  const { series, activeLaps } = useMemo(() => {
    const selectedLapData = data.laps.filter(l => selectedLaps.includes(l.lap_number));
    if (selectedLapData.length === 0) return { series: [], activeLaps: [] };

    // Reference distance from the first selected lap
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
        point[`throttle_lap_${lap.lap_number}`] = Math.round((lap.throttle_pct[idx] ?? 0) * 10) / 10;
        point[`brake_lap_${lap.lap_number}`] = Math.round((lap.brake_pct[idx] ?? 0) * 10) / 10;
      });
      
      return point;
    });

    return { series, activeLaps: selectedLapData };
  }, [data, selectedLaps]);

  if (series.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Throttle Chart */}
      <div className="h-[180px] w-full" aria-label="Throttle by distance">
        <h3 className="text-xs font-medium text-green-500 mb-2 uppercase tracking-wider">Accélérateur (%)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
            <XAxis dataKey="distance_m" hide />
            <YAxis stroke="#8b949e" tick={{ fontSize: 10 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
              formatter={(value: number) => [`${value}%`, ""]}
            />
            {activeLaps.map((lap, idx) => (
              <Line
                key={lap.lap_number}
                type="monotone"
                dataKey={`throttle_lap_${lap.lap_number}`}
                stroke={LAP_COLORS[idx % LAP_COLORS.length]}
                strokeWidth={1.5}
                dot={false}
                name={`T${lap.lap_number} Throttle`}
                animationDuration={300}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Brake Chart */}
      <div className="h-[180px] w-full" aria-label="Brake by distance">
        <h3 className="text-xs font-medium text-red-500 mb-2 uppercase tracking-wider">Freinage (%)</h3>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={series} margin={{ top: 5, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#30363d" />
            <XAxis
              dataKey="distance_m"
              stroke="#8b949e"
              tick={{ fontSize: 11 }}
              tickFormatter={(v) => `${v}m`}
            />
            <YAxis stroke="#8b949e" tick={{ fontSize: 10 }} domain={[0, 100]} />
            <Tooltip
              contentStyle={{ backgroundColor: "#161b22", border: "1px solid #30363d" }}
              formatter={(value: number) => [`${value}%`, ""]}
            />
            {activeLaps.map((lap, idx) => (
              <Line
                key={lap.lap_number}
                type="monotone"
                dataKey={`brake_lap_${lap.lap_number}`}
                stroke={LAP_COLORS[idx % LAP_COLORS.length]}
                strokeWidth={1.5}
                dot={false}
                name={`T${lap.lap_number} Brake`}
                animationDuration={300}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
