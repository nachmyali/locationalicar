import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { VitePWA } from 'vite-plugin-pwa'

import type { ManifestOptions } from 'vite-plugin-pwa'

const manifest: Partial<ManifestOptions> = {
  name: "Remons - Car Rental",
  short_name: "Remons",
  description: "Location de voitures premium",
  start_url: "/car/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#FF3B30",
  lang: "fr",
  icons: [
    {
      src: "/car/icon.svg",
      sizes: "512x512",
      type: "image/svg+xml",
      purpose: "any",
    },
    {
      src: "/car/icon.svg",
      sizes: "512x512",
      type: "image/svg+xml",
      purpose: "maskable",
    },
  ],
}

export default defineConfig({
  base: '/car/',
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
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
