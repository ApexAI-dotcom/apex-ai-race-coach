import { ReactNode } from "react";
import { useInViewFlag } from "./hooks";

/**
 * Ne monte son contenu que lorsqu'il approche de l'écran (et le garde ensuite).
 * En attendant, une case vide de la bonne hauteur évite tout saut de page.
 * Combiné à `React.lazy`, le code du contenu n'est téléchargé qu'à ce moment.
 */
export function NearView({
  children,
  minHeight,
  rootMargin = "600px 0px",
  className,
}: {
  children: ReactNode;
  minHeight: number;
  rootMargin?: string;
  className?: string;
}) {
  const [ref, near] = useInViewFlag<HTMLDivElement>({ rootMargin, threshold: 0, once: true });
  return (
    <div ref={ref} className={className} style={near ? undefined : { minHeight }}>
      {near ? children : null}
    </div>
  );
}
