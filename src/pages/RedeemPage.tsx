import { useState, useEffect, useRef } from "react";
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
import { clearPendingPassCode, formatPassDuration, getPendingPassCode, setPendingPassCode } from "@/lib/paddockPass";
import { supabase } from "@/lib/supabase";

export default function RedeemPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { session, user, isAuthenticated, loading } = useAuth();
  const { fetchSubscription } = useSubscription();
  const token = session?.access_token;

  const [code, setCode] = useState((params.get("code") || "").toUpperCase());
  const [redeeming, setRedeeming] = useState(false);
  const [done, setDone] = useState<any>(null);

  // Code du QR : gardé (14 jours, et dans le compte à l'inscription) pour être
  // activé tout seul après la connexion, même si le pilote passe par
  // l'inscription et la confirmation du mail.
  useEffect(() => {
    const c = params.get("code");
    if (c) setPendingPassCode(c);
  }, [params]);

  // Connecté sans code dans l'URL : on reprend le code en attente.
  useEffect(() => {
    if (isAuthenticated && !code) {
      const pending = getPendingPassCode() || (user?.user_metadata?.pending_pass_code as string | undefined) || null;
      if (pending) setCode(pending);
    }
  }, [isAuthenticated, code, user]);

  const redeem = async (value = code) => {
    if (!token || !value.trim()) return;
    setRedeeming(true);
    try {
      const res = await api.redeemPaddockPass(token, value.trim().toUpperCase());
      setDone(res);
      clearPendingPassCode();
      if (user?.user_metadata?.pending_pass_code) {
        await supabase.auth.updateUser({ data: { pending_pass_code: null } }).catch(() => {});
      }
      await fetchSubscription();
      toast.success("Paddock Pass activé !");
    } catch (e: any) {
      if (/déjà/i.test(e?.message || "")) clearPendingPassCode();
      toast.error(e.message || "Code invalide.");
    } finally {
      setRedeeming(false);
    }
  };

  // Connecté avec un code (QR scanné, ou retour après inscription) : activation
  // automatique, une seule fois. Le bouton reste là si elle échoue.
  const autoTried = useRef(false);
  useEffect(() => {
    if (!isAuthenticated || !token || !code || autoTried.current || done) return;
    autoTried.current = true;
    redeem(code);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, token, code]);

  const duration = done?.duration_hours ? formatPassDuration(Number(done.duration_hours)) : null;
  const until = done?.until
    ? new Date(done.until).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })
    : null;

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
            {/* La durée dépend du code (24 h à 3 mois) : on ne la connaît qu'à l'activation. */}
            Débloque toute la puissance d'ApexAI Premium
            {duration ? <> pendant {duration}</> : " pour une durée limitée"}.
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
                  {duration ? <> pendant {duration}</> : null}
                  {until ? <>, jusqu'au {until}</> : null}. Profites-en pour tester toutes les fonctionnalités en piste.
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
                  <Link to="/login?mode=signup" state={{ from: { pathname: "/redeem" } }}><Sparkles className="w-4 h-4" /> Créer mon compte</Link>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <Link to="/login" state={{ from: { pathname: "/redeem" } }}><LogIn className="w-4 h-4" /> Se connecter</Link>
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
              <Button onClick={() => redeem()} disabled={redeeming || !code.trim()} className="w-full gap-2">
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
