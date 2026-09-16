import { m } from 'motion/react'
import type { MasteryLevel } from '../../types'
import { MASTERY_META, MASTERY_ORDER } from '../../engine/core'
import { masteryDown } from '../../animations'
import { cx } from './cx'
import { Icon } from './Icon'

const SEGMENTS = 4

/**
 * Medidor de dominio. Codifica el nivel tres veces: segmentos llenos (0 a 4),
 * color de la escala y etiqueta. Así se distingue sin depender del color.
 * Experto añade una muesca. Si se pasa `previous` y es mayor, los segmentos
 * perdidos quedan en contorno y se anuncia la bajada, sin rojo ni sacudida.
 */
export function MasteryMeter({ level, previous, size = 'md', showLabel = false, className }: {
  level: MasteryLevel
  previous?: MasteryLevel
  size?: 'sm' | 'md'
  showLabel?: boolean
  className?: string
}) {
  const idx = MASTERY_ORDER.indexOf(level)
  const prevIdx = previous ? MASTERY_ORDER.indexOf(previous) : idx
  const dropped = prevIdx > idx
  const meta = MASTERY_META[level]
  const seg = size === 'sm' ? 'h-1.5 w-2.5' : 'h-2 w-4'
  const description = `Dominio: ${meta.label} (${idx} de ${SEGMENTS})${dropped ? `, bajó desde ${MASTERY_META[previous!].label}` : ''}`

  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      <span role="img" aria-label={description} className="inline-flex items-center gap-0.5">
        {Array.from({ length: SEGMENTS }, (_, i) => {
          const filled = i < idx
          const lost = dropped && i >= idx && i < prevIdx
          if (lost) {
            return (
              <m.span
                key={i}
                variants={masteryDown}
                initial="hidden"
                animate="show"
                className={cx(seg, 'rounded-sm border border-dashed border-edge-strong', MASTERY_META[previous!].dot)}
              />
            )
          }
          return <span key={i} className={cx(seg, 'rounded-sm', filled ? meta.dot : 'bg-edge')} />
        })}
        {level === 'expert' && <span className="ml-0.5 h-2.5 w-0.5 rounded-full bg-mastery-expert" />}
      </span>
      {dropped && <Icon name="arrow-down" size={14} className="text-fg-secondary" />}
      {showLabel && (
        <span className={cx('text-caption', meta.text)}>
          {dropped ? `Bajó a ${meta.label}` : meta.label}
        </span>
      )}
    </span>
  )
}

/** Compatibilidad con las pantallas anteriores. */
export function MasteryDot({ level, withLabel = false }: { level: MasteryLevel; withLabel?: boolean }) {
  return <MasteryMeter level={level} size="sm" showLabel={withLabel} />
}

/**
 * Racha de aciertos seguidos en un concepto, hacia la racha que exige el
 * siguiente nivel. La meta llega del motor (MASTERY_RULES), nunca escrita aquí.
 */
export function ConceptStreak({ streak, goal, nextLabel, className }: {
  streak: number
  goal: number | null
  nextLabel?: string
  className?: string
}) {
  if (!goal) {
    return <span className={cx('font-mono text-micro text-fg-tertiary tnum', className)}>racha {streak}</span>
  }
  const shown = Math.min(goal, 6)
  const filled = Math.min(streak, shown)
  return (
    <span className={cx('inline-flex items-center gap-2', className)}>
      <span aria-hidden="true" className="inline-flex gap-0.5">
        {Array.from({ length: shown }, (_, i) => (
          <span key={i} className={cx('h-2.5 w-1 rounded-sm', i < filled ? 'bg-accent' : 'border border-edge-strong')} />
        ))}
      </span>
      <span className="font-mono text-micro text-fg-tertiary tnum">
        racha {Math.min(streak, goal)}/{goal}{nextLabel ? ` para ${nextLabel}` : ''}
      </span>
    </span>
  )
}
