import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { Home, LineChart, Zap, Gauge, SlidersHorizontal, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { prefetchRoute } from "@/pages/loaders";

/**
 * Barre d'onglets du téléphone, comme dans une app iOS.
 *
 * Sur mobile, tout passait par le menu hamburger : deux gestes (ouvrir, puis
 * choisir) pour changer d'écran, et aucun repère de l'endroit où l'on se
 * trouve. Les cinq destinations principales sont maintenant sous le pouce,
 * à un seul tap ; le menu garde le reste (calendrier, profil, offres).
 */

interface Tab {
  to: string;
  label: string;
  icon: LucideIcon;
  hero?: boolean;
  match: (path: string) => boolean;
}

const TABS: Tab[] = [
  { to: "/", label: "Accueil", icon: Home, match: (p) => p === "/" },
  {
    to: "/dashboard",
    label: "Sessions",
    icon: LineChart,
    match: (p) => p.startsWith("/dashboard") || p.startsWith("/analysis"),
  },
  { to: "/upload", label: "Analyser", icon: Zap, hero: true, match: (p) => p.startsWith("/upload") },
  { to: "/mon-kart", label: "Mon Kart", icon: Gauge, match: (p) => p.startsWith("/mon-kart") },
  { to: "/setup", label: "Réglages", icon: SlidersHorizontal, match: (p) => p.startsWith("/setup") },
];

/** Écrans plein cadre où une barre d'onglets n'a rien à faire. */
const HIDDEN_ON = ["/login", "/reset-password", "/auth/confirm"];

export function useTabBarVisible() {
  const { pathname } = useLocation();
  return !HIDDEN_ON.includes(pathname);
}

/**
 * Le clavier virtuel recouvre le bas de l'écran : une barre fixe s'y
 * retrouverait coincée au-dessus des touches. On l'escamote le temps de la
 * saisie, comme le fait iOS.
 */
function useKeyboardOpen() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!window.matchMedia("(pointer: coarse)").matches) return;
    const isField = (el: EventTarget | null) =>
      el instanceof HTMLElement &&
      (el.isContentEditable ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        (el instanceof HTMLInputElement &&
          !["checkbox", "radio", "button", "submit", "range", "file", "color"].includes(el.type)));
    const onIn = (e: FocusEvent) => isField(e.target) && setOpen(true);
    const onOut = () => {
      // Le focus peut passer d'un champ à l'autre : on vérifie après coup.
      window.setTimeout(() => setOpen(isField(document.activeElement)), 50);
    };
    document.addEventListener("focusin", onIn);
    document.addEventListener("focusout", onOut);
    return () => {
      document.removeEventListener("focusin", onIn);
      document.removeEventListener("focusout", onOut);
    };
  }, []);
  return open;
}

export function MobileTabBar() {
  const { pathname } = useLocation();
  const keyboardOpen = useKeyboardOpen();

  return (
    <nav
      aria-label="Navigation principale"
      className={cn(
        "md:hidden fixed inset-x-0 bottom-0 z-40 select-none",
        "border-t border-white/[0.06] bg-background/80 backdrop-blur-xl backdrop-saturate-150",
        "pb-[var(--safe-bottom)] pl-[var(--safe-left)] pr-[var(--safe-right)]",
        "transition-transform duration-300 ease-ios",
        keyboardOpen ? "translate-y-full" : "translate-y-0"
      )}
    >
      <ul className="grid grid-cols-5 h-[var(--tabbar-h)]">
        {TABS.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.to} className="flex">
              <Link
                to={tab.to}
                aria-current={active ? "page" : undefined}
                onPointerDown={() => prefetchRoute(tab.to)}
                onClick={() => {
                  // Re-toucher l'onglet actif remonte en haut, comme sur iOS.
                  if (active) window.scrollTo({ top: 0, behavior: "smooth" });
                }}
                className={cn(
                  "group relative flex-1 flex flex-col items-center justify-center gap-0.5",
                  "text-[10px] font-medium tracking-tight transition-colors duration-200",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {tab.hero ? (
                  <span
                    className={cn(
                      "flex items-center justify-center w-11 h-8 rounded-xl gradient-primary text-primary-foreground",
                      "shadow-md shadow-primary/30 transition-transform duration-150 ease-ios",
                      "group-active:scale-90"
                    )}
                  >
                    <Icon className="w-[18px] h-[18px]" strokeWidth={2.4} />
                  </span>
                ) : (
                  <span className="relative flex items-center justify-center w-12 h-8">
                    {active && (
                      <motion.span
                        layoutId="tabbar-pill"
                        className="absolute inset-0 rounded-full bg-primary/15"
                        transition={{ type: "spring", stiffness: 520, damping: 40, mass: 0.9 }}
                      />
                    )}
                    <Icon
                      className="relative w-[21px] h-[21px] transition-transform duration-150 ease-ios group-active:scale-[0.86]"
                      strokeWidth={active ? 2.3 : 1.9}
                    />
                  </span>
                )}
                <span className={cn("leading-none", tab.hero && active && "text-primary")}>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
