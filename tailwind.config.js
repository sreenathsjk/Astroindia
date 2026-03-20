/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        cinzel: ['Cinzel Decorative', 'serif'],
        crimson: ['Crimson Pro', 'Georgia', 'serif'],
        devanagari: ['Noto Sans Devanagari', 'sans-serif'],
      },
      colors: {
        cosmic: {
          bg: '#080610',
          bg2: '#0d0b1e',
          bg3: '#12102a',
          gold: '#D4AF37',
          gold2: '#F5D572',
          gold3: '#8B6914',
          cream: '#FFF8E7',
          text: '#EDE8D0',
          text2: '#A89F7A',
          text3: '#6B6347',
          accent: '#7B2FBE',
          accent2: '#C84B31',
        },
      },
      animation: {
        'fade-up': 'fadeUp 0.5s ease forwards',
        'shimmer': 'shimmer 2s infinite',
        'pulse-glow': 'pulseGlow 3s infinite',
        'spin-slow': 'spin 20s linear infinite',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: 0, transform: 'translateY(16px)' },
          to: { opacity: 1, transform: 'translateY(0)' },
        },
        shimmer: {
          '0%, 100%': { opacity: 0.5 },
          '50%': { opacity: 1 },
        },
        pulseGlow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212,175,55,0.2)' },
          '50%': { boxShadow: '0 0 40px rgba(212,175,55,0.4)' },
        },
      },
    },
  },
  plugins: [],
};

