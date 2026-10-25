/**
 * account-events — appelée par le site juste après une VRAIE connexion
 * (mot de passe, Google, lien de connexion, confirmation d'inscription).
 *
 *  1. Mail de bienvenue, une seule fois par compte, pour les comptes créés
 *     depuis la mise en service (les pilotes inscrits avec Google n'avaient
 *     jusqu'ici aucun mail).
 *  2. Alerte « nouvelle connexion » quand le compte s'ouvre sur un appareil
 *     inconnu. Le tout premier appareil d'un compte est enregistré sans
 *     alerte ; trois alertes au plus par 24 h.
 *
 * L'appareil est identifié par un identifiant aléatoire gardé dans le
 * navigateur (pas d'empreinte, pas d'IP stockée).
 *
 * Sécurité : JWT obligatoire ; la fonction n'écrit qu'à l'adresse du compte
 * connecté. Tables : public.account_emails, public.user_devices (RLS sans
 * politique : accessibles au seul rôle service).
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { renderEmail } from "../_shared/emails.ts";
import { sendWithResend } from "../_shared/resend.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
// Les comptes créés avant la mise en service ne reçoivent pas de bienvenue.
const WELCOME_SINCE = new Date("2026-10-25T00:00:00Z");
const MAX_ALERTS_PER_DAY = 3;

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function json(status: number, body: unknown) {
  return new Response(JSON.stringify(body), { status, headers: { ...CORS, "Content-Type": "application/json" } });
}

/** « Chrome sur Windows », « Safari sur iPhone »… à partir du user-agent. */
export function describeDevice(ua: string): string {
  const s = ua || "";
  const browser =
    /Edg\//.test(s) ? "Edge"
    : /OPR\/|Opera/.test(s) ? "Opera"
    : /SamsungBrowser/.test(s) ? "Samsung Internet"
    : /Firefox\/|FxiOS/.test(s) ? "Firefox"
    : /CriOS|Chrome\//.test(s) ? "Chrome"
    : /Safari\//.test(s) ? "Safari"
    : "Navigateur";
  const os =
    /iPhone/.test(s) ? "iPhone"
    : /iPad/.test(s) ? "iPad"
    : /Android/.test(s) ? "Android"
    : /Windows/.test(s) ? "Windows"
    : /Mac OS X|Macintosh/.test(s) ? "Mac"
    : /CrOS/.test(s) ? "Chromebook"
    : /Linux/.test(s) ? "Linux"
    : "";
  return os ? `${browser} sur ${os}` : browser;
}

function frenchDate(d: Date): string {
  const s = new Intl.DateTimeFormat("fr-FR", {
    timeZone: "Europe/Paris",
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
  // Selon la version d'ICU : « … 2026 à 09:14 » ou « … 2026, 09:14 ».
  return / à \d/.test(s) ? s : s.replace(/[ ,]+(\d{2}:\d{2})$/, " à $1");
}

function firstName(meta: Record<string, unknown> | undefined): string | undefined {
  const raw = String(meta?.first_name ?? meta?.given_name ?? meta?.full_name ?? meta?.name ?? "").trim();
  if (!raw || raw.includes("@")) return undefined;
  const first = raw.split(/\s+/)[0];
  return first.length > 1 && first.length < 30 ? first.charAt(0).toUpperCase() + first.slice(1) : undefined;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });
  if (req.method !== "POST") return json(405, { error: "Méthode non autorisée" });

  const jwt = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: auth, error: authError } = await admin.auth.getUser(jwt);
  const user = auth?.user;
  if (authError || !user?.email) return json(401, { error: "Non connecté" });

  let body: { device_id?: string; reason?: string } = {};
  try {
    body = await req.json();
  } catch { /* corps vide */ }
  const deviceId = String(body.device_id ?? "").slice(0, 64);
  const isSignIn = body.reason === "signin";
  const ua = (req.headers.get("user-agent") ?? "").slice(0, 400);
  const result: Record<string, unknown> = {};

  // ── 1. Bienvenue ────────────────────────────────────────────────────────
  if (user.email_confirmed_at && new Date(user.created_at) >= WELCOME_SINCE) {
    // La ligne n'est créée qu'une fois : c'est elle qui garantit l'envoi unique.
    const { data: claimed } = await admin
      .from("account_emails")
      .upsert({ user_id: user.id, kind: "welcome" }, { onConflict: "user_id,kind", ignoreDuplicates: true })
      .select("user_id");
    if (claimed && claimed.length > 0) {
      try {
        const mail = renderEmail("welcome", { name: firstName(user.user_metadata) });
        await sendWithResend({ to: user.email, ...mail, tag: "welcome", idempotencyKey: `welcome-${user.id}` });
        result.welcome = "sent";
      } catch (e) {
        // On libère la ligne pour réessayer à la prochaine connexion.
        await admin.from("account_emails").delete().eq("user_id", user.id).eq("kind", "welcome");
        console.error("account-events: bienvenue", String(e));
        result.welcome = "failed";
      }
    }
  }

  // ── 2. Appareil ─────────────────────────────────────────────────────────
  if (deviceId) {
    const { data: known } = await admin
      .from("user_devices")
      .select("device_id")
      .eq("user_id", user.id)
      .eq("device_id", deviceId)
      .maybeSingle();

    if (known) {
      await admin.from("user_devices").update({ last_seen: new Date().toISOString(), user_agent: ua })
        .eq("user_id", user.id).eq("device_id", deviceId);
    } else {
      const { count } = await admin.from("user_devices").select("device_id", { count: "exact", head: true }).eq("user_id", user.id);
      const since = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
      const { count: recentAlerts } = await admin.from("user_devices").select("device_id", { count: "exact", head: true })
        .eq("user_id", user.id).eq("alerted", true).gte("first_seen", since);
      const shouldAlert = isSignIn && (count ?? 0) > 0 && (recentAlerts ?? 0) < MAX_ALERTS_PER_DAY;

      await admin.from("user_devices").upsert(
        { user_id: user.id, device_id: deviceId, user_agent: ua, alerted: shouldAlert },
        { onConflict: "user_id,device_id", ignoreDuplicates: true },
      );

      if (shouldAlert) {
        try {
          const mail = renderEmail("new_device", { when: frenchDate(new Date()), device: describeDevice(ua), email: user.email });
          await sendWithResend({ to: user.email, ...mail, tag: "new_device", idempotencyKey: `device-${user.id}-${deviceId}` });
          result.new_device = "sent";
        } catch (e) {
          console.error("account-events: alerte", String(e));
          result.new_device = "failed";
        }
      } else {
        result.new_device = "recorded";
      }
    }
  }

  return json(200, result);
});
