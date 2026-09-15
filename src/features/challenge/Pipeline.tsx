import { m } from 'motion/react'
import { pipelineStage, staggered } from '../../animations'
import { cx, Icon } from '../../components/ui'
import type { IconName } from '../../components/ui'

/**
 * Estados de una etapa. Durante la ronda solo existen en cola, en curso y
 * registrada: el veredicto (superada / fallida) aparece al final, como en un CI.
 */
export type StageState = 'queued' | 'running' | 'recorded' | 'passed' | 'failed'

export interface Stage { id: string; label: string; state: StageState }

const STAGE: Record<StageState, { icon: IconName; box: string; text: string; sr: string }> = {
  queued: { icon: 'dot', box: 'border-edge bg-surface', text: 'text-fg-tertiary', sr: 'en cola' },
  running: { icon: 'loader', box: 'border-fg-secondary bg-surface-overlay', text: 'text-fg', sr: 'en curso' },
  recorded: { icon: 'check', box: 'border-edge-strong bg-surface-raised', text: 'text-fg-secondary', sr: 'registrada' },
  passed: { icon: 'check-circle', box: 'border-accent/60 bg-accent-dim', text: 'text-accent', sr: 'superada' },
  failed: { icon: 'x-circle', box: 'border-danger/60 bg-danger-dim', text: 'text-danger', sr: 'fallida' },
}

/**
 * Pipeline de etapas: la boss battle como un despliegue y el examen como una
 * release. Se desplaza en horizontal si no cabe; nunca rompe el ancho.
 */
export function Pipeline({ stages, label, animateResult = false, onSelect, selected }: {
  stages: Stage[]
  label: string
  /** Revela las etapas en secuencia (resultado final). */
  animateResult?: boolean
  onSelect?: (index: number) => void
  selected?: number
}) {
  return (
    <div className="overflow-x-auto pb-1">
      <m.ol
        aria-label={label}
        variants={animateResult ? staggered : undefined}
        initial={animateResult ? 'hidden' : false}
        animate="show"
        className="flex min-w-max items-center"
      >
        {stages.map((s, i) => {
          const meta = STAGE[s.state]
          const body = (
            <>
              <Icon name={meta.icon} size={14} className={cx(meta.text, s.state === 'running' && 'motion-safe:animate-spin')} />
              <span className="font-mono text-micro tnum">{String(i + 1).padStart(2, '0')}</span>
              <span className={cx('max-w-[9rem] truncate text-micro', meta.text)}>{s.label}</span>
              <span className="sr-only">Etapa {i + 1}, {s.label}: {meta.sr}.</span>
            </>
          )
          return (
            <m.li key={s.id} variants={animateResult ? pipelineStage : undefined} className="flex items-center">
              {i > 0 && <span aria-hidden="true" className={cx('h-px w-4', s.state === 'queued' ? 'bg-edge' : 'bg-edge-strong')} />}
              {onSelect ? (
                <button
                  type="button"
                  aria-pressed={selected === i}
                  onClick={() => onSelect(i)}
                  className={cx('flex min-h-[36px] items-center gap-2 rounded-md border px-2 hover:bg-surface-overlay', meta.box, selected === i && 'ring-1 ring-fg')}
                >
                  {body}
                </button>
              ) : (
                <span aria-current={s.state === 'running' ? 'step' : undefined} className={cx('flex min-h-[36px] items-center gap-2 rounded-md border px-2', meta.box)}>
                  {body}
                </span>
              )}
            </m.li>
          )
        })}
      </m.ol>
    </div>
  )
}
