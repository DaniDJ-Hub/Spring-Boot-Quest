import { useMemo, useState } from 'react'
import type { Challenge } from '../../types'
import { WORLDS } from '../../data/worlds'
import { useGameActions, useGameState } from '../../engine/game-context'
import { examSet, EXAM_PER_WORLD } from '../../engine/core'
import { examAvailability, nextBossToOpen } from '../../engine/selectors'
import { useChallengeSet } from '../../hooks/useChallengeSet'
import { useRouter } from '../../app/router-context'
import { Link } from '../../app/router'
import { ChallengeRunner } from '../challenge/ChallengeRunner'
import type { Answer } from '../challenge/evaluate'
import { LoadError, LoadingBlock } from '../../components/Loading'
import { Badge, Bar, Button, cx, Icon, worldCode } from '../../components/ui'
import { RoundShell } from './round'
import { SkillReport } from './SkillReport'

type Phase = 'intro' | 'running' | 'report'

/**
 * Examen final: dos retos por mundo entre los más difíciles, sin pistas ni
 * explicaciones hasta el final. Se abre solo con los quince mundos superados,
 * también si se entra por dirección.
 */
export function Exam() {
  const { state } = useGameState()
  const { answer, saveExam } = useGameActions()
  const { navigate } = useRouter()
  const availability = examAvailability(state)

  const [phase, setPhase] = useState<Phase>(availability.taken ? 'report' : 'intro')
  const [seed, setSeed] = useState(() => Date.now())
  const [cursor, setCursor] = useState(0)
  const [given, setGiven] = useState<{ challenge: Challenge; answer: Answer; correct: boolean }[]>([])

  const selection = useMemo(() => examSet(EXAM_PER_WORLD, seed), [seed])
  const set = useChallengeSet(phase === 'running' ? selection : null)
  const queue = set.challenges

  function start() {
    // Semilla nueva en cada intento: las preguntas salen en otro orden.
    setSeed(Date.now())
    setGiven([])
    setCursor(0)
    setPhase('running')
  }

  function finish(all: typeof given) {
    const byWorld: Record<string, [number, number]> = {}
    for (const g of all) {
      const [ok, n] = byWorld[g.challenge.worldId] ?? [0, 0]
      byWorld[g.challenge.worldId] = [ok + (g.correct ? 1 : 0), n + 1]
    }
    saveExam(all.filter(g => g.correct).length, all.length, byWorld)
    setPhase('report')
  }

  /* ------------------------------ Sin acceso ------------------------------ */

  if (!availability.available && !availability.taken) {
    const next = nextBossToOpen(state)
    return (
      <div className="mx-auto max-w-2xl">
        <section className="panel p-6">
          <div className="mb-3 flex items-center gap-2">
            <Icon name="lock" size={16} className="text-locked" />
            <Badge tone="locked">Bloqueado</Badge>
          </div>
          <h1 className="text-h2">Spring Boot Expert Exam</h1>
          <p className="mt-2 text-body text-fg-secondary">
            El examen se abre al superar las quince boss battles. Llevas {availability.cleared}.
          </p>
          <div className="mt-4">
            <Bar pct={(availability.cleared / availability.total) * 100} label="Boss battles superadas" height="h-2" />
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            {next && (
              <Link to={{ name: 'mundo', worldId: next.world.id }} className="text-body text-fg-secondary hover:text-accent">
                Sigue por {worldCode(next.world)} {next.world.title}
              </Link>
            )}
            <Button variant="secondary" onClick={() => navigate({ name: 'mapa' })}>Ver el mapa</Button>
          </div>
        </section>
      </div>
    )
  }

  /* -------------------------------- Reporte ------------------------------- */

  if (phase === 'report') {
    return (
      <SkillReport
        onBack={() => navigate({ name: 'panel' })}
        onRetake={start}
        review={given.length > 0 ? given : undefined}
      />
    )
  }

  /* --------------------------------- Intro -------------------------------- */

  if (phase === 'intro') {
    return (
      <div className="mx-auto max-w-2xl">
        <section className="panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-edge-soft bg-surface-sunken px-4 py-2 font-mono text-micro text-info">
            <Icon name="file-check" size={14} />
            RELEASE CANDIDATE
          </div>
          <div className="p-6">
            <h1 className="text-h2">Spring Boot Expert Exam</h1>
            <p className="mt-2 text-body leading-relaxed text-fg-secondary">
              {selection.length} retos, {EXAM_PER_WORLD} por cada mundo, elegidos entre los más difíciles.
              Sin pistas, sin explicaciones hasta el final y sin volver atrás. Al terminar recibes un
              Skill Report con tus fortalezas y lo que conviene repasar.
            </p>
            <ul className="mt-5 space-y-2 text-caption text-fg-secondary">
              <li className="flex gap-2"><Icon name="eye-off" size={16} className="shrink-0 text-info" />El detalle de cada respuesta se muestra al terminar.</li>
              <li className="flex gap-2"><Icon name="git-commit" size={16} className="shrink-0 text-info" />Las respuestas cuentan para el dominio de los conceptos.</li>
              <li className="flex gap-2"><Icon name="refresh" size={16} className="shrink-0 text-info" />Se puede repetir; cada intento baraja de nuevo.</li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button icon="play" onClick={start}>Empezar examen</Button>
              <Button variant="secondary" onClick={() => navigate({ name: 'panel' })}>Ahora no</Button>
            </div>
          </div>
        </section>
      </div>
    )
  }

  /* --------------------------------- Ronda -------------------------------- */

  const answeredByWorld = new Map<string, number>()
  for (const g of given) answeredByWorld.set(g.challenge.worldId, (answeredByWorld.get(g.challenge.worldId) ?? 0) + 1)

  return (
    <RoundShell
      title="Examen en curso"
      subtitle={`${cursor + 1} de ${queue.length || selection.length}, sin pistas`}
      onExit={() => setPhase('intro')}
      exitLabel="Salir del examen"
      confirmExit={{
        title: '¿Salir del examen?',
        body: 'El examen no se guardará y no habrá Skill Report de este intento. Las respuestas que ya diste siguen contando para tu dominio.',
        confirmLabel: 'Salir del examen',
      }}
      progress={
        <div>
          <ol aria-label="Avance por mundo" className="flex flex-wrap gap-1">
            {WORLDS.map(w => {
              const n = answeredByWorld.get(w.id) ?? 0
              return (
                <li
                  key={w.id}
                  title={`${w.title}: ${n} de ${EXAM_PER_WORLD}`}
                  className={cx(
                    'flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-mono text-micro',
                    n === EXAM_PER_WORLD ? 'border-edge-strong text-fg-secondary' : 'border-edge text-fg-tertiary',
                  )}
                >
                  {worldCode(w)}
                  <span className="sr-only">: {n} de {EXAM_PER_WORLD} respondidos</span>
                  <span aria-hidden="true" className="flex gap-0.5">
                    {Array.from({ length: EXAM_PER_WORLD }, (_, i) => (
                      <span key={i} className={cx('h-1.5 w-1.5 rounded-full', i < n ? 'bg-fg-secondary' : 'bg-edge')} />
                    ))}
                  </span>
                </li>
              )
            })}
          </ol>
        </div>
      }
    >
      {set.status === 'loading' && <LoadingBlock label="Preparando el examen final" />}
      {set.status === 'error' && <LoadError onRetry={set.retry} error={set.error} />}
      {set.status === 'ready' && queue[cursor] && (
        <ChallengeRunner
          challenge={queue[cursor]}
          strict
          index={cursor}
          total={queue.length}
          onResolved={ok => answer(queue[cursor], ok, false)}
          onAnswer={(a, ok) => setGiven(g => [...g, { challenge: queue[cursor], answer: a, correct: ok }])}
          onNext={() => (cursor + 1 < queue.length ? setCursor(cursor + 1) : finish(given))}
          nextLabel={cursor + 1 === queue.length ? 'Terminar examen' : 'Siguiente'}
        />
      )}
    </RoundShell>
  )
}
