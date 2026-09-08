import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
// Para GitHub Pages en un repo de organización/proyecto:
//   site  -> dominio base (https://<org>.github.io)
//   base  -> nombre del repo (debe empezar con /)
export default defineConfig({
  site: 'https://pypelectricidad.github.io',
  base: '/web',
  output: 'static',
  integrations: [tailwind(), sitemap()],
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
