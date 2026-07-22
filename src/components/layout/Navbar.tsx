import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Zap, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/hooks/useAuth";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { ADMIN_EMAIL } from "@/constants";
import { cn } from "@/lib/utils";
import { MenuToggleIcon } from "@/components/ui/menu-toggle-icon";
import { useScroll } from "@/components/ui/use-scroll";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetClose,
} from "@/components/ui/sheet";

const guestNavItems = [
  { name: "Accueil", path: "/" },
  { name: "Tableau de bord", path: "/dashboard" },
  { name: "Analyser", path: "/upload", isHero: true },
  { name: "Mon Kart", path: "/mon-kart" },
  { name: "Réglages", path: "/setup" },
  { name: "Plans", path: "/pricing" },
];

const subscriberNavItems = [
  { name: "Accueil", path: "/" },
  { name: "Tableau de bord", path: "/dashboard" },
  { name: "Analyser", path: "/upload", isHero: true },
  { name: "Mon Kart", path: "/mon-kart" },
  { name: "Réglages", path: "/setup" },
  { name: "Plans", path: "/pricing" },
];

export const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user, signOut, loading } = useAuth();
  const { tier } = useSubscription();
  const scrolled = useScroll(10);
  const [isOpen, setIsOpen] = useState(false);

  const navItems = isAuthenticated ? subscriberNavItems : guestNavItems;

  const filteredNavItems = navItems.filter((item) => {
    if (item.path === "/pricing" && isAuthenticated && tier !== "rookie") {
      return false;
    }
    return true;
  });

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate("/");
    }
  };

  return (
    <header
      className={cn(
        "fixed left-0 right-0 z-50 mx-auto w-full transition-all duration-500 ease-in-out transform-gpu border-b",
        scrolled && !isOpen
          ? "bg-background/70 backdrop-blur-xl border-border/80 shadow-lg shadow-primary/5 md:top-4 md:max-w-5xl md:rounded-2xl"
          : "bg-background/75 backdrop-blur-md border-border/40 md:top-0 md:max-w-full md:rounded-none",
        isOpen ? "bg-background/95 border-border" : ""
      )}
    >
      <div className="container mx-auto px-4">
        <div
          className={cn(
            "flex items-center justify-between transition-all duration-500 ease-in-out",
            scrolled && !isOpen ? "h-14" : "h-16"
          )}
        >
          {/* Logo */}
          <Link
            to="/"
            replace
            className="flex items-center gap-2 group transition-opacity hover:opacity-90 cursor-pointer no-underline"
          >
            <div className="w-10 h-10 rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 group-hover:shadow-primary/50 transition-transform duration-200 cursor-pointer">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-xl text-foreground group-hover:text-primary/90 transition-colors">
              APEX<span className="text-primary">AI</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {filteredNavItems.map((item) => (
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
                  <Link
                    to="/admin"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-600 text-white border border-red-500 shadow-sm hover:bg-red-500 transition-colors"
                    title="Ouvrir le back-office"
                  >
                    Admin
                  </Link>
                )}
                <SubscriptionBadge />
                
                {/* Profile Dropdown */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2 select-none focus-visible:ring-0">
                      {(user?.user_metadata?.avatar_url as string) ? (
                        <Avatar className="w-6 h-6 rounded-lg">
                          <AvatarImage
                            src={user.user_metadata.avatar_url as string}
                            alt=""
                            className="object-cover"
                          />
                          <AvatarFallback className="rounded-lg text-xs">
                            {(user?.user_metadata?.full_name || user?.email || "U")
                              .toString()
                              .slice(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      ) : (
                        <User className="w-4 h-4" />
                      )}
                      {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Profil"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 bg-popover border-border backdrop-blur-xl">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none text-foreground">
                          {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                        </p>
                        <p className="text-xs leading-none text-muted-foreground truncate">
                          {user?.email}
                        </p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem asChild className="focus:bg-muted focus:text-foreground cursor-pointer">
                      <Link to="/profile" className="w-full flex items-center gap-2">
                        <User className="w-4 h-4" />
                        Mon Profil
                      </Link>
                    </DropdownMenuItem>
                    {isAuthenticated && tier !== "rookie" && (
                      <DropdownMenuItem asChild className="focus:bg-muted focus:text-foreground cursor-pointer">
                        <Link to="/pricing" className="w-full flex items-center gap-2">
                          <Zap className="w-4 h-4 text-primary" />
                          Plans
                        </Link>
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator className="bg-border" />
                    <DropdownMenuItem onClick={handleSignOut} className="focus:bg-red-500/10 focus:text-red-500 text-red-400 cursor-pointer">
                      <div className="w-full flex items-center gap-2">
                        <LogOut className="w-4 h-4" />
                        Déconnexion
                      </div>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Connexion
                  </Button>
                </Link>
                <Link to="/login?mode=signup">
                  <Button variant="hero" size="sm">
                    Inscription
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Navigation Trigger & Drawer */}
          <div className="flex md:hidden items-center gap-3">
            {isAuthenticated && <SubscriptionBadge />}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="text-foreground hover:bg-white/5 focus-visible:ring-0">
                  <MenuToggleIcon open={isOpen} className="w-6 h-6" duration={300} />
                </Button>
              </SheetTrigger>
              <SheetContent side="right" className="w-[300px] sm:w-[350px] bg-background border-l border-border backdrop-blur-xl flex flex-col p-6">
                <div className="flex items-center gap-2 mb-8 mt-2">
                  <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-lg shadow-primary/30">
                    <Zap className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <span className="font-display font-bold text-lg text-foreground">
                    APEX<span className="text-primary">AI</span>
                  </span>
                </div>
                
                {/* Navigation Items (Vertical List) */}
                <div className="flex flex-col gap-4 flex-1">
                  {filteredNavItems.map((item) => (
                    <SheetClose asChild key={item.path + item.name}>
                      <Link
                        to={item.path}
                        className={`text-base font-medium py-2 transition-all ${
                          (item as any).isHero
                            ? "gradient-primary text-primary-foreground px-4 py-2 rounded-full text-center shadow-lg shadow-primary/30 active:scale-95 animate-pulse-neon"
                            : location.pathname === item.path
                              ? "text-primary"
                              : "text-muted-foreground hover:text-primary"
                        }`}
                      >
                        {item.name}
                      </Link>
                    </SheetClose>
                  ))}
                </div>

                {/* User Account / CTA Section at the Bottom */}
                <div className="border-t border-border pt-6 mt-auto">
                  {loading ? (
                    <div className="w-full h-10 animate-pulse bg-secondary rounded" />
                  ) : isAuthenticated ? (
                    <div className="flex flex-col gap-4">
                      <div className="flex items-center gap-3">
                        {(user?.user_metadata?.avatar_url as string) ? (
                          <Avatar className="w-10 h-10 rounded-lg">
                            <AvatarImage
                              src={user.user_metadata.avatar_url as string}
                              alt=""
                              className="object-cover"
                            />
                            <AvatarFallback className="rounded-lg text-sm">
                              {(user?.user_metadata?.full_name || user?.email || "U")
                                .toString()
                                .slice(0, 2)
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center border border-border">
                            <User className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="flex flex-col">
                          <span className="text-sm font-semibold text-foreground">
                            {user?.user_metadata?.full_name || user?.email?.split("@")[0]}
                          </span>
                          <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                            {user?.email}
                          </span>
                        </div>
                      </div>
                      
                      <div className="flex flex-col gap-2 mt-2">
                        <SheetClose asChild>
                          <Link to="/profile" className="w-full">
                            <Button variant="outline" className="w-full justify-start gap-2 bg-muted/50 border-border hover:bg-muted">
                              <User className="w-4 h-4" />
                              Mon Profil
                            </Button>
                          </Link>
                        </SheetClose>
                        {tier !== "rookie" && (
                          <SheetClose asChild>
                            <Link to="/pricing" className="w-full">
                              <Button variant="outline" className="w-full justify-start gap-2 bg-muted/50 border-border hover:bg-muted">
                                <Zap className="w-4 h-4 text-primary" />
                                Plans
                              </Button>
                            </Link>
                          </SheetClose>
                        )}
                        <SheetClose asChild>
                          <Button variant="ghost" className="w-full justify-start gap-2 text-red-400 hover:text-red-500 hover:bg-red-500/10" onClick={handleSignOut}>
                            <LogOut className="w-4 h-4" />
                            Déconnexion
                          </Button>
                        </SheetClose>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-3">
                      <SheetClose asChild>
                        <Link to="/login" className="w-full">
                          <Button variant="ghost" className="w-full justify-center">
                            Connexion
                          </Button>
                        </Link>
                      </SheetClose>
                      <SheetClose asChild>
                        <Link to="/login?mode=signup" className="w-full">
                          <Button variant="hero" className="w-full justify-center">
                            Inscription
                          </Button>
                        </Link>
                      </SheetClose>
                    </div>
                  )}
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
};
