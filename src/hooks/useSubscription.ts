import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/lib/api";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_DURATION_MS = 10000;

const SUBSCRIPTION_STORAGE_KEY = "apex_subscription_backend";
const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 min — affichage immédiat du badge

function getCachedTier(): SubscriptionTier {
  if (typeof window === "undefined") return "rookie";
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (!raw) return "rookie";
    const data = JSON.parse(raw) as { tier?: string; _ts?: number };
    if (data._ts && Date.now() - data._ts > CACHE_MAX_AGE_MS) return "rookie";
    if (data.tier && ["rookie", "racer", "team"].includes(data.tier)) return data.tier as SubscriptionTier;
  } catch {
    // ignore
  }
  return "rookie";
}

export type SubscriptionTier = "visitor" | "rookie" | "racer" | "team";
export type SubscriptionStatus = "active" | "canceled" | "past_due" | "trialing" | null;

export interface SubscriptionLimits {
  tier: SubscriptionTier;
  analyses_per_month: number | null;
  analyses_used: number;
  can_export_csv: boolean;
  can_export_pdf: boolean;
  can_compare: boolean;
  max_members: number;
  max_circuits: number | null;
  max_cars: number | null;
  allowed_circuit: string | null;
  // Visual permissions
  visible_charts: string[]; // ['track_map', 'speed_trace', ...]
}

export type BillingPeriod = "monthly" | "annual" | null;

export interface SubscriptionResponse {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billing_period: BillingPeriod;
  subscription_end_date: string | null;
  limits: SubscriptionLimits;
}

/** Plan pour compatibilité affichage (free/pro/team) */
export type SubscriptionPlan = "visitor" | "free" | "pro" | "team";

function tierToPlan(tier: SubscriptionTier): SubscriptionPlan {
  if (tier === "racer") return "pro";
  if (tier === "team") return "team";
  if (tier === "visitor") return "visitor";
  return "free";
}

