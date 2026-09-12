// Traducciones de interfaz para PyP Electricidad
export type Locale = 'es' | 'en';

export const translations = {
  es: {
    // Nav
    nav: {
      inicio: 'Inicio',
      tienda: 'Tienda',
      servicios: 'Servicios',
      nosotros: 'Nosotros',
      blog: 'Blog',
      ayuda: 'Ayuda',
      contacto: 'Contacto',
    },
    // Header CTA
    presupuesto: 'Presupuesto',
    solicitarPresupuesto: 'Solicitar presupuesto',
    abrirMenu: 'Abrir menú',
    tiendaPath: 'tienda',
    // Footer
    navTitle: 'Navegación',
    contactoTitle: 'Contacto',
    certificacionesTitle: 'Certificaciones',
    footerDesc: 'Materiales eléctricos, obras electromecánicas e integración de tableros. Empresa tucumana con más de 15 años de experiencia.',
    derechos: 'Todos los derechos reservados.',
    certLine: 'Sistemas certificados ISO 9001 · ISO 14001 · ISO 45001',
    // Lang switcher
    langLabel: 'ES',
    langAlt: 'EN',
  },
  en: {
    nav: {
      inicio: 'Home',
      tienda: 'Catalog',
      servicios: 'Services',
      nosotros: 'About Us',
      blog: 'Blog',
      ayuda: 'Help',
      contacto: 'Contact',
    },
    presupuesto: 'Quote',
    solicitarPresupuesto: 'Request a quote',
    abrirMenu: 'Open menu',
    tiendaPath: 'catalog',
    navTitle: 'Navigation',
    contactoTitle: 'Contact',
    certificacionesTitle: 'Certifications',
    footerDesc: 'Electrical materials, electromechanical works and panel integration. Tucumán-based company with over 15 years of experience.',
    derechos: 'All rights reserved.',
    certLine: 'Certified systems ISO 9001 · ISO 14001 · ISO 45001',
    langLabel: 'EN',
    langAlt: 'ES',
  },
} as const;
