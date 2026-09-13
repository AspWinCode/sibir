import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      manifest: {
        name: "Сибирь — сбор дикоросов",
        short_name: "Сибирь",
        description: "Сбор и сдача дикоросов: маршруты, запасы, пункты приёма",
        theme_color: "#3a5a3a",
        background_color: "#f6f7f4",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
        ],
      },
    }),
  ],
});
