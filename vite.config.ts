import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Two builds from one codebase:
//   desktop (default):  vite build             -> dist/      (served by the local Express app)
//   web:                vite build --mode web  -> dist-web/  (static site for GitHub Pages)
// VITE_BASE sets the URL sub-path on GitHub Pages (e.g. /table-drop/).
export default defineConfig(({ mode }) => ({
  base: process.env.VITE_BASE || "/",
  plugins: [react()],
  server: {
    port: 5173,
    proxy: { "/api": "http://127.0.0.1:4173" },
  },
  build: { outDir: mode === "web" ? "dist-web" : "dist" },
}));
