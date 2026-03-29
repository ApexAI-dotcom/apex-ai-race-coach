import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";

export function KartTrendsChart({ sessions }: { sessions: any[] }) {
  if (!sessions || sessions.length === 0) return null;

  // Prendre les 10 dernières sessions par ordre chronologique
  const chartData = [...sessions]
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
    .slice(-10)
    .map((s, idx) => ({
      name: `S${idx + 1}`,
      rpm_max: s.rpm_max || 0,
      g_lateral_max: s.g_lateral_max || 0,
      date: s.session_date ? format(new Date(s.session_date), "dd/MM") : "",
    }));

  return (
    <Card className="glass-card border-white/5 bg-black/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg">Tendances (10 dernières sessions)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-48 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
              <XAxis dataKey="name" stroke="#888888" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="#ef4444" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `${v/1000}k`} />
              <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: "#111", border: "1px solid #ffffff20", borderRadius: "8px" }}
                itemStyle={{ fontSize: "12px" }}
                labelStyle={{ color: "#888", marginBottom: "4px" }}
              />
              <Line yAxisId="left" type="monotone" dataKey="rpm_max" name="RPM Max" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line yAxisId="right" type="monotone" dataKey="g_lateral_max" name="G-Lat Max" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
