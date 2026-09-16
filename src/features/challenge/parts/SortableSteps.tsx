import { useRef, useState } from 'react'
import type { KeyboardEvent, PointerEvent } from 'react'
import { LazyMotion, m } from 'motion/react'
import { T } from '../../../animations'
import { cx, Icon } from '../../../components/ui'

type Phase = 'answering' | 'recorded' | 'revealed'

const loadDomMax = () => import('../dom-max').then(r => r.default)

const move = (list: string[], from: number, to: number) => {
  const next = [...list]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/**
 * Lista reordenable para los retos de ordenar un flujo. Tres formas de mover
 * un paso, todas equivalentes:
 *  - arrastrar desde el asa (Pointer Events: ratón y táctil, sin librerías);
 *  - con teclado: Espacio en el asa para agarrar, flechas para mover,
 *    Espacio para soltar y Escape para cancelar;
 *  - botones subir y bajar, grandes en móvil.
 * Cada movimiento se anuncia en una región viva.
 */
export function SortableSteps({ steps, correct, onChange, phase, labelledBy }: {
  steps: string[]
  /** Orden correcto; solo se usa para marcar posiciones al revelar. */
  correct: string[]
  onChange: (steps: string[]) => void
  phase: Phase
  labelledBy: string
}) {
  const [announce, setAnnounce] = useState('')
  const [grabbed, setGrabbed] = useState<number | null>(null)
  const grabOrigin = useRef<{ index: number; order: string[] } | null>(null)
  const [dragging, setDragging] = useState<string | null>(null)
  const items = useRef<(HTMLLIElement | null)[]>([])
  const handles = useRef<(HTMLButtonElement | null)[]>([])
  const locked = phase !== 'answering'
  const n = steps.length

  function relocate(from: number, to: number, focusHandle = true) {
    if (to < 0 || to >= n || from === to) return
    onChange(move(steps, from, to))
    setAnnounce(`«${steps[from]}» movido a la posición ${to + 1} de ${n}.`)
    if (focusHandle) requestAnimationFrame(() => handles.current[to]?.focus())
  }

  /* ------------------------------ Teclado ------------------------------ */

  function onHandleKey(e: KeyboardEvent, i: number) {
    if (locked) return
    if (e.key === ' ' || e.key === 'Enter') {
      e.preventDefault()
      if (grabbed === null) {
        setGrabbed(i)
        grabOrigin.current = { index: i, order: steps }
        setAnnounce(`Paso «${steps[i]}» agarrado en la posición ${i + 1}. Usa las flechas para moverlo y Espacio para soltarlo.`)
      } else {
        setGrabbed(null)
        grabOrigin.current = null
        setAnnounce(`Paso soltado en la posición ${i + 1} de ${n}.`)
      }
      return
    }
    if (e.key === 'Escape' && grabbed !== null && grabOrigin.current) {
      e.preventDefault()
      const { index, order } = grabOrigin.current
      onChange(order)
      setGrabbed(null)
      grabOrigin.current = null
      setAnnounce('Movimiento cancelado.')
      requestAnimationFrame(() => handles.current[index]?.focus())
      return
    }
    if (grabbed !== null && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) {
      e.preventDefault()
      const to = e.key === 'ArrowUp' ? i - 1 : i + 1
      if (to >= 0 && to < n) { relocate(i, to); setGrabbed(to) }
    }
  }

  /* ------------------------------ Arrastre ----------------------------- */

  function onPointerDown(e: PointerEvent<HTMLButtonElement>, i: number) {
    if (locked || e.button !== 0) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setDragging(steps[i])
  }

  function onPointerMove(e: PointerEvent<HTMLButtonElement>) {
    if (!dragging) return
    const from = steps.indexOf(dragging)
    // El destino es el elemento cuyo centro queda más cerca del puntero.
    let to = from
    items.current.forEach((el, idx) => {
      if (!el) return
      const r = el.getBoundingClientRect()
      if (e.clientY > r.top && e.clientY < r.bottom) to = idx
    })
    if (to !== from) {
      onChange(move(steps, from, to))
      setAnnounce(`«${dragging}» en la posición ${to + 1} de ${n}.`)
    }
  }

  function onPointerUp(e: PointerEvent<HTMLButtonElement>) {
    if (!dragging) return
    e.currentTarget.releasePointerCapture(e.pointerId)
    setDragging(null)
  }

  return (
    <LazyMotion features={loadDomMax}>
      <p id={`${labelledBy}-help`} className="mb-3 text-caption text-fg-secondary">
        Arrastra desde el asa, usa las flechas o los botones. Con teclado: Espacio en el asa para agarrar un paso.
      </p>
      {/* Mientras se arrastra no se selecciona texto: si no, el gesto acaba
          pintando de azul el enunciado del paso. */}
      <ol
        aria-labelledby={labelledBy}
        aria-describedby={`${labelledBy}-help`}
        className={cx('space-y-2', dragging && 'select-none')}
      >
        {steps.map((s, i) => {
          const expected = correct.indexOf(s)
          const ok = phase === 'revealed' && expected === i
          const wrong = phase === 'revealed' && expected !== i
          return (
            <m.li
              key={s}
              ref={el => { items.current[i] = el }}
              layout="position"
              transition={T.base}
              className={cx(
                'flex items-stretch gap-2 rounded-md border',
                ok ? 'border-accent bg-accent-dim'
                  : wrong ? 'border-danger bg-danger-dim'
                    : dragging === s || grabbed === i ? 'border-accent bg-surface-overlay shadow-float'
                      : 'border-edge-strong bg-surface-raised',
              )}
            >
              <button
                ref={el => { handles.current[i] = el }}
                type="button"
                disabled={locked}
                aria-pressed={grabbed === i}
                aria-label={`Paso en posición ${i + 1} de ${n}: ${s}. ${grabbed === i ? 'Agarrado.' : 'Pulsa Espacio para moverlo.'}`}
                onKeyDown={e => onHandleKey(e, i)}
                onPointerDown={e => onPointerDown(e, i)}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className="grid w-10 shrink-0 cursor-grab touch-none place-items-center rounded-l-md text-fg-tertiary hover:text-fg active:cursor-grabbing disabled:cursor-default"
              >
                <Icon name="grip" size={18} />
              </button>
              <span aria-hidden="true" className="flex w-6 shrink-0 items-center font-mono text-caption text-fg-tertiary tnum">{i + 1}</span>
              <span className="flex min-w-0 flex-1 items-center py-3 text-body text-fg">{s}</span>
              {phase === 'revealed' && (
                <span className={cx('flex shrink-0 items-center gap-1 pr-2 text-micro', ok ? 'text-accent' : 'text-danger')}>
                  <Icon name={ok ? 'check' : 'x'} size={16} />
                  {ok ? <span className="sr-only">Posición correcta.</span> : <span>va en {expected + 1}<span className="sr-only">. Posición incorrecta.</span></span>}
                </span>
              )}
              {!locked && (
                // Separación entre los dos objetivos táctiles: pegados, el dedo falla.
                <span className="flex shrink-0 items-center gap-2 border-l border-edge p-2 md:flex-col md:gap-2">
                  <button
                    type="button"
                    onClick={() => relocate(i, i - 1, false)}
                    disabled={i === 0}
                    aria-label={`Subir «${s}»`}
                    className="grid h-11 w-11 place-items-center rounded-md border border-edge text-fg-secondary hover:bg-surface-overlay hover:text-fg disabled:border-transparent disabled:text-edge-strong md:h-8 md:w-8"
                  >
                    <Icon name="chevron-up" size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => relocate(i, i + 1, false)}
                    disabled={i === n - 1}
                    aria-label={`Bajar «${s}»`}
                    className="grid h-11 w-11 place-items-center rounded-md border border-edge text-fg-secondary hover:bg-surface-overlay hover:text-fg disabled:border-transparent disabled:text-edge-strong md:h-8 md:w-8"
                  >
                    <Icon name="chevron-down" size={16} />
                  </button>
                </span>
              )}
            </m.li>
          )
        })}
      </ol>
      <p aria-live="assertive" className="sr-only">{announce}</p>
    </LazyMotion>
  )
}
