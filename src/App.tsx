import { useEffect } from "react";
import { HelmetProvider } from "react-helmet-async";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}
import { AuthProvider } from "@/hooks/useAuth";
import { SubscriptionProvider } from "@/hooks/useSubscription.tsx";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Admin from "./pages/Admin";
import { usePageTracking } from "./hooks/usePageTracking";
import { AdminStatsWidget } from "./components/admin/AdminStatsWidget";
import Upload from "./pages/Upload";
import PricingPage from "./pages/PricingPage";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import ResetPassword from "./pages/ResetPassword";
import Success from "./pages/Success";
import Legal from "./pages/Legal";
import CGU from "./pages/legal/CGU";
import Confidentialite from "./pages/legal/Confidentialite";
import Parametres from "./pages/Parametres";
import AnalysisResultPage from "./pages/AnalysisResultPage";
import NotFound from "./pages/NotFound";
import MonKart from "./pages/MonKart";
import SetupPage from "./pages/SetupPage";
import { SetupPreviewPage } from "./pages/SetupPreviewPage";
import { MonKartPreviewPage } from "./pages/MonKartPreviewPage";
import { useAuth } from "@/hooks/useAuth";

const queryClient = new QueryClient();

function SetupRouteWrapper() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <SetupPreviewPage />;
  return <SetupPage />;
}

function MonKartRouteWrapper() {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (!isAuthenticated) return <MonKartPreviewPage />;
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
        <BrowserRouter>
          <ThemeInit />
          <ScrollToTop />
          <AuthProvider>
            <SubscriptionProvider>
              <PageTracker />
              <AdminStatsWidget />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/reset-password" element={<ResetPassword />} />
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
                <Route path="/mon-kart" element={<MonKartRouteWrapper />} />
                <Route path="/setup" element={<SetupRouteWrapper />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </SubscriptionProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </HelmetProvider>
);

export default App;
