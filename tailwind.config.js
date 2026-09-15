/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      /* ------------------------------- Color -------------------------------
       * Tokens por función, no por tinte: si mañana el verde cambia, se cambia
       * en un sitio y nada llamado `accent` deja de tener sentido.
       * Todos los valores están verificados contra los tres fondos:
       * texto ≥ 4.5:1 (WCAG AA) y bordes de control ≥ 3:1 (WCAG 1.4.11).
       */
      colors: {
        surface: {
          DEFAULT: '#151A2D',   // fondo de la aplicación
          raised:  '#1E2540',   // paneles y tarjetas
          sunken:  '#0F1322',   // bloques de código, campos de texto
          overlay: '#262E4E',   // capas por encima de un panel
        },
        edge: {
          DEFAULT: '#333D61',   // divisores y contenedores
          soft:    '#28304F',   // separación mínima dentro de un panel
          strong:  '#646E94',   // límite de un control (3.01:1)
        },
        fg: {
          DEFAULT:   '#E4E8F5', // texto principal      14.09:1
          secondary: '#A3AAC4', // texto de apoyo         6.53:1
          tertiary:  '#808BB7', // metadatos y cifras     4.52:1
        },
        accent:  { DEFAULT: '#5FA83C', bright: '#7BC653', dim: '#3D6B27' },
        warning: { DEFAULT: '#E8A33D', dim: '#8A5F1E' },
        danger:  { DEFAULT: '#F2656A', dim: '#7A2226' },
        info:    { DEFAULT: '#6BA3E8', dim: '#27466E' },

        /* Escala de dominio con identidad propia: antes «básico» y «en progreso»
         * compartían ámbar y se veían idénticos siendo estados distintos. */
        mastery: {
          none:     '#F2656A',
          basic:    '#E8853D',
          progress: '#E8A33D',
          mastered: '#5FA83C',
          expert:   '#6BA3E8',
        },
      },

      /* ----------------------------- Tipografía ----------------------------
       * Siete pasos y ninguno más. Antes había 26 usos de text-[11px] sueltos
       * conviviendo con la escala por defecto de Tailwind.
       */
      fontSize: {
        micro:   ['0.6875rem', { lineHeight: '1.45' }],  // 11px · contadores, etiquetas
        caption: ['0.8125rem', { lineHeight: '1.5' }],   // 13px · texto secundario
        body:    ['0.9375rem', { lineHeight: '1.65' }],  // 15px · lectura
        lead:    ['1.125rem',  { lineHeight: '1.45' }],  // 18px · entradilla
        h3:      ['1.25rem',   { lineHeight: '1.3' }],   // 20px
        h2:      ['1.5rem',    { lineHeight: '1.25' }],  // 24px
        h1:      ['2rem',      { lineHeight: '1.15', letterSpacing: '-0.015em' }], // 32px
        code:    ['0.78125rem', { lineHeight: '1.7' }],  // 12.5px · solo bloques de código
      },

      fontFamily: {
        display: ['"Space Grotesk"', '"Space Grotesk fallback"', 'system-ui', 'sans-serif'],
        sans: ['"Inter Variable"', '"Inter fallback"', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace'],
      },

      /* ------------------------------- Radio -------------------------------
       * Regla: el radio crece con el tamaño del elemento.
       */
      borderRadius: {
        sm: '0.25rem',   // 4px  · chips, marcas
        md: '0.5rem',    // 8px  · botones, opciones, campos
        lg: '0.75rem',   // 12px · paneles y tarjetas
      },

      /* ------------------------------ Movimiento ---------------------------
       * Duraciones y curvas con nombre, para que no aparezcan valores sueltos.
       */
      transitionDuration: {
        instant: '90ms',   // respuesta a una pulsación
        quick: '160ms',    // cambio de estado
        smooth: '260ms',   // entrada de un elemento
      },
      transitionTimingFunction: {
        out: 'cubic-bezier(0.22, 1, 0.36, 1)',
      },

      keyframes: {
        pop:   { '0%': { transform: 'scale(.96)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        slide: { '0%': { transform: 'translateY(6px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
      },
      animation: {
        pop: 'pop 180ms cubic-bezier(0.22, 1, 0.36, 1)',
        slide: 'slide 220ms cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
