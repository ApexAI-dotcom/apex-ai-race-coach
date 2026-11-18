import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { getTeamMe, type TeamMembership } from "@/lib/team";

// Une réponse par minute suffit : la barre de navigation la demande à chaque page.
let cache: { token: string; at: number; data: Promise<{ enabled: boolean; memberships: TeamMembership[] }> } | null = null;
function fetchMe(token: string, force: boolean) {
  if (!force && cache && cache.token === token && Date.now() - cache.at < 60_000) return cache.data;
  const data = getTeamMe(token).catch(() => ({ enabled: false, memberships: [] as TeamMembership[] }));
  cache = { token, at: Date.now(), data };
  return data;
}

/** À appeler après avoir rejoint ou quitté une structure. */
export function invalidateTeamCache() {
  cache = null;
}

/**
 * Adhésions Team du compte connecté. `enabled` reste false tant que
 * l'interrupteur serveur est coupé : rien de nouveau ne s'affiche alors.
 */
export function useTeam() {
  const { session } = useAuth();
  const token = session?.access_token ?? null;
  const [enabled, setEnabled] = useState(false);
  const [memberships, setMemberships] = useState<TeamMembership[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async (force: boolean) => {
    if (!token) {
      setEnabled(false);
      setMemberships([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const r = await fetchMe(token, force);
      setEnabled(r.enabled);
      setMemberships(r.memberships || []);
    } catch {
      setEnabled(false);
      setMemberships([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    load(false);
  }, [load]);
  const refresh = useCallback(() => load(true), [load]);

  const coachOf = memberships.filter((m) => m.role === "coach" && m.structure.live !== false);
  const pilotOf = memberships.filter((m) => m.role === "pilote");
  return { enabled, memberships, coachOf, pilotOf, loading, refresh, token };
}
