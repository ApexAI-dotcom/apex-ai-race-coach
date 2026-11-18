import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Copy, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import {
  createAdminStructure,
  getAdminTeam,
  updateAdminRequest,
  updateAdminStructure,
  type AdminContactRequest,
  type AdminStructure,
} from "@/lib/team";

const STATUS_LABEL: Record<AdminContactRequest["status"], string> = {
  nouvelle: "Nouvelle",
  en_discussion: "En discussion",
  signee: "Signée",
  sans_suite: "Sans suite",
};
const STRUCT_LABEL: Record<string, string> = { essai: "Essai", active: "Active", suspendue: "Suspendue", terminee: "Terminée" };
const KIND_LABEL: Record<string, string> = { ecole: "École", club: "Club", coach: "Coach", autre: "Autre" };
const fmt = (iso?: string | null) => (iso ? new Date(iso).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" }) : "—");

/**
 * Admin · Team : les demandes « Contactez-nous » et les structures (essai,
 * limites, coachs, pilotes, usage). Créer une structure génère le lien
 * d'invitation du coach, à lui envoyer.
 */
export function TeamAdminPanel({ token }: { token: string }) {
  const [data, setData] = useState<{ enabled: boolean; structures: AdminStructure[]; requests: AdminContactRequest[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draftFrom, setDraftFrom] = useState<AdminContactRequest | null>(null);

  const load = useCallback(() => {
    getAdminTeam(token)
      .then(setData)
      .catch((e) => setError(e instanceof Error ? e.message : "Chargement impossible."));
  }, [token]);
  useEffect(load, [load]);

  if (error) return <p className="text-sm text-red-500">{error}</p>;
  if (!data) return <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />;

  const setStatus = async (r: AdminContactRequest, status: AdminContactRequest["status"]) => {
    await updateAdminRequest(r.id, { status }, token).catch(() => toast.error("Mise à jour impossible."));
    load();
  };

  return (
    <div className="flex flex-wrap gap-6">
      <div className="min-w-0 flex-[999_1_560px] space-y-6">
        {!data.enabled && (
          <p className="rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-400">
            Espace Team coupé : les demandes arrivent, mais coachs et pilotes ne voient encore rien. On l'allume quand tu
            valides (interrupteur <code>team_space</code>).
          </p>
        )}

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Demandes · {data.requests.length}</h2>
          {data.requests.length === 0 && <p className="text-sm text-muted-foreground">Aucune demande pour l'instant.</p>}
          {data.requests.map((r) => (
            <article key={r.id} className="space-y-2 rounded-2xl border border-border bg-card p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="flex-1 font-semibold">
                  {r.structure_name || r.name} · {KIND_LABEL[r.kind] ?? r.kind}
                  {r.pilots_estimate ? ` · ${r.pilots_estimate} pilotes` : ""}
                </p>
                <span
                  className={cn(
                    "rounded-full border px-2.5 py-0.5 text-xs font-semibold",
                    r.status === "nouvelle" ? "border-amber-500/50 text-amber-400" : "border-border text-muted-foreground",
                  )}
                >
                  {STATUS_LABEL[r.status]}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {r.name} · <a href={`mailto:${r.email}`}>{r.email}</a>
                {r.phone ? ` · ${r.phone}` : ""} · reçue le {fmt(r.created_at)}
              </p>
              {r.message && <p className="whitespace-pre-line text-sm">{r.message}</p>}
              <div className="flex flex-wrap gap-2 pt-1">
                {r.status !== "signee" && (
                  <Button size="sm" className="h-9 gradient-primary text-white" onClick={() => setDraftFrom(r)}>
                    Créer la structure
                  </Button>
                )}
                {r.status === "nouvelle" && (
                  <Button size="sm" variant="outline" className="h-9" onClick={() => setStatus(r, "en_discussion")}>
                    En discussion
                  </Button>
                )}
                {r.status !== "sans_suite" && r.status !== "signee" && (
                  <Button size="sm" variant="ghost" className="h-9 text-muted-foreground" onClick={() => setStatus(r, "sans_suite")}>
                    Sans suite
                  </Button>
                )}
              </div>
            </article>
          ))}
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-lg font-semibold">Structures · {data.structures.length}</h2>
          <div className="overflow-x-auto rounded-2xl border border-border">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-card text-left text-muted-foreground">
                <tr>
                  <th className="p-3 font-medium">Structure</th>
                  <th className="p-3 font-medium">Statut</th>
                  <th className="p-3 font-medium">Coachs</th>
                  <th className="p-3 font-medium">Pilotes</th>
                  <th className="p-3 font-medium">Analyses (30 j)</th>
                  <th className="p-3 font-medium">Fin</th>
                  <th className="p-3" />
                </tr>
              </thead>
              <tbody>
                {data.structures.map((s) => (
                  <StructureRow key={s.id} s={s} token={token} onChange={load} />
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <CreateStructureForm token={token} from={draftFrom} onCreated={load} />
    </div>
  );
}

function StructureRow({ s, token, onChange }: { s: AdminStructure; token: string; onChange: () => void }) {
  const end = s.status === "essai" ? s.trial_until : s.contract_until;
  const patch = async (p: Record<string, unknown>) => {
    await updateAdminStructure(s.id, p, token).catch(() => toast.error("Mise à jour impossible."));
    onChange();
  };
  const extend = () => {
    const base = s.trial_until && new Date(s.trial_until) > new Date() ? new Date(s.trial_until) : new Date();
    base.setDate(base.getDate() + 14);
    patch({ trial_until: base.toISOString() });
  };
  return (
    <tr className="border-t border-border align-top">
      <td className="p-3">
        <span className="font-medium">{s.name}</span>
        {s.coach_invites.length > 0 && (
          <span className="block text-xs text-muted-foreground">Invitation coach en attente : {s.coach_invites[0].code}</span>
        )}
      </td>
      <td className={cn("p-3", s.status === "essai" ? "text-amber-400" : s.live ? "text-green-500" : "text-muted-foreground")}>
        {STRUCT_LABEL[s.status] ?? s.status}
      </td>
      <td className="p-3">
        {s.coaches}
        {s.max_coaches ? ` / ${s.max_coaches}` : ""}
      </td>
      <td className="p-3">
        {s.pilots}
        {s.max_pilots ? ` / ${s.max_pilots}` : ""}
      </td>
      <td className="p-3">{s.analyses_30d}</td>
      <td className="p-3">{fmt(end)}</td>
      <td className="p-3">
        <div className="flex flex-wrap justify-end gap-1.5">
          {s.status === "essai" && (
            <Button size="sm" variant="outline" className="h-8" onClick={extend}>
              +2 semaines
            </Button>
          )}
          {s.status !== "active" && (
            <Button size="sm" variant="outline" className="h-8" onClick={() => patch({ status: "active", contract_until: null })}>
              Activer
            </Button>
          )}
          {s.status !== "suspendue" && s.status !== "terminee" && (
            <Button size="sm" variant="ghost" className="h-8 text-muted-foreground" onClick={() => patch({ status: "suspendue" })}>
              Suspendre
            </Button>
          )}
        </div>
      </td>
    </tr>
  );
}

function CreateStructureForm({
  token,
  from,
  onCreated,
}: {
  token: string;
  from: AdminContactRequest | null;
  onCreated: () => void;
}) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState("ecole");
  const [weeks, setWeeks] = useState(4);
  const [maxPilots, setMaxPilots] = useState("");
  const [maxCoaches, setMaxCoaches] = useState("");
  const [maxKarts, setMaxKarts] = useState("");
  const [coachEmail, setCoachEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [link, setLink] = useState<string | null>(null);

  useEffect(() => {
    if (!from) return;
    setName(from.structure_name || from.name);
    setKind(["ecole", "club", "coach"].includes(from.kind) ? from.kind : "ecole");
    setCoachEmail(from.email);
    setLink(null);
  }, [from]);

  const n = (v: string) => (v.trim() ? Math.max(1, parseInt(v, 10) || 0) || null : null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const r = await createAdminStructure(
        {
          name,
          kind,
          trial_weeks: weeks,
          max_pilots: n(maxPilots),
          max_coaches: n(maxCoaches),
          max_karts: n(maxKarts),
          coach_email: coachEmail || undefined,
          contact_request_id: from?.id ?? null,
        },
        token,
      );
      setLink(r.coach_link);
      onCreated();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Création impossible.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <aside className="flex-[1_1_320px] self-start rounded-2xl bg-gradient-to-br from-primary to-orange-500 p-px">
      <form onSubmit={submit} className="space-y-3 rounded-[15px] bg-card p-5">
        <h2 className="font-display text-lg font-semibold">Nouvelle structure</h2>
        <div className="space-y-1.5">
          <Label htmlFor="ts-name">Nom</Label>
          <Input id="ts-name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            ["ecole", "École"],
            ["club", "Club"],
            ["coach", "Coach"],
          ].map(([v, l]) => (
            <button
              key={v}
              type="button"
              aria-pressed={kind === v}
              onClick={() => setKind(v)}
              className={cn(
                "h-9 rounded-lg px-3 text-sm",
                kind === v ? "gradient-primary font-semibold text-white" : "border border-border text-muted-foreground",
              )}
            >
              {l}
            </button>
          ))}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ts-weeks">Essai (semaines)</Label>
          <Input id="ts-weeks" type="number" min={1} max={52} value={weeks} onChange={(e) => setWeeks(parseInt(e.target.value, 10) || 4)} />
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1.5">
            <Label htmlFor="ts-p">Pilotes max</Label>
            <Input id="ts-p" inputMode="numeric" placeholder="libre" value={maxPilots} onChange={(e) => setMaxPilots(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ts-c">Coachs max</Label>
            <Input id="ts-c" inputMode="numeric" placeholder="libre" value={maxCoaches} onChange={(e) => setMaxCoaches(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="ts-k">Karts max</Label>
            <Input id="ts-k" inputMode="numeric" placeholder="libre" value={maxKarts} onChange={(e) => setMaxKarts(e.target.value)} />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="ts-email">Email du coach</Label>
          <Input id="ts-email" type="email" value={coachEmail} onChange={(e) => setCoachEmail(e.target.value)} />
          <p className="text-xs text-muted-foreground">Le lien d'invitation ne marchera qu'avec un compte à cette adresse.</p>
        </div>
        <Button type="submit" className="h-11 w-full gradient-primary text-white" disabled={busy || !name.trim()}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Créer et obtenir le lien coach"}
        </Button>
        {link && (
          <div className="space-y-2 rounded-xl border border-green-500/40 bg-green-500/10 p-3 text-sm">
            <p className="font-semibold text-green-500">Structure créée. Envoie ce lien au coach :</p>
            <p className="break-all">{link}</p>
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="h-9 gap-1.5"
              onClick={() => navigator.clipboard?.writeText(link).then(() => toast.success("Lien copié"))}
            >
              <Copy className="h-3.5 w-3.5" /> Copier
            </Button>
          </div>
        )}
      </form>
    </aside>
  );
}
