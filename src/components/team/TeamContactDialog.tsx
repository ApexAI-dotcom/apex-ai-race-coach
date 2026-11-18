import { useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { sendTeamContact, type ContactPayload } from "@/lib/team";

const KINDS: { v: NonNullable<ContactPayload["kind"]>; label: string }[] = [
  { v: "ecole", label: "École" },
  { v: "club", label: "Club" },
  { v: "coach", label: "Coach" },
  { v: "autre", label: "Autre" },
];
const SIZES = ["Moins de 10", "10 à 25", "25 à 50", "Plus de 50"];

/**
 * « Contactez-nous » de l'offre Team (sur devis). La demande arrive chez
 * Yanis par mail et dans l'admin ; il crée ensuite la structure et l'essai.
 */
export function TeamContactDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { user, session } = useAuth();
  const [form, setForm] = useState<ContactPayload>({
    name: (user?.user_metadata?.full_name as string) || "",
    email: user?.email || "",
    kind: "ecole",
    pilots_estimate: SIZES[1],
  });
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof ContactPayload) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!form.name.trim() || !form.email.trim()) {
      setError("Indique ton nom et ton email.");
      return;
    }
    setSending(true);
    try {
      await sendTeamContact(form, session?.access_token);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Envoi impossible. Réessaie dans un instant.");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-lg">
        {done ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-500" />
            <DialogTitle className="font-display text-xl">Demande envoyée</DialogTitle>
            <DialogDescription>
              On te répond sous 48 h avec une proposition et un essai pour ta structure.
            </DialogDescription>
            <Button className="mt-2" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="font-display text-xl">Team · sur devis</DialogTitle>
              <DialogDescription>
                Écoles, clubs et coachs : dis-nous qui tu es, on revient vers toi avec un essai pour ta structure.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={submit} className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="tc-name">Ton nom</Label>
                <Input id="tc-name" value={form.name} onChange={set("name")} autoComplete="name" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tc-structure">Structure</Label>
                <Input
                  id="tc-structure"
                  value={form.structure_name || ""}
                  onChange={set("structure_name")}
                  placeholder="École, club, ou ton nom de coach"
                />
              </div>
              <fieldset className="space-y-1.5">
                <legend className="text-sm font-medium">Type</legend>
                <div className="flex flex-wrap gap-2">
                  {KINDS.map((k) => (
                    <button
                      key={k.v}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, kind: k.v }))}
                      aria-pressed={form.kind === k.v}
                      className={
                        form.kind === k.v
                          ? "h-10 rounded-lg px-3 text-sm font-semibold gradient-primary text-white"
                          : "h-10 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:text-foreground"
                      }
                    >
                      {k.label}
                    </button>
                  ))}
                </div>
              </fieldset>
              <fieldset className="space-y-1.5">
                <legend className="text-sm font-medium">Nombre de pilotes</legend>
                <div className="flex flex-wrap gap-2">
                  {SIZES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, pilots_estimate: s }))}
                      aria-pressed={form.pilots_estimate === s}
                      className={
                        form.pilots_estimate === s
                          ? "h-10 rounded-lg px-3 text-sm font-semibold gradient-primary text-white"
                          : "h-10 rounded-lg border border-border px-3 text-sm text-muted-foreground hover:text-foreground"
                      }
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </fieldset>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="tc-email">Email</Label>
                  <Input id="tc-email" type="email" value={form.email} onChange={set("email")} autoComplete="email" required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="tc-phone">Téléphone (facultatif)</Label>
                  <Input id="tc-phone" type="tel" value={form.phone || ""} onChange={set("phone")} autoComplete="tel" />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tc-msg">Ton besoin (facultatif)</Label>
                <Textarea id="tc-msg" rows={3} value={form.message || ""} onChange={set("message")} />
              </div>
              {/* Champ piège : invisible pour un humain, rempli par les robots. */}
              <input
                type="text"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden="true"
                className="hidden"
                value={form.website || ""}
                onChange={set("website")}
              />
              {error && <p className="text-sm text-red-500">{error}</p>}
              <Button type="submit" className="h-12 w-full gradient-primary text-white" disabled={sending}>
                {sending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Envoyer ma demande"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Tes coordonnées servent uniquement à te répondre.
              </p>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
