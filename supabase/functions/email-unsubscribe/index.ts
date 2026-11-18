/**
 * email-unsubscribe — désinscription en un clic des mails d'accompagnement.
 *
 * GET  ?t=<jeton>  : depuis le lien du mail, affiche une page de confirmation.
 * POST ?t=<jeton>  : « List-Unsubscribe-Post » des messageries (Gmail, Apple).
 * Les mails de sécurité du compte continuent : ils ne passent pas par ici.
 * Fonction publique (pas de JWT) : le jeton signé suffit.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { verifyUnsubscribe } from "../_shared/unsubscribe.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const SECRET = Deno.env.get("EMAIL_UNSUB_SECRET") ?? "";

const page = (title: string, text: string, status = 200) =>
  new Response(
    `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${title}</title></head>
<body style="margin:0;background:#0a0a0a;color:#fafafa;font-family:Inter,Helvetica,Arial,sans-serif">
<main style="max-width:460px;margin:12vh auto;padding:0 20px">
<div style="height:5px;border-radius:5px;background:linear-gradient(90deg,#ff4242,#f97316);margin-bottom:28px"></div>
<h1 style="font-size:26px;margin:0 0 12px">${title}</h1><p style="color:#bdbdbd;line-height:1.6">${text}</p>
<p><a href="https://www.apexai.racing" style="color:#ff6b4a">Retour sur ApexAI</a></p></main></body></html>`,
    { status, headers: { "Content-Type": "text/html; charset=utf-8" } },
  );

Deno.serve(async (req) => {
  const token = new URL(req.url).searchParams.get("t") ?? "";
  const userId = SECRET ? await verifyUnsubscribe(token, SECRET) : null;
  if (!userId) return page("Lien invalide", "Ce lien de désinscription n'est pas reconnu. Écris à contact@apexai.racing et on s'en occupe.", 400);
  const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { error } = await db.from("email_optout").upsert({ user_id: userId, source: req.method === "POST" ? "one_click" : "lien" }, { onConflict: "user_id" });
  if (error) return page("Petit souci", "La désinscription n'a pas pu être enregistrée. Réessaie dans un instant.", 500);
  if (req.method === "POST") return new Response("ok");
  return page("C'est noté", "Tu ne recevras plus les conseils d'ApexAI par mail. Les mails de sécurité de ton compte (connexion, mot de passe) continuent.");
});
