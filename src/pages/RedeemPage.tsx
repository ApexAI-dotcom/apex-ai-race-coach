import { useState, useEffect } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { Layout } from "@/components/layout/Layout";
import { PageMeta } from "@/components/seo/PageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Ticket, Loader2, CheckCircle2, Sparkles, LogIn } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { toast } from "sonner";

export default function RedeemPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { session, isAuthenticated, loading } = useAuth();
  const { refresh } = useSubscription() as any;
  const token = session?.access_token;

  const [code, setCode] = useState((params.get("code") || "").toUpperCase());
  const [redeeming, setRedeeming] = useState(false);
  const [done, setDone] = useState<any>(null);

  // Si on arrive via QR sans être connecté, on garde le code pour après login
  useEffect(() => {
    const c = params.get("code");
    if (c && !isAuthenticated) {
      try { sessionStorage.setItem("apexai_pending_code", c.toUpperCase()); } catch { /* noop */ }
    }
  }, [params, isAuthenticated]);

  // Reprise automatique du code après connexion
  useEffect(() => {
    if (isAuthenticated && !code) {
      try {
        const pending = sessionStorage.getItem("apexai_pending_code");
        if (pending) setCode(pending);
      } catch { /* noop */ }
    }
  }, [isAuthenticated, code]);

  const redeem = async () => {
    if (!token || !code.trim()) return;
    setRedeeming(true);
    try {
      const res = await api.redeemPaddockPass(token, code.trim().toUpperCase());
      setDone(res);
      try { sessionStorage.removeItem("apexai_pending_code"); } catch { /* noop */ }
      if (typeof refresh === "function") refresh();
      toast.success("Paddock Pass activé !");
    } catch (e: any) {
      toast.error(e.message || "Code invalide.");
    } finally {
      setRedeeming(false);
    }
  };

  const hours = done?.duration_hours || 24;

  return (
    <Layout>
      <PageMeta title="Activer un Paddock Pass | ApexAI" description="Active ton Paddock Pass et débloque ApexAI Premium." />
      <div className="container max-w-md mx-auto px-4 py-16 min-h-[70vh] flex flex-col justify-center">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 mb-4">
            <Ticket className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground">Paddock Pass</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Débloque toute la puissance d'ApexAI Premium pendant {hours}h.
          </p>
        </div>

        {done ? (
          <Card className="bg-card border-primary/30 rounded-2xl text-center">
            <CardContent className="pt-8 pb-6 space-y-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto" />
              <div>
                <h2 className="text-xl font-bold text-foreground">Accès Premium activé !</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Ton offre <span className="text-primary font-semibold capitalize">{done.tier}</span> est active
                  pendant {hours}h. Profites-en pour tester toutes les fonctionnalités en piste.
                </p>
              </div>
              <div className="flex flex-col gap-2 pt-2">
                <Button onClick={() => navigate("/upload")} className="gap-2">
                  <Sparkles className="w-4 h-4" /> Lancer une analyse
                </Button>
                <Button variant="outline" onClick={() => navigate("/mon-kart")}>Configurer mon kart</Button>
              </div>
            </CardContent>
          </Card>
        ) : loading ? (
          <div className="flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : !isAuthenticated ? (
          <Card className="bg-card border-border rounded-2xl text-center">
            <CardContent className="pt-8 pb-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Connecte-toi ou crée ton compte pour activer ton Paddock Pass
                {code ? <> (<span className="font-mono text-primary">{code}</span>)</> : null}.
                Ton code est conservé.
              </p>
              <div className="flex flex-col gap-2">
                <Button asChild className="gap-2">
                  <Link to="/login?mode=signup"><Sparkles className="w-4 h-4" /> Créer mon compte</Link>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/login"><LogIn className="w-4 h-4" /> Se connecter</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="bg-card border-border rounded-2xl">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Entre ton code</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="PADDOCK-XXXXXX"
                className="font-mono text-center text-lg tracking-wider"
                onKeyDown={(e) => e.key === "Enter" && redeem()}
              />
              <Button onClick={redeem} disabled={redeeming || !code.trim()} className="w-full gap-2">
                {redeeming ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ticket className="w-4 h-4" />}
                Activer mon Paddock Pass
              </Button>
              <p className="text-[11px] text-muted-foreground text-center">
                Un pass par compte. À la fin de la période, tu retrouves ton offre actuelle.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
}
