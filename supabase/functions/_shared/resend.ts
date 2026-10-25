/**
 * Envoi par l'API Resend (https://resend.com/docs/api-reference/emails/send-email).
 * Pas de SDK : un simple fetch, avec une clé d'idempotence pour qu'une
 * requête rejouée (nouvel essai de Supabase) n'envoie pas deux fois le mail.
 */

const API_KEY = Deno.env.get("RESEND_API_KEY") ?? "";
const FROM = Deno.env.get("EMAIL_FROM") ?? "ApexAI <noreply@apexai.racing>";
const REPLY_TO = Deno.env.get("EMAIL_REPLY_TO") ?? "contact@apexai.racing";

export interface OutgoingMail {
  to: string;
  subject: string;
  html: string;
  text: string;
  /** Catégorie visible dans Resend (signup, recovery, welcome…). */
  tag: string;
  idempotencyKey?: string;
}

export async function sendWithResend(mail: OutgoingMail): Promise<string> {
  if (!API_KEY) throw new Error("RESEND_API_KEY manquant");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      ...(mail.idempotencyKey ? { "Idempotency-Key": mail.idempotencyKey.slice(0, 256) } : {}),
    },
    body: JSON.stringify({
      from: FROM,
      to: [mail.to],
      reply_to: REPLY_TO,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
      tags: [{ name: "category", value: mail.tag.replace(/[^A-Za-z0-9_-]/g, "_") }],
    }),
  });
  const body = await res.text();
  if (!res.ok) throw new Error(`Resend ${res.status}: ${body.slice(0, 300)}`);
  try {
    return JSON.parse(body).id ?? "";
  } catch {
    return "";
  }
}
