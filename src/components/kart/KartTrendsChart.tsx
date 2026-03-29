import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
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
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg text-foreground">Évolution sur les 10 dernières sessions</CardTitle>
        <p className="text-muted-foreground text-sm mt-1">
          Observez la corrélation entre vos performances en piste (G Latéral Max) et la sollicitation mécanique (RPM Max). 
          Une chute de G avec des RPM constants peut indiquer une fin de vie des pneumatiques.
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
              <XAxis dataKey="name" stroke="currentColor" className="opacity-50" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left" stroke="#ef4444" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} />
              <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--card-foreground))" }}
                itemStyle={{ fontSize: "12px", color: "hsl(var(--foreground))" }}
                labelStyle={{ color: "hsl(var(--muted-foreground))", marginBottom: "4px" }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Line yAxisId="left" type="monotone" dataKey="rpm_max" name="RPM Max (Moteur)" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line yAxisId="right" type="monotone" dataKey="g_lateral_max" name="G Latéral Max (Grip)" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
