/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: {
          950: '#07110f',
          900: '#0c1a17',
          800: '#132824',
          700: '#1c3530',
          500: '#8aa39c',
          300: '#d7ebe5',
        },
        accent: {
          DEFAULT: '#2dd4bf',
          hover: '#14b8a6',
        },
      },
      boxShadow: {
        glow: '0 20px 60px rgba(45, 212, 191, 0.12)',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
