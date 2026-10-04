/**
 * Apex AI - Protected Route Component
 * Composant pour protéger les routes nécessitant une authentification
 */

import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <DelayedSpinner />;
  }

  if (!isAuthenticated) {
    // Rediriger vers la page de connexion avec l'état pour revenir après connexion
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

/**
 * La session se lit en quelques millisecondes la plupart du temps : afficher
 * un spinner tout de suite produisait un clignotement à chaque ouverture.
 * Il n'apparaît que si l'attente devient réellement perceptible.
 */
function DelayedSpinner() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const t = window.setTimeout(() => setShow(true), 350);
    return () => window.clearTimeout(t);
  }, []);
  if (!show) return <div className="min-h-[70vh]" />;
  return (
    <div className="flex items-center justify-center min-h-[70vh] animate-in fade-in-0 duration-300">
      <div className="text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    </div>
  );
}
