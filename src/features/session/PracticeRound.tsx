import { useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Challenge, ChallengeMeta, GameState } from '../../types'
import { CONCEPT_LABEL } from '../../data/worlds'
import { useGameActions, useGameState } from '../../engine/game-context'
import { masteryDelta } from '../../engine/selectors'
import type { SelectionReason } from '../../engine/selectors'
import { useChallengeSet } from '../../hooks/useChallengeSet'
import { ChallengeRunner } from '../challenge/ChallengeRunner'
import { LoadError, LoadingBlock } from '../../components/Loading'
import { cx, Icon, MasteryMeter } from '../../components/ui'
import { RoundProgress, RoundShell, RoundSummary } from './round'
import { useRoundSnapshot } from './round-state'

/**
 * Ronda de práctica: la comparten el mundo y la sesión de refuerzo. Lleva el
 * cursor, el resultado de cada reto y el resumen final; el motivo de cada reto
 * lo decide el motor y aquí solo se muestra.
 */
export function PracticeRound({ title, subtitle, tone = 'neutral', selection, reasons, onExit, summaryTitle, summaryActions, loadingLabel }: {
  title: string
  subtitle?: ReactNode
  tone?: 'neutral' | 'info'
  selection: ChallengeMeta[]
  reasons?: Record<string, SelectionReason>
  onExit: () => void
  summaryTitle: string
  summaryActions: (ctx: { answered: Challenge[]; results: boolean[] }) => ReactNode
  loadingLabel?: string
}) {
  const { state } = useGameState()
  const { answer } = useGameActions()
  const before = useRoundSnapshot()
  const [cursor, setCursor] = useState(0)
  const [results, setResults] = useState<boolean[]>([])
  const [answered, setAnswered] = useState<Challenge[]>([])
  const [finished, setFinished] = useState(false)
  // Estado justo antes de la última respuesta: sirve para contar qué se movió.
  const beforeAnswer = useRef<GameState>(state)

  const set = useChallengeSet(selection)
  const queue = set.challenges
  const current = queue[cursor]

  if (finished) {
    return (
      <RoundSummary
        title={summaryTitle}
        before={before}
        answered={answered}
        results={results}
        actions={summaryActions({ answered, results })}
      />
    )
  }

  return (
    <RoundShell
      title={title}
      subtitle={subtitle}
      tone={tone}
      onExit={onExit}
      exitLabel="Salir"
      progress={queue.length > 0 ? <RoundProgress total={queue.length} cursor={cursor} results={results} /> : undefined}
    >
      {set.status === 'loading' && <LoadingBlock label={loadingLabel ?? 'Preparando la ronda'} />}
      {set.status === 'error' && <LoadError onRetry={set.retry} error={set.error} />}
      {set.status === 'ready' && current && (
        <ChallengeRunner
          challenge={current}
          index={cursor}
          total={queue.length}
          reason={reasons?.[current.id]}
          onResolved={(ok, usedHint) => {
            beforeAnswer.current = state
            answer(current, ok, usedHint)
            setResults(r => [...r, ok])
            setAnswered(a => [...a, current])
          }}
          onNext={() => (cursor + 1 < queue.length ? setCursor(cursor + 1) : setFinished(true))}
          nextLabel={cursor + 1 === queue.length ? 'Ver resumen' : 'Siguiente'}
          feedbackExtra={<MasteryFeedback before={beforeAnswer.current} concepts={current.concepts} />}
        />
      )}
    </RoundShell>
  )
}

/** Cómo quedó el dominio de los conceptos del reto tras responderlo. */
function MasteryFeedback({ before, concepts }: { before: GameState; concepts: string[] }) {
  const { state } = useGameState()
  const changes = masteryDelta(before, state, concepts)
  if (changes.length === 0) return null

  return (
    <div className="border-t border-edge pt-3">
      <p className="mb-2 font-mono text-micro uppercase tracking-wide text-fg-tertiary">Dominio</p>
      <ul className="space-y-2">
        {changes.map(c => (
          <li key={c.concept} className="flex flex-wrap items-center gap-2">
            <span className="min-w-0 flex-1 truncate text-caption text-fg-secondary">{CONCEPT_LABEL[c.concept] ?? c.concept}</span>
            <MasteryMeter level={c.to} previous={c.direction === 'down' ? c.from : undefined} size="sm" showLabel />
            {c.direction === 'up' && (
              <span className={cx('flex items-center gap-1 text-micro text-accent')}>
                <Icon name="arrow-up" size={12} />
                subió
              </span>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
