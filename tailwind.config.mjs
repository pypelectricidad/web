/** @type {import('tailwindcss').Config} */
export default {
  content: ['./src/**/*.{astro,html,js,jsx,md,mdx,ts,tsx,vue}'],
  theme: {
    extend: {
      colors: {
        // Paleta de marca PyP Electricidad — basada en dos azules institucionales
        brand: {
          DEFAULT: '#188ef3',    // Azul eléctrico primario
          dark: '#03246f',       // Azul marino profundo
          light: '#00b9f2',      // Cyan eléctrico
          50: '#e8f4ff',
          100: '#c7e3fc',
          200: '#8ac5f9',
          300: '#53abf6',
          400: '#2795f3',
          500: '#188ef3',
          600: '#1370c4',
          700: '#0e5290',
          800: '#0a3b66',
          900: '#03246f',
        },
        // Amarillo reservado para uso mínimo (solo acentos puntuales)
        accent: {
          DEFAULT: '#fced04',
          dark: '#d4c800',
        },
        ink: {
          DEFAULT: '#2c2e35',
          light: '#d8d9da',
        },
        steel: {
          50: '#f5f7fa',
          100: '#e4e9f0',
          200: '#c8d2e0',
          300: '#9aabc2',
          400: '#6b7f9a',
          500: '#4a5d78',
          600: '#36475c',
          700: '#273344',
          800: '#1a2330',
          900: '#0f1620',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Consolas', 'monospace'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
      },
      backgroundImage: {
        'hazard-stripes': 'repeating-linear-gradient(45deg, #188ef3 0px, #188ef3 20px, #03246f 20px, #03246f 40px)',
        'grid-pattern': "linear-gradient(rgba(24,142,243,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(24,142,243,0.07) 1px, transparent 1px)",
      },
      backgroundSize: {
        'grid-lg': '40px 40px',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scan': 'scan 3s linear infinite',
      },
      keyframes: {
        scan: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
    },
  },
  plugins: [],
};
