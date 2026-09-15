import { useState } from 'react'
import { CONCEPT_LABEL, WORLD_BY_ID } from '../../data/worlds'
import { useGameActions, useGameState } from '../../engine/game-context'
import { bossAvailable, bossSet, masteryOf, nextInWorld, worldProgress } from '../../engine/core'
import { useChallengeSet } from '../../hooks/useChallengeSet'
import { useRouter } from '../../app/router-context'
import { ChallengeRunner } from '../challenge/ChallengeRunner'
import { LoadError, LoadingBlock } from '../../components/Loading'
import { Bar, Button, Chip, Empty, MasteryDot } from '../../components/ui'

type Mode = 'overview' | 'practice' | 'boss'

export function WorldView({ worldId }: { worldId: string }) {
  const { state } = useGameState()
  const { answer, clearBoss } = useGameActions()
  const { navigate } = useRouter()
  const world = WORLD_BY_ID[worldId]

  const [mode, setMode] = useState<Mode>('overview')
  // La selección se congela al iniciar la sesión: si se recalculara en cada
  // respuesta, los retos cambiarían de orden bajo los pies del jugador.
  const [selection, setSelection] = useState<ReturnType<typeof nextInWorld> | null>(null)
  const [cursor, setCursor] = useState(0)
  const [bossScore, setBossScore] = useState<[number, number]>([0, 0])
  const [bossDone, setBossDone] = useState(false)

  const set = useChallengeSet(mode === 'overview' ? null : selection)
  const queue = set.challenges

  if (!world) {
    return <Empty title="Ese mundo no existe" body="La dirección apunta a un mundo que no está en el mapa." action={<Button onClick={() => navigate({ name: 'mapa' })}>Ir al mapa</Button>} />
  }

  const progress = worldProgress(state, worldId)
  const canBoss = bossAvailable(state, world)
  const cleared = state.bossCleared.includes(worldId)

  function startPractice() {
    setSelection(nextInWorld(state, worldId))
    setCursor(0)
    setMode('practice')
  }

  function startBoss() {
    setSelection(bossSet(world))
    setCursor(0)
    setBossScore([0, 0])
    setBossDone(false)
    setMode('boss')
  }

  function handleResolved(correct: boolean, usedHint: boolean) {
    answer(queue[cursor], correct, usedHint)
    if (mode === 'boss') setBossScore(([ok, n]) => [ok + (correct ? 1 : 0), n + 1])
  }

  function handleNext() {
    if (cursor + 1 < queue.length) { setCursor(cursor + 1); return }
    if (mode === 'boss') {
      const [ok, n] = bossScore
      if (n && ok / n >= world.boss.passRate) clearBoss(worldId, ok === n)
      setBossDone(true)
      return
    }
    setMode('overview')
  }

  /* ------------------------------- Retos ------------------------------- */

  if (mode !== 'overview' && !bossDone) {
    return (
      <div className="max-w-3xl">
        <button onClick={() => setMode('overview')} className="inline-flex items-center min-h-[44px] text-caption text-fg-secondary hover:text-fg mb-2">
          ← Salir {mode === 'boss' ? 'de la boss battle' : 'de la práctica'}
        </button>
        {mode === 'boss' && (
          <div className="panel p-4 mb-5 border-warning/50">
            <h2 className="font-display text-warning">{world.boss.title}</h2>
            <p className="text-body text-fg-secondary mt-1">{world.boss.brief}</p>
            <p className="text-caption text-fg-tertiary mt-2">
              Sin pistas y sin explicaciones hasta el final. Necesitas {Math.round(world.boss.passRate * 100)} % para superarla.
            </p>
          </div>
        )}
        {set.status === 'loading' && <LoadingBlock label={`Cargando los retos de ${world.title}`} />}
        {set.status === 'error' && <LoadError onRetry={set.retry} />}
        {set.status === 'ready' && queue.length > 0 && (
          <div className="panel p-5">
            <ChallengeRunner
              challenge={queue[cursor]}
              strict={mode === 'boss'}
              index={cursor}
              total={queue.length}
              onResolved={handleResolved}
              onNext={handleNext}
              nextLabel={cursor + 1 === queue.length ? (mode === 'boss' ? 'Ver resultado' : 'Terminar') : 'Siguiente'}
            />
          </div>
        )}
      </div>
    )
  }

  /* ---------------------------- Resultado boss --------------------------- */

  if (mode === 'boss' && bossDone) {
    const [ok, n] = bossScore
    const rate = n ? ok / n : 0
    const passed = rate >= world.boss.passRate
    const fallados = queue.filter(c => (state.failed[c.id] ?? 0) > 0 && (state.solved[c.id] ?? 0) === 0)
    return (
      <div className="max-w-3xl">
        <div className={`panel p-6 ${passed ? 'border-accent/50' : 'border-danger/50'}`}>
          <h2 className={`text-h2 mb-1 ${passed ? 'text-accent' : 'text-danger'}`}>
            {passed ? 'Boss superada' : 'No alcanzó'}
          </h2>
          <p className="text-body text-fg-secondary mb-4">
            {ok} de {n} correctos · {Math.round(rate * 100)} % · umbral {Math.round(world.boss.passRate * 100)} %
          </p>
          <Bar pct={rate * 100} tone={passed ? 'accent' : 'danger'} label="Resultado de la boss battle" />
          <p className="text-body mt-4 leading-relaxed">
            {passed
              ? 'El mundo queda marcado como superado y se desbloquea lo que dependía de él.'
              : 'Practica los retos del mundo y vuelve. La boss battle se puede repetir las veces que quieras.'}
          </p>
          {fallados.length > 0 && (
            <div className="mt-4 pt-4 border-t border-edge">
              <h3 className="text-caption text-fg-secondary mb-2 font-sans font-normal">Conceptos que fallaste aquí</h3>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(fallados.flatMap(c => c.concepts))].map(k => (
                  <Chip key={k} tone="danger">{CONCEPT_LABEL[k] ?? k}</Chip>
                ))}
              </div>
            </div>
          )}
          <div className="mt-5 flex gap-3">
            <Button onClick={() => { setMode('overview'); setBossDone(false) }}>Volver al mundo</Button>
            {!passed && <Button variant="ghost" onClick={startPractice}>Practicar antes</Button>}
          </div>
        </div>
      </div>
    )
  }

  /* ------------------------------ Portada ------------------------------ */

  return (
    <div className="max-w-3xl">
      <button onClick={() => navigate({ name: 'mapa' })} className="inline-flex items-center min-h-[44px] text-caption text-fg-secondary hover:text-fg mb-2">
        ← Mapa
      </button>

      <header className="mb-6">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-mono text-caption text-fg-tertiary tnum">Mundo {String(world.index).padStart(2, '0')}</span>
          {cleared && <Chip tone="accent">Superado</Chip>}
        </div>
        <h1 className="text-h2 mb-1">{world.title}</h1>
        <p className="text-body text-fg-secondary">{world.tagline}</p>
        <p className="text-caption text-fg-tertiary mt-2">En el curso: {world.courseRange}</p>
      </header>

      <div className="panel p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-body">Retos resueltos</span>
          <span className="text-body tnum text-fg-secondary">{progress.done} de {progress.total}</span>
        </div>
        <Bar pct={progress.pct} tone={cleared ? 'accent' : 'info'} label={`Retos resueltos en ${world.title}`} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        <button onClick={startPractice} className="panel p-4 text-left hover:border-accent/60 transition-colors">
          <span className="block font-display text-body mb-1">Practicar</span>
          <span className="block text-caption text-fg-secondary">
            Los retos se ordenan solos: primero lo que fallaste, luego tus conceptos flojos, después lo nuevo.
          </span>
        </button>
        <button
          onClick={startBoss}
          disabled={!canBoss && !cleared}
          className={`panel p-4 text-left transition-colors ${canBoss || cleared ? 'hover:border-warning/60 border-warning/40' : 'opacity-60 cursor-not-allowed'}`}
        >
          <span className="block font-display text-body mb-1 text-warning">{world.boss.title}</span>
          <span className="block text-caption text-fg-secondary">
            {canBoss || cleared
              ? `${world.boss.size} retos encadenados, sin pistas.`
              : 'Se abre al resolver el 70 % de los retos del mundo.'}
          </span>
        </button>
      </div>

      <section>
        <h2 className="text-body text-fg-secondary mb-3">Dominio por concepto</h2>
        <ul className="panel divide-y divide-edge">
          {world.concepts.map(k => {
            const level = masteryOf(state, k)
            const s = state.concepts[k]
            return (
              <li key={k} className="flex items-center gap-3 px-4 py-2.5">
                <MasteryDot level={level} />
                <span className="text-body flex-1">{CONCEPT_LABEL[k] ?? k}</span>
                <span className="text-micro text-fg-tertiary tnum">{s ? `${s.correct}/${s.attempts}` : '—'}</span>
              </li>
            )
          })}
        </ul>
      </section>
    </div>
  )
}
