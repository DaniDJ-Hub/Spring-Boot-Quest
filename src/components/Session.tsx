import { useMemo, useState } from 'react'
import type { Challenge } from '../types'
import { CONCEPT_LABEL, WORLDS, WORLD_BY_ID } from '../data/worlds'
import { useGame } from '../engine/useGame'
import { examSet, masteryOf, reinforcementSet, weakConcepts } from '../engine/core'
import { ChallengeRunner } from './ChallengeRunner'
import { Bar, Button, Chip, Empty, MasteryDot } from './ui'

/* --------------------------- Sesión de refuerzo --------------------------- */

export function Reinforce({ onBack }: { onBack: () => void }) {
  const { state, answer } = useGame()
  const [queue] = useState<Challenge[]>(() => reinforcementSet(state, 8))
  const [cursor, setCursor] = useState(0)
  const [done, setDone] = useState(false)
  const [score, setScore] = useState(0)
  const weak = useMemo(() => weakConcepts(state, 6), [state])

  if (!queue.length) {
    return (
      <Empty
        title="No hay nada que reforzar"
        body="El refuerzo se arma con los conceptos donde aciertas menos del 60 %. Ahora mismo no hay ninguno con suficientes intentos fallidos."
        action={<Button onClick={onBack}>Volver</Button>}
      />
    )
  }

  if (done) {
    return (
      <div className="max-w-2xl panel p-6">
        <h2 className="text-xl mb-1">Refuerzo terminado</h2>
        <p className="text-sm text-chalk-mute mb-4">{score} de {queue.length} correctos.</p>
        <Bar pct={(score / queue.length) * 100} tone={score / queue.length >= 0.7 ? 'leaf' : 'amber'} />
        <div className="mt-5">
          <div className="text-xs text-chalk-mute mb-2">Estado actual de esos conceptos</div>
          <ul className="space-y-2">
            {[...new Set(queue.flatMap(c => c.concepts))].slice(0, 10).map(k => (
              <li key={k} className="flex items-center gap-2">
                <MasteryDot level={masteryOf(state, k)} />
                <span className="text-sm">{CONCEPT_LABEL[k] ?? k}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="mt-5"><Button onClick={onBack}>Volver al panel</Button></div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <button onClick={onBack} className="text-xs text-chalk-mute hover:text-chalk mb-4">← Salir del refuerzo</button>
      <div className="panel p-4 mb-5 border-sky/40">
        <div className="font-display text-sky">Sesión de refuerzo</div>
        <p className="text-sm text-chalk-mute mt-1">
          Ocho retos elegidos por tus fallos, no al azar.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {weak.slice(0, 5).map(k => <Chip key={k} tone="rust">{CONCEPT_LABEL[k] ?? k}</Chip>)}
        </div>
      </div>
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
    </div>
  )
}

/* -------------------------------- Examen -------------------------------- */

export function Exam({ onBack }: { onBack: () => void }) {
  const { state, answer, saveExam } = useGame()
  const [started, setStarted] = useState(false)
  const [queue] = useState<Challenge[]>(() => examSet(2))
  const [cursor, setCursor] = useState(0)
  const [results, setResults] = useState<Record<string, boolean>>({})
  const [finished, setFinished] = useState(false)

  const score = Object.values(results).filter(Boolean).length

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
    return <SkillReport onBack={onBack} onRetake={() => { setStarted(true); setFinished(false); setResults({}); setCursor(0) }} />
  }

  if (!started) {
    return (
      <div className="max-w-2xl panel p-6">
        <h1 className="text-2xl mb-2">Spring Boot Expert Exam</h1>
        <p className="text-sm text-chalk-mute leading-relaxed mb-4">
          {queue.length} retos, dos por cada mundo, elegidos entre los más difíciles. Sin pistas, sin explicaciones
          hasta el final y sin poder volver atrás. Al terminar recibes un reporte con tus fortalezas y lo que
          conviene repasar.
        </p>
        <div className="flex gap-3">
          <Button onClick={() => setStarted(true)}>Empezar</Button>
          <Button variant="ghost" onClick={onBack}>Ahora no</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <div className="panel p-4 mb-5 border-line">
        <div className="flex items-center justify-between">
          <span className="font-display">Examen en curso</span>
          <span className="text-xs text-chalk-faint tnum">{cursor + 1} de {queue.length}</span>
        </div>
      </div>
      <div className="panel p-5">
        <ChallengeRunner
          challenge={queue[cursor]}
          strict
          index={cursor}
          total={queue.length}
          onResolved={(ok, hint) => {
            answer(queue[cursor], ok, hint)
            setResults(r => ({ ...r, [queue[cursor].id]: ok }))
          }}
          onNext={() => {
            if (cursor + 1 < queue.length) { setCursor(cursor + 1); return }
            finish(results)
          }}
          nextLabel={cursor + 1 === queue.length ? 'Terminar examen' : 'Siguiente'}
        />
      </div>
      <p className="text-xs text-chalk-faint mt-3 tnum">Aciertos hasta ahora: {score}</p>
    </div>
  )
}

/* ------------------------------ Skill report ----------------------------- */

export function SkillReport({ onBack, onRetake }: { onBack: () => void; onRetake: () => void }) {
  const { state } = useGame()
  const exam = state.exam
  if (!exam) return <Empty title="Sin examen registrado" body="Presenta el examen final para generar el reporte." action={<Button onClick={onBack}>Volver</Button>} />

  const pct = (exam.score / Math.max(1, exam.total)) * 100
  const level = pct >= 90 ? 'Spring Boot Expert' : pct >= 75 ? 'Backend Engineer' : pct >= 55 ? 'Spring Developer' : 'En formación'
  const entries = Object.entries(exam.byWorld).sort((a, b) => (a[1][0] / a[1][1]) - (b[1][0] / b[1][1]))
  const flojos = entries.filter(([, [ok, n]]) => ok / n < 0.6)
  const fuertes = entries.filter(([, [ok, n]]) => ok / n >= 0.8)
  const allConcepts = WORLDS.flatMap(w => w.concepts)
  const dominados = allConcepts.filter(k => ['mastered', 'expert'].includes(masteryOf(state, k)))
  const pendientes = allConcepts.filter(k => masteryOf(state, k) === 'none')

  return (
    <div className="max-w-3xl space-y-6">
      <div className="panel p-6">
        <div className="text-[11px] text-chalk-faint mb-1">Spring Boot Skill Report</div>
        <h1 className="font-display text-3xl mb-1">{level}</h1>
        <p className="text-sm text-chalk-mute mb-4">
          {exam.score} de {exam.total} · {Math.round(pct)} % · {new Date(exam.at).toLocaleDateString('es-MX')}
        </p>
        <Bar pct={pct} tone={pct >= 75 ? 'leaf' : pct >= 55 ? 'amber' : 'rust'} height="h-2" />
      </div>

      <section className="panel p-5">
        <h2 className="text-sm text-chalk-mute mb-3">Resultado por mundo</h2>
        <div className="space-y-2">
          {WORLDS.map(w => {
            const r = exam.byWorld[w.id]
            if (!r) return null
            const [ok, n] = r
            return (
              <div key={w.id} className="flex items-center gap-3">
                <span className="text-xs w-32 sm:w-44 shrink-0 truncate">{w.title}</span>
                <Bar pct={(ok / n) * 100} tone={ok / n >= 0.8 ? 'leaf' : ok / n >= 0.5 ? 'amber' : 'rust'} height="h-1.5" />
                <span className="text-[11px] text-chalk-faint tnum w-10 text-right shrink-0">{ok}/{n}</span>
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-sm text-leaf mb-2">Fortalezas</h2>
          {fuertes.length === 0
            ? <p className="text-sm text-chalk-mute">Ningún mundo por encima del 80 % todavía.</p>
            : <ul className="text-sm space-y-1">{fuertes.map(([id]) => <li key={id}>{WORLD_BY_ID[id]?.title}</li>)}</ul>}
        </section>
        <section className="panel p-5">
          <h2 className="text-sm text-rust mb-2">A repasar</h2>
          {flojos.length === 0
            ? <p className="text-sm text-chalk-mute">Nada por debajo del 60 %.</p>
            : <ul className="text-sm space-y-1">{flojos.map(([id]) => (
                <li key={id}>{WORLD_BY_ID[id]?.title} <span className="text-chalk-faint">· {WORLD_BY_ID[id]?.courseRange}</span></li>
              ))}</ul>}
        </section>
      </div>

      <section className="panel p-5">
        <h2 className="text-sm text-chalk-mute mb-3">Conceptos</h2>
        <p className="text-sm mb-3">
          <span className="text-leaf tnum">{dominados.length}</span> dominados ·{' '}
          <span className="text-rust tnum">{pendientes.length}</span> sin practicar todavía
        </p>
        {pendientes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {pendientes.slice(0, 16).map(k => <Chip key={k} tone="rust">{CONCEPT_LABEL[k] ?? k}</Chip>)}
            {pendientes.length > 16 && <Chip>+{pendientes.length - 16} más</Chip>}
          </div>
        )}
      </section>

      <section className="panel p-5">
        <h2 className="text-sm text-chalk-mute mb-2">Qué sigue</h2>
        <ul className="text-sm space-y-2 leading-relaxed">
          {flojos.slice(0, 3).map(([id]) => (
            <li key={id}>Vuelve al mundo <span className="text-chalk">{WORLD_BY_ID[id]?.title}</span> y repite su boss battle sin fallar ninguno.</li>
          ))}
          <li>
            Temas que este curso no cubre y son el siguiente paso natural: pruebas unitarias con JUnit y Mockito,
            y microservicios con Spring Cloud. El propio instructor los deja fuera y los trata en cursos aparte.
          </li>
        </ul>
      </section>

      <div className="flex gap-3">
        <Button onClick={onBack}>Volver al panel</Button>
        <Button variant="ghost" onClick={onRetake}>Repetir el examen</Button>
      </div>
    </div>
  )
}
