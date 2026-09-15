import type { Transition, Variants } from 'motion/react'

/**
 * Lenguaje de movimiento.
 *
 * Una animación tiene que comunicar un cambio, responder a una acción,
 * establecer jerarquía o hacer más natural una interacción. Si no cumple
 * ninguna, no se anima. Solo se animan transform y opacity.
 *
 * Las duraciones son las mismas que los tokens de Tailwind (`duration-fast`,
 * `base`, `slow`, `unlock`), expresadas en segundos porque es lo que espera Motion.
 */
export const DURATION = {
  fast: 0.15,   // respuesta a una acción, sello de veredicto
  base: 0.25,   // cambio de estado, entrada de un reto
  slow: 0.4,    // cambio de dominio, resultados
  unlock: 0.55, // solo el recorrido de una dependencia resuelta
} as const

/** Entradas y cambios de estado: arranca rápido y se posa. */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const
/** Desplazamientos entre dos posiciones: reordenar, recorrer una arista. */
export const EASE_IN_OUT = [0.65, 0, 0.35, 1] as const

export const T: Record<'fast' | 'base' | 'slow' | 'unlock', Transition> = {
  fast: { duration: DURATION.fast, ease: EASE_OUT },
  base: { duration: DURATION.base, ease: EASE_OUT },
  slow: { duration: DURATION.slow, ease: EASE_IN_OUT },
  unlock: { duration: DURATION.unlock, ease: EASE_IN_OUT },
}

/** Muelle corto, reservado a lo que interrumpe: toast y diálogo. */
export const SPRING: Transition = { type: 'spring', stiffness: 420, damping: 30, mass: 0.7 }

/* ------------------------------ Variantes ------------------------------ */

/** Cambio de pantalla: lo justo para leerse como sustitución, no parpadeo. */
export const page: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: T.base },
  exit: { opacity: 0, transition: T.fast },
}

/** Reto que entra y sale. La dirección refuerza que se avanza. */
export const challenge: Variants = {
  hidden: { opacity: 0, x: 12 },
  show: { opacity: 1, x: 0, transition: T.base },
  exit: { opacity: 0, x: -12, transition: T.fast },
}

/** Bloque que aparece donde antes no había nada: explicación, consola. */
export const reveal: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: T.base },
}

/** Sello BUILD SUCCESS / BUILD FAILED: se imprime, no rebota. */
export const verdict: Variants = {
  hidden: { opacity: 0, scale: 0.98 },
  show: { opacity: 1, scale: 1, transition: T.fast },
}

/** Aviso de logro: interrumpe, por eso lleva muelle. */
export const toast: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRING },
  exit: { opacity: 0, scale: 0.96, transition: T.fast },
}

/** Diálogo modal: el panel entra, el fondo solo se funde. */
export const dialogPanel: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { ...SPRING, stiffness: 480 } },
  exit: { opacity: 0, scale: 0.98, transition: T.fast },
}

export const dialogBackdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: T.base },
  exit: { opacity: 0, transition: T.fast },
}

/** Elemento que entra o sale de una lista. */
export const listItem: Variants = {
  hidden: { opacity: 0, y: -4 },
  show: { opacity: 1, y: 0, transition: T.base },
  exit: { opacity: 0, y: 4, transition: T.fast },
}

/**
 * Bajada de dominio: sobria. El segmento perdido se atenúa y se hunde dos
 * píxeles. Sin sacudida y sin rojo: se informa, no se castiga.
 */
export const masteryDown: Variants = {
  hidden: { opacity: 1, y: 0 },
  show: { opacity: 0.35, y: 2, transition: T.slow },
}

/** Etapa de un pipeline que pasa a su estado final, en secuencia. */
export const pipelineStage: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: T.base },
}

/**
 * Secuencia con significado: etapas del pipeline, capas del mapa. No se
 * aplica a cada sección de cada pantalla: eso es el tic más reconocible de
 * una interfaz generada.
 */
export const staggered: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
}

/** Tramo de una arista ortogonal: eje en el que crece y orden dentro del recorrido. */
export interface EdgeSegment { axis: 'x' | 'y'; step: 0 | 1 | 2 }

/** Duración de cada uno de los tres tramos de una arista. */
export const EDGE_STEP = DURATION.unlock / 3

/**
 * Recorrido de una dependencia resuelta. La arista es ortogonal (baja, cruza,
 * baja), así que se dibuja con escalas por eje —transform— en vez de animar el
 * trazo. Los tres tramos suman la duración de `unlock`.
 */
export const edgeGrow: Variants = {
  hidden: ({ axis }: EdgeSegment) => (axis === 'x' ? { scaleX: 0 } : { scaleY: 0 }),
  show: ({ axis, step }: EdgeSegment) => ({
    ...(axis === 'x' ? { scaleX: 1 } : { scaleY: 1 }),
    transition: { duration: EDGE_STEP, ease: 'linear', delay: step * EDGE_STEP },
  }),
}

/** Respuesta a la pulsación en superficies grandes, donde no hay hover táctil. */
export const TAP = { scale: 0.98 } as const
