import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { MobileNav } from "./MobileNav";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen min-h-[100dvh] bg-background overflow-x-hidden">
      <Navbar />
      <main className="pt-16 pb-24 md:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
};
