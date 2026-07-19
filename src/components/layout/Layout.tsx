import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { MobileNav } from "./MobileNav";
import { LegalFooter } from "@/components/legal/LegalFooter";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background flex flex-col">
      <Navbar />
      <main className="pt-16 pb-8 md:pb-0 flex-1 w-full overflow-x-hidden">{children}</main>
      <LegalFooter />
      <MobileNav />
    </div>
  );
};
