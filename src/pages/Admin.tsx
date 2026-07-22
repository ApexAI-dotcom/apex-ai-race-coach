import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ShieldCheck, Users, BarChart3, Ticket, UserCog, Loader2, Plus,
  Copy, Power, TrendingUp, Inbox, Wrench, Clock, MousePointerClick,
} from "lucide-react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { FeedbackAdminPanel } from "@/components/feedback/FeedbackAdminPanel";

const CHART = ["#ef4444", "#f59e0b", "#10b981", "#3b82f6", "#a855f7", "#64748b"];
const TIER_LABELS: Record<string, string> = {
  rookie: "Gratuit", racer: "Racer", team: "Team", visiteur: "Visiteur", visitor: "Visiteur",
};

function ChartCard({ title, icon: Icon, children }: { title: string; icon: any; children: React.ReactNode }) {
  return (
    <Card className="bg-card border-border rounded-2xl">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-semibold flex items-center gap-2 text-muted-foreground">
          <Icon className="w-4 h-4 text-primary" /> {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

const chartTooltip = {
  contentStyle: {
    background: "hsl(var(--card))", border: "1px solid hsl(var(--border))",
    borderRadius: 12, fontSize: 12,
  },
};

function StatTile({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
      {hint && <p className="text-[11px] text-muted-foreground mt-0.5">{hint}</p>}
    </div>
  );
}

export default function Admin() {
  const { session, loading: authLoading } = useAuth();
  const token = session?.access_token;

  const [me, setMe] = useState<any>(null);
  const [checking, setChecking] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [analytics, setAnalytics] = useState<any>(null);

  useEffect(() => {
    const check = async () => {
      if (!token) { setChecking(false); return; }
      try {
        const res = await api.getAdminMe(token);
        setMe(res);
        if (res.permissions?.includes("stats")) {
          api.getAdminStats(token).then(setStats).catch(() => {});
          api.getAnalyticsOverview(token, 14).then(setAnalytics).catch(() => {});
        }
      } catch {
        setMe({ is_admin: false });
      } finally {
        setChecking(false);
      }
    };
    check();
  }, [token]);

  if (authLoading || checking) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!me?.is_admin) return <Navigate to="/dashboard" replace />;

  const can = (p: string) => me.permissions?.includes(p);

  return (
    <Layout>
      <PageMeta title="Administration | ApexAI" description="Back-office ApexAI" />
      <div className="container max-w-7xl mx-auto py-8 px-4 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-display font-bold flex items-center gap-2">
              <ShieldCheck className="w-7 h-7 text-primary" />
              Administration
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Pilotage de la plateforme ApexAI
            </p>
          </div>
          <Badge className="bg-primary/10 text-primary border border-primary/20 rounded-full px-3 py-1">
            {me.role_label}
          </Badge>
        </div>

        <Tabs defaultValue={can("stats") ? "overview" : "feedback"}>
          <TabsList className="flex-wrap h-auto">
            {can("stats") && <TabsTrigger value="overview" className="gap-2"><BarChart3 className="w-4 h-4" />Vue d'ensemble</TabsTrigger>}
            {can("feedback") && <TabsTrigger value="feedback" className="gap-2"><Inbox className="w-4 h-4" />Retours pilotes</TabsTrigger>}
            {can("promo") && <TabsTrigger value="promo" className="gap-2"><Ticket className="w-4 h-4" />Paddock Pass</TabsTrigger>}
            {can("roles") && <TabsTrigger value="roles" className="gap-2"><UserCog className="w-4 h-4" />Collaborateurs</TabsTrigger>}
          </TabsList>

          {can("stats") && (
            <TabsContent value="overview" className="mt-6 space-y-6">
              {!stats ? (
                <div className="flex justify-center p-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
              ) : (
                <>
                  <section className="space-y-3">
                    <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                      <Users className="w-4 h-4" /> Pilotes
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <StatTile label="Total inscrits" value={stats.users?.total ?? 0} />
                      <StatTile label="Abonnés payants" value={stats.users?.paying ?? 0} hint="Racer + Team" />
                      <StatTile label="Gratuits" value={stats.users?.by_tier?.rookie ?? 0} />
                      <StatTile label="Essais actifs" value={stats.paddock_pass?.active_trials ?? 0} hint="Paddock Pass en cours" />
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                      <TrendingUp className="w-4 h-4" /> Activité
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <StatTile label="Analyses totales" value={stats.analyses?.total ?? 0} />
                      <StatTile label="Ce mois-ci" value={stats.analyses?.this_month ?? 0} />
                      <StatTile label="7 derniers jours" value={stats.analyses?.last_7_days ?? 0} />
                      <StatTile label="Sessions loguées" value={stats.engagement?.sessions_logged ?? 0} />
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                      <Wrench className="w-4 h-4" /> Engagement produit
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <StatTile label="Garages configurés" value={stats.engagement?.kart_profiles ?? 0} />
                      <StatTile label="Réglages créés" value={stats.engagement?.setups ?? 0} />
                      <StatTile label="Trains déclarés" value={stats.engagement?.tire_sets ?? 0} />
                      <StatTile label="Circuits" value={stats.engagement?.circuits ?? 0} />
                    </div>
                  </section>

                  {/* Graphiques */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                      <ChartCard title="Fréquentation (14 derniers jours)" icon={TrendingUp}>
                        {analytics?.timeline?.length ? (
                          <ResponsiveContainer width="100%" height={220}>
                            <AreaChart data={analytics.timeline}>
                              <defs>
                                <linearGradient id="v" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="0%" stopColor="#ef4444" stopOpacity={0.4} />
                                  <stop offset="100%" stopColor="#ef4444" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                              <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={(d) => d.slice(5)} stroke="hsl(var(--muted-foreground))" />
                              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                              <Tooltip {...chartTooltip} />
                              <Area type="monotone" dataKey="views" name="Vues" stroke="#ef4444" strokeWidth={2} fill="url(#v)" />
                            </AreaChart>
                          </ResponsiveContainer>
                        ) : (
                          <p className="text-sm text-muted-foreground text-center py-16">
                            Les données de navigation apparaîtront ici après quelques visites.
                          </p>
                        )}
                      </ChartCard>
                    </div>

                    <ChartCard title="Répartition des pilotes" icon={Users}>
                      {stats.users?.by_tier && Object.keys(stats.users.by_tier).length ? (
                        <ResponsiveContainer width="100%" height={220}>
                          <PieChart>
                            <Pie
                              data={Object.entries(stats.users.by_tier).map(([k, v]) => ({ name: TIER_LABELS[k] || k, value: v }))}
                              dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80} paddingAngle={2}
                            >
                              {Object.keys(stats.users.by_tier).map((_, i) => (
                                <Cell key={i} fill={CHART[i % CHART.length]} />
                              ))}
                            </Pie>
                            <Tooltip {...chartTooltip} />
                          </PieChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-16">Aucune donnée.</p>
                      )}
                    </ChartCard>
                  </div>

                  {/* Analytics de navigation */}
                  <section className="space-y-3">
                    <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                      <MousePointerClick className="w-4 h-4" /> Parcours utilisateurs
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <StatTile label="Vues totales" value={analytics?.totals?.views ?? 0} hint="14 derniers jours" />
                      <StatTile label="Visiteurs connectés" value={analytics?.totals?.unique_signed_in ?? 0} />
                      <StatTile label="Vues anonymes" value={analytics?.totals?.anonymous_views ?? 0} />
                      <StatTile
                        label="Temps moyen / page"
                        value={analytics?.totals?.avg_time_on_page_s != null ? `${analytics.totals.avg_time_on_page_s}s` : "—"}
                      />
                    </div>
                    <ChartCard title="Pages les plus consultées" icon={Clock}>
                      {analytics?.top_pages?.length ? (
                        <ResponsiveContainer width="100%" height={Math.max(180, analytics.top_pages.length * 32)}>
                          <BarChart data={analytics.top_pages.slice(0, 8)} layout="vertical" margin={{ left: 20 }}>
                            <XAxis type="number" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" allowDecimals={false} />
                            <YAxis type="category" dataKey="path" width={120} tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                            <Tooltip {...chartTooltip} formatter={(v: any, n: any, p: any) => [
                              `${v} vues${p.payload.avg_seconds ? ` · ${p.payload.avg_seconds}s en moy.` : ""}`, "",
                            ]} />
                            <Bar dataKey="views" fill="#ef4444" radius={[0, 4, 4, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-10">
                          Les pages consultées apparaîtront ici bientôt.
                        </p>
                      )}
                    </ChartCard>
                  </section>

                  <section className="space-y-3">
                    <h2 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                      <Inbox className="w-4 h-4" /> Relation pilotes
                    </h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <StatTile label="Retours reçus" value={stats.feedback?.total ?? 0} />
                      <StatTile label="Non traités" value={stats.feedback?.new ?? 0} />
                      <StatTile label="Codes Paddock" value={stats.paddock_pass?.codes ?? 0} />
                      <StatTile label="Activations" value={stats.paddock_pass?.redemptions ?? 0} />
                    </div>
                  </section>
                </>
              )}
            </TabsContent>
          )}

          {can("feedback") && (
            <TabsContent value="feedback" className="mt-6">
              <FeedbackAdminPanel />
            </TabsContent>
          )}

          {can("promo") && (
            <TabsContent value="promo" className="mt-6">
              <PaddockPassPanel token={token!} />
            </TabsContent>
          )}

          {can("roles") && (
            <TabsContent value="roles" className="mt-6">
              <RolesPanel token={token!} />
            </TabsContent>
          )}
        </Tabs>
      </div>
    </Layout>
  );
}

/* ─────────────── Paddock Pass ─────────────── */
function PaddockPassPanel({ token }: { token: string }) {
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [label, setLabel] = useState("");
  const [hours, setHours] = useState("24");
  const [maxRed, setMaxRed] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getPromoCodes(token);
      setCodes(res.codes || []);
    } catch (e: any) {
      toast.error(e.message || "Lecture impossible.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  const create = async () => {
    setCreating(true);
    try {
      const res = await api.createPromoCode(token, {
        label: label.trim() || undefined,
        tier: "racer",
        durationHours: Number(hours) || 24,
        maxRedemptions: maxRed ? Number(maxRed) : undefined,
        expiresInDays: 90,
      });
      toast.success(`Code créé : ${res.code?.code}`);
      setLabel(""); setMaxRed("");
      load();
    } catch (e: any) {
      toast.error(e.message || "Génération impossible.");
    } finally {
      setCreating(false);
    }
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copié.");
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-primary" /> Générer un Paddock Pass
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Débloque l'offre Racer pendant une durée limitée. À distribuer sur les
            circuits (papier ou QR) pour faire tester ApexAI en conditions réelles.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
          <div className="space-y-2 md:col-span-2">
            <Label>Libellé interne</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Ex : Trophée de Varennes — juillet" />
          </div>
          <div className="space-y-2">
            <Label>Durée (heures)</Label>
            <Input type="number" min={1} max={720} value={hours} onChange={(e) => setHours(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Utilisations max</Label>
            <Input type="number" min={1} value={maxRed} onChange={(e) => setMaxRed(e.target.value)} placeholder="illimité" />
          </div>
          <Button onClick={create} disabled={creating} className="md:col-span-4 gap-2">
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
            Générer le code
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Codes émis</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : codes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">Aucun code émis.</p>
          ) : (
            codes.map((c) => (
              <div key={c.code} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-background/40">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <code className="font-mono font-bold text-primary">{c.code}</code>
                    <Badge className={`rounded-full text-[10px] border ${c.active ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"}`}>
                      {c.active ? "Actif" : "Désactivé"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {c.label || "Sans libellé"} · {c.duration_hours} h · {c.redemptions}
                    {c.max_redemptions ? `/${c.max_redemptions}` : ""} activation(s)
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copy(c.code)} title="Copier">
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost" size="icon" className="h-8 w-8"
                    title={c.active ? "Désactiver" : "Réactiver"}
                    onClick={async () => {
                      try {
                        await api.togglePromoCode(token, c.code, !c.active);
                        load();
                      } catch (e: any) { toast.error(e.message); }
                    }}
                  >
                    <Power className={`w-4 h-4 ${c.active ? "text-emerald-500" : "text-muted-foreground"}`} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ─────────────── Collaborateurs ─────────────── */
function RolesPanel({ token }: { token: string }) {
  const [roles, setRoles] = useState<any[]>([]);
  const [available, setAvailable] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("support");
  const [granting, setGranting] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.getAdminRoles(token);
      setRoles(res.roles || []);
      setAvailable(res.available || []);
    } catch (e: any) {
      toast.error(e.message || "Lecture impossible.");
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [token]);

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg flex items-center gap-2">
            <UserCog className="w-5 h-5 text-primary" /> Donner un accès
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Le collaborateur doit déjà avoir un compte ApexAI. Son accès est
            limité aux permissions de son rôle.
          </p>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div className="space-y-2 md:col-span-2">
            <Label>Email du collaborateur</Label>
            <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="collaborateur@exemple.com" />
          </div>
          <div className="space-y-2">
            <Label>Rôle</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {available.map((r) => (
                  <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button
            className="md:col-span-3"
            disabled={granting || !email.trim()}
            onClick={async () => {
              setGranting(true);
              try {
                await api.grantAdminRole(token, email.trim(), role);
                toast.success("Accès accordé.");
                setEmail("");
                load();
              } catch (e: any) { toast.error(e.message || "Attribution impossible."); }
              finally { setGranting(false); }
            }}
          >
            {granting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Accorder l'accès
          </Button>
        </CardContent>
      </Card>

      <Card className="bg-card border-border rounded-2xl">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Équipe</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {loading ? (
            <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
          ) : (
            roles.map((r) => (
              <div key={r.user_id} className="flex items-center justify-between gap-3 p-3 rounded-xl border border-border bg-background/40">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{r.email || r.user_id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{r.role_label} · {r.note || "—"}</p>
                </div>
                {r.role !== "owner" && (
                  <Button
                    variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 shrink-0"
                    onClick={async () => {
                      if (!confirm(`Révoquer l'accès de ${r.email} ?`)) return;
                      try {
                        await api.revokeAdminRole(token, r.user_id);
                        toast.success("Accès révoqué.");
                        load();
                      } catch (e: any) { toast.error(e.message); }
                    }}
                  >
                    Révoquer
                  </Button>
                )}
              </div>
            ))
          )}
          <div className="pt-3 mt-3 border-t border-border space-y-1.5">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">Rôles disponibles</p>
            {available.map((r) => (
              <p key={r.value} className="text-xs text-muted-foreground">
                <span className="font-semibold text-foreground">{r.label}</span> — {r.permissions.join(", ")}
              </p>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
