import { forwardRef } from 'react'
import type { ReactNode } from 'react'
import { m } from 'motion/react'
import type { Challenge } from '../../../types'
import { verdict } from '../../../animations'
import { CONCEPT_LABEL } from '../../../data/worlds'
import { Badge, cx, Icon } from '../../../components/ui'

export type ConsolePhase = 'waiting' | 'recorded' | 'revealed'

/**
 * Consola del reto: donde aterriza el resultado. BUILD SUCCESS / BUILD FAILED
 * en voz de terminal, y la explicación en tipografía de lectura, porque es lo
 * que hay que entender. En modo estricto solo confirma que se registró.
 */
export const Console = forwardRef<HTMLDivElement, {
  challenge: Challenge
  phase: ConsolePhase
  correct: boolean
  /** XP concedido; se omite en revisión. */
  xp?: number
  usedHint?: boolean
  /** Texto de la respuesta correcta cuando se falló (opciones). */
  answerText?: ReactNode
  /** Consecuencias en retos de decisión. */
  consequence?: { picked?: string; correct?: string }
  extra?: ReactNode
  shortcut?: ReactNode
}>(function Console({ challenge: c, phase, correct, xp, usedHint, answerText, consequence, extra, shortcut }, ref) {
  return (
    <div ref={ref} tabIndex={-1} role="status" aria-live="polite" className="panel overflow-hidden outline-none focus-visible:outline-2">
      <div className="flex items-center gap-2 border-b border-edge-soft bg-surface-sunken px-4 py-2 font-mono text-micro text-fg-tertiary">
        <Icon name="terminal" size={14} />
        consola
      </div>

      {phase === 'waiting' && (
        <div className="px-4 py-6 font-mono text-caption text-fg-tertiary">
          <p>&gt; esperando comprobación<span className="motion-safe:animate-breathe">_</span></p>
          {shortcut && <p className="mt-3 hidden font-sans lg:block">{shortcut}</p>}
        </div>
      )}

      {phase === 'recorded' && (
        <div className="flex gap-3 px-4 py-5">
          <Icon name="check" size={18} className="mt-0.5 text-fg-secondary" />
          <p className="text-body text-fg-secondary">
            Respuesta registrada. El detalle se muestra al terminar.
          </p>
        </div>
      )}

      {phase === 'revealed' && (
        <div className="space-y-4 p-4">
          <m.div
            variants={verdict}
            initial="hidden"
            animate="show"
            className={cx(
              'flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-3 py-2',
              correct ? 'border-accent/50 bg-accent-dim' : 'border-danger/50 bg-danger-dim',
            )}
          >
            <Icon name={correct ? 'check-circle' : 'x-circle'} size={18} className={correct ? 'text-accent' : 'text-danger'} />
            <span className={cx('font-mono text-caption font-bold tracking-wide', correct ? 'text-accent' : 'text-danger')}>
              {correct ? 'BUILD SUCCESS' : 'BUILD FAILED'}
            </span>
            <span className="text-body font-semibold text-fg">{correct ? 'Correcto' : 'Incorrecto'}</span>
            {xp !== undefined && (
              <span className="ml-auto font-mono text-caption text-fg-secondary tnum">
                +{xp} XP{correct && usedHint ? ' · con pista' : ''}
              </span>
            )}
          </m.div>

          {!correct && answerText && (
            <p className="text-body text-fg">
              <span className="text-fg-secondary">La respuesta era: </span>{answerText}
            </p>
          )}

          {consequence?.picked && (
            <div className="rounded-md border border-edge bg-surface-sunken p-3">
              <p className="mb-1 font-mono text-micro uppercase tracking-wide text-fg-tertiary">Consecuencia de tu decisión</p>
              <p className="text-body leading-relaxed text-fg">{consequence.picked}</p>
            </div>
          )}
          {!correct && consequence?.correct && (
            <div className="rounded-md border border-accent/40 bg-surface-sunken p-3">
              <p className="mb-1 font-mono text-micro uppercase tracking-wide text-accent">Con la decisión recomendada</p>
              <p className="text-body leading-relaxed text-fg">{consequence.correct}</p>
            </div>
          )}

          <div>
            <p className="mb-1 font-mono text-micro uppercase tracking-wide text-fg-tertiary">Explicación</p>
            <p className="text-body leading-relaxed text-fg">{c.explain}</p>
          </div>
          {!correct && c.deeper && (
            <p className="border-t border-edge pt-3 text-body leading-relaxed text-fg-secondary">{c.deeper}</p>
          )}

          <div className="flex flex-wrap gap-2">
            {c.concepts.map(k => <Badge key={k} variant="label">{CONCEPT_LABEL[k] ?? k}</Badge>)}
          </div>
          {extra}
        </div>
      )}
    </div>
  )
})
