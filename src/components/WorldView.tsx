import { useMemo, useState } from 'react'
import type { Challenge } from '../types'
import { CONCEPT_LABEL, WORLD_BY_ID } from '../data/worlds'
import { useGame } from '../engine/useGame'
import { bossAvailable, bossSet, masteryOf, nextInWorld, worldProgress } from '../engine/core'
import { ChallengeRunner } from './ChallengeRunner'
import { Bar, Button, Chip, Empty, MasteryDot } from './ui'

type Mode = 'overview' | 'practice' | 'boss'

export function WorldView({ worldId, onBack }: { worldId: string; onBack: () => void }) {
  const { state, answer, clearBoss } = useGame()
  const world = WORLD_BY_ID[worldId]
  const [mode, setMode] = useState<Mode>('overview')
  const [queue, setQueue] = useState<Challenge[]>([])
  const [cursor, setCursor] = useState(0)
  const [bossScore, setBossScore] = useState<[number, number]>([0, 0])
  const [bossDone, setBossDone] = useState(false)

  const progress = worldProgress(state, worldId)
  const canBoss = bossAvailable(state, world)
  const cleared = state.bossCleared.includes(worldId)
  const queueList = useMemo(() => nextInWorld(state, worldId), [state, worldId])

  function startPractice() {
    setQueue(queueList)
    setCursor(0)
    setMode('practice')
  }

  function startBoss() {
    setQueue(bossSet(world))
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
      const rate = n ? ok / n : 0
      if (rate >= world.boss.passRate) clearBoss(worldId, ok === n)
      setBossDone(true)
      return
    }
    setMode('overview')
  }

  /* ------------------------------- Retos ------------------------------- */

  if ((mode === 'practice' || mode === 'boss') && !bossDone && queue.length) {
    return (
      <div className="max-w-3xl">
        <button onClick={() => setMode('overview')} className="text-xs text-chalk-mute hover:text-chalk mb-4">
          ← Salir {mode === 'boss' ? 'de la boss battle' : 'de la práctica'}
        </button>
        {mode === 'boss' && (
          <div className="panel p-4 mb-5 border-amber/40">
            <div className="font-display text-amber">{world.boss.title}</div>
            <p className="text-sm text-chalk-mute mt-1">{world.boss.brief}</p>
            <p className="text-xs text-chalk-faint mt-2">
              Sin pistas y sin explicaciones hasta el final. Necesitas {Math.round(world.boss.passRate * 100)} % para superarla.
            </p>
          </div>
        )}
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
      </div>
    )
  }

  /* ---------------------------- Resultado boss --------------------------- */

  if (mode === 'boss' && bossDone) {
    const [ok, n] = bossScore
    const rate = n ? ok / n : 0
    const passed = rate >= world.boss.passRate
    const failedOnes = queue.filter(c => (state.failed[c.id] ?? 0) > 0 && (state.solved[c.id] ?? 0) === 0)
    return (
      <div className="max-w-3xl">
        <div className={`panel p-6 ${passed ? 'border-leaf/50' : 'border-rust/50'}`}>
          <h2 className={`text-2xl mb-1 ${passed ? 'text-leaf' : 'text-rust'}`}>
            {passed ? 'Boss superada' : 'No alcanzó'}
          </h2>
          <p className="text-sm text-chalk-mute mb-4">
            {ok} de {n} correctos · {Math.round(rate * 100)} % · umbral {Math.round(world.boss.passRate * 100)} %
          </p>
          <Bar pct={rate * 100} tone={passed ? 'leaf' : 'rust'} />
          <p className="text-sm mt-4 leading-relaxed">
            {passed
              ? 'El mundo queda marcado como superado y se desbloquea lo que dependía de él.'
              : 'Practica los retos del mundo y vuelve. La boss battle se puede repetir las veces que quieras.'}
          </p>
          {failedOnes.length > 0 && (
            <div className="mt-4 pt-4 border-t border-line-soft">
              <div className="text-xs text-chalk-mute mb-2">Conceptos que fallaste aquí</div>
              <div className="flex flex-wrap gap-1.5">
                {[...new Set(failedOnes.flatMap(c => c.concepts))].map(k => (
                  <Chip key={k} tone="rust">{CONCEPT_LABEL[k] ?? k}</Chip>
                ))}
              </div>
            </div>
          )}
          <div className="mt-5 flex gap-3">
            <Button onClick={() => setMode('overview')}>Volver al mundo</Button>
            {!passed && <Button variant="ghost" onClick={startPractice}>Practicar antes</Button>}
          </div>
        </div>
      </div>
    )
  }

  /* ------------------------------ Portada ------------------------------ */

  return (
    <div className="max-w-3xl">
      <button onClick={onBack} className="text-xs text-chalk-mute hover:text-chalk mb-4">← Mapa</button>

      <header className="mb-6">
        <div className="flex items-baseline gap-2 mb-1">
          <span className="font-mono text-xs text-chalk-faint tnum">Mundo {String(world.index).padStart(2, '0')}</span>
          {cleared && <Chip tone="leaf">Superado</Chip>}
        </div>
        <h1 className="text-2xl mb-1">{world.title}</h1>
        <p className="text-sm text-chalk-mute">{world.tagline}</p>
        <p className="text-xs text-chalk-faint mt-2">En el curso: {world.courseRange}</p>
      </header>

      <div className="panel p-4 mb-5">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm">Retos resueltos</span>
          <span className="text-sm tnum text-chalk-mute">{progress.done} de {progress.total}</span>
        </div>
        <Bar pct={progress.pct} tone={cleared ? 'leaf' : 'sky'} />
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mb-6">
        <button onClick={startPractice} className="panel p-4 text-left hover:border-leaf/60 transition-colors">
          <div className="font-display text-[15px] mb-1">Practicar</div>
          <p className="text-xs text-chalk-mute">
            Los retos se ordenan solos: primero lo que fallaste, luego tus conceptos flojos, después lo nuevo.
          </p>
        </button>
        <button
          onClick={startBoss}
          disabled={!canBoss && !cleared}
          className={`panel p-4 text-left transition-colors ${canBoss || cleared ? 'hover:border-amber/60 border-amber/30' : 'opacity-45 cursor-not-allowed'}`}
        >
          <div className="font-display text-[15px] mb-1 text-amber">{world.boss.title}</div>
          <p className="text-xs text-chalk-mute">
            {canBoss || cleared
              ? `${world.boss.size} retos encadenados, sin pistas.`
              : `Se abre al resolver el 70 % de los retos del mundo.`}
          </p>
        </button>
      </div>

      <section>
        <h2 className="text-sm text-chalk-mute mb-3">Dominio por concepto</h2>
        <div className="panel divide-y divide-line-soft">
          {world.concepts.map(k => {
            const level = masteryOf(state, k)
            const s = state.concepts[k]
            return (
              <div key={k} className="flex items-center gap-3 px-4 py-2.5">
                <MasteryDot level={level} />
                <span className="text-sm flex-1">{CONCEPT_LABEL[k] ?? k}</span>
                <span className="text-[11px] text-chalk-faint tnum">
                  {s ? `${s.correct}/${s.attempts}` : '—'}
                </span>
                <span className="text-[11px] w-20 text-right text-chalk-mute hidden sm:block">
                  {level === 'none' ? 'Sin datos' : ['expert', 'mastered'].includes(level) ? 'Dominado' : 'En progreso'}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      {progress.total === 0 && (
        <div className="mt-6">
          <Empty title="Sin retos todavía" body="Este mundo aún no tiene contenido cargado." />
        </div>
      )}
    </div>
  )
}
