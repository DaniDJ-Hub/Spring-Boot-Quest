import type { ChallengeMeta, World } from '../../types'
import type { BossGate, SelectionReason, WorldStatus } from '../../engine/selectors'
import { CONCEPT_LABEL } from '../../data/worlds'
import { Link } from '../../app/router'
import { cx } from './cx'
import { Icon } from './Icon'
import { Badge, DifficultyPips, ReasonBadge } from './Badge'
import { Bar } from './Progress'
import { KIND_META, WORLD_STATUS_META, worldCode } from './meta'

/**
 * Tarjeta de mundo. El estado se lee en tres canales: etiqueta, icono y
 * tratamiento del borde (discontinuo si está bloqueado, doble si dominado).
 * Siempre es un enlace: un mundo bloqueado también se puede abrir para ver
 * qué dependencia falta.
 */
export function WorldCard({ world, status, gate, requirements, greenConcepts, className, headline }: {
  world: World
  status: WorldStatus
  gate: BossGate
  requirements?: { world: World; cleared: boolean }[]
  /** Conceptos del mundo en verde. */
  greenConcepts?: number
  className?: string
  /** Variante destacada para el punto focal del panel. */
  headline?: boolean
}) {
  const meta = WORLD_STATUS_META[status]
  const locked = status === 'locked'
  const done = status === 'cleared' || status === 'mastered'

  return (
    <Link
      to={{ name: 'mundo', worldId: world.id }}
      className={cx(
        'group relative block rounded-lg border bg-surface-raised p-4 transition-[transform,border-color,background-color] duration-fast ease-out hover:bg-surface-overlay active:scale-[.99]',
        locked ? 'border-dashed border-edge-strong' : status === 'boss-open' ? 'border-boss/60 hover:border-boss' : done ? 'border-accent/50 hover:border-accent' : 'border-edge hover:border-edge-strong',
        status === 'mastered' && 'outline outline-1 outline-offset-2 outline-accent/40',
        className,
      )}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-micro text-fg-tertiary tnum">{worldCode(world)}</span>
        <Badge tone={meta.tone} icon={meta.icon} className="ml-auto">{meta.label}</Badge>
      </div>
      <h3 className={cx('font-display text-fg group-hover:text-fg', headline ? 'text-h2' : 'text-h3')}>{world.title}</h3>
      <p className="mt-1 line-clamp-2 text-caption text-fg-secondary">{world.tagline}</p>

      {locked ? (
        requirements && requirements.length > 0 && (
          <p className="mt-4 flex flex-wrap items-center gap-2 text-caption text-fg-secondary">
            <Icon name="lock" size={14} className="text-locked" />
            Requiere:
            {requirements.map(r => (
              <span key={r.world.id} className="inline-flex items-center gap-1 font-mono text-micro">
                {worldCode(r.world)}
                <Icon name={r.cleared ? 'check' : 'x'} size={12} className={r.cleared ? 'text-accent' : 'text-fg-tertiary'} />
                <span className="sr-only">{r.cleared ? 'superado' : 'pendiente'}</span>
              </span>
            ))}
          </p>
        )
      ) : (
        <div className="mt-4">
          <Bar
            pct={gate.total ? (gate.done / gate.total) * 100 : 0}
            tone={done ? 'accent' : status === 'boss-open' ? 'boss' : 'info'}
            marker={done ? undefined : gate.ratio * 100}
            markerLabel={`La boss se abre con ${gate.required} retos resueltos`}
            label={`${world.title}: ${gate.done} de ${gate.total} retos resueltos`}
          />
          <p className="mt-2 flex flex-wrap justify-between gap-x-3 font-mono text-micro text-fg-tertiary tnum">
            <span>{gate.done}/{gate.total} retos</span>
            {done
              ? greenConcepts !== undefined && <span>{greenConcepts}/{world.concepts.length} conceptos en verde</span>
              : gate.open
                ? <span className="text-boss">deploy listo</span>
                : <span>deploy abre con {gate.required} · faltan {gate.remaining}</span>}
          </p>
        </div>
      )}
    </Link>
  )
}

export type ChallengeRecord = 'new' | 'solved' | 'failed'

const RECORD_META: Record<ChallengeRecord, { label: string; icon: 'dot' | 'check-circle' | 'rotate-ccw'; className: string }> = {
  new: { label: 'Sin intentar', icon: 'dot', className: 'text-fg-tertiary' },
  solved: { label: 'Resuelto', icon: 'check-circle', className: 'text-accent' },
  failed: { label: 'Fallado', icon: 'rotate-ccw', className: 'text-warning' },
}

/**
 * Tarjeta de reto. El enunciado vive en el contenido diferido, así que aquí
 * se muestra lo que la metadata sabe: tipo, conceptos, dificultad y XP.
 */
export function ChallengeCard({ meta, reason, record, onPlay, disabled }: {
  meta: ChallengeMeta
  reason?: SelectionReason
  record: ChallengeRecord
  onPlay?: () => void
  disabled?: boolean
}) {
  const kind = KIND_META[meta.kind]
  const rec = RECORD_META[record]
  return (
    <button
      type="button"
      onClick={onPlay}
      disabled={disabled}
      className="group flex w-full items-start gap-3 rounded-md border border-edge bg-surface-raised p-3 text-left transition-[transform,border-color,background-color] duration-fast ease-out hover:border-edge-strong hover:bg-surface-overlay active:scale-[.99] disabled:cursor-not-allowed disabled:border-dashed"
    >
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-md border border-edge-strong text-fg-secondary group-hover:text-fg">
        <Icon name={kind.icon} size={16} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-body text-fg">{kind.label}</span>
          {reason && <ReasonBadge reason={reason} />}
        </span>
        <span className="mt-1 block truncate text-caption text-fg-secondary">
          {meta.concepts.map(k => CONCEPT_LABEL[k] ?? k).join(' · ')}
        </span>
        <span className="mt-2 flex items-center gap-3 font-mono text-micro text-fg-tertiary">
          <span>{meta.id}</span>
          <DifficultyPips value={meta.difficulty} />
          <span className="tnum">+{meta.xp} XP</span>
        </span>
      </span>
      <span className={cx('flex shrink-0 items-center gap-1 text-micro', rec.className)}>
        <Icon name={rec.icon} size={16} />
        <span className="sr-only sm:not-sr-only">{rec.label}</span>
      </span>
    </button>
  )
}
