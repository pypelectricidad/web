/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Paleta inicial de PyP Electricidad (a ajustar con la marca)
        brand: {
          DEFAULT: '#0b3d91',
          dark: '#072d6b',
          light: '#1e5bb8',
        },
        accent: {
          DEFAULT: '#f5a623',
          dark: '#d18a0f',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
