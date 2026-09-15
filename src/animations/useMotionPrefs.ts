import { useReducedMotion } from 'motion/react'

/**
 * El bloque `prefers-reduced-motion` de index.css solo alcanza a las animaciones
 * de CSS. Motion anima con JavaScript, así que sin esto un usuario que ha pedido
 * menos movimiento recibiría más que antes.
 *
 * MotionConfig con reducedMotion="user" ya desactiva transformaciones de forma
 * global; este hook cubre lo que no pasa por variantes, como el contador de XP.
 */
export function useMotionPrefs() {
  const reduced = useReducedMotion() ?? false
  return { reduced }
}
