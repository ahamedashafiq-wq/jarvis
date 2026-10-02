/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        zoro: {
          bg: '#050A12',
          panel: '#08121F',
          panelElevated: '#0B1624',
          panelHighlight: '#0E1D2D',
          border: 'rgba(25, 217, 255, 0.12)',
          borderHover: 'rgba(25, 217, 255, 0.28)',
          cyan: '#19D9FF',
          blue: '#3D7CFF',
          violet: '#8B5CFF',
          success: '#21E6A0',
          warning: '#FFB020',
          critical: '#FF4D67',
          emerald: '#21E6A0',
          gold: '#FFB020',
          danger: '#FF4D67',
          text: '#F0F6FC',
          textSecondary: '#8FA4BE',
          textMuted: '#4E6581',
        },
        jarvis: {
          bg: '#050A12',
          surface: '#08121F',
          surfaceElevated: '#0B1624',
          border: 'rgba(25, 217, 255, 0.12)',
          borderHover: 'rgba(25, 217, 255, 0.28)',
          primary: '#19D9FF',
          secondary: '#3D7CFF',
          accent: '#8B5CFF',
          warning: '#FFB020',
          danger: '#FF4D67',
          success: '#21E6A0',
          text: '#F0F6FC',
          textSecondary: '#8FA4BE',
          textMuted: '#4E6581',
          panel: '#08121F',
          panelElevated: '#0B1624',
          bright: '#19D9FF',
          muted: '#8FA4BE',
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
