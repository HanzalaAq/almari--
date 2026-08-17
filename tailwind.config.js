/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  darkMode: 'class',
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#007782',
          light: '#E8F4F4',
          hover: '#00626B',
          dark: '#00555C',
        },
        text: {
          primary: '#090A0A',
          secondary: '#5C6363',
          muted: '#8B9393',
        },
        border: '#DDE2E2',
        surface: {
          DEFAULT: '#EDF2F2',
          dark: '#1A1A1A',
        },
        success: '#10B981',
        info: '#3B82F6',
        warning: '#F59E0B',
        error: '#EF4444',
        teal: {
          50: '#E8F4F4',
          100: '#C5E4E4',
          200: '#9ED2D2',
          300: '#6DBDBD',
          400: '#40A8A8',
          500: '#009494',
          600: '#007782',
          700: '#005C66',
          800: '#00444C',
          900: '#002E33',
        },
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
      },
      animation: {
        'pulse': 'pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      backdropBlur: {
        'xl': '24px',
      },
    },
  },
  plugins: [],
}
