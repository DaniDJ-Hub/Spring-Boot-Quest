import { useMemo, useState } from 'react'
import { CONCEPT_LABEL } from '../../data/worlds'
import { useGameActions, useGameState } from '../../engine/game-context'
import { masteryOf, reinforcementSet, weakConcepts } from '../../engine/core'
import { useChallengeSet } from '../../hooks/useChallengeSet'
import { useRouter } from '../../app/router-context'
import { ChallengeRunner } from '../challenge/ChallengeRunner'
import { LoadError, LoadingBlock } from '../../components/Loading'
import { Bar, Button, Chip, Empty, MasteryDot } from '../../components/ui'

export function Reinforce() {
  const { state } = useGameState()
  const { answer } = useGameActions()
  const { navigate } = useRouter()

  // La selección se fija al entrar: reordenarla mientras respondes sería confuso.
  const [selection] = useState(() => reinforcementSet(state, 8))
  const [cursor, setCursor] = useState(0)
  const [done, setDone] = useState(false)
  const [score, setScore] = useState(0)
  const weak = useMemo(() => weakConcepts(state, 6), [state])

  const set = useChallengeSet(selection.length ? selection : null)
  const queue = set.challenges
  const volver = () => navigate({ name: 'panel' })

  if (!selection.length) {
    return (
      <Empty
        title="No hay nada que reforzar"
        body="El refuerzo se arma con los conceptos donde aciertas menos del 60 %. Ahora mismo no hay ninguno con suficientes intentos fallidos."
        action={<Button onClick={volver}>Volver</Button>}
      />
    )
  }

  if (done) {
    return (
      <div className="max-w-2xl panel p-6">
        <h1 className="text-h3 mb-1">Refuerzo terminado</h1>
        <p className="text-body text-fg-secondary mb-4">{score} de {queue.length} correctos.</p>
        <Bar pct={(score / Math.max(1, queue.length)) * 100} tone={score / Math.max(1, queue.length) >= 0.7 ? 'accent' : 'warning'} label="Resultado del refuerzo" />
        <div className="mt-5">
          <h2 className="text-caption text-fg-secondary mb-2">Estado actual de esos conceptos</h2>
          <ul className="space-y-2">
            {[...new Set(queue.flatMap(c => c.concepts))].slice(0, 10).map(k => (
              <li key={k} className="flex items-center gap-2">
                <MasteryDot level={masteryOf(state, k)} />
                <span className="text-body">{CONCEPT_LABEL[k] ?? k}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-5"><Button onClick={volver}>Volver al panel</Button></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <button onClick={volver} className="inline-flex items-center min-h-[44px] text-caption text-fg-secondary hover:text-fg mb-2">
        ← Salir del refuerzo
      </button>
      <div className="panel p-4 mb-5 border-info/50">
        <h1 className="font-display text-info">Sesión de refuerzo</h1>
        <p className="text-body text-fg-secondary mt-1">Ocho retos elegidos por tus fallos, no al azar.</p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {weak.slice(0, 5).map(k => <Chip key={k} tone="danger">{CONCEPT_LABEL[k] ?? k}</Chip>)}
        </div>
      </div>
      {set.status === 'loading' && <LoadingBlock label="Preparando tu sesión de refuerzo" />}
      {set.status === 'error' && <LoadError onRetry={set.retry} />}
      {set.status === 'ready' && queue.length > 0 && (
        <div className="panel p-5">
          <ChallengeRunner
            challenge={queue[cursor]}
            index={cursor}
            total={queue.length}
            onResolved={(ok, hint) => { answer(queue[cursor], ok, hint); if (ok) setScore(s => s + 1) }}
            onNext={() => (cursor + 1 < queue.length ? setCursor(cursor + 1) : setDone(true))}
            nextLabel={cursor + 1 === queue.length ? 'Ver resumen' : 'Siguiente'}
          />
        </div>
      )}
    </div>
  )
}
