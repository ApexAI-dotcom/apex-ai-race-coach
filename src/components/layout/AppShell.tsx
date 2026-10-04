import { ReactNode, useEffect, useLayoutEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { Navbar } from "./Navbar";
import { MobileTabBar, useTabBarVisible } from "./MobileTabBar";
import { LegalFooter } from "@/components/legal/LegalFooter";
import { PaddockPassBanner } from "@/components/paddock/PaddockPassBanner";
import { AddToHomeScreenHint } from "./AddToHomeScreenHint";

/**
 * Coque de l'application, montée UNE fois pour toute la session.
 *
 * Avant, chaque page rendait sa propre <Layout> : changer de page démontait
 * puis remontait la barre de navigation, le bandeau Paddock Pass (qui
 * relançait son appel réseau et disparaissait une fraction de seconde), le
 * pied de page… C'est ce clignotement à chaque tap qui donnait l'impression
 * d'un site web plutôt que d'une app. Désormais seul le contenu change.
 */
export function AppShell({ children }: { children: ReactNode }) {
  useScrollMemory();
  const showTabBar = useTabBarVisible();

  return (
    <div
      className={
        "min-h-screen min-h-[100dvh] bg-background flex flex-col md:pb-0 " +
        // La barre d'onglets est fixe : on réserve sa hauteur pour que le bas
        // de chaque page reste atteignable au doigt.
        (showTabBar ? "pb-[calc(var(--tabbar-h)+var(--safe-bottom))]" : "pb-[var(--safe-bottom)]")
      }
    >
      <Navbar />
      {/*
        La barre de navigation est en position fixe : sans cette compensation,
        le bandeau Paddock Pass se retrouvait DERRIÈRE elle et n'était jamais
        visible. La compensation suit la hauteur RÉELLE de la barre : 4 rem
        plus l'encoche, sinon le bandeau Paddock Pass repasse dessous.
      */}
      <div className="pt-[calc(4rem+var(--safe-top))] flex-1 flex flex-col">
        <PaddockPassBanner />
        <main className="pb-8 md:pb-0 flex-1 w-full overflow-x-hidden">{children}</main>
      </div>
      <LegalFooter />
      <AddToHomeScreenHint />
      {showTabBar && <MobileTabBar />}
    </div>
  );
}

/**
 * Mémoire de défilement, comme dans une app native :
 *   — nouvelle page → on part du haut ;
 *   — retour arrière → on retrouve la page exactement là où on l'avait
 *     laissée, au lieu d'être renvoyé en haut d'une longue liste.
 */
function useScrollMemory() {
  const location = useLocation();
  const navType = useNavigationType();
  const positions = useRef(new Map<string, number>());
  const currentKey = useRef(location.key);
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    if ("scrollRestoration" in window.history) window.history.scrollRestoration = "manual";
  }, []);

  // On mémorise en continu la position de l'entrée d'historique courante.
  useEffect(() => {
    let frame = 0;
    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        positions.current.set(currentKey.current, window.scrollY);
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
    };
  }, []);

  // Avant l'affichage de la nouvelle page : aucun « saut » visible.
  useLayoutEffect(() => {
    currentKey.current = location.key;
    // Un simple changement de paramètre (?analysisId=…) n'est pas une
    // nouvelle page : on ne touche pas au défilement.
    if (prevPath.current === location.pathname) return;
    prevPath.current = location.pathname;

    const saved = navType === "POP" ? positions.current.get(location.key) : undefined;
    if (saved === undefined) {
      window.scrollTo(0, 0);
      return;
    }
    // La page peut encore être en train de se remplir : on réessaie quelques
    // images de suite, le temps que sa hauteur permette la position voulue.
    let tries = 0;
    let frame = 0;
    const restore = () => {
      window.scrollTo(0, saved);
      const reachable = document.documentElement.scrollHeight - window.innerHeight >= saved - 2;
      if (!reachable && tries++ < 40) frame = requestAnimationFrame(restore);
    };
    restore();
    return () => cancelAnimationFrame(frame);
  }, [location.key, location.pathname, navType]);
}
