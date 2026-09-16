import { useEffect, useRef, useState } from 'react'
import { levelProgress, nextTitle, titleFor } from '../../engine/core'
import { cx } from './cx'

type BarTone = 'accent' | 'warning' | 'info' | 'danger' | 'boss' | 'neutral'

const FILL: Record<BarTone, string> = {
  accent: 'bg-accent',
  warning: 'bg-warning',
  info: 'bg-info',
  danger: 'bg-danger',
  boss: 'bg-boss',
  neutral: 'bg-fg-tertiary',
}

const clamp = (n: number) => Math.max(0, Math.min(100, n))

/**
 * Barra de progreso. El relleno crece con transform (scaleX), no con width:
 * no provoca repintado de maquetación. Admite una marca de umbral —dónde se
 * abre la boss— y un tramo de ganancia recién obtenida.
 */
export function Bar({ pct, tone = 'accent', height = 'h-1.5', label, marker, markerLabel, gainFrom, className }: {
  pct: number
  tone?: BarTone
  /** Clase de altura: h-1, h-1.5, h-2. */
  height?: string
  /** Qué mide. Sin esto la barra es decorativa y se oculta al lector. */
  label?: string
  /** Posición de un umbral, en porcentaje. */
  marker?: number
  markerLabel?: string
  /** Porcentaje previo: el tramo entre este valor y `pct` se resalta como ganancia. */
  gainFrom?: number
  className?: string
}) {
  const value = clamp(pct)
  const a11y = label
    ? { role: 'progressbar' as const, 'aria-label': label, 'aria-valuenow': Math.round(value), 'aria-valuemin': 0, 'aria-valuemax': 100 }
    : { 'aria-hidden': true as const }
  const gain = gainFrom !== undefined && gainFrom < value ? clamp(gainFrom) : null

  return (
    <div className={cx('relative w-full', className)}>
      <div className={cx('relative w-full overflow-hidden rounded-full bg-edge-soft', height)} {...a11y}>
        <div
          className={cx('absolute inset-0 origin-left transition-transform duration-slow ease-move', FILL[tone])}
          style={{ transform: `scaleX(${(gain ?? value) / 100})` }}
        />
        {gain !== null && (
          <div
            className="absolute inset-y-0 origin-left bg-accent-bright transition-transform duration-slow ease-move"
            style={{ left: `${gain}%`, width: `${value - gain}%` }}
          />
        )}
      </div>
      {marker !== undefined && (
        <span
          aria-hidden={markerLabel ? undefined : true}
          title={markerLabel}
          className="absolute -top-1 -bottom-1 w-0.5 -translate-x-1/2 rounded-full bg-fg"
          style={{ left: `${clamp(marker)}%` }}
        />
      )}
    </div>
  )
}

/**
 * XP hacia el siguiente nivel. Cuando el XP sube, el tramo ganado se ve en
 * verde brillante un momento antes de asentarse.
 */
export function XpBar({ xp, className, compact = false }: { xp: number; className?: string; compact?: boolean }) {
  const lp = levelProgress(xp)
  const previous = useRef({ xp, level: lp.level })
  const [gainFrom, setGainFrom] = useState<number | undefined>(undefined)

  useEffect(() => {
    const prev = previous.current
    previous.current = { xp, level: lp.level }
    if (xp <= prev.xp) return
    // Si se cruzó de nivel, la ganancia arranca desde cero en la barra nueva.
    const from = prev.level === lp.level ? ((prev.xp - lp.floor) / Math.max(1, lp.ceil - lp.floor)) * 100 : 0
    setGainFrom(from)
    const t = setTimeout(() => setGainFrom(undefined), 1400)
    return () => clearTimeout(t)
  }, [xp, lp.level, lp.floor, lp.ceil])

  return (
    <div className={className}>
      <Bar pct={lp.pct} gainFrom={gainFrom} height={compact ? 'h-1' : 'h-1.5'} label={`Progreso hacia el nivel ${lp.level + 1}`} />
      {!compact && (
        <div className="mt-1 flex justify-between font-mono text-micro text-fg-tertiary tnum">
          <span>{xp - lp.floor} / {lp.ceil - lp.floor} XP</span>
          <span>LV {lp.level + 1}</span>
        </div>
      )}
    </div>
  )
}

/** Nivel y título. El número en Space Grotesk; la sigla LV en mono. */
export function LevelBadge({ xp, size = 'md', className }: { xp: number; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const { level } = levelProgress(xp)
  const next = nextTitle(level)
  return (
    <div className={cx('flex items-center gap-3', className)}>
      <div className={cx(
        'grid shrink-0 place-items-center rounded-md border border-accent/50 bg-accent-dim text-accent',
        size === 'lg' ? 'h-16 w-16' : size === 'md' ? 'h-11 w-11' : 'h-9 w-9',
      )}>
        <span className="sr-only">Nivel</span>
        <span className={cx('font-display font-bold leading-none tnum', size === 'lg' ? 'text-h1' : size === 'md' ? 'text-h3' : 'text-lead')}>
          {level}
        </span>
      </div>
      <div className="min-w-0">
        <p className="font-mono text-micro text-fg-tertiary">LV {level}</p>
        <p className={cx('truncate font-display text-fg', size === 'lg' ? 'text-h2' : 'text-body')}>{titleFor(level)}</p>
        {size === 'lg' && next && (
          <p className="text-caption text-fg-secondary">Siguiente título: {next.name} en el nivel {next.level}</p>
        )}
      </div>
    </div>
  )
}
