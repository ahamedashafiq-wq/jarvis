/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jarvis: {
          bg: '#030605',
          surface: '#07100D',
          surfaceElevated: '#0A1512',
          border: 'rgba(0, 255, 170, 0.14)',
          borderHover: 'rgba(0, 255, 170, 0.28)',
          primary: '#00F5A0',
          secondary: '#00D9FF',
          accent: '#8B5CF6',
          warning: '#FFB000',
          danger: '#FF3B5C',
          success: '#00F5A0',
          text: '#F5F7F6',
          textSecondary: '#8A9A94',
          textMuted: '#52635D',
          // Backwards compatibility with 1.0 tokens
          panel: '#07100D',
          panelElevated: '#0A1512',
          bright: '#00F5A0',
          muted: '#8A9A94',
        },
      },
      fontFamily: {
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'glow-primary': '0 0 20px -5px rgba(0, 245, 160, 0.3)',
        'glow-secondary': '0 0 20px -5px rgba(0, 217, 255, 0.3)',
        'glow-accent': '0 0 20px -5px rgba(139, 92, 246, 0.3)',
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite ease-in-out',
        'spin-slow': 'spin 12s linear infinite',
        'spin-reverse': 'spinReverse 16s linear infinite',
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
        spinReverse: {
          '0%': { transform: 'rotate(360deg)' },
          '100%': { transform: 'rotate(0deg)' },
        },
      },
    },
  },
  plugins: [],
}
