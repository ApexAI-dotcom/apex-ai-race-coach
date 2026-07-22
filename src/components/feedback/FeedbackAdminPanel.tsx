import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Inbox, Loader2, Send, Lightbulb, Bug, HelpCircle, MessageSquarePlus } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const CAT_ICONS: Record<string, any> = {
  idea: Lightbulb, bug: Bug, question: HelpCircle, other: MessageSquarePlus,
};
const STATUSES = [
  { value: "new", label: "Nouveau" },
  { value: "read", label: "Lu" },
  { value: "in_progress", label: "En cours" },
  { value: "done", label: "Traité" },
  { value: "archived", label: "Archivé" },
];
const STATUS_STYLES: Record<string, string> = {
  new: "bg-primary/10 text-primary border-primary/20",
  read: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  in_progress: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  done: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  archived: "bg-muted text-muted-foreground border-border",
};

export function FeedbackAdminPanel() {
  const { session } = useAuth();
  const token = session?.access_token;
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [replies, setReplies] = useState<Record<string, string>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const fetchAll = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await api.getAllFeedback(token);
      setMessages(res.messages || []);
    } catch (e: any) {
      toast.error(e.message || "Lecture impossible.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const save = async (id: string, payload: { status?: string; adminReply?: string }) => {
    if (!token) return;
    setSavingId(id);
    try {
      const res = await api.updateFeedback(token, id, payload);
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, ...res.message } : m)));
      toast.success("Retour mis à jour.");
    } catch (e: any) {
      toast.error(e.message || "Mise à jour impossible.");
    } finally {
      setSavingId(null);
    }
  };

  const pending = messages.filter((m) => m.status === "new").length;

  return (
    <Card className="bg-card border-border rounded-2xl">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Inbox className="w-5 h-5 text-primary" />
          Retours pilotes
          {pending > 0 && (
            <Badge className="bg-primary text-primary-foreground border-0 rounded-full ml-1">
              {pending} nouveau{pending > 1 ? "x" : ""}
            </Badge>
          )}
        </CardTitle>
        <Button size="sm" variant="outline" onClick={fetchAll} className="rounded-full">
          Actualiser
        </Button>
      </CardHeader>

      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex justify-center p-6"><Loader2 className="w-5 h-5 animate-spin text-primary" /></div>
        ) : messages.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">Aucun retour pour le moment.</p>
        ) : (
          messages.map((m) => {
            const Icon = CAT_ICONS[m.category] || MessageSquarePlus;
            return (
              <div key={m.id} className="p-4 rounded-xl border border-border bg-background/40 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 text-primary shrink-0 mt-1" />
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground">{m.subject}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">
                        {m.user_email || m.user_id?.slice(0, 8)} ·{" "}
                        {new Date(m.created_at).toLocaleString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <Select value={m.status} onValueChange={(v) => save(m.id, { status: v })}>
                    <SelectTrigger className={`h-7 w-[120px] text-xs border rounded-full shrink-0 ${STATUS_STYLES[m.status] || ""}`}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s.value} value={s.value} className="text-xs">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <p className="text-sm text-foreground whitespace-pre-wrap pl-6.5">{m.body}</p>

                {m.admin_reply && (
                  <div className="pl-6 border-l-2 border-emerald-500/40">
                    <p className="text-[10px] uppercase tracking-wider text-emerald-500 font-semibold">
                      Réponse envoyée
                    </p>
                    <p className="text-xs text-foreground mt-1 whitespace-pre-wrap">{m.admin_reply}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <Textarea
                    rows={2}
                    placeholder={m.admin_reply ? "Modifier la réponse…" : "Répondre au pilote…"}
                    value={replies[m.id] ?? ""}
                    onChange={(e) => setReplies((p) => ({ ...p, [m.id]: e.target.value }))}
                    className="text-sm"
                  />
                  <Button
                    size="icon"
                    className="shrink-0 h-auto"
                    disabled={savingId === m.id || !(replies[m.id] || "").trim()}
                    onClick={() => {
                      save(m.id, { adminReply: replies[m.id] });
                      setReplies((p) => ({ ...p, [m.id]: "" }));
                    }}
                  >
                    {savingId === m.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
