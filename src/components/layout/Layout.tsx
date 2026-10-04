import { ReactNode } from "react";
import { useNavigationType } from "react-router-dom";

interface LayoutProps {
  children: ReactNode;
}

/**
 * Enveloppe de page.
 *
 * La barre de navigation, le bandeau et le pied de page vivent désormais dans
 * <AppShell>, montée une seule fois (voir AppShell.tsx). Chaque page garde son
 * <Layout> pour ne rien changer à son code ; il ne fait plus qu'animer
 * l'arrivée du contenu.
 *
 * Nouvelle page : léger fondu montant, à la manière d'iOS. Retour arrière :
 * simple fondu — la page réapparaît à l'endroit où on l'avait laissée, un
 * mouvement vertical y serait déroutant.
 */
export const Layout = ({ children }: LayoutProps) => {
  const navType = useNavigationType();
  return <div className={navType === "POP" ? "page-fade" : "page-enter"}>{children}</div>;
};
