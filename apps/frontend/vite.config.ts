import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: [
        "favicon.ico",
        "favicon.svg",
        "assets/pwa/app-icon-180.png",
        "assets/pwa/app-icon-16.png",
        "assets/pwa/app-icon-32.png",
      ],
      manifest: {
        name: "BitFinance",
        short_name: "BitFinance",
        description: "BitFinance budget tracker",
        start_url: "/",
        scope: "/",
        display: "standalone",
        background_color: "#1E93FF",
        theme_color: "#1E93FF",
        icons: [
          {
            src: "assets/pwa/app-icon-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "assets/pwa/app-icon-512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "assets/pwa/app-icon-maskable-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
      },
      devOptions: {
        enabled: true,
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
  },
});
