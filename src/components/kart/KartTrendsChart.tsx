import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";

export function KartTrendsChart({ sessions }: { sessions: any[] }) {
  if (!sessions || sessions.length === 0) return null;

  // Grouper pour identifier les sessions multiples le même jour
  const dateCounts: Record<string, number> = {};
  const processedSessions = [...sessions]
    .sort((a, b) => new Date(a.session_date).getTime() - new Date(b.session_date).getTime())
    .map(s => {
      const d = s.session_date ? format(new Date(s.session_date), "dd/MM") : "??";
      dateCounts[d] = (dateCounts[d] || 0) + 1;
      return { ...s, dateLabel: d, daySessionIdx: dateCounts[d] };
    });

  const chartData = processedSessions
    .slice(-10)
    .map((s) => ({
      name: dateCounts[s.dateLabel] > 1 ? `${s.dateLabel} (#${s.daySessionIdx})` : s.dateLabel,
      rpm_max: s.rpm_max || 0,
      g_lateral_max: s.g_lateral_max || 0,
      fullDate: s.session_date ? format(new Date(s.session_date), "dd/MM/yyyy HH:mm") : "",
      originalIdx: s.daySessionIdx
    }));

  return (
    <Card className="bg-card border-border shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="text-lg text-foreground">Évolution de la Performance</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">
              Corrélation entre RPM Max (moteur) et G Latéral Max (grip) sur les 10 dernières sessions.
            </p>
          </div>
          <div className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-1 rounded border border-border uppercase tracking-wider">
            Chronologique (Ancien → Récent)
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[250px] w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="opacity-10" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="currentColor" 
                className="opacity-50" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: 'currentColor' }}
              />
              <YAxis yAxisId="left" stroke="#ef4444" fontSize={10} tickLine={false} axisLine={false} domain={['auto', 'auto']} tickFormatter={(v) => `${(v/1000).toFixed(1)}k`} />
              <YAxis yAxisId="right" orientation="right" stroke="#3b82f6" fontSize={10} tickLine={false} axisLine={false} domain={[0, 'auto']} />
              <Tooltip 
                contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", color: "hsl(var(--card-foreground))" }}
                itemStyle={{ fontSize: "12px" }}
                labelStyle={{ color: "hsl(var(--primary))", fontWeight: "bold", marginBottom: "4px" }}
                formatter={(value: any, name: string) => {
                  if (name.includes("RPM")) return [`${Math.round(value)} tr/min`, "RPM Max"];
                  if (name.includes("G Latéral")) return [`${value.toFixed(2)} G`, "G Latéral Max"];
                  return [value, name];
                }}
                labelFormatter={(label, items) => {
                  const item = items[0]?.payload;
                  return item ? `Session du ${item.fullDate}` : label;
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px", paddingTop: "10px" }} />
              <Line yAxisId="left" type="monotone" dataKey="rpm_max" name="RPM Max" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
              <Line yAxisId="right" type="monotone" dataKey="g_lateral_max" name="G Latéral Max" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-2 text-[10px] text-center text-muted-foreground flex items-center justify-center gap-2">
          <span>Plus ancien</span>
          <div className="h-px bg-muted flex-1 max-w-[100px]" />
          <span>Plus récent</span>
        </div>
      </CardContent>
    </Card>
  );
}
