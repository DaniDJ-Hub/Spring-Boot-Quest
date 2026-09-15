import { useState } from 'react'
import { useGameActions, useGameState } from '../../engine/game-context'
import { examSet } from '../../engine/core'
import { useChallengeSet } from '../../hooks/useChallengeSet'
import { useRouter } from '../../app/router-context'
import { ChallengeRunner } from '../challenge/ChallengeRunner'
import { LoadError, LoadingBlock } from '../../components/Loading'
import { Button } from '../../components/ui'
import { SkillReport } from './SkillReport'

export function Exam() {
  const { state } = useGameState()
  const { answer, saveExam } = useGameActions()
  const { navigate } = useRouter()

  const [started, setStarted] = useState(false)
  // La semilla forma parte del estado: al repetir el examen se genera otra y
  // las preguntas salen en orden distinto, que era el fallo A-5.
  const [seed, setSeed] = useState(() => Date.now())
  const [selection, setSelection] = useState(() => examSet(2, seed))
  const [cursor, setCursor] = useState(0)
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)

  const set = useChallengeSet(started ? selection : null)
  const queue = set.challenges
  const score = Object.values(results).filter(Boolean).length

  function retake() {
    const s = Date.now()
    setSeed(s)
    setSelection(examSet(2, s))
    setResults({})
    setCursor(0)
    setFinished(false)
    setStarted(true)
  }

  function finish(final: Record<string, boolean>) {
    const byWorld: Record<string, [number, number]> = {}
    for (const c of queue) {
      const [ok, n] = byWorld[c.worldId] ?? [0, 0]
      byWorld[c.worldId] = [ok + (final[c.id] ? 1 : 0), n + 1]
    }
    saveExam(Object.values(final).filter(Boolean).length, queue.length, byWorld)
    setFinished(true)
  }

  if (finished || (!started && state.exam)) {
    return <SkillReport onBack={() => navigate({ name: 'panel' })} onRetake={retake} />
  }

  if (!started) {
    return (
      <div className="max-w-2xl panel p-6">
        <h1 className="text-h2 mb-2">Spring Boot Expert Exam</h1>
        <p className="text-body text-fg-secondary leading-relaxed mb-4">
          {selection.length} retos, dos por cada mundo, elegidos entre los más difíciles. Sin pistas, sin
          explicaciones hasta el final y sin poder volver atrás. Al terminar recibes un reporte con tus
          fortalezas y lo que conviene repasar.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => setStarted(true)}>Empezar</Button>
          <Button variant="secondary" onClick={() => navigate({ name: 'panel' })}>Ahora no</Button>
        </div>
      </div>
    )
  }

  if (set.status === 'loading') return <LoadingBlock label="Preparando el examen final" />
  if (set.status === 'error') return <LoadError onRetry={set.retry} />
  if (!queue.length) return null

  return (
    <div className="max-w-3xl">
      <div className="panel p-4 mb-5">
        <div className="flex items-center justify-between">
          <h1 className="font-display text-lead">Examen en curso</h1>
          <span className="text-caption text-fg-tertiary tnum">{cursor + 1} de {queue.length}</span>
        </div>
      </div>
      <div className="panel p-5">
        <ChallengeRunner
          challenge={queue[cursor]}
          strict
          index={cursor}
          total={queue.length}
          onResolved={ok => {
            answer(queue[cursor], ok, false)
            setResults(r => ({ ...r, [queue[cursor].id]: ok }))
          }}
          onNext={() => {
            if (cursor + 1 < queue.length) { setCursor(cursor + 1); return }
            finish(results)
          }}
          nextLabel={cursor + 1 === queue.length ? 'Terminar examen' : 'Siguiente'}
        />
      </div>
      <p className="text-caption text-fg-tertiary mt-3 tnum">Aciertos hasta ahora: {score}</p>
    </div>
  )
}
