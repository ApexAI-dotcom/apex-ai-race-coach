import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
import { redeemPaddockPass } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription.tsx";
import { clearPendingPassCode, formatPassDuration, getPendingPassCode } from "@/lib/paddockPass";

/**
 * Active tout seul le Paddock Pass scanné avant la création du compte, dès que
 * le pilote est connecté, quelle que soit la page où il arrive (accueil après
 * confirmation du mail, connexion Google…). Sans rien, rendu invisible.
 *
 * La page /redeem garde la main quand le pilote y est : elle affiche déjà
 * le résultat de l'activation.
 */
export function PendingPassRedeemer() {
  const { user, session } = useAuth();
  const { fetchSubscription } = useSubscription();
  const { pathname } = useLocation();
  const busy = useRef(false);
  const token = session?.access_token;

  useEffect(() => {
    if (!user || !token || busy.current || pathname.startsWith("/redeem")) return;
    const fromAccount = (user.user_metadata?.pending_pass_code as string | undefined) || null;
    const code = getPendingPassCode() || fromAccount;
    if (!code) return;

    busy.current = true;
    const forget = async () => {
      clearPendingPassCode();
      if (fromAccount) {
        await supabase.auth.updateUser({ data: { pending_pass_code: null } }).catch(() => {});
      }
    };

    (async () => {
      try {
        const res = await redeemPaddockPass(token, code);
        await forget();
        await fetchSubscription();
        const tier = res?.tier === "team" ? "Team" : "Racer";
        const duration = res?.duration_hours ? formatPassDuration(Number(res.duration_hours)) : null;
        toast.success(`Paddock Pass activé : ${tier}${duration ? ` pendant ${duration}` : ""}`, {
          description: "Analyses illimitées, Mon Kart et les réglages sont débloqués.",
          duration: 8000,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        // Déjà utilisé par ce pilote ou un pass déjà en cours : rien à signaler.
        if (/déjà/i.test(msg)) {
          await forget();
        } else if (/n'existe pas|plus actif|expiré|limite/i.test(msg)) {
          await forget();
          toast.error(`Code ${code} : ${msg}`);
        }
        // Erreur réseau ou serveur : on garde le code, nouvel essai au prochain passage.
      } finally {
        busy.current = false;
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, token, pathname]);

  return null;
}
