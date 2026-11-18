/**
 * Espace Team (écoles, clubs, coachs) — appels à l'API.
 *
 * Tout l'espace dépend d'un interrupteur côté serveur : tant qu'il est coupé,
 * `getTeamMe` répond `enabled: false` et l'app ne montre rien de nouveau.
 * Seule la demande « Contactez-nous » (offre Team sur devis) marche toujours.
 */
import { API_BASE_URL } from "@/lib/api";

export type TeamRole = "coach" | "pilote";

export interface TeamStructureRef {
  id: string;
  name: string;
  kind: "ecole" | "club" | "coach";
  status?: string;
  trial_until?: string | null;
  live?: boolean;
}

export interface TeamMembership {
  structure: TeamStructureRef;
  role: TeamRole;
  joined_at?: string;
}

export interface TeamPilotRow {
  user_id: string;
  name: string;
  joined_at?: string;
  sessions: number;
  last_session: { id: string; date?: string; circuit?: string | null; best_lap?: number | null } | null;
  trend_30d: number | null;
  inactive: boolean;
}

export interface TeamOverview {
  structure: TeamStructureRef & { max_pilots?: number | null };
  coaches: number;
  pilots: TeamPilotRow[];
  alerts: { kind: string; pilot_id: string; text: string }[];
  rankings: { circuit: string; rows: { user_id: string; name: string; best_lap: number }[] }[];
}

export interface TeamPilotSessions {
  pilot: { user_id: string; name: string; joined_at?: string };
  sessions: {
    id: string;
    created_at?: string;
    circuit_name?: string | null;
    session_name?: string | null;
    best_lap_time?: number | null;
    score?: number | null;
    uploaded_by?: string | null;
    shared?: boolean;
  }[];
}

export interface ContactPayload {
  name: string;
  email: string;
  phone?: string;
  structure_name?: string;
  kind?: "ecole" | "club" | "coach" | "autre";
  pilots_estimate?: string;
  message?: string;
  website?: string;
}

async function call<T>(path: string, init: RequestInit = {}, token?: string | null): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const detail = typeof body?.detail === "string" ? body.detail : "Une erreur est survenue. Réessaie dans un instant.";
    throw new Error(detail);
  }
  return body as T;
}

export const sendTeamContact = (p: ContactPayload, token?: string | null) =>
  call<{ ok: boolean }>("/api/team/contact", { method: "POST", body: JSON.stringify(p) }, token);

export const getTeamMe = (token: string) =>
  call<{ enabled: boolean; memberships: TeamMembership[] }>("/api/team/me", {}, token);

export const getInvite = (code: string) =>
  call<{ structure: TeamStructureRef; role: TeamRole; consent_version: string }>(
    `/api/team/invite/${encodeURIComponent(code)}`,
  );

export const joinStructure = (code: string, consent: boolean, token: string) =>
  call<{ structure_id: string; role: TeamRole; already: boolean }>(
    "/api/team/join",
    { method: "POST", body: JSON.stringify({ code, consent }) },
    token,
  );

export const leaveStructure = (structureId: string, token: string) =>
  call<{ left: boolean; racer_until: string | null }>(`/api/team/${structureId}/leave`, { method: "POST" }, token);

export const shareSession = (structureId: string, analysisId: string, share: boolean, token: string) =>
  call<{ ok: boolean }>(
    `/api/team/${structureId}/share`,
    { method: "POST", body: JSON.stringify({ analysis_id: analysisId, share }) },
    token,
  );

export const createPilotInvite = (
  structureId: string,
  opts: { guardian_certified: boolean; max_uses?: number | null; expires_days?: number },
  token: string,
) =>
  call<{ code: string; expires_at?: string; guardian_certified?: boolean }>(
    `/api/team/${structureId}/invites`,
    { method: "POST", body: JSON.stringify(opts) },
    token,
  );

export const getTeamOverview = (structureId: string, token: string) =>
  call<TeamOverview>(`/api/team/${structureId}/overview`, {}, token);

export const getPilotSessions = (structureId: string, pilotId: string, token: string) =>
  call<TeamPilotSessions>(`/api/team/${structureId}/pilots/${pilotId}/sessions`, {}, token);

export const removePilot = (structureId: string, pilotId: string, token: string) =>
  call<{ removed: boolean }>(`/api/team/${structureId}/pilots/${pilotId}/remove`, { method: "POST" }, token);

// ── Admin ────────────────────────────────────────────────────────────────

export interface AdminContactRequest {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  structure_name?: string | null;
  kind: string;
  pilots_estimate?: string | null;
  message?: string | null;
  status: "nouvelle" | "en_discussion" | "signee" | "sans_suite";
  admin_note?: string | null;
  created_at: string;
}

export interface AdminStructure extends TeamStructureRef {
  contract_until?: string | null;
  max_pilots?: number | null;
  max_coaches?: number | null;
  max_karts?: number | null;
  coaches: number;
  pilots: number;
  analyses_30d: number;
  created_at: string;
  coach_invites: { code: string; email?: string | null; expires_at?: string | null }[];
}

export const getAdminTeam = (token: string) =>
  call<{ enabled: boolean; structures: AdminStructure[]; requests: AdminContactRequest[] }>("/api/admin/team", {}, token);

export const updateAdminRequest = (id: string, patch: { status?: string; admin_note?: string }, token: string) =>
  call<{ ok: boolean }>(`/api/admin/team/requests/${id}`, { method: "PATCH", body: JSON.stringify(patch) }, token);

export const createAdminStructure = (
  p: {
    name: string;
    kind: string;
    trial_weeks: number;
    max_pilots?: number | null;
    max_coaches?: number | null;
    max_karts?: number | null;
    coach_email?: string;
    contact_request_id?: string | null;
  },
  token: string,
) =>
  call<{ structure: AdminStructure; coach_code: string; coach_link: string }>(
    "/api/admin/team/structures",
    { method: "POST", body: JSON.stringify(p) },
    token,
  );

export const updateAdminStructure = (id: string, patch: Record<string, unknown>, token: string) =>
  call<{ ok: boolean }>(`/api/admin/team/structures/${id}`, { method: "PATCH", body: JSON.stringify(patch) }, token);

/** Code d'invitation gardé pendant l'inscription, repris à la connexion. */
export const PENDING_JOIN_KEY = "apex_pending_join";

export const joinLink = (code: string) => `${window.location.origin}/rejoindre/${code}`;

export const formatLap = (s?: number | null) =>
  s == null ? "—" : `${s.toFixed(2).replace(".", ",")} s`;
