import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { vitePluginManusRuntime } from "vite-plugin-manus-runtime";
import path from "path";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    vitePluginManusRuntime(),
  ].filter(Boolean),

  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets"),
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
});
