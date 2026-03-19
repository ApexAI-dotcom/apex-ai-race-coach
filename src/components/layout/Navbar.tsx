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
  Settings
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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0d1117] border-b border-white/5 h-16 flex items-center shadow-lg">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" replace className="flex items-center gap-2 group transition-opacity hover:opacity-90 cursor-pointer no-underline">
            <div className="w-9 h-9 rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-105 transition-transform duration-200">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-lg text-foreground">
              APEX<span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navItems.map((item) => (
              <Link
                key={item.path + item.name}
                to={item.path}
                className={cn(
                  "text-sm font-medium transition-colors hover:text-primary",
                  location.pathname === item.path ? "text-primary" : "text-muted-foreground"
                )}
              >
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
                  <Button variant="ghost" size="sm" className="gap-2 h-9">
                    <Avatar className="w-6 h-6 rounded-md">
                      <AvatarImage src={(user?.user_metadata?.avatar_url as string) || ""} alt="" className="object-cover" />
                      <AvatarFallback className="rounded-md text-[10px] bg-secondary">
                        {(user?.user_metadata?.full_name || user?.email || "U").toString().slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="max-w-[100px] truncate">
                      {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Profil"}
                    </span>
                  </Button>
                </Link>
                <Button variant="ghost" size="icon" onClick={handleSignOut} className="h-9 w-9 text-muted-foreground hover:text-red-500 transition-colors">
                  <LogOut className="w-4 h-4" />
                </Button>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">Connexion</Button>
                </Link>
                <Link to="/login">
                  <Button variant="hero" size="sm" className="px-6">Inscription</Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Trigger using Sheet */}
          <div className="md:hidden">
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground">
                  <Menu className="w-6 h-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] bg-[#0d1117] border-white/10 p-0 flex flex-col shadow-2xl">
                <SheetHeader className="p-6 border-b border-white/5 text-left">
                  <SheetTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-primary" />
                    <span className="font-display font-bold">APEX AI</span>
                  </SheetTitle>
                  <SheetDescription className="text-xs text-muted-foreground">
                    Navigation Pilote
                  </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
                  {navItems.map((item) => (
                    <Link
                      key={item.path + item.name}
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-3 p-4 rounded-xl transition-all active:scale-[0.98]",
                        location.pathname === item.path
                          ? "bg-primary/10 text-primary border border-primary/20"
                          : "hover:bg-white/5 text-muted-foreground"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5", location.pathname === item.path ? "text-primary" : "text-muted-foreground")} />
                      <span className="font-medium">{item.name}</span>
                    </Link>
                  ))}
                </div>

                <div className="p-6 border-t border-white/5 bg-white/2 space-y-4">
                  {isAuthenticated ? (
                    <div className="space-y-4">
                      <div className="flex items-center gap-3 p-3 bg-white/5 rounded-xl border border-white/5">
                        <Avatar className="w-10 h-10 rounded-lg">
                          <AvatarImage src={(user?.user_metadata?.avatar_url as string) || ""} alt="" className="object-cover" />
                          <AvatarFallback className="rounded-lg text-sm bg-secondary">
                            {(user?.user_metadata?.full_name || user?.email || "U").toString().slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 overflow-hidden">
                          <div className="font-bold truncate text-foreground">{user?.user_metadata?.full_name || user?.email?.split("@")[0]}</div>
                          <div className="text-[10px] text-muted-foreground truncate">{user?.email}</div>
                        </div>
                      </div>

                      <div className="px-1"><SubscriptionBadge /></div>
                      
                      <div className="grid grid-cols-1 gap-2">
                        <Link to="/profile" onClick={() => setIsOpen(false)}>
                          <Button variant="secondary" className="w-full justify-start gap-3 h-11 rounded-xl">
                            <User className="w-4 h-4" />
                            Mon Profil
                          </Button>
                        </Link>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start gap-3 h-11 rounded-xl text-muted-foreground hover:text-red-500" 
                          onClick={() => { setIsOpen(false); handleSignOut(); }}
                        >
                          <LogOut className="w-4 h-4" />
                          Déconnexion
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 gap-3">
                      <Link to="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="outline" className="w-full h-11 rounded-xl border-white/10">Connexion</Button>
                      </Link>
                      <Link to="/login" onClick={() => setIsOpen(false)}>
                        <Button variant="hero" className="w-full h-11 rounded-xl">Inscription</Button>
                      </Link>
                    </div>
                  )}
                </div>
                
                <div className="p-4 text-center">
                  <p className="text-[10px] text-muted-foreground">© 2026 APEX AI</p>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </nav>
  );
};
