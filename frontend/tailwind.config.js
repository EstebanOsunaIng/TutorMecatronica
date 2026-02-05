/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Quicksand', 'sans-serif']
      },
      colors: {
        brand: {
          50: '#f3fbff',
          100: '#e1f4ff',
          200: '#bfe8ff',
          300: '#8dd6ff',
          400: '#4cbcff',
          500: '#199ef0',
          600: '#0d78c1',
          700: '#0b5f9b',
          800: '#0d507e',
          900: '#0e4468'
        }
      }
    }
  },
  plugins: []
};
