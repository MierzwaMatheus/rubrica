import { defineConfig, loadEnv, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { umamiScriptTag } from "./src/lib/umamiScript";

/** Injeta o script do Umami só quando ele está configurado (ver src/lib/umamiScript.ts). */
function umami(env: Record<string, string>): Plugin {
  return {
    name: "rubrica-umami",
    transformIndexHtml(html) {
      const tag = umamiScriptTag(env);
      return tag ? html.replace("</body>", `  ${tag}\n  </body>`) : html;
    },
  };
}

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), umami(loadEnv(mode, process.cwd(), "VITE_"))],

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
  },

  build: {
    outDir: "dist",        // dist na raiz (padrão do Vite e da Vercel)
    emptyOutDir: true,
    sourcemap: process.env.NODE_ENV !== "production",
  },

  server: {
    port: 3000,
    host: true,
    strictPort: false,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
  },
}));
