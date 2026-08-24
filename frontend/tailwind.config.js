/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        cookscape: {
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#e00000', // Signature Cookscape Crimson Red
          600: '#cc0000',
          700: '#b30000',
          800: '#990000',
          900: '#7f0000',
          950: '#4c0000',
          dark: '#0f172a',
          surface: '#1e293b',
          card: '#182234',
        },
        brand: {
          red: '#e00000',
          redHover: '#cc0000',
          redLight: '#fee2e2',
          green: '#006039', // "Interiors and Beyond" Emerald Green
          greenHover: '#004d2e',
          greenLight: '#e6f4ed',
          dark: '#0f172a',
        },
      },
      fontFamily: {
        sans: ['Inter', 'Segoe UI', 'sans-serif'],
        serif: ['Playfair Display', 'Georgia', 'serif'],
      }
    },
  },
  plugins: [],
}
