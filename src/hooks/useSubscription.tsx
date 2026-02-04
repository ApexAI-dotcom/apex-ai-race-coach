import { useState, useEffect } from 'react'
import { useUser } from './useAuth'
import { supabase } from '@/lib/supabase'

export type SubscriptionPlan = 'free' | 'pro' | 'team'
export type SubscriptionStatus = 'active' | 'canceled' | 'past_due' | 'trialing'

interface SubscriptionData {
  plan: SubscriptionPlan
  status: SubscriptionStatus
  customerId: string | null
  currentPeriodEnd: string | null
  cancelAtPeriodEnd: boolean
}

interface SubscriptionLimits {
  maxAnalysesPerMonth: number
  canCompare: boolean
  canExportPDF: boolean
  canAccessAPI: boolean
}

const PLAN_LIMITS: Record<SubscriptionPlan, SubscriptionLimits> = {
  free: {
    maxAnalysesPerMonth: 3,
    canCompare: false,
    canExportPDF: false,
    canAccessAPI: false,
  },
  pro: {
    maxAnalysesPerMonth: Infinity,
    canCompare: true,
    canExportPDF: true,
    canAccessAPI: false,
  },
  team: {
    maxAnalysesPerMonth: Infinity,
    canCompare: true,
    canExportPDF: true,
    canAccessAPI: true,
  },
}

// Cache API response 30s
const API_CACHE_KEY = 'apex_subscription_cache'
const CACHE_DURATION = 30 * 1000 // 30 secondes

function getCachedSubscription(userId: string): SubscriptionData | null {
  try {
    const cached = localStorage.getItem(`${API_CACHE_KEY}_${userId}`)
    if (!cached) return null
    
    const { data, timestamp } = JSON.parse(cached)
    const now = Date.now()
    
    if (now - timestamp < CACHE_DURATION) {
      console.log("📦 Using cached subscription")
      return data
    }
    
    // Cache expiré
    localStorage.removeItem(`${API_CACHE_KEY}_${userId}`)
    return null
  } catch {
    return null
  }
}

function setCachedSubscription(userId: string, data: SubscriptionData) {
  try {
    localStorage.setItem(
      `${API_CACHE_KEY}_${userId}`,
      JSON.stringify({ data, timestamp: Date.now() })
    )
  } catch {
    // Ignore localStorage errors
  }
}

export function useSubscription() {
  const { user } = useUser()
  const [subscription, setSubscription] = useState<SubscriptionData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadSubscription = async () => {
      if (!user) {
        setSubscription(null)
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // Vérifier le cache localStorage en premier (instantané)
        const cached = getCachedSubscription(user.id)
        if (cached) {
          setSubscription(cached)
          setLoading(false)
          console.log("✅ Subscription loaded from cache")
          // Charger en arrière-plan pour mettre à jour si nécessaire
        }

        // Essayer l'API (avec cache de 30s)
        const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000"
        try {
          const response = await fetch(
            `${API_URL}/api/subscription-status?user_id=${user.id}`,
            { cache: 'no-cache' }
          )
          
          if (response.ok) {
            const data = await response.json()
            console.log("📦 Subscription from API:", data)
            
            if (data.plan && data.plan !== 'free') {
              // Mettre en cache
              const subscriptionData: SubscriptionData = {
                plan: data.plan as SubscriptionPlan,
                status: (data.status || 'active') as SubscriptionStatus,
                customerId: data.customer_id || null,
                currentPeriodEnd: null,
                cancelAtPeriodEnd: false,
              }
              setCachedSubscription(user.id, subscriptionData)
              
              // Mettre à jour Supabase (async, non bloquant)
              supabase.auth.updateUser({
                data: {
                  subscription: { plan: data.plan, status: data.status },
                  subscription_status: data.status,
                  stripe_customer_id: data.customer_id,
                }
              }).catch(err => console.warn("Supabase update slow/failed:", err))
              
              setSubscription(subscriptionData)
              setLoading(false)
              return
            }
          }
        } catch (apiError) {
          console.warn("API error, fallback to metadata/cache:", apiError)
          // Si on a un cache, on l'utilise même si l'API échoue
          if (cached) {
            setLoading(false)
            return
          }
        }

        // Fallback: Récupérer depuis Supabase user_metadata
        const plan = (user.user_metadata?.subscription?.plan as SubscriptionPlan) || 
                     (user.user_metadata?.subscription as SubscriptionPlan) || 
                     'free'
        const status = (user.user_metadata?.subscription?.status as SubscriptionStatus) ||
                       (user.user_metadata?.subscription_status as SubscriptionStatus) || 
                       'active'
        const customerId = user.user_metadata?.stripe_customer_id || null
        const currentPeriodEnd = user.user_metadata?.subscription_period_end || null
        const cancelAtPeriodEnd = user.user_metadata?.cancel_at_period_end || false

        const subscriptionData: SubscriptionData = {
          plan,
          status,
          customerId,
          currentPeriodEnd,
          cancelAtPeriodEnd,
        }
        
        // Mettre en cache même si c'est "free"
        setCachedSubscription(user.id, subscriptionData)
        
        setSubscription(subscriptionData)
      } catch (err) {
        console.error('Error loading subscription:', err)
        setError('Erreur lors du chargement de l\'abonnement')
        // Par défaut, plan gratuit
        setSubscription({
          plan: 'free',
          status: 'active',
          customerId: null,
          currentPeriodEnd: null,
          cancelAtPeriodEnd: false,
        })
      } finally {
        setLoading(false)
      }
    }

    loadSubscription()
  }, [user])

  const limits = subscription ? PLAN_LIMITS[subscription.plan] : PLAN_LIMITS.free
  const isPro = subscription?.plan === 'pro' || subscription?.plan === 'team'
  const isActive = subscription?.status === 'active' || subscription?.status === 'trialing'

  return {
    subscription,
    limits,
    isPro,
    isActive,
    loading,
    error,
  }
}

/**
 * Fonction utilitaire pour forcer PRO en mode test
 * Utilisation: forceProSubscription()
 */
export async function forceProSubscription() {
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      console.error("No user found")
      return
    }

    await supabase.auth.updateUser({
      data: {
        subscription: { plan: "pro", status: "active" },
        subscription_status: "active",
      }
    })
    
    console.log("✅ Subscription forced to PRO")
    // Recharger la page pour mettre à jour l'état
    window.location.reload()
  } catch (error) {
    console.error("Error forcing PRO:", error)
  }
}
