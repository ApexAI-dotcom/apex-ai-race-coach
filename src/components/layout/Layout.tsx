import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { MobileNav } from "./MobileNav";
import { LegalFooter } from "@/components/legal/LegalFooter";
import { PaddockPassBanner } from "@/components/paddock/PaddockPassBanner";

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
      <div className="pt-16 flex-1 flex flex-col">
        <PaddockPassBanner />
        <main className="pb-8 md:pb-0 flex-1 w-full overflow-x-hidden">{children}</main>
      </div>
      <LegalFooter />
      <MobileNav />
    </div>
  );
};
