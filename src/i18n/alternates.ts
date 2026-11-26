import blogSlugMapJson from '../data/blog-slugs.json';

// Static blog posts living as .astro files (not covered by blog-slugs.json)
const STATIC_POST_MAP: Record<string, string> = {
  'mantenimiento-basico-de-motores-electricos': 'basic-maintenance-of-electric-motors',
  'estufas-electricas-consumo': 'electric-heaters-consumption',
  'electricidad-a-4000-metros-de-altura': 'electricity-at-4000-meters-altitude',
  'punteras-para-cables-electricos': 'cable-ferrules-or-bare-wires',
};

const BLOG_ES_TO_EN: Record<string, string> = {
  ...(blogSlugMapJson as Record<string, string>),
  ...STATIC_POST_MAP,
};
const BLOG_EN_TO_ES = Object.fromEntries(
  Object.entries(BLOG_ES_TO_EN).map(([es, en]) => [en, es]),
);

// Sections whose route name differs between locales
const ES_TO_EN_SECTION: Record<string, string> = { catalogos: 'catalogs', tienda: 'catalog' };
const EN_TO_ES_SECTION: Record<string, string> = { catalogs: 'catalogos', catalog: 'tienda' };

// Sections that exist only in Spanish — no hreflang partner
const ES_ONLY = new Set(['category', 'post', 'product-page', 'stand-expo-mining-2026', 'panel', '404']);

/** Returns the { es, en } path pair for a given pathname, or null if there is no counterpart. */
export function getAlternatePaths(pathname: string): { es: string; en: string } | null {
  const clean = pathname.replace(/^\/+|\/+$/g, '');
  const isEn = clean === 'en' || clean.startsWith('en/');
  const rest = isEn ? clean.slice(2).replace(/^\//, '') : clean;
  const [first, ...tail] = rest.split('/').filter(Boolean);
  const slug = tail[0];

  if (!first) return { es: '/', en: '/en/' };

  if (isEn) {
    if (first === 'blog' && slug) {
      const esSlug = BLOG_EN_TO_ES[slug];
      if (!esSlug) return null;
      return { es: `/blog/${esSlug}/`, en: `/en/blog/${slug}/` };
    }
    if (first === 'catalog' && slug) {
      return { es: `/tienda/${slug}/`, en: `/en/catalog/${slug}/` };
    }
    const esFirst = EN_TO_ES_SECTION[first] ?? first;
    return { es: `/${esFirst}/`, en: `/en/${first}/` };
  }

  if (ES_ONLY.has(first)) return null;
  if (first === 'blog' && slug) {
    const enSlug = BLOG_ES_TO_EN[slug];
    if (!enSlug) return null;
    return { es: `/blog/${slug}/`, en: `/en/blog/${enSlug}/` };
  }
  if (first === 'tienda' && slug) {
    return { es: `/tienda/${slug}/`, en: `/en/catalog/${slug}/` };
  }
  const enFirst = ES_TO_EN_SECTION[first] ?? first;
  return { es: `/${first}/`, en: `/en/${enFirst}/` };
}
