import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: './',
  build: { outDir: 'docs', emptyOutDir: true },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['img/*.png', 'img/*.webp'],
      manifest: {
        name: 'The BBG App',
        short_name: 'BBG App',
        lang: 'fr',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'any',
        background_color: '#FEF2DC',
        theme_color: '#FBB938',
        icons: [
          { src: 'img/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'img/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'img/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,webp,woff,woff2}'] },
    }),
  ],
})
