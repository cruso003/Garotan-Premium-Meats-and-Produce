/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2D5016',
          50: '#E8F5E0',
          100: '#D1EBC1',
          200: '#A3D783',
          300: '#75C345',
          400: '#47AF07',
          500: '#2D5016',
          600: '#244012',
          700: '#1B300E',
          800: '#122009',
          900: '#091005',
        },
        secondary: {
          DEFAULT: '#0077BE',
          50: '#E0F2FF',
          100: '#B3E0FF',
          200: '#80CCFF',
          300: '#4DB8FF',
          400: '#26A6FF',
          500: '#0077BE',
          600: '#00629E',
          700: '#004D7E',
          800: '#00385E',
          900: '#00233E',
        },
        accent: {
          DEFAULT: '#FF6B35',
          50: '#FFE8E0',
          100: '#FFD1C2',
          200: '#FFA385',
          300: '#FF8A5B',
          400: '#FF7648',
          500: '#FF6B35',
          600: '#E65420',
          700: '#CC3D0B',
          800: '#A63008',
          900: '#802305',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
