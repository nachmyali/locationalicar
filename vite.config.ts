import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { VitePWA } from 'vite-plugin-pwa'

import type { ManifestOptions } from 'vite-plugin-pwa'

const manifest: Partial<ManifestOptions> = {
  name: "AliCar — Location de voitures",
  short_name: "AliCar",
  description: "AliCar — Location de voitures au Maroc : Casablanca, Marrakech, Rabat. Qualité et abordabilité.",
  start_url: "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#3BB8FF",
  lang: "fr",
  icons: [
    {
      src: "/pwa.png",
      sizes: "1024x1024",
      type: "image/png",
      purpose: "any",
    },
    {
      src: "/pwa.png",
      sizes: "1024x1024",
      type: "image/png",
      purpose: "maskable",
    },
  ],
}

export default defineConfig({
  base: '/',
  build: {
    sourcemap: false,
  },
  plugins: [
    inspectAttr(),
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest,
      workbox: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024,
        globPatterns: ['**/*.{js,css,html,svg,png,jpg,jpeg,gif,webp,woff,woff2}'],
        globIgnores: ['**/images/cta-car.png', '**/images/about-man.png'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
          {
            urlPattern: /\/images\//,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images-cache',
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  server: {
    port: 3000,
    proxy: {
      '/api/send-email': {
        target: 'https://suvsudggaozxqtsxqwxq.supabase.co/functions/v1/send-email',
        changeOrigin: true,
        rewrite: () => '',
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
