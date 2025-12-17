import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  base: "/",
  server: {
    port: 3000,
    open: true,
    host: true,
  },
  preview: {
    port: 3000,
    host: true,
    // Allow all hosts (needed for Render deployment)
    allowedHosts: "all",
  },
  build: {
    outDir: "dist",
    // Ensure assets are correctly referenced
    assetsDir: "assets",
  },
  // SPA mode - ensures proper routing
  appType: "spa",
});
