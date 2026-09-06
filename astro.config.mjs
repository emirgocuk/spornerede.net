// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@tailwindcss/vite';
import node from '@astrojs/node';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  // SSR modu: /api/* endpoint'leri için zorunlu
  output: 'server',
  adapter: node({ mode: 'standalone' }),

  // Site URL (sitemap için)
  site: 'https://spornerede.net',

  // SEO: tek tip canonical icin trailing slash yok
  trailingSlash: 'never',

  // Performans: viewport icindeki iç linkleri hover'da on-yukleme yap.
  // data-astro-prefetch="..." ile sayfa basina override edilebilir.
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'hover',
  },

  // Cloudflare/Nginx proxy arkasında Astro origin kontrolü form POST'larını
  // hatalı şekilde cross-site algılayabiliyor. Oturum cookie'leri SameSite=Lax.
  security: {
    checkOrigin: false,
  },

  // Entegrasyonlar
  integrations: [
    sitemap({
      filter: (page) => {
        // Admin, merkez, panel, API ve form sayfalari sitemap'e girmesin
        if (page.includes('/merkez')) return false;
        if (page.includes('/admin')) return false;
        if (page.includes('/panel')) return false;
        if (page.includes('/api/')) return false;
        if (page.includes('/basvuru')) return false;
        if (page.includes('/uploads/')) return false;
        return true;
      },
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date(),
    }),
  ],

  // Vite ayarları
  vite: {
    plugins: [tailwindcss()],
    server: {
      watch: {
        ignored: [
          '**/.git/**',
          '**/.cursor/**',
          '**/node_modules/**',
          '**/dist/**',
          '**/pocketbase/pb_data/**',
          '**/*.db',
          '**/*.db-shm',
          '**/*.db-wal',
          '**/terminals/**',
        ],
      },
    },
  },
});