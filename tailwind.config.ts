import type { Config } from 'tailwindcss'

/**
 * Tailwind config — overridden `green` and `emerald` palettes point to the
 * modern vibrant AccessibilityChecker mint. This coopts every pre-existing
 * `bg-green-*` / `text-green-*` / `border-green-*` usage across the app into
 * the brand system without a mass rewrite.
 */
const brandGreen = {
  50:  '#ECFDF5',
  100: '#DFF8EA',
  200: '#BCEFD2',
  300: '#86E3B2',
  400: '#3DD58F',
  500: '#10C98A', // core brand mint
  600: '#0EB77C',
  700: '#0A9A68',
  800: '#066B48',
  900: '#053A28',
}

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        green:   brandGreen,
        emerald: brandGreen,
      },
      fontFamily: {
        body:    ['var(--font-body)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono:    ['var(--font-mono)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
        display: ['var(--font-mono)', 'ui-monospace', 'monospace'],
      },
      borderRadius: {
        DEFAULT: '3px',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
export default config
