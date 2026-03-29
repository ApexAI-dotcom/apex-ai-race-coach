import { Link, useLocation, useNavigate } from "react-router-dom";
import { Zap, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { ADMIN_EMAIL } from "@/constants";

const guestNavItems = [
  { name: "Accueil", path: "/" },
  { name: "Tableau de bord", path: "/dashboard" },
  { name: "Télécharger", path: "/upload" },
  { name: "Plans", path: "/pricing" },
];

const subscriberNavItems = [
  { name: "Accueil", path: "/" },
  { name: "Tableau de bord", path: "/dashboard" },
  { name: "Analyser", path: "/upload", isHero: true },
  { name: "Mon Kart", path: "/mon-kart" },
  { name: "Plans", path: "/pricing" },
];

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut, loading } = useAuth();

  const navItems = isAuthenticated ? subscriberNavItems : guestNavItems;

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate("/");
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-white/5">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" replace className="flex items-center gap-2 group transition-opacity hover:opacity-90 cursor-pointer no-underline">
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 group-hover:shadow-primary/50 transition-transform duration-200 cursor-pointer">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground group-hover:text-primary/90 transition-colors">
              APEX<span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link
                key={item.path + item.name}
                to={item.path}
                className={`text-sm font-medium transition-all ${
                  (item as any).isHero
                    ? "gradient-primary text-primary-foreground px-4 py-1.5 rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 active:scale-100 animate-pulse-neon animate-shimmer active-shimmer"
                    : location.pathname === item.path
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary hover:underline underline-offset-4"
                }`}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 animate-pulse bg-secondary rounded" />
            ) : isAuthenticated ? (
              <>
                {user?.email === ADMIN_EMAIL && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-600 text-white border border-red-500 shadow-sm">
                    Admin
                  </span>
                )}
                <SubscriptionBadge />
                <Link to="/profile">
                  <Button variant="ghost" size="sm" className="gap-2">
                    {(user?.user_metadata?.avatar_url as string) ? (
                      <Avatar className="w-6 h-6 rounded-lg">
                        <AvatarImage src={user.user_metadata.avatar_url as string} alt="" className="object-cover" />
                        <AvatarFallback className="rounded-lg text-xs">
                          {(user?.user_metadata?.full_name || user?.email || "U").toString().slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    ) : (
                      <User className="w-4 h-4" />
                    )}
                    {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Profil"}
                  </Button>
                </Link>
                {/* No more "Analyser CSV" button here — it's now in the nav items */}
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="gap-2">
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Connexion</Button>
                </Link>
                <Link to="/login">
                  <Button variant="hero" size="sm">Inscription</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
