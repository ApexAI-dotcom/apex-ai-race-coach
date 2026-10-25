import { lazy, Suspense, useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { SubscriptionProvider, useSubscription } from "@/hooks/useSubscription.tsx";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { loaders, prefetchCoreRoutes } from "./pages/loaders";
import { usePageTracking } from "./hooks/usePageTracking";
import { AdminStatsWidget } from "./components/admin/AdminStatsWidget";
import { useAuth } from "@/hooks/useAuth";

// L'accueil reste dans le paquet principal : c'est la porte d'entrée de tout
// le monde, il doit s'afficher sans attendre un second téléchargement.
// Tout le reste est chargé à la demande — et préchargé au repos (loaders.ts).
const Dashboard = lazy(loaders.dashboard);
const Admin = lazy(loaders.admin);
const RedeemPage = lazy(loaders.redeem);
const Upload = lazy(loaders.upload);
const PricingPage = lazy(loaders.pricing);
const Profile = lazy(loaders.profile);
const Login = lazy(loaders.login);
const ResetPassword = lazy(loaders.resetPassword);
const AuthConfirm = lazy(loaders.authConfirm);
const Success = lazy(loaders.success);
const Legal = lazy(loaders.legal);
const CGU = lazy(loaders.cgu);
const Confidentialite = lazy(loaders.confidentialite);
const Parametres = lazy(loaders.parametres);
const CalendarPage = lazy(loaders.calendar);
const AnalysisResultPage = lazy(loaders.analysisResult);
const MonKart = lazy(loaders.monKart);
const SetupPage = lazy(loaders.setup);
const SetupPreviewPage = lazy(() =>
  loaders.setupPreview().then((m) => ({ default: m.SetupPreviewPage }))
);
const MonKartPreviewPage = lazy(() =>
  loaders.monKartPreview().then((m) => ({ default: m.MonKartPreviewPage }))
);

const queryClient = new QueryClient();

function RoutePrefetcher() {
  useEffect(() => {
    // Après le premier affichage seulement : rien ne doit lui voler la vedette.
    const t = window.setTimeout(prefetchCoreRoutes, 1200);
    return () => window.clearTimeout(t);
  }, []);
  return null;
}

function SetupRouteWrapper() {
  const { isAuthenticated, loading } = useAuth();
  const { tier, isLoading } = useSubscription();
  if (loading || (isAuthenticated && isLoading)) return null;
  // Vitrine pour les non-abonnés (visiteurs ET rookies), vraie page pour Racer/Team.
  if (!isAuthenticated || tier === "rookie" || tier === "visitor") return <SetupPreviewPage />;
  return <SetupPage />;
}

function MonKartRouteWrapper() {
  const { isAuthenticated, loading } = useAuth();
  const { tier, isLoading } = useSubscription();
  if (loading || (isAuthenticated && isLoading)) return null;
  if (!isAuthenticated || tier === "rookie" || tier === "visitor") return <MonKartPreviewPage />;
  return <MonKart />;
}

function PageTracker() {
  usePageTracking();
  return null;
}

function ThemeInit() {
  useEffect(() => {
    try {
      const saved = localStorage.getItem("apexai_settings");
      if (saved) {
        const parsed = JSON.parse(saved) as { theme?: "dark" | "light" };
        if (parsed.theme === "light") {
          document.documentElement.classList.add("light");
        } else {
          document.documentElement.classList.remove("light");
        }
      }
    } catch {
      // ignore
    }
  }, []);
  return null;
}

const App = () => (
  <HelmetProvider>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        {/* v7_startTransition : la page actuelle reste affichée tant que la
            suivante n'est pas prête — jamais d'écran vide entre deux pages. */}
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <ThemeInit />
          <RoutePrefetcher />
          <AuthProvider>
            <SubscriptionProvider>
              <PageTracker />
              <AdminStatsWidget />
              <AppShell>
              <Suspense fallback={null}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
                <Route path="/auth/confirm" element={<AuthConfirm />} />
                <Route path="/pricing" element={<PricingPage />} />
                <Route path="/success" element={<Success />} />
                <Route path="/legal" element={<Legal />} />
                <Route path="/legal/cgu" element={<CGU />} />
                <Route path="/legal/confidentialite" element={<Confidentialite />} />
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <Dashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin"
                  element={
                    <ProtectedRoute>
                      <Admin />
                    </ProtectedRoute>
                  }
                />
                <Route path="/redeem" element={<RedeemPage />} />
                <Route path="/upload" element={<Upload />} />
                <Route
                  path="/profile"
                  element={
                    <ProtectedRoute>
                      <Profile />
                    </ProtectedRoute>
                  }
                />
                <Route path="/analysis/:analysisId" element={<AnalysisResultPage />} />
                <Route
                  path="/parametres"
                  element={
                    <ProtectedRoute>
                      <Parametres />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/calendrier"
                  element={
                    <ProtectedRoute>
                      <CalendarPage />
                    </ProtectedRoute>
                  }
                />
                <Route path="/mon-kart" element={<MonKartRouteWrapper />} />
                <Route path="/setup" element={<SetupRouteWrapper />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              </Suspense>
              </AppShell>
            </SubscriptionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
