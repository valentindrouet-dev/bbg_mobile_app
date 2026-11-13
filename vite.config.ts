import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import pkg from './package.json' with { type: 'json' }

const BUILD_ID = String(Date.now())

export default defineConfig({
  base: './',
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version.replace(/\.0$/, '')),
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  build: { outDir: 'docs', emptyOutDir: true },
  plugins: [
    react(),
    {
      name: 'version-file',
      generateBundle() {
        this.emitFile({ type: 'asset', fileName: 'version.json', source: JSON.stringify({ build: BUILD_ID }) })
      },
    },
    VitePWA({
      registerType: 'autoUpdate',
      // Removes any previously installed service worker and its caches.
      selfDestroying: true,
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
