import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Layout } from "@/components/layout/Layout";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <Layout>
      <div className="flex min-h-[70vh] items-center justify-center px-4">
        <div className="text-center">
          <h1 className="mb-4 text-4xl font-bold">404</h1>
          <p className="mb-4 text-xl text-muted-foreground">Oups ! Page introuvable</p>
          {/* Lien interne : pas de rechargement complet de l'app. */}
          <Link to="/" className="text-primary underline hover:text-primary/90">
            Retour à l'accueil
          </Link>
        </div>
      </div>
    </Layout>
  );
};

export default NotFound;