export function useSubscription() {
  const { user, session, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tier, setTier] = useState<SubscriptionTier>(() => {
    const cached = getCachedTier();
    return (cached as SubscriptionTier) || "visitor";
  });
  const [status, setStatus] = useState<SubscriptionStatus>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(null);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const tokenRef = useRef(session?.access_token);
  tokenRef.current = session?.access_token;

  const hasFetchedRef = useRef(false);

  const fetchSubscription = useCallback(async () => {
    if (!isAuthenticated) {
      setTier("visitor");
      setLimits({
        tier: "visitor",
        analyses_per_month: 1,
        analyses_used: 0, // Sera géré par localStorage ou API session
        can_export_csv: false,
        can_export_pdf: false,
        can_compare: false,
        max_members: 0,
        max_circuits: null,
        max_cars: null,
        allowed_circuit: null,
        visible_charts: ["track_map"],
      });
      setIsLoading(false);
      return;
    }

    const token = tokenRef.current;
    const url = `${API_BASE_URL}/api/user/subscription`;

    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        throw new Error("Failed to fetch subscription");
      }
      const data: SubscriptionResponse = await res.json();
      
      // Update limits based on tier if backend doesn't provide visible_charts yet
      const processedTier = data.tier || "rookie";
      
      // Frontend-side circuit logic: if allowed_circuit is null, find the first analysis
      let allowedCircuit = data.limits?.allowed_circuit;
      if (processedTier === "rookie" && !allowedCircuit && isAuthenticated) {
        try {
          // Import dynamic to avoid circular dependency if any
          const { getAllAnalyses } = await import("@/lib/storage");
          const analyses = await getAllAnalyses(user?.id);
          if (analyses.length > 0) {
            // The first circuit ever analyzed becomes the allowed one
            const firstWithCircuit = [...analyses].reverse().find(a => a.circuit_name);
            allowedCircuit = firstWithCircuit?.circuit_name || null;
          }
        } catch (e) {
          console.warn("Failed to determine allowed circuit from storage", e);
        }
      }

      const processedLimits: SubscriptionLimits = {
        ...data.limits,
        tier: processedTier,
        allowed_circuit: allowedCircuit,
        visible_charts: data.limits?.visible_charts || (
          processedTier === "racer" || processedTier === "team" 
            ? ["track_map", "speed_trace", "throttle_brake", "delta_time", "apex_margin", "radar"]
            : ["track_map", "speed_trace"] // Rookie can see 1 chart (speed_trace) + track_map
        )
      };

      setTier(processedTier);
      setStatus(data.status ?? null);
      setBillingPeriod(data.billing_period ?? null);
      setSubscriptionEndDate(data.subscription_end_date ?? null);
      setLimits(processedLimits);

      try {
        localStorage.setItem(
          SUBSCRIPTION_STORAGE_KEY,
          JSON.stringify({ ...data, limits: processedLimits, _ts: Date.now() })
        );
      } catch {
        // ignore
      }
    } catch {
      // Fallback for Rookie
      let allowedCircuit = null;
      if (isAuthenticated) {
        try {
          const { getAllAnalyses } = await import("@/lib/storage");
          const analyses = await getAllAnalyses(user?.id);
          const firstWithCircuit = [...analyses].reverse().find(a => a.circuit_name);
          allowedCircuit = firstWithCircuit?.circuit_name || null;
        } catch {}
      }

      setTier("rookie");
      setLimits({
        tier: "rookie",
        analyses_per_month: 3,
        analyses_used: 0,
        can_export_csv: false,
        can_export_pdf: false,
        can_compare: false,
        max_members: 0,
        max_circuits: 1,
        max_cars: null,
        allowed_circuit: allowedCircuit,
        visible_charts: ["track_map", "speed_trace"],
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Rest of the effect for session_id polling...
  const sessionId = searchParams.get("session_id");
  const fetchRef = useRef(fetchSubscription);
  fetchRef.current = fetchSubscription;

  useEffect(() => {
    if (!sessionId || !user?.id) return;
    let elapsed = 0;
    const poll = () => {
      elapsed += POLL_INTERVAL_MS;
      fetchRef.current().then(() => {});
      if (elapsed >= POLL_MAX_DURATION_MS) {
        if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
        const next = new URLSearchParams(searchParams);
        next.delete("session_id");
        next.delete("success");
        setSearchParams(next, { replace: true });
        return;
      }
      pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    };
    pollTimeoutRef.current = setTimeout(poll, POLL_INTERVAL_MS);
    return () => {
      if (pollTimeoutRef.current) clearTimeout(pollTimeoutRef.current);
    };
  }, [sessionId, user?.id]);

  const plan = tierToPlan(tier);

  const isChartVisible = (chartId: string, circuitName?: string | null) => {
    if (tier === "racer" || tier === "team") return true;
    
    // Circuit restriction for Rookie
    if (tier === "rookie" && circuitName && limits?.allowed_circuit && circuitName !== limits.allowed_circuit) {
      if (chartId !== "track_map") return false; // Show only track map for wrong circuit
    }

    if (chartId === "track_map") return true;
    
    // Alias for metrics
    if (chartId === "performance_score" || chartId === "avg_speed" || chartId === "corners") {
      return limits?.visible_charts?.includes("speed_trace") ?? false;
    }

    return limits?.visible_charts?.includes(chartId) ?? false;
  };

  const getCtaDetails = (circuitName?: string | null) => {
    if (tier === "visitor") {
      return {
        title: "Crée ton compte pour voir tes résultats complets",
        buttonText: "Créer un compte",
      };
    }
    
    if (tier === "rookie" && circuitName && limits?.allowed_circuit && circuitName !== limits.allowed_circuit) {
      return {
        title: `Passe à Racer pour analyser d'autres circuits (Circuit actuel: ${limits.allowed_circuit})`,
        buttonText: "Passer à Racer",
      };
    }

    return {
      title: "Passe à Racer pour débloquer toutes tes analyses",
      buttonText: "Débloquer avec Racer",
    };
  };

  return {
    tier,
    status,
    billingPeriod,
    subscriptionEndDate,
    limits,
    isLoading,
    plan,
    isChartVisible,
    getCtaDetails,
    isAuthenticated,
    fetchSubscription,
  };
}
