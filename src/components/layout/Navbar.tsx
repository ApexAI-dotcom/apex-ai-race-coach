import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { 
  Home, 
  LayoutDashboard, 
  Zap, 
  LogOut, 
  User, 
  Menu,
  CreditCard,
  PlusCircle,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle, 
  SheetTrigger,
  SheetDescription 
} from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { ADMIN_EMAIL } from "@/constants";
import { cn } from "@/lib/utils";

const guestNavItems = [
  { name: "Accueil", path: "/", icon: Home },
  { name: "Tableau de bord", path: "/dashboard", icon: LayoutDashboard },
  { name: "Télécharger", path: "/upload", icon: PlusCircle },
  { name: "Plans", path: "/pricing", icon: CreditCard },
];

const subscriberNavItems = [
  { name: "Accueil", path: "/", icon: Home },
  { name: "Tableau de bord", path: "/dashboard", icon: LayoutDashboard },
  { name: "Analyser", path: "/upload", icon: PlusCircle, isHero: true },
  { name: "Plans", path: "/pricing", icon: CreditCard },
];

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
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
    <nav className="sticky top-0 left-0 right-0 z-50 bg-[#0d1117]/95 backdrop-blur-md border-b border-white/5 h-16 flex items-center shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" replace className="flex items-center gap-2 group transition-opacity hover:opacity-90 cursor-pointer no-underline">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform duration-200">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground uppercase tracking-tight">
              Apex<span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path + item.name}
                to={item.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary flex items-center gap-2",
                  location.pathname === item.path ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            ))}
          </div>

          {/* Desktop CTA */}
          <div className="hidden md:flex items-center gap-3">
            {loading ? (
              <div className="w-8 h-8 animate-pulse bg-secondary rounded-lg" />
            ) : isAuthenticated ? (
              <>
                {user?.email === ADMIN_EMAIL && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500 border border-red-500/20">
                    Admin
                  </span>
                )}
                <SubscriptionBadge />
                <Link to="/profile">
                  <Button variant="ghost" size="sm" className="gap-2 h-9 p-1 pr-3 rounded-full hover:bg-white/5">
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={(user?.user_metadata?.avatar_url as string) || ""} alt="" className="object-cover" />
                      <AvatarFallback className="text-[10px] bg-secondary">
                        {(user?.user_metadata?.full_name || user?.email || "U").toString().slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-semibold truncate max-w-[80px]">
                      {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Profil"}
                    </span>
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-8 w-8 text-muted-foreground hover:text-red-500">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Connexion</Button>
                </Link>
                <Link to="/login">
                  <Button variant="hero" size="sm" className="px-4">Inscription</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger using Sheet */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-white/5">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[85%] max-w-[320px] bg-[#0d1117] border-white/5 p-0 flex flex-col shadow-2xl overflow-hidden">
                <div className="flex flex-col h-full bg-[#0d1117]">
                  <SheetHeader className="p-6 border-b border-white/5 text-left bg-[#0d1117]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
                        <Zap className="w-4 h-4 text-primary-foreground" />
                      </div>
                      <SheetTitle className="font-display font-bold text-xl">APEX AI</SheetTitle>
                    </div>
                    <SheetDescription className="text-xs text-[#8b949e]">
                      Ton Ingénieur de Course Virtuel
                    </SheetDescription>
                  </SheetHeader>

                  <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 bg-[#0d1117]">
                    {navItems.map((item) => (
                      <Link
                        key={item.path + item.name}
                        to={item.path}
                        onClick={() => setIsOpen(false)}
                        className={cn(
                          "flex items-center gap-4 p-4 rounded-xl transition-all duration-200",
                          location.pathname === item.path
                            ? "bg-primary/10 text-primary font-bold shadow-sm"
                            : "hover:bg-white/5 text-[#e6edf3]"
                        )}
                      >
                        <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "text-primary" : "opacity-60")} />
                        <span className="text-base">{item.name}</span>
                      </Link>
                    ))}
                  </div>

                  <div className="p-6 border-t border-white/5 mt-auto bg-[#0d1117]">
                    {isAuthenticated ? (
                      <div className="space-y-6">
                        <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5 shadow-inner">
                          <Avatar className="w-12 h-12 rounded-xl ring-2 ring-primary/20">
                            <AvatarImage src={(user?.user_metadata?.avatar_url as string) || ""} alt="" className="object-cover" />
                            <AvatarFallback className="rounded-xl text-lg bg-secondary">
                              {(user?.user_metadata?.full_name || user?.email || "U").toString().slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="font-bold text-[#e6edf3] truncate text-lg">
                              {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                            </div>
                            <div className="text-xs text-[#8b949e] truncate">{user?.email}</div>
                          </div>
                        </div>

                        <div className="flex justify-between items-center px-1">
                          <SubscriptionBadge />
                          <Badge variant="outline" className="text-[10px] opacity-40 uppercase tracking-widest border-white/5">
                            ID: {user?.id.slice(0, 8)}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-1 gap-2">
                          <Link to="/profile" onClick={() => setIsOpen(false)} className="w-full">
                            <Button variant="secondary" className="w-full justify-start gap-4 h-12 rounded-xl font-semibold border border-white/5">
                              <User className="w-5 h-5 text-primary" />
                              Mon Profil
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            className="w-full justify-start gap-4 h-12 rounded-xl text-muted-foreground hover:text-red-500 hover:bg-red-500/5 transition-colors" 
                            onClick={() => { setIsOpen(false); handleSignOut(); }}
                          >
                            <LogOut className="w-5 h-5" />
                            Déconnexion
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        <Link to="/login" onClick={() => setIsOpen(false)}>
                          <Button variant="outline" className="w-full h-12 rounded-xl border-white/10 hover:bg-white/5">Connexion</Button>
                        </Link>
                        <Link to="/login" onClick={() => setIsOpen(false)}>
                          <Button variant="hero" className="w-full h-12 rounded-xl shadow-lg shadow-primary/20">Inscription</Button>
                        </Link>
                      </div>
                    )}
                    
                    <div className="mt-8 pt-6 border-t border-white/5 text-center">
                      <p className="text-[10px] text-[#8b949e] uppercase tracking-[0.2em] font-medium">© 2026 APEX AI • Version 1.1</p>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
