import { m } from 'motion/react'
import type { CSSProperties } from 'react'
import type { World } from '../../types'
import type { WorldStatus } from '../../engine/selectors'
import { edgeGrow } from '../../animations'
import type { EdgeSegment } from '../../animations'
import { cx } from './cx'
import { Icon } from './Icon'
import { WORLD_STATUS_META } from './meta'

const NODE_TONE: Record<WorldStatus, { box: string; port: string; label: string }> = {
  locked: { box: 'border-dashed border-edge-strong bg-surface', port: 'border-edge-strong bg-surface', label: 'text-locked' },
  available: { box: 'border-edge-strong bg-surface-raised', port: 'border-edge-strong bg-surface-raised', label: 'text-fg-secondary' },
  'in-progress': { box: 'border-info/60 bg-surface-raised', port: 'border-info bg-surface-raised', label: 'text-info' },
  'boss-open': { box: 'border-boss bg-surface-raised', port: 'border-boss bg-boss', label: 'text-boss' },
  cleared: { box: 'border-accent/70 bg-surface-raised', port: 'border-accent bg-accent', label: 'text-accent' },
  mastered: { box: 'border-accent bg-surface-raised outline outline-1 outline-offset-2 outline-accent/50', port: 'border-accent-bright bg-accent-bright', label: 'text-accent-bright' },
}

/**
 * Nodo del grafo de dependencias. Seis estados, cada uno con borde, puerto,
 * icono y texto propios. Es un botón: el mapa decide qué pasa al elegirlo.
 */
export function GraphNode({ world, status, done, total, selected, isNew, onSelect, className, style }: {
  world: World
  status: WorldStatus
  done: number
  total: number
  selected?: boolean
  isNew?: boolean
  onSelect: () => void
  className?: string
  style?: CSSProperties
}) {
  const meta = WORLD_STATUS_META[status]
  const tone = NODE_TONE[status]
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      aria-label={`Mundo ${world.index}: ${world.title}. ${meta.label}. ${done} de ${total} retos.${isNew ? ' Nuevo.' : ''}`}
      style={style}
      className={cx(
        'group relative w-full rounded-md border px-3 py-2 text-left transition-[transform,border-color,background-color] duration-fast ease-out hover:bg-surface-overlay active:scale-[.98]',
        tone.box,
        selected && 'bg-surface-overlay ring-1 ring-fg/60',
        className,
      )}
    >
      <span aria-hidden="true" className={cx('absolute -top-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full border', tone.port)} />
      <span aria-hidden="true" className={cx('absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rounded-full border', tone.port)} />
      <span className="flex items-center gap-2">
        <span className="font-mono text-micro text-fg-tertiary tnum">{String(world.index).padStart(2, '0')}</span>
        <Icon name={meta.icon} size={14} className={cx('ml-auto', tone.label)} />
      </span>
      <span className={cx('mt-0.5 block truncate font-display text-caption', status === 'locked' ? 'text-fg-secondary' : 'text-fg')}>
        {world.title}
      </span>
      <span className="mt-1 flex items-center justify-between gap-2 font-mono text-micro">
        <span className={tone.label}>{meta.label}</span>
        {status !== 'locked' && <span className="text-fg-tertiary tnum">{done}/{total}</span>}
      </span>
      {isNew && (
        <span className="absolute -right-2 -top-2 rounded-sm border border-accent bg-accent-dim px-1 font-mono text-micro text-accent">NUEVO</span>
      )}
    </button>
  )
}

/**
 * Arista ortogonal entre el puerto inferior de un nodo y el superior de otro:
 * baja, cruza a la altura `midY` y vuelve a bajar. Inactiva es discontinua;
 * activa, sólida y verde. `resolving` dibuja el recorrido tramo a tramo.
 */
export function DependencyEdge({ from, to, midY, active, resolving = false }: {
  from: { x: number; y: number }
  to: { x: number; y: number }
  midY: number
  active: boolean
  resolving?: boolean
}) {
  // Mientras se resuelve, la base se pinta inactiva y el verde la recorre encima.
  const solid = active && !resolving
  const segments: { d: [number, number, number, number]; seg: EdgeSegment; origin: string }[] = [
    { d: [from.x, from.y, from.x, midY], seg: { axis: 'y', step: 0 }, origin: 'top' },
    { d: [from.x, midY, to.x, midY], seg: { axis: 'x', step: 1 }, origin: to.x >= from.x ? 'left' : 'right' },
    { d: [to.x, midY, to.x, to.y], seg: { axis: 'y', step: 2 }, origin: 'top' },
  ]

  return (
    <g>
      {segments.map(({ d }, i) => (
        <line
          key={`base-${i}`}
          x1={d[0]} y1={d[1]} x2={d[2]} y2={d[3]}
          className={solid ? 'stroke-accent' : 'stroke-edge-strong'}
          strokeWidth={solid ? 2 : 1.5}
          strokeDasharray={solid ? undefined : '4 4'}
          strokeLinecap="round"
        />
      ))}
      {resolving && segments.map(({ d, seg, origin }, i) => (
        <m.line
          key={`run-${i}`}
          x1={d[0]} y1={d[1]} x2={d[2]} y2={d[3]}
          className="stroke-accent"
          strokeWidth={2}
          strokeLinecap="round"
          custom={seg}
          variants={edgeGrow}
          initial="hidden"
          animate="show"
          style={{ transformOrigin: origin }}
          // transform-box vive en la clase: escalar un segmento desde su propio extremo.
          data-edge-segment=""
        />
      ))}
    </g>
  )
}
