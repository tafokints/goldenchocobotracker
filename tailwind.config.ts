/** @type {import('tailwindcss').Config} */
import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      colors: {
        'chocobo-gold': 'rgb(var(--theme-accent-rgb) / <alpha-value>)',
        'chocobo-gold-bright': 'rgb(var(--theme-accent-bright-rgb) / <alpha-value>)',
        'chocobo-dark': 'rgb(var(--theme-bg-rgb) / <alpha-value>)',
        'chocobo-surface': 'rgb(var(--theme-surface-rgb) / <alpha-value>)',
        'chocobo-recessed': 'rgb(var(--theme-recessed-rgb) / <alpha-value>)',
        'chocobo-light': 'rgb(var(--theme-fg-rgb) / <alpha-value>)',
        'chocobo-muted': 'rgb(var(--theme-muted-rgb) / <alpha-value>)',
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic':
          'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
    },
  },
  plugins: [],
};
export default config;
