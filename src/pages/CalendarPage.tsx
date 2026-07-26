import { useCallback, useEffect, useMemo, useState } from "react";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  CalendarDays,
  LayoutGrid,
  List,
  Flag,
  Timer,
  GraduationCap,
  AlertCircle,
  CircleDot,
  Plus,
  Trash2,
  Pencil,
  Check,
  Loader2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { MonthGrid } from "@/components/calendar/MonthGrid";
import { CalendarPrepBanner } from "@/components/calendar/CalendarPrepBanner";
import { useAuth } from "@/hooks/useAuth";
import {
  listPilotEvents,
  createPilotEvent,
  updatePilotEvent,
  deletePilotEvent,
  type PilotEvent,
  type PilotEventInput,
  type PilotEventType,
  getCircuits,
} from "@/lib/api";

/**
 * Calendrier du pilote — la vie sportive au même endroit : courses,
 * entraînements, séances de coaching et échéances administratives.
 *
 * Deux lectures complémentaires : la grille mensuelle pour voir sa saison d'un
 * coup d'œil (semaines chargées, trous où caler une séance), et la liste
 * chronologique pour savoir ce qui arrive et dans quel ordre.
 *
 * Ce qui le distingue d'un agenda générique : il s'appuie sur ce que
 * l'application sait déjà du pilote — ses circuits, l'état de son matériel —
 * pour lui éviter de ressaisir et surtout d'oublier.
 */

const TYPES: {
  id: PilotEventType;
  label: string;
  icon: React.ElementType;
  color: string;
  ring: string;
  accent: string;
}[] = [
  { id: "race", label: "Course", icon: Flag, color: "text-red-400", ring: "border-red-500/40 bg-red-500/10", accent: "bg-red-500" },
  { id: "training", label: "Entraînement", icon: Timer, color: "text-sky-400", ring: "border-sky-500/40 bg-sky-500/10", accent: "bg-sky-500" },
  { id: "coaching", label: "Coaching", icon: GraduationCap, color: "text-violet-400", ring: "border-violet-500/40 bg-violet-500/10", accent: "bg-violet-500" },
  { id: "deadline", label: "Échéance", icon: AlertCircle, color: "text-amber-400", ring: "border-amber-500/40 bg-amber-500/10", accent: "bg-amber-500" },
  { id: "other", label: "Autre", icon: CircleDot, color: "text-muted-foreground", ring: "border-white/15 bg-white/5", accent: "bg-white/25" },
];

const typeMeta = (t: PilotEventType) => TYPES.find((x) => x.id === t) ?? TYPES[4];

