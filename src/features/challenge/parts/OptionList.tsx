import { useRef } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { m } from 'motion/react'
import type { Option } from '../../../types'
import { TAP } from '../../../animations'
import { cx, Icon } from '../../../components/ui'

export type OptionPhase = 'answering' | 'recorded' | 'revealed'

const LETTERS = 'ABCDEFGH'

/**
 * Grupo de opciones con semántica de radio: flechas, Inicio/Fin y selección
 * al moverse, como un radio nativo. Tres fases:
 *  - answering: se puede elegir.
 *  - recorded: modo estricto; solo se marca «tu elección», sin corrección.
 *  - revealed: práctica o revisión; correcta, incorrecta y descartadas.
 * El estado nunca depende solo del color: hay icono y texto para el lector.
 */
export function OptionList({ options, picked, answerId, phase, onPick, labelledBy, layout = 'list', prefix = 'Opción', renderBody }: {
  options: Option[]
  picked: string | null
  answerId: string
  phase: OptionPhase
  onPick: (id: string) => void
  labelledBy: string
  layout?: 'list' | 'grid'
  /** Rótulo de cada opción: «Opción», «Hipótesis», «Propuesta», «Parche». */
  prefix?: string
  renderBody?: (o: Option, state: { picked: boolean; revealed: boolean; isAnswer: boolean }) => ReactNode
}) {
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const answering = phase === 'answering'
  const revealed = phase === 'revealed'
  const focusable = picked ?? options[0]?.id

  function onKey(e: KeyboardEvent, i: number) {
    if (!answering) return
    const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End']
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const last = options.length - 1
    const next = e.key === 'Home' ? 0
      : e.key === 'End' ? last
        : e.key === 'ArrowDown' || e.key === 'ArrowRight' ? (i + 1 > last ? 0 : i + 1)
          : (i - 1 < 0 ? last : i - 1)
    onPick(options[next].id)
    refs.current[next]?.focus()
  }

  return (
    <div role="radiogroup" aria-labelledby={labelledBy} className={cx('grid gap-2', layout === 'grid' && 'md:grid-cols-2')}>
      {options.map((o, i) => {
        const isPicked = picked === o.id
        const isAnswer = o.id === answerId
        const state = revealed
          ? isAnswer ? 'correct' : isPicked ? 'wrong' : 'dismissed'
          : isPicked ? 'picked' : 'idle'

        const box = {
          idle: 'border-edge-strong bg-surface-raised hover:border-fg-tertiary hover:bg-surface-overlay',
          picked: 'border-accent bg-accent-dim',
          correct: 'border-accent bg-accent-dim',
          wrong: 'border-danger bg-danger-dim',
          dismissed: 'border-edge bg-surface-raised',
        }[state]

        const mark = {
          idle: <span className="h-4 w-4 rounded-full border-2 border-edge-strong" />,
          picked: <span className="grid h-4 w-4 place-items-center rounded-full border-2 border-accent"><span className="h-2 w-2 rounded-full bg-accent" /></span>,
          correct: <Icon name="check-circle" size={18} className="text-accent" />,
          wrong: <Icon name="x-circle" size={18} className="text-danger" />,
          dismissed: <span className="h-4 w-4 rounded-full border-2 border-edge" />,
        }[state]

        return (
          <m.button
            key={o.id}
            ref={el => { refs.current[i] = el }}
            type="button"
            role="radio"
            aria-checked={isPicked}
            aria-disabled={!answering}
            tabIndex={o.id === focusable ? 0 : -1}
            whileTap={answering ? TAP : undefined}
            onKeyDown={e => onKey(e, i)}
            onClick={() => { if (answering) onPick(o.id) }}
            className={cx(
              'group flex w-full min-w-0 gap-3 rounded-md border p-3 text-left transition-[border-color,background-color] duration-fast ease-out',
              box,
              !answering && 'cursor-default',
            )}
          >
            <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center">{mark}</span>
            <span className="min-w-0 flex-1">
              <span className="mb-1 flex items-center gap-2 font-mono text-micro uppercase tracking-wide text-fg-tertiary">
                {prefix} {LETTERS[i]}
                {phase === 'recorded' && isPicked && (
                  <span className="rounded-sm border border-edge-strong px-1 normal-case tracking-normal text-fg-secondary">tu elección</span>
                )}
              </span>
              {renderBody
                ? renderBody(o, { picked: isPicked, revealed, isAnswer })
                : <span className="block text-body leading-relaxed text-fg">{o.text}</span>}
            </span>
            {revealed && (
              <span className="sr-only">
                {isAnswer ? (isPicked ? 'Respuesta correcta, tu elección.' : 'Respuesta correcta.') : isPicked ? 'Tu respuesta, incorrecta.' : 'Opción descartada.'}
              </span>
            )}
            {phase === 'recorded' && isPicked && <span className="sr-only">Tu elección, registrada.</span>}
          </m.button>
        )
      })}
    </div>
  )
}
