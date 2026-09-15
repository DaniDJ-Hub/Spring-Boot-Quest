import type { Transition, Variants } from 'motion/react'

/**
 * Sistema de animación centralizado.
 *
 * Regla que decide qué entra aquí: una animación tiene que comunicar un cambio,
 * dar respuesta a una acción, establecer jerarquía o hacer más natural una
 * interacción. Si no cumple ninguna, no se anima.
 *
 * Y si una transición de CSS basta —un color al pasar el ratón, una barra que
 * crece— se queda en CSS. Motion se usa donde CSS no llega: sobre todo salidas,
 * que CSS no puede animar porque el nodo ya no existe.
 *
 * Las duraciones son las mismas que los tokens de Tailwind (`duration-instant`,
 * `quick`, `smooth`), expresadas en segundos porque es lo que espera Motion.
 */
export const DURATION = {
  instant: 0.09,
  quick: 0.16,
  smooth: 0.26,
} as const

/** Una sola curva para todo: la misma que `ease-out` en tailwind.config.js. */
export const EASE = [0.22, 1, 0.36, 1] as const

export const T: Record<'instant' | 'quick' | 'smooth', Transition> = {
  instant: { duration: DURATION.instant, ease: EASE },
  quick: { duration: DURATION.quick, ease: EASE },
  smooth: { duration: DURATION.smooth, ease: EASE },
}

/** Muelle corto para lo que aparece de golpe y debe notarse. */
export const SPRING: Transition = { type: 'spring', stiffness: 420, damping: 30, mass: 0.7 }

/* ------------------------------ Variantes ------------------------------ */

/** Cambio de pantalla: lo justo para que se lea como sustitución, no parpadeo. */
export const page: Variants = {
  hidden: { opacity: 0, y: 4 },
  show: { opacity: 1, y: 0, transition: T.quick },
  exit: { opacity: 0, transition: T.instant },
}

/** Reto que entra y sale. La dirección refuerza que se avanza. */
export const challenge: Variants = {
  hidden: { opacity: 0, x: 12 },
  show: { opacity: 1, x: 0, transition: T.smooth },
  exit: { opacity: 0, x: -12, transition: T.quick },
}

/** Aviso de logro: es lo único que interrumpe, así que es lo único con muelle. */
export const toast: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: SPRING },
  exit: { opacity: 0, scale: 0.96, transition: T.instant },
}

/** Diálogo modal: el panel entra, el fondo solo se funde. */
export const dialogPanel: Variants = {
  hidden: { opacity: 0, scale: 0.97, y: 8 },
  show: { opacity: 1, scale: 1, y: 0, transition: { ...SPRING, stiffness: 480 } },
  exit: { opacity: 0, scale: 0.98, transition: T.instant },
}

export const dialogBackdrop: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: T.quick },
  exit: { opacity: 0, transition: T.instant },
}

/** Elemento que entra o sale de una lista: pasos del reto de ordenar. */
export const listItem: Variants = {
  hidden: { opacity: 0, y: -4 },
  show: { opacity: 1, y: 0, transition: T.quick },
  exit: { opacity: 0, y: 4, transition: T.instant },
}

/** Bloque de explicación tras responder: aparece donde antes no había nada. */
export const reveal: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: T.smooth },
}

/**
 * Escalonado. Se usa solo cuando el orden de aparición significa algo, por
 * ejemplo el mapa, donde la secuencia refuerza que los mundos dependen unos de
 * otros. No se aplica a cada sección de cada pantalla: eso es el tic más
 * reconocible de una interfaz generada.
 */
export const staggered: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.025 } },
}

/** Respuesta a la pulsación en superficies grandes, donde no hay hover táctil. */
export const TAP = { scale: 0.985 } as const
