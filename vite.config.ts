import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base: process.env.VITE_BASE_PATH || './',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['icons/*.png', 'icons/*.svg'],
      manifest: {
        name: 'Nhà mình · App gia đình',
        short_name: 'Nhà mình',
        description: 'Một góc nhỏ cho hai chúng mình',
        lang: 'vi',
        start_url: './',
        scope: './',
        display: 'standalone',
        background_color: '#f7f8f3',
        theme_color: '#397464',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: 'icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,png,svg,json}'],
        globIgnores: [
          '**/prices.json',
          '**/feature-{caidat,dicho,gia,giong,khac,kinhdich,lich,sharebill,tuvi}-*.js',
          '**/tuvi-engine-*.js',
          '**/cloud-*.js',
        ],
        runtimeCaching: [
          {
            urlPattern: /\/assets\/.*\.(?:js|css)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'nha-features-v1',
              expiration: { maxEntries: 100, maxAgeSeconds: 31536000 },
            },
          },
        ],
        navigateFallback: 'index.html',
        cleanupOutdatedCaches: true,
        clientsClaim: true,
      },
    }),
  ],
  build: {
    target: 'es2022',
    chunkSizeWarningLimit: 700,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('/iztro/') || id.includes('/lunar-lite/') || id.includes('/i18next/'))
            return 'tuvi-engine';
        },
        chunkFileNames(chunk) {
          const feature = chunk.facadeModuleId
            ?.replace(/\\/g, '/')
            .match(/\/src\/features\/([^/]+)\//);
          return feature ? `assets/feature-${feature[1]}-[hash].js` : 'assets/[name]-[hash].js';
        },
      },
    },
  },
});
