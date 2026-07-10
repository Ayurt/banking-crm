/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#eef9ff',
          100: '#d9f1ff',
          200: '#bce7ff',
          300: '#8ed8ff',
          400: '#59c0ff',
          500: '#33a1ff',
          600: '#1a7ff5',
          700: '#1468e1',
          800: '#1754b6',
          900: '#19498f',
          950: '#142d57',
        },
        navy: {
          800: '#0c1929',
          900: '#071018',
          950: '#040a10',
        },
        gold: {
          400: '#e8c468',
          500: '#d4a853',
          600: '#b8892e',
        },
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out forwards',
        'fade-in-up': 'fadeInUp 0.6s ease-out forwards',
        'slide-in-left': 'slideInLeft 0.5s ease-out forwards',
        'pulse-soft': 'pulseSoft 2.5s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 3s ease-in-out infinite alternate',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        fadeInUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-12px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.7' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 20px rgba(51, 161, 255, 0.15)' },
          '100%': { boxShadow: '0 0 40px rgba(212, 168, 83, 0.25)' },
        },
      },
      backgroundImage: {
        'mesh-gradient': 'radial-gradient(at 40% 20%, rgba(51, 161, 255, 0.12) 0px, transparent 50%), radial-gradient(at 80% 0%, rgba(212, 168, 83, 0.1) 0px, transparent 50%), radial-gradient(at 0% 50%, rgba(16, 185, 129, 0.08) 0px, transparent 50%)',
        'sidebar-gradient': 'linear-gradient(180deg, #0c1929 0%, #071018 50%, #040a10 100%)',
      },
    },
  },
  plugins: [],
  corePlugins: { preflight: false },
};
