import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { VitePWA } from "vite-plugin-pwa"

export default defineConfig({
  base: "/vitaquest/",
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["icon-192.png", "icon-512.png", "icon-192.svg", "icon-512.svg"],
      manifest: {
        name: "VitaQuest",
        short_name: "VitaQuest",
        description: "Tu compañero de progreso diario.",
        start_url: "/vitaquest/",
        scope: "/vitaquest/",
        display: "standalone",
        background_color: "#0d1117",
        theme_color: "#2d6a4f",
        lang: "es",
        icons: [
          { src: "/vitaquest/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/vitaquest/icon-192.png", sizes: "192x192", type: "image/png", purpose: "maskable" },
          { src: "/vitaquest/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/vitaquest/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
    }),
  ],
})
