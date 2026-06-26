/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          50: '#fdf6e8',
          100: '#f9e8c4',
          200: '#f3d07a',
          300: '#eab43d',
          400: '#d9941a',
          500: '#b87a14',
          600: '#966410',
          700: '#7a5113',
          800: '#624117',
          900: '#4d3314',
        },
        rose: {
          50: '#fef1f2',
          100: '#ffdadd',
          200: '#ffc0c6',
          300: '#ff96a0',
          400: '#ff5c6e',
          500: '#f52e48',
          600: '#e31234',
          700: '#bf0a2b',
          800: '#9e0d2b',
          900: '#85102b',
        }
      },
      fontFamily: {
        display: ['Playfair Display', 'serif'],
        body: ['Poppins', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
