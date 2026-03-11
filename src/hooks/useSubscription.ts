import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/lib/api";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_DURATION_MS = 10000;

export type SubscriptionTier = "rookie" | "racer" | "team";
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
export type SubscriptionPlan = "free" | "pro" | "team";

function tierToPlan(tier: SubscriptionTier): SubscriptionPlan {
  if (tier === "racer") return "pro";
  if (tier === "team") return "team";
  return "free";
}

export function useSubscription() {
  const { user, session } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [tier, setTier] = useState<SubscriptionTier>("rookie");
  const [status, setStatus] = useState<SubscriptionStatus>(null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(null);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);
  const [limits, setLimits] = useState<SubscriptionLimits | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchSubscription = useCallback(async () => {
    if (!user?.id) {
      setTier("rookie");
      setStatus(null);
      setBillingPeriod(null);
      setSubscriptionEndDate(null);
      setLimits(null);
      setIsLoading(false);
      return;
    }

    const token = session?.access_token;
    const url = `${API_BASE_URL}/api/user/subscription`;

    setIsLoading(true);
    try {
      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        setTier("rookie");
        setStatus(null);
        setBillingPeriod(null);
        setSubscriptionEndDate(null);
        setLimits(null);
        return;
      }
      const data: SubscriptionResponse = await res.json();
      setTier(data.tier ?? "rookie");
      setStatus(data.status ?? null);
      setBillingPeriod(data.billing_period ?? null);
      setSubscriptionEndDate(data.subscription_end_date ?? null);
      setLimits(data.limits ?? null);
    } catch {
      setTier("rookie");
      setStatus(null);
      setBillingPeriod(null);
      setSubscriptionEndDate(null);
      setLimits(null);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, session?.access_token]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  // Après paiement : ?session_id= présent → polling 2s pendant 10s, nettoyer l’URL quand tier change
  useEffect(() => {
    const sessionId = searchParams.get("session_id");
    if (!sessionId || !user?.id) return;

    let elapsed = 0;

    const poll = () => {
      elapsed += POLL_INTERVAL_MS;
      fetchSubscription().then(() => {});
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
  }, [searchParams.get("session_id"), user?.id, fetchSubscription]);

  // Quand le tier passe de rookie à autre chose, nettoyer session_id de l’URL
  const prevTierRef = useRef<SubscriptionTier>("rookie");
  useEffect(() => {
    if (prevTierRef.current === "rookie" && tier !== "rookie" && searchParams.has("session_id")) {
      const next = new URLSearchParams(searchParams);
      next.delete("session_id");
      next.delete("success");
      setSearchParams(next, { replace: true });
    }
    prevTierRef.current = tier;
  }, [tier, searchParams, setSearchParams]);

  const plan = tierToPlan(tier);
  return {
    tier,
    status,
    billingPeriod,
    subscriptionEndDate,
    limits,
    isLoading,
    plan,
  };
}
