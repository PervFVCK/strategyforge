/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#f0fdf4',
          500: '#10b981', // Emerald
          600: '#059669',
          700: '#047857',
        },
      },
    },
  },
  plugins: [],
}
