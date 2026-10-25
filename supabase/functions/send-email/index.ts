/**
 * send-email — « Send Email Hook » de Supabase Auth.
 *
 * Supabase n'envoie plus lui-même les mails de compte : il appelle cette
 * fonction (requête signée), qui construit le mail ApexAI et l'envoie par
 * l'API Resend.
 *
 * Les liens pointent vers la page /auth/confirm du site (token_hash), et non
 * plus vers l'URL de vérification de Supabase :
 *   - ils marchent même si le pilote ouvre le mail sur un autre appareil que
 *     celui où il s'est inscrit (le flux PKCE échouait dans ce cas) ;
 *   - un lien déjà utilisé affiche une page claire au lieu d'une erreur brute.
 *
 * Secrets (Edge Functions → Secrets) : RESEND_API_KEY, SEND_EMAIL_HOOK_SECRET.
 * Facultatifs : EMAIL_FROM, EMAIL_REPLY_TO.
 */
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0";
import { type EmailData, type EmailKind, renderEmail } from "../_shared/emails.ts";
import { sendWithResend } from "../_shared/resend.ts";

const HOOK_SECRET = (Deno.env.get("SEND_EMAIL_HOOK_SECRET") ?? "").replace("v1,whsec_", "");
const DEFAULT_SITE = "https://www.apexai.racing";

// Origines vers lesquelles un lien de mail peut renvoyer : le site, ses
// aperçus Vercel et le poste de développement. Toute autre origine retombe
// sur le site.
const ALLOWED_ORIGINS = [
  /^https:\/\/(www\.)?apexai\.racing$/,
  /^https:\/\/apex-ai-race-coach[a-z0-9-]*\.vercel\.app$/,
  /^http:\/\/localhost(:\d+)?$/,
];

interface HookPayload {
  user: {
    id: string;
    email: string;
    new_email?: string;
    user_metadata?: Record<string, unknown>;
  };
  email_data: {
    token: string;
    token_hash: string;
    redirect_to: string;
    email_action_type: string;
    site_url: string;
    token_new: string;
    token_hash_new: string;
    old_email?: string;
    provider?: string;
    factor_type?: string;
  };
}

function safeUrl(raw: string | undefined): URL | null {
  if (!raw) return null;
  try {
    const u = new URL(raw);
    return ALLOWED_ORIGINS.some((re) => re.test(u.origin)) ? u : null;
  } catch {
    return null;
  }
}

/** Origine du site et page de destination après la vérification. */
function target(email_data: HookPayload["email_data"], fallbackNext: string) {
  const redirect = safeUrl(email_data.redirect_to);
  const site = redirect?.origin ?? safeUrl(email_data.site_url)?.origin ?? DEFAULT_SITE;
  let next = fallbackNext;
  if (redirect && redirect.pathname && redirect.pathname !== "/") {
    next = redirect.pathname + redirect.search;
  }
  return { site, next };
}

