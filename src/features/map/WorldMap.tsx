import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import { WORLDS } from '../../data/worlds'
import { useGameState } from '../../engine/game-context'
import { bossAvailable, worldProgress, worldUnlocked } from '../../engine/core'
import { m } from 'motion/react'
import { Link } from '../../app/router'
import { listItem, staggered } from '../../animations'
import { Bar, Chip } from '../../components/ui'

/** Los tokens de Tailwind no llegan a los atributos de SVG, así que se declaran
 *  aquí con los mismos valores para que no se desincronicen en silencio. */
const STROKE = {
  done: '#3D6B27',
  idle: '#333D61',
  clearedFill: '#5FA83C',
  clearedRing: '#7BC653',
  openFill: '#1E2540',
  openRing: '#6BA3E8',
  lockedFill: '#151A2D',
}

interface Point { x: number; y: number }

export function WorldMap() {
  const { state } = useGameState()
  const container = useRef<HTMLDivElement>(null)
  const rows = useRef<(HTMLLIElement | null)[]>([])
  const [points, setPoints] = useState<Point[]>([])
  const [height, setHeight] = useState(0)
  const [step, setStep] = useState(22)

  /**
   * Las posiciones de los nodos se miden del DOM en vez de calcularse con una
   * altura de fila fija. Así el árbol sigue cuadrando aunque el texto envuelva
   * en dos líneas o el usuario suba el tamaño de letra del sistema.
   */
  const measure = useCallback(() => {
    const box = container.current
    if (!box) return
    const base = box.getBoundingClientRect()
    const narrow = box.clientWidth < 520
    const s = narrow ? 11 : 22
    setStep(s)
    setPoints(
      WORLDS.map((w, i) => {
        const el = rows.current[i]
        if (!el) return { x: 0, y: 0 }
        const r = el.getBoundingClientRect()
        return { x: 14 + w.depth * s, y: r.top - base.top + r.height / 2 }
      }),
    )
    setHeight(box.scrollHeight)
  }, [])

  useLayoutEffect(() => {
    measure()
    const box = container.current
    if (!box || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    for (const el of rows.current) if (el) ro.observe(el)
    return () => ro.disconnect()
  }, [measure])

  const gutter = 14 + step * 5 + (step === 11 ? 16 : 26)

  return (
    <section>
      <header className="mb-5">
        <h1 className="text-h3 mb-1">Árbol de dependencias</h1>
        <p className="text-body text-fg-secondary max-w-2xl">
          Cada mundo se apoya en los anteriores, igual que en el curso. Un mundo se abre cuando superas
          la boss battle de todos los que cuelgan encima de él.
        </p>
      </header>

      <div ref={container} className="relative">
        {points.length === WORLDS.length && (
          <svg className="absolute inset-0 pointer-events-none" width="100%" height={height} aria-hidden="true">
            {WORLDS.map((w, i) =>
              w.requires.map(req => {
                const j = WORLDS.findIndex(x => x.id === req)
                if (j < 0) return null
                const a = points[j]
                const b = points[i]
                const done = state.bossCleared.includes(req)
                return (
                  <path
                    key={`${w.id}-${req}`}
                    d={`M ${a.x} ${a.y + 12} L ${a.x} ${b.y - 14} Q ${a.x} ${b.y} ${a.x + 14} ${b.y} L ${b.x - 7} ${b.y}`}
                    fill="none"
                    stroke={done ? STROKE.done : STROKE.idle}
                    strokeWidth={1.5}
                  />
                )
              }),
            )}
            {WORLDS.map((w, i) => {
              const cleared = state.bossCleared.includes(w.id)
              const open = worldUnlocked(state, w)
              return (
                <circle
                  key={w.id}
                  cx={points[i].x} cy={points[i].y} r={cleared ? 6 : 5}
                  fill={cleared ? STROKE.clearedFill : open ? STROKE.openFill : STROKE.lockedFill}
                  stroke={cleared ? STROKE.clearedRing : open ? STROKE.openRing : STROKE.idle}
                  strokeWidth={2}
                />
              )
            })}
          </svg>
        )}

        {/* Escalonado solo aquí: en el mapa el orden de aparición refuerza que
            cada mundo se apoya en el anterior. Aplicarlo a todas las secciones
            de todas las pantallas es el tic más reconocible de una interfaz
            generada, así que no se hace en ningún otro sitio. */}
        <m.ol variants={staggered} initial="hidden" animate="show" className="relative space-y-3">
          {WORLDS.map((w, i) => {
            const open = worldUnlocked(state, w)
            const cleared = state.bossCleared.includes(w.id)
            const p = worldProgress(state, w.id)
            const bossReady = bossAvailable(state, w) && !cleared
            const etiqueta = `Mundo ${w.index}: ${w.title}. ${cleared ? 'Superado.' : open ? `${p.done} de ${p.total} retos resueltos.` : 'Bloqueado.'}`
            const clases = `block w-full text-left rounded-lg border px-3 py-2.5 transition-colors duration-quick ease-out
              ${open ? 'border-edge-strong hover:border-accent bg-surface-raised/50' : 'border-edge opacity-60 cursor-not-allowed'}
              ${cleared ? 'border-accent/50' : ''}`

            const contenido = (
              <>
                <span className="flex items-baseline gap-2">
                  <span className="font-mono text-micro text-fg-tertiary tnum">{String(w.index).padStart(2, '0')}</span>
                  <span className={`font-display text-body ${cleared ? 'text-accent' : ''}`}>{w.title}</span>
                  {cleared && <span aria-hidden="true" className="text-accent text-caption">✓</span>}
                  {bossReady && <Chip tone="warning" className="ml-auto">Boss lista</Chip>}
                  {!open && <span aria-hidden="true" className="ml-auto text-micro text-fg-tertiary">Bloqueado</span>}
                </span>
                <span className="block text-caption text-fg-secondary mt-0.5 line-clamp-1">{w.tagline}</span>
                {open && (
                  <span className="mt-2 flex items-center gap-2">
                    <Bar pct={p.pct} tone={cleared ? 'accent' : 'info'} height="h-1" />
                    <span className="text-micro text-fg-tertiary tnum shrink-0">{p.done}/{p.total}</span>
                  </span>
                )}
              </>
            )

            return (
              <m.li
                key={w.id}
                ref={el => { rows.current[i] = el }}
                variants={listItem}
                style={{ paddingLeft: gutter }}
              >
                {open
                  ? <Link to={{ name: 'mundo', worldId: w.id }} aria-label={etiqueta} className={clases}>{contenido}</Link>
                  : <span aria-label={etiqueta} className={clases}>{contenido}</span>}
              </m.li>
            )
          })}
        </m.ol>
      </div>
    </section>
  )
}
