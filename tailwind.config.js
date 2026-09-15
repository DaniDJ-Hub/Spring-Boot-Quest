import { modes, palette } from './src/styles/palette.js'

/* ------------------------------- Color ---------------------------------
 * Los colores salen de src/styles/palette.js. Cada token se sirve como una
 * variable CSS con canales RGB, así que las utilidades admiten opacidad
 * (`bg-accent/10`) y un modo puede redefinir superficies en un contenedor
 * (`data-mode="boss"`) sin duplicar clases.
 */
const channels = hex => [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16)).join(' ')
const varName = (group, key) => (key === 'DEFAULT' ? `--c-${group}` : `--c-${group}-${key}`)

const toVars = pal => {
  const out = {}
  for (const [group, values] of Object.entries(pal)) {
    for (const [key, hex] of Object.entries(values)) out[varName(group, key)] = channels(hex)
  }
  return out
}

const colors = Object.fromEntries(
  Object.entries(palette).map(([group, values]) => [
    group,
    Object.fromEntries(Object.keys(values).map(key => [key, `rgb(var(${varName(group, key)}) / <alpha-value>)`])),
  ]),
)

/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors,

      /* ----------------------------- Tipografía ----------------------------
       * Rol: Space Grotesk para títulos, XP y resultados; Inter para interfaz e
       * instrucciones; JetBrains Mono para código, logs, IDs y contadores.
       */
      fontSize: {
        micro:   ['0.6875rem', { lineHeight: '1.45' }],                          // 11 · IDs, etiquetas de etapa
        caption: ['0.8125rem', { lineHeight: '1.5' }],                           // 13 · apoyo
        body:    ['0.9375rem', { lineHeight: '1.6' }],                           // 15 · lectura
        lead:    ['1.125rem',  { lineHeight: '1.45' }],                          // 18 · enunciado
        h3:      ['1.25rem',   { lineHeight: '1.3' }],                           // 20
        h2:      ['1.5rem',    { lineHeight: '1.25' }],                          // 24
        h1:      ['2rem',      { lineHeight: '1.15', letterSpacing: '-0.015em' }], // 32
        display: ['2.75rem',   { lineHeight: '1.05', letterSpacing: '-0.02em' }],  // 44 · XP, nivel, % de resultado
        code:    ['0.875rem',  { lineHeight: '1.7' }],                           // 14 · código y logs
      },

      fontFamily: {
        display: ['"Space Grotesk"', '"Space Grotesk fallback"', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', '"Inter fallback"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },

      /* Radio: crece con el tamaño del elemento. Cerrado, de herramienta. */
      borderRadius: {
        sm: '0.25rem',   // 4  · chips, segmentos
        md: '0.375rem',  // 6  · controles, nodos
        lg: '0.625rem',  // 10 · paneles
      },

      /* Elevación: la jerarquía la dan superficie y borde. La única sombra es
       * para lo que flota por encima de todo: toast y diálogo. */
      boxShadow: {
        float: '0 8px 24px rgb(0 0 0 / 0.5)',
      },

      /* Movimiento: mismas duraciones que src/animations/motion.ts. */
      transitionDuration: {
        fast: '150ms',   // respuesta a una acción
        base: '250ms',   // cambio de estado, entrada
        slow: '400ms',   // cambios de dominio, resultados
        unlock: '550ms', // solo el desbloqueo de dependencias
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
        move: 'cubic-bezier(0.65, 0, 0.35, 1)',
      },

      keyframes: {
        breathe: { '0%, 100%': { opacity: '1' }, '50%': { opacity: '0.55' } },
        spin: { to: { transform: 'rotate(360deg)' } },
      },
      animation: {
        breathe: 'breathe 1.6s ease-in-out infinite',
        spin: 'spin 0.9s linear infinite',
      },
    },
  },
  plugins: [
    // Variables de color: la paleta base en :root y cada modo en su contenedor.
    ({ addBase }) => {
      addBase({ ':root': toVars(palette) })
      for (const [name, pal] of Object.entries(modes)) addBase({ [`[data-mode="${name}"]`]: toVars(pal) })
    },
  ],
}
