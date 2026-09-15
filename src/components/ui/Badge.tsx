import type { ReactNode } from 'react'
import type { ChallengeKind, Difficulty } from '../../types'
import type { SelectionReason } from '../../engine/selectors'
import { cx } from './cx'
import { Icon } from './Icon'
import type { IconName } from './Icon'
import { KIND_META, RARITY_META, REASON_META } from './meta'
import type { Rarity, Tone } from './meta'

const TONE: Record<Tone, string> = {
  neutral: 'border-edge-strong text-fg-secondary',
  accent: 'border-accent/40 bg-accent-dim text-accent',
  warning: 'border-warning/40 bg-warning-dim text-warning',
  danger: 'border-danger/40 bg-danger-dim text-danger',
  info: 'border-info/40 bg-info-dim text-info',
  boss: 'border-boss/50 bg-boss-dim text-boss',
  locked: 'border-dashed border-edge-strong text-locked',
}

/**
 * Etiqueta de estado. `tag` es la voz de consola (mono, mayúsculas) para
 * estados y motivos; `label` es texto normal para conceptos y nombres.
 * Siempre lleva texto: el color nunca es el único portador del significado.
 */
export function Badge({ children, tone = 'neutral', icon, variant = 'tag', className }: {
  children: ReactNode
  tone?: Tone
  icon?: IconName
  variant?: 'tag' | 'label'
  className?: string
}) {
  return (
    <span
      className={cx(
        'inline-flex max-w-full items-center gap-1 whitespace-nowrap rounded-sm border px-2 py-0.5 text-micro',
        variant === 'tag' ? 'font-mono uppercase tracking-wide' : 'font-sans',
        TONE[tone],
        className,
      )}
    >
      {icon && <Icon name={icon} size={12} />}
      <span className="truncate">{children}</span>
    </span>
  )
}

/** Compatibilidad con las pantallas anteriores: una etiqueta de texto normal. */
export function Chip({ children, tone = 'neutral', className }: { children: ReactNode; tone?: Exclude<Tone, 'boss' | 'locked'>; className?: string }) {
  return <Badge variant="label" tone={tone} className={className}>{children}</Badge>
}

export function ReasonBadge({ reason, className }: { reason: SelectionReason; className?: string }) {
  const m = REASON_META[reason]
  return (
    <span title={m.hint} className={className}>
      <Badge tone={m.tone} icon={m.icon}>{m.label}</Badge>
    </span>
  )
}

export function KindBadge({ kind, className }: { kind: ChallengeKind; className?: string }) {
  const m = KIND_META[kind]
  return <Badge variant="label" icon={m.icon} className={className}>{m.label}</Badge>
}

export function RarityBadge({ rarity, className }: { rarity: Rarity; className?: string }) {
  const m = RARITY_META[rarity]
  return (
    <span className={cx('inline-flex items-center rounded-sm border px-1.5 font-mono text-micro tracking-wide', m.text, m.border, className)}>
      {m.label}
    </span>
  )
}

/** Dificultad en cinco pips. La cifra va para el lector de pantalla. */
export function DifficultyPips({ value, className }: { value: Difficulty; className?: string }) {
  return (
    <span className={cx('inline-flex items-center gap-0.5', className)}>
      <span className="sr-only">Dificultad {value} de 5</span>
      {[1, 2, 3, 4, 5].map(i => (
        <span
          key={i}
          aria-hidden="true"
          className={cx('h-2.5 w-1 rounded-sm', i <= value ? 'bg-fg-secondary' : 'border border-edge-strong')}
        />
      ))}
    </span>
  )
}
