/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Заменяем весь масштаб скруглений (не extend — именно замена): вместо
    // мягких SaaS-карточек — почти прямые углы приборной панели. rounded-full
    // остаётся для аватаров/точек-индикаторов, всё остальное становится
    // технически строгим одним центральным изменением, без правки компонентов
    borderRadius: {
      none: '0px',
      sm: '1px',
      DEFAULT: '2px',
      md: '2px',
      lg: '3px',
      xl: '4px',
      '2xl': '5px',
      '3xl': '6px',
      full: '9999px',
    },
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
        warning: {
          DEFAULT: 'var(--warning)',
          bg: 'var(--warning-bg)',
        },
        cyan: {
          DEFAULT: 'var(--accent-cyan)',
        },
      },
      boxShadow: {
        panel: '0 1px 2px rgba(0,0,0,0.24)',
        elevated: '0 8px 24px rgba(0,0,0,0.28)',
        glow: '0 0 0 1px var(--accent), 0 0 16px -2px var(--accent)',
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
        'tape-scroll': {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'row-in': {
          '0%': { opacity: '0', transform: 'translateY(-4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'pop-in': {
          '0%': { opacity: '0', transform: 'scale(0.96)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        // Каскадное появление виджетов при монтировании дашборда — вес и лёгкая
        // "пружинность" вместо мгновенного появления всех блоков разом
        'widget-in': {
          '0%': { opacity: '0', transform: 'translateY(8px) scale(0.98)' },
          '100%': { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
      },
      animation: {
        flash: 'flash 0.6s ease-out',
        'flash-up': 'flash-up 0.7s ease-out',
        'flash-down': 'flash-down 0.7s ease-out',
        shimmer: 'shimmer 1.4s infinite linear',
        'tape-scroll': 'tape-scroll 30s linear infinite',
        'row-in': 'row-in 0.25s ease-out',
        'pop-in': 'pop-in 0.15s ease-out',
        'widget-in': 'widget-in 0.35s cubic-bezier(0.22, 1, 0.36, 1) both',
      },
    },
  },
  plugins: [],
}
