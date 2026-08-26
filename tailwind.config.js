/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ['class'],
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    // Масштаб скруглений из дизайн-системы (tokens/radius.css): 4/6/10/12/16/20/pill —
    // мягкие карточки вместо прежних почти прямых углов "пульта управления"
    borderRadius: {
      none: '0px',
      sm: '6px',
      DEFAULT: '10px',
      md: '10px',
      lg: '12px',
      xl: '16px',
      '2xl': '20px',
      '3xl': '20px',
      full: '9999px',
    },
    extend: {
      fontFamily: {
        sans: ['Plus Jakarta Sans', '-apple-system', 'Segoe UI', 'sans-serif'],
        display: ['Plus Jakarta Sans', '-apple-system', 'Segoe UI', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
      },
      colors: {
        bg: {
          base: 'var(--bg-base)',
          rail: 'var(--bg-rail)',
          head: 'var(--bg-head)',
          panel: 'var(--bg-panel)',
          raised: 'var(--bg-raised)',
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
          contrast: 'var(--on-accent)',
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
        // Тени из дизайн-системы (tokens/elevation.css) — глубина через
        // почти-чёрную поверхность + hairline-рамку, не через drop shadow
        panel: '0 1px 0 rgba(255,255,255,.03) inset, 0 8px 24px rgba(0,0,0,.45)',
        elevated: '0 16px 40px rgba(0,0,0,.6)',
        glow: '0 0 0 1px var(--accent), 0 8px 28px -4px var(--accent)',
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
