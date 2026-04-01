/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        polaris: {
          black: '#0A0A0F',
          navy: '#060B1A',
          gold: '#C9A84C',
          'gold-light': '#E8C96A',
          'gold-dark': '#9B7A2E',
          blue: '#1E3A8A',
          'blue-electric': '#3B82F6',
          silver: '#94A3B8',
          'silver-light': '#CBD5E1',
        }
      },
      fontFamily: {
        display: ['var(--font-display)'],
        body: ['var(--font-body)'],
        mono: ['var(--font-mono)'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-gold': 'pulseGold 2s infinite',
        'typing': 'typing 1s infinite',
      },
      keyframes: {
        fadeIn: { from: { opacity: '0' }, to: { opacity: '1' } },
        slideUp: { from: { opacity: '0', transform: 'translateY(16px)' }, to: { opacity: '1', transform: 'translateY(0)' } },
        pulseGold: { '0%, 100%': { boxShadow: '0 0 0 0 rgba(201,168,76,0.4)' }, '50%': { boxShadow: '0 0 0 10px rgba(201,168,76,0)' } },
        typing: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0' } },
      }
    },
  },
  plugins: [],
}
