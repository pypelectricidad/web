import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
// Dominio custom en GitHub Pages:
//   site  -> dominio final (https://pypelectricidad.com.ar)
//   base  -> raíz del dominio
export default defineConfig({
  site: 'https://pypelectricidad.com.ar',
  base: '/',
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
