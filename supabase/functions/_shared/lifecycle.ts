/**
 * Suite d'activation : quel mail envoyer à qui, aujourd'hui.
 *
 * Fonction pure (aucun accès réseau) : la tâche quotidienne `lifecycle-emails`
 * lui passe les comptes, et elle renvoie la liste des envois. Testée par
 * src/test/lifecycle.test.ts.
 *
 * Règles :
 *  - jamais deux fois le même mail à la même personne (clé dans account_emails) ;
 *  - jamais à un compte désinscrit (email_optout) ;
 *  - un seul mail d'accompagnement par personne et par jour ;
 *  - aucun rattrapage : un compte inscrit il y a 3 mois ne reçoit pas « J+3 ».
 */
import type { EmailKind } from "./emails.ts";

export interface LifecycleAccount {
  user_id: string;
  email: string;
  created_at: string;
  email_confirmed: boolean;
  analyses: number;
  first_analysis_at?: string | null;
  first_analysis_id?: string | null;
  first_analysis_circuit?: string | null;
  trial_tier?: string | null;
  trial_until?: string | null;
  paid_tier?: string | null;
  /** Départ d'une structure Team (pilote parti ou retiré) récent. */
  left_structure?: { id: string; name: string; left_at: string } | null;
  sent: string[];
  opted_out: boolean;
}

export interface PlannedMail {
  user_id: string;
  email: string;
  kind: EmailKind;
  /** Clé unique dans account_emails (le type, plus la date ou la structure si besoin). */
  key: string;
  data: { analysisId?: string | null; circuit?: string | null; until?: string | null; structure?: string | null };
}

const H = 3600 * 1000;
const D = 24 * H;

export function frenchDay(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long" }).format(new Date(iso));
}

export function planLifecycle(accounts: LifecycleAccount[], now: Date = new Date()): PlannedMail[] {
  const t = now.getTime();
  const out: PlannedMail[] = [];
  for (const a of accounts) {
    if (a.opted_out || !a.email || !a.email_confirmed) continue;
    const sent = new Set(a.sent);
    const age = t - new Date(a.created_at).getTime();
    const plan = (kind: EmailKind, key: string, data: PlannedMail["data"] = {}) => {
      if (!sent.has(key)) out.push({ user_id: a.user_id, email: a.email, kind, key, data });
    };
    const before = out.length;

    // Le plus utile d'abord ; un seul par jour et par personne.
    if (a.left_structure && t - new Date(a.left_structure.left_at).getTime() < 2 * D) {
      plan("team_farewell", `team_farewell:${a.left_structure.id}`, {
        structure: a.left_structure.name,
        until: a.trial_until ? frenchDay(a.trial_until) : null,
      });
    }
    if (out.length === before && a.trial_tier && a.trial_until) {
      const left = new Date(a.trial_until).getTime() - t;
      const paid = (a.paid_tier || "rookie").toLowerCase();
      if (left > 2 * D && left <= 3 * D && paid !== "racer" && paid !== "team") {
        plan("pass_ending", `pass_ending:${a.trial_until.slice(0, 10)}`, { until: frenchDay(a.trial_until) });
      }
    }
    if (out.length === before && a.analyses > 0 && a.first_analysis_at) {
      const since = t - new Date(a.first_analysis_at).getTime();
      if (since >= 0 && since < 2 * D) {
        plan("first_analysis", "first_analysis", { analysisId: a.first_analysis_id, circuit: a.first_analysis_circuit });
      }
    }
    if (out.length === before && a.analyses === 0) {
      if (age >= 7 * D && age < 10 * D) plan("activation_d7", "activation_d7");
      else if (age >= 3 * D && age < 6 * D) plan("activation_d3", "activation_d3");
    }
  }
  return out;
}
