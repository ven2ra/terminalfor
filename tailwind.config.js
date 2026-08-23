/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        display: ['"Space Grotesk"', '"Hanken Grotesk"', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', '"Roboto Mono"', 'monospace'],
      },
      colors: {
        bg: {
          base: 'var(--bg-base)',
          panel: 'var(--bg-panel)',
          elevated: 'var(--bg-elevated)',
          hover: 'var(--bg-hover)',
        },
        border: {
          DEFAULT: 'var(--border-color)',
          subtle: 'var(--border-subtle)',
        },
        text: {
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
        },
        accent: {
          DEFAULT: 'var(--accent)',
          hover: 'var(--accent-hover)',
        },
        buy: {
          DEFAULT: 'var(--buy)',
          bg: 'var(--buy-bg)',
        },
        sell: {
          DEFAULT: 'var(--sell)',
          bg: 'var(--sell-bg)',
        },
      },
      boxShadow: {
        panel: '0 1px 2px rgba(0,0,0,0.24)',
      },
      keyframes: {
        flash: {
          '0%': { backgroundColor: 'var(--flash-color)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'flash-up': {
          '0%': { backgroundColor: 'var(--buy-bg)', color: 'var(--buy)' },
          '100%': { backgroundColor: 'transparent' },
        },
        'flash-down': {
          '0%': { backgroundColor: 'var(--sell-bg)', color: 'var(--sell)' },
          '100%': { backgroundColor: 'transparent' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-400px 0' },
          '100%': { backgroundPosition: '400px 0' },
        },
      },
      animation: {
        flash: 'flash 0.6s ease-out',
        'flash-up': 'flash-up 0.7s ease-out',
        'flash-down': 'flash-down 0.7s ease-out',
        shimmer: 'shimmer 1.4s infinite linear',
      },
    },
  },
  plugins: [],
}
