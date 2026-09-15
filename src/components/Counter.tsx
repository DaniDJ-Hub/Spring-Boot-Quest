import { useEffect, useRef, useState } from 'react'
import { useMotionPrefs } from '../animations'

const EASE_OUT = (t: number) => 1 - Math.pow(1 - t, 3)

/**
 * Cifra que interpola al cambiar. Existe porque el XP sube al responder y un
 * salto seco de 120 a 134 no comunica nada: la cuenta sí dice «acabas de ganar
 * puntos y esta es la cantidad». CSS no puede animar el contenido de un nodo.
 *
 * Va a mano con requestAnimationFrame en vez de con `animate()` de Motion:
 * importar el motor completo de animación para interpolar un número costaba
 * varios kB y aquí no aporta nada que estas quince líneas no hagan.
 *
 * Con movimiento reducido, o en el primer pintado, salta directamente.
 */
export function Counter({ value, className }: { value: number; className?: string }) {
  const { reduced } = useMotionPrefs()
  const [shown, setShown] = useState(value)
  const previous = useRef(value)

  useEffect(() => {
    const from = previous.current
    previous.current = value
    if (reduced || from === value) { setShown(value); return }

    const ms = Math.min(700, 250 + Math.abs(value - from) * 2.5)
    const start = performance.now()
    let frame = 0

    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / ms)
      setShown(Math.round(from + (value - from) * EASE_OUT(t)))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [value, reduced])

  // El valor real va en aria-label: un lector no debería oír la cuenta atrás.
  return (
    <span className={className} aria-label={String(value)}>
      <span aria-hidden="true">{shown}</span>
    </span>
  )
}
