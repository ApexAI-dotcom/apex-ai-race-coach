import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Zap, LogOut, User, ChevronRight } from "lucide-react";
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
  { name: "Plans", path: "/pricing" },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut, loading } = useAuth();
  const [shimmering, setShimmering] = useState(false);

  const triggerShimmer = () => {
    setShimmering(true);
    setTimeout(() => setShimmering(false), 2500);
  };

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
                    ? `gradient-primary text-primary-foreground px-4 py-1.5 rounded-full shadow-lg shadow-primary/30 hover:shadow-xl hover:scale-105 active:scale-100 animate-pulse-neon animate-shimmer ${shimmering ? "active-shimmer" : ""}`
                    : location.pathname === item.path
                      ? "text-primary"
                      : "text-muted-foreground hover:text-primary hover:underline underline-offset-4"
                }`}
                onClick={(item as any).isHero ? triggerShimmer : undefined}
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

          {/* Mobile Menu Button */}
          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2 text-foreground">
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] md:hidden"
          >
            {/* Backdrop */}
            <div 
              className="absolute inset-0 bg-background/60 backdrop-blur-md"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute top-0 right-0 bottom-0 w-[80%] max-w-sm bg-background border-l border-white/10 shadow-2xl flex flex-col"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5">
                <span className="font-display font-bold text-xl">Menu</span>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full bg-secondary/50 text-foreground"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-8">
                {/* Navigation Section */}
                <div>
                  <h4 className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase mb-4">Navigation</h4>
                  <div className="space-y-2">
                    {navItems.map((item) => (
                      <Link
                        key={item.path+item.name}
                        to={item.path}
                        className={`flex items-center justify-between p-4 rounded-2xl transition-all active:scale-95 ${
                          (item as any).isHero
                            ? `gradient-primary text-primary-foreground font-bold shadow-lg shadow-primary/20 animate-pulse-neon animate-shimmer ${shimmering ? "active-shimmer" : ""}`
                            : location.pathname === item.path
                              ? "bg-primary/10 text-primary border border-primary/20"
                              : "bg-secondary/20 text-muted-foreground hover:bg-secondary/40 border border-transparent"
                        }`}
                        onClick={() => {
                          setIsOpen(false);
                          if ((item as any).isHero) triggerShimmer();
                        }}
                      >
                        <span className="font-medium">{item.name}</span>
                        {(item as any).isHero ? <Zap className="w-4 h-4" /> : <ChevronRight className="w-4 h-4 opacity-50" />}
                      </Link>
                    ))}
                  </div>
                </div>

                {/* Account Section */}
                <div>
                  <h4 className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase mb-4">Compte</h4>
                  <div className="space-y-2">
                    {loading ? (
                      <div className="w-full h-12 animate-pulse bg-secondary rounded-2xl" />
                    ) : isAuthenticated ? (
                      <>
                        <Link 
                          to="/profile" 
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-4 p-4 rounded-2xl bg-secondary/20 border border-transparent ${location.pathname === "/profile" ? "border-primary/20 bg-primary/5 text-primary" : "text-foreground"}`}
                        >
                          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold shadow-sm">
                            {(user?.user_metadata?.avatar_url as string) ? (
                              <img src={user.user_metadata.avatar_url as string} className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <User className="w-5 h-5" />
                            )}
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="font-bold truncate">{user?.user_metadata?.full_name || user?.email?.split("@")[0]}</div>
                            <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
                          </div>
                        </Link>
                        
                        <div className="px-2"><SubscriptionBadge /></div>

                        <Button 
                          variant="ghost" 
                          className="w-full justify-start gap-3 h-12 rounded-2xl text-muted-foreground" 
                          onClick={() => { setIsOpen(false); handleSignOut(); }}
                        >
                          <LogOut className="w-4 h-4" />
                          Déconnexion
                        </Button>
                      </>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1">
                          <Button variant="outline" className="w-full h-12 rounded-2xl border-white/10 bg-secondary/20">Connexion</Button>
                        </Link>
                        <Link to="/login" onClick={() => setIsOpen(false)} className="flex-1">
                          <Button variant="hero" className="w-full h-12 rounded-2xl">Rejoindre</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer info */}
              <div className="p-8 text-center border-t border-white/5">
                <p className="text-[10px] text-muted-foreground">© 2026 APEX AI — Propulsé par l'IA</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