function confirmUrl(site: string, tokenHash: string, type: string, next: string) {
  const q = new URLSearchParams({ token_hash: tokenHash, type, next });
  return `${site}/auth/confirm?${q.toString()}`;
}

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function hookError(status: number, message: string) {
  return json(status, { error: { http_code: status, message } });
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return hookError(405, "Méthode non autorisée");
  if (!HOOK_SECRET) return hookError(500, "SEND_EMAIL_HOOK_SECRET manquant");

  const raw = await req.text();
  let payload: HookPayload;
  try {
    payload = new Webhook(HOOK_SECRET).verify(raw, Object.fromEntries(req.headers)) as HookPayload;
  } catch {
    return hookError(401, "Signature invalide");
  }

  const { user, email_data } = payload;
  const action = email_data.email_action_type;
  const webhookId = req.headers.get("webhook-id") ?? crypto.randomUUID();

  // Chaque entrée : à qui, quel mail, avec quelles données.
  const sends: { to: string; kind: EmailKind; data: EmailData }[] = [];

  switch (action) {
    case "signup": {
      const { site, next } = target(email_data, "/dashboard");
      sends.push({ to: user.email, kind: "signup", data: { url: confirmUrl(site, email_data.token_hash, "signup", next) } });
      break;
    }
    case "invite": {
      const { site, next } = target(email_data, "/dashboard");
      sends.push({ to: user.email, kind: "invite", data: { url: confirmUrl(site, email_data.token_hash, "invite", next) } });
      break;
    }
    case "magiclink":
    case "email": {
      const { site, next } = target(email_data, "/dashboard");
      sends.push({ to: user.email, kind: "magiclink", data: { url: confirmUrl(site, email_data.token_hash, "magiclink", next) } });
      break;
    }
    case "recovery": {
      const { site } = target(email_data, "/reset-password");
      // La page de destination est imposée : un lien de récupération mène
      // toujours au choix du nouveau mot de passe.
      sends.push({ to: user.email, kind: "recovery", data: { url: confirmUrl(site, email_data.token_hash, "recovery", "/reset-password") } });
      break;
    }
    case "email_change": {
      const { site } = target(email_data, "/parametres");
      const newEmail = user.new_email ?? "";
      // Attention : les noms sont inversés côté Supabase (voir la doc du hook).
      //   token_hash_new → adresse ACTUELLE ; token_hash → NOUVELLE adresse.
      if (email_data.token_hash_new && email_data.token_hash) {
        sends.push({
          to: user.email,
          kind: "email_change_current",
          data: { url: confirmUrl(site, email_data.token_hash_new, "email_change", "/parametres"), oldEmail: user.email, newEmail },
        });
        sends.push({
          to: newEmail,
          kind: "email_change_new",
          data: { url: confirmUrl(site, email_data.token_hash, "email_change", "/parametres"), oldEmail: user.email },
        });
      } else {
        const hash = email_data.token_hash || email_data.token_hash_new;
        sends.push({
          to: newEmail || user.email,
          kind: "email_change_new",
          data: { url: confirmUrl(site, hash, "email_change", "/parametres"), oldEmail: user.email },
        });
      }
      break;
    }
    case "reauthentication":
      sends.push({ to: user.email, kind: "reauthentication", data: { code: email_data.token } });
      break;
    case "password_changed_notification":
      sends.push({ to: user.email, kind: "password_changed_notification", data: {} });
      break;
    case "email_changed_notification":
      sends.push({
        to: email_data.old_email || user.email,
        kind: "email_changed_notification",
        data: { oldEmail: email_data.old_email, newEmail: user.email },
      });
      break;
    case "identity_linked_notification":
    case "identity_unlinked_notification":
      sends.push({ to: user.email, kind: action, data: { provider: email_data.provider } });
      break;
    case "phone_changed_notification":
      sends.push({ to: user.email, kind: "security_notification", data: { detail: "Le numéro de téléphone de ton compte ApexAI a été modifié." } });
      break;
    case "mfa_factor_enrolled_notification":
      sends.push({ to: user.email, kind: "security_notification", data: { detail: "Une méthode de double authentification a été ajoutée à ton compte ApexAI." } });
      break;
    case "mfa_factor_unenrolled_notification":
      sends.push({ to: user.email, kind: "security_notification", data: { detail: "Une méthode de double authentification a été retirée de ton compte ApexAI." } });
      break;
    default:
      // Type inconnu (ajout futur de Supabase) : on ne bloque pas le pilote.
      console.warn("send-email: type non géré", action);
      return json(200, {});
  }

  try {
    for (const [i, s] of sends.entries()) {
      if (!s.to) continue;
      const mail = renderEmail(s.kind, s.data);
      await sendWithResend({ to: s.to, ...mail, tag: s.kind, idempotencyKey: `${webhookId}-${i}` });
    }
  } catch (e) {
    console.error("send-email: échec d'envoi", action, String(e));
    return hookError(500, "Le mail n'a pas pu être envoyé. Réessaie dans un instant.");
  }

  return json(200, {});
});
