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

  // Entegrasyonlar
  integrations: [sitemap()],

  // Vite ayarları
  vite: {
    plugins: [tailwindcss()],
  },
});