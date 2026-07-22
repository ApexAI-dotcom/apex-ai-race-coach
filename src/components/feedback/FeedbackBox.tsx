import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { MessageSquarePlus, Lightbulb, Bug, HelpCircle, Loader2, Lock, CheckCircle2 } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "idea", label: "Idée d'amélioration", icon: Lightbulb },
  { value: "bug", label: "Bug rencontré", icon: Bug },
  { value: "question", label: "Question", icon: HelpCircle },
  { value: "other", label: "Autre", icon: MessageSquarePlus },
];

const STATUS_LABELS: Record<string, string> = {
  new: "Envoyé",
  read: "Lu",
  in_progress: "En cours",
  done: "Traité",
  archived: "Archivé",
};
const STATUS_STYLES: Record<string, string> = {
  new: "bg-muted text-muted-foreground border-border",
  read: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  in_progress: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  done: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  archived: "bg-muted text-muted-foreground border-border",
};

export function FeedbackBox() {
  const { session } = useAuth();
  const token = session?.access_token;
  const [messages, setMessages] = useState<any[]>([]);
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [category, setCategory] = useState("idea");
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");

  const fetchMine = async () => {
    if (!token) return;
    try {
      const res = await api.getMyFeedback(token);
      setMessages(res.messages || []);
    } catch {
      setMessages([]);
    }
  };

  useEffect(() => {
    fetchMine();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const handleSend = async () => {
    if (!token || !subject.trim() || !body.trim()) {
      toast.error("Renseignez un sujet et un message.");
      return;
    }
    setSending(true);
    try {
      await api.sendFeedback(token, {
        category,
        subject: subject.trim(),
        body: body.trim(),
        context: { page: window.location.pathname },
      });
      toast.success("Merci ! Votre retour a bien été transmis.");
      setSubject("");
      setBody("");
      setCategory("idea");
      setOpen(false);
      fetchMine();
    } catch (e: any) {
      toast.error(e.message || "Envoi impossible.");
    } finally {
      setSending(false);
    }
  };

  if (!token) return null;

  return (
    <Card className="bg-card border-border rounded-2xl">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <div>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MessageSquarePlus className="w-5 h-5 text-primary" />
            Boîte à recommandations
          </CardTitle>
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1.5">
            <Lock className="w-3 h-3" />
            Échange privé avec l'équipe ApexAI — votre avis de pilote nous guide.
          </p>
        </div>
        <Button
          size="sm"
          className="gap-2 rounded-full shrink-0"
          onClick={() => setOpen(true)}
        >
          <MessageSquarePlus className="w-4 h-4" />
          Proposer
        </Button>
      </CardHeader>

      {messages.length > 0 && (
        <CardContent className="space-y-2 pt-0">
          {messages.slice(0, 4).map((m) => {
            const Cat = CATEGORIES.find((c) => c.value === m.category)?.icon || MessageSquarePlus;
            return (
              <div key={m.id} className="p-3 rounded-xl border border-border bg-background/40">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <Cat className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {new Date(m.created_at).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <Badge className={`border rounded-full text-[10px] shrink-0 ${STATUS_STYLES[m.status] || ""}`}>
                    {STATUS_LABELS[m.status] || m.status}
                  </Badge>
                </div>
                {m.admin_reply && (
                  <div className="mt-2.5 pl-6 border-l-2 border-primary/40">
                    <p className="text-[10px] uppercase tracking-wider text-primary font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Réponse ApexAI
                    </p>
                    <p className="text-xs text-foreground mt-1 whitespace-pre-wrap">{m.admin_reply}</p>
                  </div>
                )}
              </div>
            );
          })}
        </CardContent>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Partager une recommandation</DialogTitle>
            <DialogDescription>
              Une idée, un bug rencontré en piste, une question ? Ce message n'est
              lu que par l'équipe ApexAI — il reste confidentiel.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de retour</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Sujet</Label>
              <Input
                value={subject}
                maxLength={140}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Ex : Ajouter les pressions par train de pneus"
              />
            </div>

            <div className="space-y-2">
              <Label>Votre message</Label>
              <Textarea
                value={body}
                maxLength={4000}
                rows={6}
                onChange={(e) => setBody(e.target.value)}
                placeholder="Décrivez votre idée ou le problème rencontré, avec le contexte (circuit, session, matériel) si utile."
              />
              <p className="text-[11px] text-muted-foreground text-right">{body.length}/4000</p>
            </div>

            <Button className="w-full gap-2" onClick={handleSend} disabled={sending}>
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquarePlus className="w-4 h-4" />}
              Envoyer à l'équipe
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
