/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink:     { DEFAULT: '#151A2D', deep: '#0F1322', panel: '#1E2540', raise: '#262E4E' },
        line:    { DEFAULT: '#2E3757', soft: '#232B48' },
        leaf:    { DEFAULT: '#5FA83C', bright: '#7BC653', dim: '#3D6B27' },
        amber:   { DEFAULT: '#E8A33D', dim: '#8A5F1E' },
        rust:    { DEFAULT: '#E5484D', dim: '#7A2226' },
        sky:     { DEFAULT: '#4C8DD9', dim: '#27466E' },
        chalk:   { DEFAULT: '#E4E8F5', mute: '#8B93AD', faint: '#5B6382' },
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'system-ui', 'sans-serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        pop:   { '0%': { transform: 'scale(.9)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        slide: { '0%': { transform: 'translateY(6px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        fill:  { '0%': { width: '0%' } },
        shake: { '0%,100%': { transform: 'translateX(0)' }, '25%': { transform: 'translateX(-4px)' }, '75%': { transform: 'translateX(4px)' } },
      },
      animation: {
        pop: 'pop .18s ease-out',
        slide: 'slide .22s ease-out',
        shake: 'shake .3s ease-in-out',
      },
    },
  },
  plugins: [],
}
