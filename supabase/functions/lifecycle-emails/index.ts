/**
 * lifecycle-emails — tâche quotidienne de la suite d'activation.
 *
 * Appelée une fois par jour (pg_cron, 10 h Paris) avec l'en-tête
 * `x-cron-secret: LIFECYCLE_CRON_SECRET`. Elle rassemble les comptes,
 * demande à planLifecycle() quels mails partent aujourd'hui, réserve chaque
 * envoi dans account_emails (clé unique : jamais deux fois), puis envoie.
 *
 * Interrupteur : LIFECYCLE_ENABLED=1 (secret de la fonction). Sans lui, la
 * fonction calcule et renvoie le plan sans rien envoyer (`dry_run`).
 *
 * Secrets : RESEND_API_KEY, LIFECYCLE_CRON_SECRET, EMAIL_UNSUB_SECRET.
 */
import { createClient } from "jsr:@supabase/supabase-js@2";
import { renderEmail } from "../_shared/emails.ts";
import { sendWithResend } from "../_shared/resend.ts";
import { planLifecycle, type LifecycleAccount } from "../_shared/lifecycle.ts";
import { signUnsubscribe, unsubscribeUrl } from "../_shared/unsubscribe.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CRON_SECRET = Deno.env.get("LIFECYCLE_CRON_SECRET") ?? "";
const UNSUB_SECRET = Deno.env.get("EMAIL_UNSUB_SECRET") ?? "";
const ENABLED = Deno.env.get("LIFECYCLE_ENABLED") === "1";
const SITE = "https://www.apexai.racing";
const MAX_PER_RUN = 150;
// Les comptes plus anciens ne sont pas concernés par l'accueil (pas de rattrapage).
const LOOKBACK_DAYS = 30;

Deno.serve(async (req) => {
  if (!CRON_SECRET || req.headers.get("x-cron-secret") !== CRON_SECRET) {
    return new Response("forbidden", { status: 403 });
  }
  const db = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const now = new Date();
  const since = new Date(now.getTime() - LOOKBACK_DAYS * 864e5).toISOString();

  // 1. Comptes : récents (accueil) + Paddock Pass en fin + départs de structure.
  const users: { id: string; email: string; created_at: string; email_confirmed_at: string | null }[] = [];
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await db.auth.admin.listUsers({ page, perPage: 200 });
    if (error) break;
    users.push(...data.users.map((u) => ({ id: u.id, email: u.email ?? "", created_at: u.created_at, email_confirmed_at: u.email_confirmed_at ?? null })));
    if (data.users.length < 200) break;
  }
  const ids = users.map((u) => u.id);
  const [profiles, analyses, sent, optout, left] = await Promise.all([
    db.from("profiles").select("id, subscription_tier, trial_tier, trial_until").in("id", ids),
    db.from("analyses").select("id, user_id, created_at, circuit_name").in("user_id", ids).order("created_at", { ascending: true }),
    db.from("account_emails").select("user_id, kind").in("user_id", ids),
    db.from("email_optout").select("user_id").in("user_id", ids),
    db.from("structure_members").select("user_id, structure_id, left_at, structures(name)").in("status", ["parti", "retire"]).gte("left_at", since),
  ]);

  const prof = new Map((profiles.data ?? []).map((p) => [p.id, p]));
  const byUser = new Map<string, { count: number; first?: { id: string; created_at: string; circuit_name: string | null } }>();
  for (const a of analyses.data ?? []) {
    const e = byUser.get(a.user_id) ?? { count: 0 };
    e.count++;
    if (!e.first) e.first = a;
    byUser.set(a.user_id, e);
  }
  const sentBy = new Map<string, string[]>();
  for (const s of sent.data ?? []) sentBy.set(s.user_id, [...(sentBy.get(s.user_id) ?? []), s.kind]);
  const opted = new Set((optout.data ?? []).map((o) => o.user_id));
  const leftBy = new Map((left.error ? [] : left.data ?? []).map((m: any) => [m.user_id, { id: m.structure_id, name: m.structures?.name ?? "", left_at: m.left_at }]));

  const accounts: LifecycleAccount[] = users.map((u) => {
    const p = prof.get(u.id);
    const a = byUser.get(u.id);
    return {
      user_id: u.id,
      email: u.email,
      created_at: u.created_at,
      email_confirmed: !!u.email_confirmed_at,
      analyses: a?.count ?? 0,
      first_analysis_at: a?.first?.created_at ?? null,
      first_analysis_id: a?.first?.id ?? null,
      first_analysis_circuit: a?.first?.circuit_name ?? null,
      trial_tier: p?.trial_tier ?? null,
      trial_until: p?.trial_until ?? null,
      paid_tier: p?.subscription_tier ?? null,
      left_structure: leftBy.get(u.id) ?? null,
      sent: sentBy.get(u.id) ?? [],
      opted_out: opted.has(u.id),
    };
  });

  const planned = planLifecycle(accounts, now).slice(0, MAX_PER_RUN);
  if (!ENABLED) {
    return Response.json({ dry_run: true, planned: planned.map((m) => ({ user_id: m.user_id, kind: m.kind, key: m.key })) });
  }

  const result: Record<string, number> = {};
  for (const m of planned) {
    // Réservation d'abord : si la ligne existe déjà, un autre passage l'a envoyé.
    const { data: claimed } = await db
      .from("account_emails")
      .upsert({ user_id: m.user_id, kind: m.key }, { onConflict: "user_id,kind", ignoreDuplicates: true })
      .select("user_id");
    if (!claimed?.length) continue;
    try {
      const token = await signUnsubscribe(m.user_id, UNSUB_SECRET);
      const unsub = unsubscribeUrl(`${SUPABASE_URL}/functions/v1`, token);
      const mail = renderEmail(m.kind, {
        unsubscribeUrl: unsub,
        analysisUrl: m.data.analysisId ? `${SITE}/analysis/${m.data.analysisId}` : undefined,
        circuit: m.data.circuit ?? undefined,
        until: m.data.until ?? undefined,
        structure: m.data.structure ?? undefined,
      });
      await sendWithResend({
        to: m.email,
        ...mail,
        tag: m.kind,
        idempotencyKey: `${m.key}-${m.user_id}`,
        headers: { "List-Unsubscribe": `<${unsub}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
      });
      result[m.kind] = (result[m.kind] ?? 0) + 1;
    } catch (e) {
      await db.from("account_emails").delete().eq("user_id", m.user_id).eq("kind", m.key);
      console.error("lifecycle-emails:", m.kind, String(e));
    }
  }
  return Response.json({ sent: result, planned: planned.length });
});
