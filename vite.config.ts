import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { inspectAttr } from 'kimi-plugin-inspect-react'
import { VitePWA } from 'vite-plugin-pwa'

import type { ManifestOptions } from 'vite-plugin-pwa'

const manifest: Partial<ManifestOptions> = {
  name: "INVOLOCATION - Location de voitures",
  short_name: "INVOLOCATION",
  description: "INVOLOCATION Location Voiture Marrakech Aeroport l'agence de location de voitures partout au Maroc aux meilleurs conditions.",
  start_url: process.env.GITHUB_ACTIONS ? "/RENT/" : "/",
  display: "standalone",
  background_color: "#ffffff",
  theme_color: "#DC2626",
  lang: "fr",
  icons: [
    {
      src: (process.env.GITHUB_ACTIONS ? "/RENT/" : "/") + "pwa.png",
      sizes: "1024x1024",
      type: "image/png",
      purpose: "any",
    },
    {
      src: (process.env.GITHUB_ACTIONS ? "/RENT/" : "/") + "pwa.png",
      sizes: "1024x1024",
      type: "image/png",
      purpose: "maskable",
    },
  ],
}

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? '/RENTCAR/' : '/',
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
        target: 'https://mceegdufnetfkfdyuaic.supabase.co/functions/v1/send-email',
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
