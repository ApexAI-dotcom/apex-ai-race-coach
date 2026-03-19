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
  { name: "Accueil", path: "/", icon: <Zap className="w-4 h-4" /> },
  { name: "Tableau de bord", path: "/dashboard", icon: <ChevronRight className="w-4 h-4" /> },
  { name: "Télécharger", path: "/upload", icon: <Zap className="w-4 h-4" /> },
  { name: "Plans", path: "/pricing", icon: <ChevronRight className="w-4 h-4" /> },
];

const subscriberNavItems = [
  { name: "Accueil", path: "/", icon: <Zap className="w-4 h-4" /> },
  { name: "Tableau de bord", path: "/dashboard", icon: <ChevronRight className="w-4 h-4" /> },
  { name: "Analyser", path: "/upload", isHero: true, icon: <Zap className="w-4 h-4" /> },
  { name: "Plans", path: "/pricing", icon: <ChevronRight className="w-4 h-4" /> },
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
              className="absolute inset-0 bg-background/40 backdrop-blur-xl"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu Content */}
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute top-0 right-0 bottom-0 w-[85%] max-w-sm glass-card border-l border-white/10 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/5">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-primary/20">
                    <Zap className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-display font-black text-lg tracking-tight">MENU</span>
                </div>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-foreground transition-colors border border-white/10"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-10 custom-scrollbar">
                {/* Navigation Section */}
                <motion.div
                  initial="hidden"
                  animate="visible"
                  variants={{
                    hidden: { opacity: 0 },
                    visible: {
                      opacity: 1,
                      transition: { staggerChildren: 0.1 }
                    }
                  }}
                >
                  <h4 className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase mb-6 pl-2">Navigation</h4>
                  <div className="space-y-3">
                    {navItems.map((item, idx) => (
                      <motion.div
                        key={item.path + item.name}
                        variants={{
                          hidden: { x: 20, opacity: 0 },
                          visible: { x: 0, opacity: 1 }
                        }}
                      >
                        <Link
                          to={item.path}
                          className={`flex items-center justify-between p-4 rounded-2xl transition-all active:scale-95 group ${
                            (item as any).isHero
                              ? `gradient-primary text-primary-foreground font-bold shadow-xl shadow-primary/20 animate-pulse-neon animate-shimmer ${shimmering ? "active-shimmer" : ""}`
                              : location.pathname === item.path
                                ? "bg-primary/10 text-primary border border-primary/20"
                                : "bg-white/5 text-muted-foreground hover:bg-white/10 border border-white/5 hover:border-white/10"
                          }`}
                          onClick={() => {
                            setIsOpen(false);
                            if ((item as any).isHero) triggerShimmer();
                          }}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-base">{item.name}</span>
                          </div>
                          {(item as any).isHero ? (
                            <Zap className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4 opacity-50 group-hover:translate-x-1 transition-transform" />
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                {/* Account Section */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                >
                  <h4 className="text-[10px] font-black tracking-[0.2em] text-muted-foreground uppercase mb-6 pl-2">Compte</h4>
                  <div className="space-y-4">
                    {loading ? (
                      <div className="w-full h-20 animate-pulse bg-white/5 rounded-2xl" />
                    ) : isAuthenticated ? (
                      <div className="space-y-4">
                        <Link 
                          to="/profile" 
                          onClick={() => setIsOpen(false)}
                          className={`flex items-center gap-4 p-4 rounded-2xl transition-all hover:bg-white/10 border ${
                            location.pathname === "/profile" 
                              ? "border-primary/30 bg-primary/5 text-primary shadow-lg shadow-primary/5" 
                              : "border-white/5 bg-white/5 text-foreground"
                          }`}
                        >
                          <div className="relative">
                            <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center text-primary-foreground font-bold shadow-lg shadow-primary/20 overflow-hidden">
                              {(user?.user_metadata?.avatar_url as string) ? (
                                <img src={user.user_metadata.avatar_url as string} className="w-full h-full object-cover" />
                              ) : (
                                <User className="w-6 h-6" />
                              )}
                            </div>
                            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-background rounded-full" />
                          </div>
                          <div className="flex-1 overflow-hidden">
                            <div className="font-extrabold truncate text-base leading-tight">
                              {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                            </div>
                            <div className="text-[10px] text-muted-foreground truncate uppercase tracking-tighter opacity-70">
                              {user?.email}
                            </div>
                          </div>
                        </Link>
                        
                        <div className="flex justify-center">
                          <SubscriptionBadge />
                        </div>

                        <button 
                          className="w-full flex items-center justify-center gap-3 h-14 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 transition-all active:scale-95 font-bold" 
                          onClick={() => { setIsOpen(false); handleSignOut(); }}
                        >
                          <LogOut className="w-5 h-5" />
                          Déconnexion
                        </button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        <Link to="/login" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full h-14 rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 font-bold">Connexion</Button>
                        </Link>
                        <Link to="/login" onClick={() => setIsOpen(false)}>
                          <Button variant="hero" className="w-full h-14 rounded-2xl font-black italic tracking-wider">REJOINDRE APEX</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                </motion.div>
              </div>

              {/* Footer info */}
              <div className="p-8 text-center bg-white/5 border-t border-white/5">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Système En Ligne</span>
                </div>
                <p className="text-[10px] text-muted-foreground/50 font-medium">© 2026 APEX AI — Propulsé par l'IA</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};
