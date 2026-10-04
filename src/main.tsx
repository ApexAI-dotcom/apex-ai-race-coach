import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Safari iOS n'applique les styles `:active` (le bouton qui s'enfonce sous le
// doigt) que si la page écoute les touchers. Un écouteur vide et passif suffit.
document.addEventListener("touchstart", () => {}, { passive: true });

createRoot(document.getElementById("root")!).render(<App />);
