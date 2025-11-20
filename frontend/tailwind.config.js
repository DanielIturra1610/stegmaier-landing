/** @type {import('tailwindcss').Config} */
const colors = require("tailwindcss/colors");

module.exports = {
    darkMode: ["class"],
    content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  safelist: [
    // Clases de secciones
    'section-hero',
    'section-process',
    'section-services',
    'section-testimonials',
    'section-contact',
    'section-divider-top',
    'section-divider-bottom',
    // Fondos corporativos
    'bg-corporate-light',
    'bg-corporate-complete',
    'bg-decorative-orbs',
    'bg-lines-corporate',
    'bg-grid-corporate',
    'bg-dots-corporate',
    'floating-particles'
  ],

  theme: {
  	extend: {
  		colors: {
  			gray: colors.gray,
  			slate: colors.slate,
  			primary: {
  				'50': 'rgb(var(--color-primary-50) / <alpha-value>)',
  				'100': 'rgb(var(--color-primary-100) / <alpha-value>)',
  				'200': 'rgb(var(--color-primary-200) / <alpha-value>)',
  				'300': 'rgb(var(--color-primary-300) / <alpha-value>)',
  				'400': 'rgb(var(--color-primary-400) / <alpha-value>)',
  				'500': 'rgb(var(--color-primary-500) / <alpha-value>)',
  				'600': 'rgb(var(--color-primary-600) / <alpha-value>)',
  				'700': 'rgb(var(--color-primary-700) / <alpha-value>)',
  				'800': 'rgb(var(--color-primary-800) / <alpha-value>)',
  				'900': 'rgb(var(--color-primary-900) / <alpha-value>)',
  				DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)'
  			},
  			accent: {
  				'50': 'rgb(var(--color-accent-50) / <alpha-value>)',
  				'500': 'rgb(var(--color-accent-500) / <alpha-value>)',
  				'700': 'rgb(var(--color-accent-700) / <alpha-value>)',
  				DEFAULT: 'rgb(var(--color-accent-500) / <alpha-value>)'
  			},
  			gold: {
  				'50': 'rgb(var(--color-gold-50) / <alpha-value>)',
  				'500': 'rgb(var(--color-gold-500) / <alpha-value>)',
  				'700': 'rgb(var(--color-gold-700) / <alpha-value>)',
  				DEFAULT: 'rgb(var(--color-gold-500) / <alpha-value>)'
  			},
  			stegmaier: {
  				blue: {
  					DEFAULT: 'rgb(var(--color-primary) / <alpha-value>)',
  					light: 'rgb(var(--color-primary-light) / <alpha-value>)',
  					dark: 'rgb(var(--color-primary-dark) / <alpha-value>)'
  				},
  				gray: {
  					light: 'rgb(var(--color-gray-light) / <alpha-value>)',
  					dark: 'rgb(var(--color-gray-dark) / <alpha-value>)'
  				}
  			}
  		},
  		backgroundImage: {
			// Radial genérico
			'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
			// Cuadrícula blanca super-sutil (para overlays)
			'grid-white': 'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
			// Hero corporativo
			'hero-pattern': 'linear-gradient(to right bottom, rgba(6,78,129,.9), rgba(12,74,110,.8)), url(\'/src/assets/hero-bg.jpg\')'
		},
  		fontFamily: {
  			sans: [
  				'Inter',
  				'system-ui',
  				'sans-serif'
  			],
  			heading: [
  				'Montserrat',
  				'sans-serif'
  			],
  			display: [
  				'Work Sans',
  				'system-ui',
  				'sans-serif'
  			]
  		},
  		fontSize: {
  			'2xs': [
  				'0.625rem',
  				{
  					lineHeight: '1rem'
  				}
  			],
  			xs: [
  				'0.75rem',
  				{
  					lineHeight: '1rem'
  				}
  			],
  			sm: [
  				'0.875rem',
  				{
  					lineHeight: '1.25rem'
  				}
  			],
  			base: [
  				'1rem',
  				{
  					lineHeight: '1.5rem'
  				}
  			],
  			lg: [
  				'1.125rem',
  				{
  					lineHeight: '1.75rem'
  				}
  			],
  			xl: [
  				'1.25rem',
  				{
  					lineHeight: '1.75rem'
  				}
  			],
  			'2xl': [
  				'1.5rem',
  				{
  					lineHeight: '2rem'
  				}
  			],
  			'3xl': [
  				'1.875rem',
  				{
  					lineHeight: '2.25rem'
  				}
  			],
  			'4xl': [
  				'2.25rem',
  				{
  					lineHeight: '2.5rem'
  				}
  			],
  			'5xl': [
  				'3rem',
  				{
  					lineHeight: '1.1'
  				}
  			],
  			'6xl': [
  				'3.75rem',
  				{
  					lineHeight: '1'
  				}
  			],
  			'7xl': [
  				'4.5rem',
  				{
  					lineHeight: '1'
  				}
  			]
  		},
  		fontWeight: {
  			light: '300',
  			normal: '400',
  			medium: '500',
  			semibold: '600',
  			bold: '700',
  			extrabold: '800'
  		},
  		borderRadius: {
  			sm: 'var(--radius-sm)',
  			md: 'var(--radius-md)',
  			lg: 'var(--radius-lg)',
  			xl: 'var(--radius-xl)',
  			'2xl': 'var(--radius-2xl)'
  		},
  		boxShadow: {
  			soft: 'var(--shadow-soft)',
  			hover: 'var(--shadow-hover)',
  			card: 'var(--shadow-card)',
  			elevated: 'var(--shadow-elevated)'
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },

  plugins: [require("@tailwindcss/typography")],
};
