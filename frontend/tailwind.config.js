/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        finova: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          500: '#14b8a6',
          600: '#0d9488',
          700: '#0f766e',
          900: '#134e4a',
          dark: '#0b0f19',
          card: '#111827',
          surface: '#1f2937',
          accent: '#6366f1'
        }
      }
    },
  },
  plugins: [],
}
