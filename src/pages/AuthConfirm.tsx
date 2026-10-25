import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import type { EmailOtpType } from "@supabase/supabase-js";
import { AlertCircle, CheckCircle2, Loader2, MailCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { Layout } from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

/**
 * /auth/confirm — page d'arrivée de tous les liens envoyés par mail
 * (confirmation d'inscription, mot de passe oublié, lien de connexion,
 * changement d'adresse, invitation).
 *
 * Le lien porte un token_hash, vérifié ici avec verifyOtp : contrairement au
 * flux PKCE, ça marche même si le mail est ouvert sur un autre appareil que
 * celui de l'inscription. Un lien expiré ou déjà utilisé affiche un message
 * clair, avec de quoi recevoir un nouveau lien.
 */

const TYPES: EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

const COPY: Record<string, { pending: string; done: string }> = {
  signup: { pending: "Confirmation de ton adresse…", done: "Adresse confirmée, bienvenue sur ApexAI." },
  email: { pending: "Connexion en cours…", done: "C'est bon, tu es connecté." },
  magiclink: { pending: "Connexion en cours…", done: "C'est bon, tu es connecté." },
  invite: { pending: "Activation de ton compte…", done: "Ton compte est actif." },
  recovery: { pending: "Vérification du lien…", done: "Lien vérifié, choisis ton nouveau mot de passe." },
  email_change: { pending: "Confirmation de l'adresse…", done: "Adresse confirmée." },
};

/** Ne suit que des chemins internes (pas d'URL externe dans « next »). */
function safeNext(raw: string | null, fallback: string) {
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return fallback;
  return raw;
}

type State = "pending" | "done" | "error";

export default function AuthConfirm() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const tokenHash = params.get("token_hash");
  const rawType = params.get("type") ?? "";
  const type = (TYPES.includes(rawType as EmailOtpType) ? rawType : "email") as EmailOtpType;
  const fallback = type === "recovery" ? "/reset-password" : type === "email_change" ? "/parametres" : "/dashboard";
  const next = type === "recovery" ? "/reset-password" : safeNext(params.get("next"), fallback);
  const copy = COPY[type] ?? COPY.email;

  const [state, setState] = useState<State>("pending");
  const [alreadySignedIn, setAlreadySignedIn] = useState(false);
  const [email, setEmail] = useState("");
  const [resent, setResent] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const started = useRef(false);

  useEffect(() => {
    // Une seule vérification, même si React monte deux fois la page.
    if (started.current) return;
    started.current = true;

    (async () => {
      if (!tokenHash) {
        setState("error");
        return;
      }
      const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
      if (!error) {
        setState("done");
        setTimeout(() => navigate(next, { replace: true }), 1200);
        return;
      }
      // Lien déjà utilisé (souvent : un deuxième clic) mais session ouverte :
      // on n'affiche pas d'erreur inutile.
      const { data } = await supabase.auth.getSession();
      if (data.session && type !== "recovery") {
        setAlreadySignedIn(true);
        setState("done");
        setTimeout(() => navigate(next, { replace: true }), 1200);
        return;
      }
      setState("error");
    })();
  }, [tokenHash, type, next, navigate]);

  const resend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setResent("sending");
    const target = email.trim();
    const { error } =
      type === "recovery"
        ? await supabase.auth.resetPasswordForEmail(target, { redirectTo: `${window.location.origin}/reset-password` })
        : type === "signup"
          ? await supabase.auth.resend({ type: "signup", email: target })
          : await supabase.auth.signInWithOtp({ email: target, options: { shouldCreateUser: false } });
    setResent(error ? "error" : "sent");
  };

  return (
    <Layout>
      <Helmet>
        <meta name="robots" content="noindex, nofollow" />
        <title>Vérification | ApexAI</title>
      </Helmet>
      <div className="container mx-auto flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center">
          {state === "pending" && (
            <>
              <Loader2 className="mx-auto h-9 w-9 animate-spin text-primary" aria-hidden="true" />
              <p className="mt-5 font-display text-lg font-semibold text-foreground">{copy.pending}</p>
            </>
          )}

          {state === "done" && (
            <>
              <CheckCircle2 className="mx-auto h-10 w-10 text-green-500" aria-hidden="true" />
              <p className="mt-5 font-display text-lg font-semibold text-foreground">
                {alreadySignedIn ? "Ce lien a déjà servi, et tu es bien connecté." : copy.done}
              </p>
              <p className="mt-2 text-sm text-muted-foreground">Redirection…</p>
            </>
          )}

          {state === "error" && (
            <>
              <AlertCircle className="mx-auto h-10 w-10 text-primary" aria-hidden="true" />
              <h1 className="mt-5 font-display text-xl font-bold text-foreground">Ce lien n'est plus valable</h1>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Il a expiré ou il a déjà été utilisé. Indique ton adresse : on t'en envoie un nouveau.
              </p>

              {resent === "sent" ? (
                <div className="mt-6 flex items-center justify-center gap-2 rounded-xl border border-border bg-secondary/40 px-4 py-3 text-sm text-foreground">
                  <MailCheck className="h-4 w-4 text-green-500" aria-hidden="true" />
                  Nouveau lien envoyé, regarde ta boîte mail.
                </div>
              ) : (
                <form onSubmit={resend} className="mt-6 flex flex-col gap-3">
                  <Input
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="ton@email.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="bg-secondary/50"
                    aria-label="Ton adresse e-mail"
                  />
                  <Button type="submit" disabled={resent === "sending"}>
                    {resent === "sending" ? <Loader2 className="h-4 w-4 animate-spin" /> : "Recevoir un nouveau lien"}
                  </Button>
                  {resent === "error" && (
                    <p className="text-xs text-primary">L'envoi n'a pas marché. Attends une minute et réessaie.</p>
                  )}
                </form>
              )}

              <Link to="/login" className="mt-5 inline-block text-sm font-semibold text-primary hover:underline">
                Aller à la connexion
              </Link>
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
