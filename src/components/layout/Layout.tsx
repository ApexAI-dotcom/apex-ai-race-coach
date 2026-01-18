import { ReactNode } from "react";
import { Navbar } from "./Navbar";
import { MobileNav } from "./MobileNav";

interface LayoutProps {
  children: ReactNode;
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-16 pb-20 md:pb-0">{children}</main>
      <MobileNav />
    </div>
  );
};
