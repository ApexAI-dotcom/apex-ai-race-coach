import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { LegalFooter } from "@/components/legal/LegalFooter";
import { PaddockPassBanner } from "@/components/paddock/PaddockPassBanner";
import { AddToHomeScreenHint } from "./AddToHomeScreenHint";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      <Navbar />
      {/*
        La barre de navigation est en position fixe : sans cette compensation,
        le bandeau Paddock Pass se retrouvait DERRIÈRE elle et n'était jamais
        visible. On réserve ici sa hauteur, puis le bandeau (collant) reste
        affiché sous elle, y compris quand elle se rétracte au défilement.
      */}
      {/* La compensation suit la hauteur RÉELLE de la barre : 4 rem plus
          l'encoche, sinon le bandeau Paddock Pass repasse dessous. */}
      <div className="pt-[calc(4rem+var(--safe-top))] flex-1 flex flex-col">
        <PaddockPassBanner />
        <main className="pb-[calc(2rem+var(--safe-bottom))] md:pb-[var(--safe-bottom)] flex-1 w-full overflow-x-hidden">{children}</main>
      </div>
      <LegalFooter />
      <AddToHomeScreenHint />
    </div>
  );
};
