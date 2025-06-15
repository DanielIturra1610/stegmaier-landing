/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],

  theme: {
    extend: {
      /* ────────────────── COLORES ────────────────── */
      colors: {
        // Paleta de utilidades estándar de Tailwind (opcional)
        gray: colors.gray,
        slate: colors.slate,

        // Paleta corporativa vinculada a CSS custom-props
        primary: {
          50: "rgb(var(--color-primary-50) / <alpha-value>)",
          100: "rgb(var(--color-primary-100) / <alpha-value>)",
          200: "rgb(var(--color-primary-200) / <alpha-value>)",
          300: "rgb(var(--color-primary-300) / <alpha-value>)",
          400: "rgb(var(--color-primary-400) / <alpha-value>)",
          500: "rgb(var(--color-primary-500) / <alpha-value>)", // Color principal
          600: "rgb(var(--color-primary-600) / <alpha-value>)",
          700: "rgb(var(--color-primary-700) / <alpha-value>)",
          800: "rgb(var(--color-primary-800) / <alpha-value>)",
          900: "rgb(var(--color-primary-900) / <alpha-value>)",
          DEFAULT: "rgb(var(--color-primary) / <alpha-value>)", // Para compatibilidad
        },
        
        // Color acento (verde)
        accent: {
          50: "rgb(var(--color-accent-50) / <alpha-value>)",
          500: "rgb(var(--color-accent-500) / <alpha-value>)",
          700: "rgb(var(--color-accent-700) / <alpha-value>)",
          DEFAULT: "rgb(var(--color-accent-500) / <alpha-value>)",
        },
        
        // Color acento alternativo (dorado)
        gold: {
          50: "rgb(var(--color-gold-50) / <alpha-value>)",
          500: "rgb(var(--color-gold-500) / <alpha-value>)",
          700: "rgb(var(--color-gold-700) / <alpha-value>)",
          DEFAULT: "rgb(var(--color-gold-500) / <alpha-value>)",
        },
        
        // Mantener para retrocompatibilidad
        stegmaier: {
          blue: {
            DEFAULT: "rgb(var(--color-primary) / <alpha-value>)",
            light: "rgb(var(--color-primary-light) / <alpha-value>)",
            dark: "rgb(var(--color-primary-dark) / <alpha-value>)",
          },
          gray: {
            light: "rgb(var(--color-gray-light) / <alpha-value>)",
            dark: "rgb(var(--color-gray-dark) / <alpha-value>)",
          },
        },
      },

      /* ──────────────── BACKGROUND IMAGES ──────────── */
      backgroundImage: (theme) => ({
        // Radial genérico
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",

        // Cuadrícula blanca super-sutil (para overlays)
        "grid-white": `linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px),
           linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)`,

        // Hero corporativo
        "hero-pattern":
          "linear-gradient(to right bottom, rgba(6,78,129,.9), rgba(12,74,110,.8)), url('/src/assets/hero-bg.jpg')",
      }),

      /* ────────────────── TIPOGRAFÍA ────────────────── */
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        heading: ["Montserrat", "sans-serif"],
        display: ["Work Sans", "system-ui", "sans-serif"], // Nueva tipografía para títulos destacados
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],     // 10px
        xs: ['0.75rem', { lineHeight: '1rem' }],          // 12px
        sm: ['0.875rem', { lineHeight: '1.25rem' }],      // 14px
        base: ['1rem', { lineHeight: '1.5rem' }],         // 16px
        lg: ['1.125rem', { lineHeight: '1.75rem' }],      // 18px
        xl: ['1.25rem', { lineHeight: '1.75rem' }],       // 20px
        '2xl': ['1.5rem', { lineHeight: '2rem' }],        // 24px
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],   // 30px
        '4xl': ['2.25rem', { lineHeight: '2.5rem' }],     // 36px
        '5xl': ['3rem', { lineHeight: '1.1' }],           // 48px
        '6xl': ['3.75rem', { lineHeight: '1' }],          // 60px
        '7xl': ['4.5rem', { lineHeight: '1' }],           // 72px
      },
      fontWeight: {
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },

      /* ──────────────── RADIOS & SOMBRAS ─────────── */
      borderRadius: {
        sm: "var(--radius-sm)",
        md: "var(--radius-md)",
        lg: "var(--radius-lg)",
        xl: "var(--radius-xl)",
        '2xl': "var(--radius-2xl)",
      },
      boxShadow: {
        soft: "var(--shadow-soft)",
        hover: "var(--shadow-hover)",
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
      },
    },
  },

  plugins: [require("@tailwindcss/typography")],
};
