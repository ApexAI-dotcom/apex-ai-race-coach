import { Link, useLocation } from "react-router-dom";
import { Home, BarChart3, Upload, User, Settings } from "lucide-react";
import { motion } from "framer-motion";

const navItems = [
  { icon: Home, label: "Accueil", path: "/" },
  { icon: BarChart3, label: "Tableau de bord", path: "/dashboard" },
  { icon: Upload, label: "Télécharger", path: "/upload" },
  { icon: Settings, label: "Paramètres", path: "/parametres" },
  { icon: User, label: "Profil", path: "/profile" },
];

export const MobileNav = () => {
  const location = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-card border-t border-white/5 pb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center justify-around h-16 px-4 min-h-[4rem]">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative flex flex-col items-center gap-1 py-2 px-4"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 rounded-xl"
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
              <Icon
                className={`w-5 h-5 relative z-10 ${
                  isActive ? "text-primary" : "text-muted-foreground"
                }`}
              />
              <span
                className={`text-xs relative z-10 ${
                  isActive ? "text-primary font-medium" : "text-muted-foreground"
                }`}
              >
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};
