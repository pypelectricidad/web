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
  integrations: [
    tailwind(),
    sitemap({
      filter: (page) =>
        !page.includes('/panel') &&
        !page.includes('/post/') &&
        !page.includes('/product-page/') &&
        !page.includes('/category/') &&
        !page.endsWith('/404') &&
        !/\/(gabinetes|iluminacion|conductores|canalizacion|automycontrol|tierra|accesoriosind|transform|antiexplosivos|domicil|untratomuypositivo|politica[^/]*|copia-de[^/]*|sorteo[^/]*|coming-soon[^/]*)\/?$/.test(page),
    }),
  ],
  i18n: {
    defaultLocale: 'es',
    locales: ['es', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },
});