/** Convertit une date ISO en valeur pour <input type="datetime-local"> (heure locale). */
function toLocalInput(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatWhen(ev: PilotEvent): string {
  const d = new Date(ev.starts_at);
  const date = d.toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
  if (ev.all_day) return date.charAt(0).toUpperCase() + date.slice(1);
  const time = d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
  return `${date.charAt(0).toUpperCase() + date.slice(1)} · ${time}`;
}

function countdown(ev: PilotEvent): string | null {
  const diff = new Date(ev.starts_at).getTime() - Date.now();
  if (diff < 0) return null;
  const days = Math.floor(diff / 86_400_000);
  if (days === 0) return "aujourd'hui";
  if (days === 1) return "demain";
  if (days < 31) return `dans ${days} jours`;
  const months = Math.round(days / 30);
  return `dans ${months} mois`;
}

const emptyForm = (): PilotEventInput => ({
  title: "",
  event_type: "training",
  starts_at: new Date(Date.now() + 86_400_000).toISOString(),
  ends_at: null,
  all_day: false,
  circuit_name: null,
  location: null,
  notes: null,
  completed: false,
});

export default function CalendarPage() {
  const { session, user } = useAuth();
  const token = session?.access_token;

  const [knownCircuits, setKnownCircuits] = useState<string[]>([]);
  const [events, setEvents] = useState<PilotEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<PilotEventInput>(emptyForm);
  const [showForm, setShowForm] = useState(false);
  const [view, setView] = useState<"list" | "month">("month");
  const [month, setMonth] = useState<Date>(() => new Date());
  const [selectedDay, setSelectedDay] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      setEvents(await listPilotEvents(token));
    } catch {
      toast.error("Impossible de charger le calendrier.");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load();
  }, [load]);

  // Circuits déjà roulés par le pilote, tirés de ses analyses : le calendrier
  // ne lui redemande pas une information que l'application possède.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { getAllAnalyses } = await import("@/lib/storage");
        const analyses = await getAllAnalyses(user?.id);
        const fromAnalyses = analyses
          .map((a: any) => a?.circuit_name || a?.result?.session_conditions?.circuit_name)
          .filter((n: unknown): n is string => typeof n === "string" && n.trim().length > 0);

        // On complète avec le catalogue de circuits de l'app (celui que le
        // pilote alimente dans Réglages) : il n'a pas à ressaisir un nom que
        // l'application connaît déjà.
        let fromCatalog: string[] = [];
        if (token) {
          try {
            const res: any = await getCircuits(token);
            const list = Array.isArray(res) ? res : (res?.circuits ?? []);
            fromCatalog = list
              .map((c: any) => c?.name)
              .filter((n: unknown): n is string => typeof n === "string" && n.trim().length > 0);
          } catch {
            /* le catalogue est un bonus, pas une dépendance */
          }
        }
        const names = Array.from(new Set([...fromAnalyses, ...fromCatalog]));
        if (!cancelled) setKnownCircuits(names.slice(0, 30));
      } catch {
        /* le calendrier reste utilisable sans suggestions */
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.id, token]);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const up: PilotEvent[] = [];
    const old: PilotEvent[] = [];
    for (const e of events) {
      (new Date(e.starts_at).getTime() >= now && !e.completed ? up : old).push(e);
    }
    old.reverse(); // le passé récent d'abord
    return { upcoming: up, past: old };
  }, [events]);

  const eventsOfSelectedDay = useMemo(() => {
    if (!selectedDay) return [];
    return events
      .filter((e) => {
        const d = new Date(e.starts_at);
        const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
        return k === selectedDay;
      })
      .sort((a, b) => +new Date(a.starts_at) - +new Date(b.starts_at));
  }, [events, selectedDay]);

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm());
    setShowForm(true);
  };

  const openEdit = (ev: PilotEvent) => {
    setEditingId(ev.id);
    setForm({
      title: ev.title,
      event_type: ev.event_type,
      starts_at: ev.starts_at,
      ends_at: ev.ends_at ?? null,
      all_day: ev.all_day,
      circuit_name: ev.circuit_name ?? null,
      location: ev.location ?? null,
      notes: ev.notes ?? null,
      completed: ev.completed,
    });
    setShowForm(true);
  };

  const save = async () => {
    if (!token) return;
    if (!form.title.trim()) {
      toast.error("Donne un titre à cet événement.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        const updated = await updatePilotEvent(token, editingId, form);
        setEvents((prev) => prev.map((e) => (e.id === editingId ? updated : e)));
        toast.success("Événement mis à jour.");
      } else {
        const created = await createPilotEvent(token, form);
        setEvents((prev) => [...prev, created]);
        toast.success("Événement ajouté au calendrier.");
      }
      setShowForm(false);
      setEditingId(null);
    } catch (e: any) {
      toast.error(e?.message || "Enregistrement impossible.");
    } finally {
      setSaving(false);
    }
  };

  const toggleDone = async (ev: PilotEvent) => {
    if (!token) return;
    const next = { ...ev, completed: !ev.completed };
    setEvents((prev) => prev.map((e) => (e.id === ev.id ? next : e)));
    try {
      await updatePilotEvent(token, ev.id, {
        title: ev.title,
        event_type: ev.event_type,
        starts_at: ev.starts_at,
        ends_at: ev.ends_at ?? null,
        all_day: ev.all_day,
        circuit_name: ev.circuit_name ?? null,
        location: ev.location ?? null,
        notes: ev.notes ?? null,
        completed: !ev.completed,
      });
    } catch {
      setEvents((prev) => prev.map((e) => (e.id === ev.id ? ev : e))); // on revient en arrière
      toast.error("Modification impossible.");
    }
  };

  const remove = async (ev: PilotEvent) => {
    if (!token) return;
    const before = events;
    setEvents((prev) => prev.filter((e) => e.id !== ev.id));
    try {
      await deletePilotEvent(token, ev.id);
      toast.success("Événement supprimé.");
    } catch {
      setEvents(before);
      toast.error("Suppression impossible.");
    }
  };

  const renderEvent = (ev: PilotEvent, isPast: boolean) => {
    const meta = typeMeta(ev.event_type);
    const Icon = meta.icon;
    const cd = countdown(ev);
    return (
      <Card
        key={ev.id}
        className={`relative overflow-hidden bg-secondary/40 border-white/5 transition-all hover:border-white/15 hover:bg-secondary/60 ${isPast ? "opacity-60" : ""}`}
      >
        {/* Accent latéral : la couleur du type se lit avant même le texte */}
        <span className={`absolute left-0 top-0 bottom-0 w-1 ${meta.accent}`} />
        <CardContent className="p-4 pl-5 flex items-start gap-3">
          <div className={`shrink-0 w-10 h-10 rounded-xl border flex items-center justify-center ${meta.ring}`}>
            <Icon className={`w-5 h-5 ${meta.color}`} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-semibold text-foreground ${ev.completed ? "line-through" : ""}`}>
                {ev.title}
              </h3>
              <Badge variant="outline" className="text-[10px] border-white/10">
                {meta.label}
              </Badge>
              {cd && !ev.completed && (
                <span className="text-[11px] text-primary font-medium">{cd}</span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {formatWhen(ev)}
              {ev.circuit_name ? ` · ${ev.circuit_name}` : ""}
              {ev.location ? ` · ${ev.location}` : ""}
            </p>
            {ev.notes && (
              <p className="text-xs text-muted-foreground/80 mt-1.5 whitespace-pre-line">
                {ev.notes}
              </p>
            )}
          </div>

          <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 sm:h-8 sm:w-8"
              onClick={() => toggleDone(ev)}
              title={ev.completed ? "Marquer comme à venir" : "Marquer comme fait"}
              aria-label={ev.completed ? "Marquer comme à venir" : "Marquer comme fait"}
            >
              <Check className={`w-4 h-4 ${ev.completed ? "text-emerald-500" : ""}`} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 sm:h-8 sm:w-8"
              onClick={() => openEdit(ev)}
              title="Modifier"
              aria-label="Modifier"
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-10 w-10 sm:h-8 sm:w-8 hover:text-red-500"
              onClick={() => remove(ev)}
              title="Supprimer"
              aria-label="Supprimer"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <Layout>
      <PageMeta
        title="Calendrier | ApexAI"
        description="Organise ta saison : courses, entraînements, coaching et échéances."
        path="/calendrier"
      />
      <div className="container max-w-3xl mx-auto px-4 py-8 md:py-12">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-primary" />
              Calendrier
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ta saison au même endroit : courses, entraînements, coaching et échéances
              d'inscription.
            </p>
          </div>
          {!showForm && (
            <Button onClick={openCreate} className="gap-1.5 shrink-0">
              <Plus className="w-4 h-4" />
              Ajouter
            </Button>
          )}
        </div>

        {showForm && (
          <Card className="bg-card border-primary/20 mb-6">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-foreground">
                  {editingId ? "Modifier l'événement" : "Nouvel événement"}
                </h2>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowForm(false)} aria-label="Fermer">
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = form.event_type === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setForm((f) => ({ ...f, event_type: t.id }))}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        active ? t.ring : "border-white/10 text-muted-foreground hover:bg-white/5"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${active ? t.color : ""}`} />
                      {t.label}
                    </button>
                  );
                })}
              </div>

              <Input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                placeholder="Ex. Manche 3 du championnat régional"
                maxLength={140}
              />

              <div className="grid sm:grid-cols-2 gap-3">
                <label className="text-xs text-muted-foreground space-y-1">
                  <span>Date et heure</span>
                  <Input
                    type="datetime-local"
                    value={toLocalInput(form.starts_at)}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        starts_at: new Date(e.target.value).toISOString(),
                      }))
                    }
                  />
                </label>
                <label className="text-xs text-muted-foreground space-y-1">
                  <span>Circuit (optionnel)</span>
                  <Input
                    list="apex-known-circuits"
                    value={form.circuit_name ?? ""}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, circuit_name: e.target.value || null }))
                    }
                    placeholder={knownCircuits[0] ?? "Ex. Adria Karting Raceway"}
                  />
                  {/* Les circuits proposés sont ceux que le pilote a réellement
                      roulés : le calendrier s'appuie sur ses analyses au lieu de
                      lui redemander ce que l'app sait déjà. */}
                  <datalist id="apex-known-circuits">
                    {knownCircuits.map((c) => (
                      <option key={c} value={c} />
                    ))}
                  </datalist>
                </label>
              </div>

              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={form.all_day}
                  onChange={(e) => setForm((f) => ({ ...f, all_day: e.target.checked }))}
                  className="accent-primary"
                />
                Journée entière (pas d'heure précise)
              </label>

              <textarea
                value={form.notes ?? ""}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value || null }))}
                placeholder="Notes : objectifs, matériel à prévoir, contacts…"
                rows={3}
                maxLength={2000}
                className="w-full rounded-md bg-background border border-input px-3 py-2 text-sm resize-y focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              />

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setShowForm(false)}>
                  Annuler
                </Button>
                <Button onClick={save} disabled={saving} className="gap-1.5">
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Enregistrer" : "Ajouter"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Croise la prochaine échéance avec l'état réel du matériel */}
        {!loading && events.length > 0 && <CalendarPrepBanner events={events} />}

        {/* Deux lectures complémentaires : la saison d'un coup d'œil (mois),
            ou ce qui arrive et dans quel ordre (liste). */}
        {!loading && events.length > 0 && (
          <div className="flex items-center gap-1 bg-secondary/50 rounded-lg p-1 mb-4 w-fit">
            <button
              onClick={() => setView("month")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === "month" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Mois
            </button>
            <button
              onClick={() => setView("list")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                view === "list" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <List className="w-3.5 h-3.5" /> Liste
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : events.length === 0 ? (
          <Card className="bg-secondary/30 border-white/5">
            <CardContent className="p-8 text-center">
              <CalendarDays className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <h2 className="font-semibold text-foreground">Ton calendrier est vide</h2>
              <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
                Ajoute ta prochaine course, tes entraînements ou une date limite d'inscription
                pour garder ta saison sous contrôle.
              </p>
              <Button onClick={openCreate} className="mt-4 gap-1.5">
                <Plus className="w-4 h-4" />
                Ajouter un événement
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {view === "month" && (
              <div className="space-y-3">
                <MonthGrid
                  month={month}
                  events={events}
                  selectedDay={selectedDay}
                  onMonthChange={setMonth}
                  onSelectDay={setSelectedDay}
                />
                {selectedDay && (
                  <section className="space-y-2.5">
                    <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                      {new Date(selectedDay).toLocaleDateString("fr-FR", {
                        weekday: "long", day: "numeric", month: "long",
                      })}
                    </h2>
                    {eventsOfSelectedDay.length === 0 ? (
                      <p className="text-sm text-muted-foreground">Rien ce jour-là.</p>
                    ) : (
                      eventsOfSelectedDay.map((e) =>
                        renderEvent(e, new Date(e.starts_at).getTime() < Date.now())
                      )
                    )}
                  </section>
                )}
              </div>
            )}

            {view === "list" && (
            <section className="space-y-2.5">
              <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                À venir {upcoming.length > 0 && `(${upcoming.length})`}
              </h2>
              {upcoming.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Rien de prévu pour l'instant.
                </p>
              ) : (
                upcoming.map((e) => renderEvent(e, false))
              )}
            </section>
            )}

            {view === "list" && past.length > 0 && (
              <section className="space-y-2.5">
                <h2 className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
                  Passé et terminé ({past.length})
                </h2>
                {past.map((e) => renderEvent(e, true))}
              </section>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
