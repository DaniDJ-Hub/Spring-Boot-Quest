/**
 * Fuente única de verdad de la paleta. Todo lo demás se deriva de aquí:
 *
 *   palette.js ──► tailwind.config.js ──► variables CSS (:root y [data-mode])
 *              │                      └─► utilidades: bg-surface-raised, text-fg…
 *              └─► tokens.test.ts (contraste WCAG calculado sobre estos hex)
 *
 * Los valores viven en hex para poder medir el contraste; Tailwind los convierte
 * a canales RGB y los sirve como variables, de modo que un modo (la boss battle)
 * puede redefinir superficies sin duplicar clases.
 *
 * Reglas de nombre: grupos y claves de una sola palabra, porque check-tokens
 * solo reconoce tokens de hasta dos segmentos (`boss-surface`, no `boss-surface-raised`).
 * Los niveles de `mastery` no se renombran: MASTERY_META del motor los referencia.
 */

/** Identidad: grafito con un matiz verde, verde Spring para lo que pasa, naranja Java para producción. */
export const palette = {
  surface: {
    sunken: '#0A0E0C',   // código, logs, campos
    DEFAULT: '#0F1412',  // fondo de la aplicación
    raised: '#161C19',   // paneles
    overlay: '#1D2521',  // capas sobre un panel, filas activas
  },
  edge: {
    soft: '#212A26',     // separación mínima dentro de un panel
    DEFAULT: '#2C3631',  // contenedores y divisores
    strong: '#65756D',   // límite de un control (≥ 3:1 en todas las superficies)
  },
  fg: {
    DEFAULT: '#E8EDEA',
    secondary: '#AAB6B0',
    tertiary: '#86948D',
    inverse: '#0A0E0C',  // texto sobre rellenos de color
  },
  focus: { DEFAULT: '#8BCB5E' },
  accent: { DEFAULT: '#6DB33F', bright: '#8BCB5E', dim: '#1F3317' },
  warning: { DEFAULT: '#E2B340', dim: '#4A3A14' },
  danger: { DEFAULT: '#EF7A6F', dim: '#4A2320' },
  info: { DEFAULT: '#6FA8D6', dim: '#1E3447' },
  locked: { DEFAULT: '#86948D' },
  boss: { DEFAULT: '#F89820', bright: '#FFB24D', dim: '#4A2E0B', surface: '#130F0A' },

  /* Escala ordinal: gris → ocre → lima → verde → menta. El orden nunca depende
   * solo del tono: el medidor lo codifica también con segmentos y etiqueta. */
  mastery: {
    none: '#8A9791',
    basic: '#D0A04A',
    progress: '#B9C255',
    mastered: '#6DB33F',
    expert: '#4FC7A0',
  },

  /* Rareza de logro con la metáfora de versiones: SNAPSHOT → RC → RELEASE → LTS. */
  rarity: {
    snapshot: '#9AA8A1',
    rc: '#6FA8D6',
    release: '#6DB33F',
    lts: '#F89820',
  },
}

/**
 * Modos: redefinen variables dentro de un contenedor con `data-mode`.
 * La boss battle («production deploy») calienta las superficies y cambia el
 * anillo de foco al naranja de producción. Éxito y error no cambian de color:
 * un BUILD FAILED tiene que leerse igual en cualquier contexto.
 */
export const modes = {
  boss: {
    surface: {
      sunken: '#0B0806',
      DEFAULT: '#110D09',
      raised: '#19140F',
      overlay: '#221B14',
    },
    edge: {
      soft: '#2A2119',
      DEFAULT: '#3A2E23',
      strong: '#7C6B5B',
    },
    focus: { DEFAULT: '#FFB24D' },
  },
}
