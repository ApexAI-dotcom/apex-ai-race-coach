import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  base: "/",
  build: {
    emptyOutDir: true,
    sourcemap: false,
    rollupOptions: {
      output: {
        // Les bibliothèques changent rarement, notre code à chaque déploiement :
        // séparées, elles restent dans le cache du téléphone d'une version à
        // l'autre et seul le code de l'app est retéléchargé.
        // Seuls des groupes AUTONOMES sont isolés (aucune dépendance hors du
        // groupe) : un groupe qui importerait le paquet principal, lui-même
        // importateur du groupe, crée une boucle et un écran blanc au
        // démarrage (« Cannot access … before initialization »).
        manualChunks(rawId) {
          const id = rawId.split("\\").join("/");
          // Aides de conversion CommonJS (utilisées par React) : rangées avec
          // React pour qu'il n'ait jamais à importer le paquet principal.
          if (id.includes("commonjsHelpers")) return "react";
          if (!id.includes("/node_modules/")) return;
          const path = id.split("/node_modules/").pop()!;
          const pkg = path.startsWith("@") ? path.split("/").slice(0, 2).join("/") : path.split("/")[0];
          if (["react", "react-dom", "scheduler", "react-router", "react-router-dom", "@remix-run/router"].includes(pkg))
            return "react";
          if (
            [
              "@supabase/supabase-js",
              "@supabase/auth-js",
              "@supabase/functions-js",
              "@supabase/postgrest-js",
              "@supabase/realtime-js",
              "@supabase/storage-js",
              "iceberg-js",
              "tslib",
            ].includes(pkg)
          )
            return "supabase";
        },
      },
    },
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
