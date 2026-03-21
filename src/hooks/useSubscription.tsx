import React, { useState, useEffect, useCallback, useRef, createContext, useContext, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { API_BASE_URL } from "@/lib/api";

const POLL_INTERVAL_MS = 2000;
const POLL_MAX_DURATION_MS = 10000;

const SUBSCRIPTION_STORAGE_KEY = "apex_subscription_backend";
const CACHE_MAX_AGE_MS = 5 * 60 * 1000; // 5 min

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
  visible_charts: string[];
}

export type BillingPeriod = "monthly" | "annual" | null;

export interface SubscriptionResponse {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billing_period: BillingPeriod;
  subscription_end_date: string | null;
  limits: SubscriptionLimits;
}

export type SubscriptionPlan = "visitor" | "free" | "pro" | "team";

function tierToPlan(tier: SubscriptionTier): SubscriptionPlan {
  if (tier === "racer") return "pro";
  if (tier === "team") return "team";
  if (tier === "visitor") return "visitor";
  return "free";
}

function getCachedData(): Partial<SubscriptionResponse> & { _ts?: number } {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(SUBSCRIPTION_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

interface SubscriptionContextType {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  billingPeriod: BillingPeriod;
  subscriptionEndDate: string | null;
  limits: SubscriptionLimits | null;
  isLoading: boolean;
  plan: SubscriptionPlan;
  isChartVisible: (chartId: string, circuitName?: string | null) => boolean;
  getCtaDetails: (circuitName?: string | null) => { title: string; buttonText: string };
  isAuthenticated: boolean;
  fetchSubscription: () => Promise<void>;
  incrementAnalysesUsed: () => void;
}

const SubscriptionContext = createContext<SubscriptionContextType | null>(null);

export const SubscriptionProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, session, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [initialData] = useState(() => getCachedData());

  const [tier, setTier] = useState<SubscriptionTier>(() => initialData.tier || "visitor");
  const [status, setStatus] = useState<SubscriptionStatus>(initialData.status ?? null);
  const [billingPeriod, setBillingPeriod] = useState<BillingPeriod>(initialData.billing_period ?? null);
  const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(initialData.subscription_end_date ?? null);
  const [limits, setLimits] = useState<SubscriptionLimits | null>(initialData.limits ?? null);
  const [isLoading, setIsLoading] = useState(!initialData.limits);
  
  const pollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tokenRef = useRef(session?.access_token);
  tokenRef.current = session?.access_token;

  const fetchSubscription = useCallback(async () => {
    if (!isAuthenticated) {
      const visitorLimits: SubscriptionLimits = {
        tier: "visitor",
        analyses_per_month: 1,
        analyses_used: 0,
        can_export_csv: false,
        can_export_pdf: false,
        can_compare: false,
        max_members: 0,
        max_circuits: null,
        max_cars: null,
        allowed_circuit: null,
        visible_charts: ["track_map"],
      };
      setTier("visitor");
      setLimits(visitorLimits);
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/user/subscription`, {
        headers: tokenRef.current ? { Authorization: `Bearer ${tokenRef.current}` } : {},
      });
      if (!res.ok) throw new Error("Failed to fetch subscription");
      
      const data: SubscriptionResponse = await res.json();
      const processedTier = data.tier || "rookie";
      
      let allowedCircuit = data.limits?.allowed_circuit;
      if (processedTier === "rookie" && !allowedCircuit) {
        try {
          const { getAllAnalyses } = await import("@/lib/storage");
          const analyses = await getAllAnalyses(user?.id);
          const firstWithCircuit = [...analyses].reverse().find(a => a.circuit_name);
          allowedCircuit = firstWithCircuit?.circuit_name || null;
        } catch {}
      }

      const processedLimits: SubscriptionLimits = {
        ...data.limits,
        tier: processedTier,
        allowed_circuit: allowedCircuit,
        visible_charts: data.limits?.visible_charts || (
          processedTier === "racer" || processedTier === "team" 
            ? ["track_map", "speed_trace", "throttle_brake", "delta_time", "apex_margin", "radar"]
            : ["track_map", "speed_trace", "coaching_advice"]
        )
      };

      setTier(processedTier);
      setStatus(data.status ?? null);
      setBillingPeriod(data.billing_period ?? null);
      setSubscriptionEndDate(data.subscription_end_date ?? null);
      setLimits(processedLimits);

      localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify({ ...data, limits: processedLimits, _ts: Date.now() }));
    } catch {
      // Fallback rookie
      setTier("rookie");
      setLimits(prev => prev || {
        tier: "rookie",
        analyses_per_month: 3,
        analyses_used: 0,
        can_export_csv: false,
        can_export_pdf: false,
        can_compare: false,
        max_members: 0,
        max_circuits: 1,
        max_cars: null,
        allowed_circuit: null,
        visible_charts: ["track_map", "speed_trace", "coaching_advice"],
      });
    } finally {
      setIsLoading(false);
    }
  }, [isAuthenticated, user?.id]);

  useEffect(() => {
    fetchSubscription();
  }, [fetchSubscription]);

  const incrementAnalysesUsed = useCallback(() => {
    setLimits(prev => {
      if (!prev) return prev;
      const newLimits = { ...prev, analyses_used: prev.analyses_used + 1 };
      try {
        const cached = getCachedData();
        localStorage.setItem(SUBSCRIPTION_STORAGE_KEY, JSON.stringify({ ...cached, limits: newLimits, _ts: Date.now() }));
      } catch {}
      return newLimits;
    });
  }, []);

  const isChartVisible = useCallback((chartId: string, circuitName?: string | null) => {
    if (tier === "racer" || tier === "team") return true;
    if (tier === "rookie" && circuitName && limits?.allowed_circuit && circuitName !== limits.allowed_circuit) {
      if (chartId !== "track_map") return false;
    }
    if (chartId === "track_map") return true;
    if (chartId === "performance_score" || chartId === "avg_speed" || chartId === "corners") {
      return limits?.visible_charts?.includes("speed_trace") ?? false;
    }
    return limits?.visible_charts?.includes(chartId) ?? false;
  }, [tier, limits]);

  const getCtaDetails = useCallback((circuitName?: string | null) => {
    if (tier === "visitor") {
      return { title: "Crée ton compte pour voir tes résultats complets", buttonText: "Créer un compte" };
    }
    if (tier === "rookie" && circuitName && limits?.allowed_circuit && circuitName !== limits.allowed_circuit) {
      return { title: `Passe à Racer pour analyser d'autres circuits (Circuit actuel: ${limits.allowed_circuit})`, buttonText: "Passer à Racer" };
    }
    return { title: "Passe à Racer pour débloquer toutes tes analyses", buttonText: "Débloquer avec Racer" };
  }, [tier, limits]);

  const plan = useMemo(() => tierToPlan(tier), [tier]);

  const value = useMemo(() => ({
    tier, status, billingPeriod, subscriptionEndDate, limits, isLoading, plan,
    isChartVisible, getCtaDetails, isAuthenticated, fetchSubscription, incrementAnalysesUsed
  }), [tier, status, billingPeriod, subscriptionEndDate, limits, isLoading, plan, isChartVisible, getCtaDetails, isAuthenticated, fetchSubscription, incrementAnalysesUsed]);

  return <SubscriptionContext.Provider value={value}>{children}</SubscriptionContext.Provider>;
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) throw new Error("useSubscription must be used within a SubscriptionProvider");
  return context;
};
