import { CONCEPT_LABEL, WORLDS, WORLD_BY_ID } from '../data/worlds'
import { CHALLENGES } from '../data'
import { useGame } from '../engine/useGame'
import {
  levelProgress, masteryOf, nextTitle, overallProgress, titleFor, weakConcepts, worldProgress,
} from '../engine/core'
import { Bar, Button, Chip, MasteryDot } from './ui'

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel px-4 py-3">
      <div className="text-[11px] text-chalk-faint mb-1">{label}</div>
      <div className="font-display text-2xl tnum leading-none">{value}</div>
      {sub && <div className="text-[11px] text-chalk-mute mt-1.5">{sub}</div>}
    </div>
  )
}

export function Dashboard({ onOpenWorld, onReinforce, onExam }: {
  onOpenWorld: (id: string) => void
  onReinforce: () => void
  onExam: () => void
}) {
  const { state } = useGame()
  const lp = levelProgress(state.xp)
  const overall = overallProgress(state)
  const weak = weakConcepts(state, 6)
  const nt = nextTitle(lp.level)
  const allConcepts = WORLDS.flatMap(w => w.concepts)
  const green = allConcepts.filter(k => ['mastered', 'expert'].includes(masteryOf(state, k))).length
  const recent = state.log.slice(0, 6)
  const examReady = state.bossCleared.length === WORLDS.length

  return (
    <div className="space-y-8">
      {/* Nivel */}
      <section className="panel p-5">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <div>
            <div className="text-[11px] text-chalk-faint mb-1">Nivel {lp.level}</div>
            <h1 className="font-display text-2xl text-leaf leading-none">{titleFor(lp.level)}</h1>
          </div>
          <div className="text-right">
            <div className="font-display text-2xl tnum leading-none">{state.xp}</div>
            <div className="text-[11px] text-chalk-faint mt-1">XP acumulado</div>
          </div>
        </div>
        <Bar pct={lp.pct} />
        <div className="flex justify-between mt-2 text-[11px] text-chalk-faint tnum">
          <span>{lp.floor} XP</span>
          <span>{nt ? `${nt.name} en el nivel ${nt.level}` : 'Nivel máximo de títulos'}</span>
          <span>{lp.ceil} XP</span>
        </div>
      </section>

      {/* Cifras */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Racha" value={`${state.streak.count}`} sub={state.streak.count === 1 ? 'día' : 'días seguidos'} />
        <Stat label="Retos resueltos" value={`${overall.done}`} sub={`de ${overall.total}`} />
        <Stat label="Conceptos dominados" value={`${green}`} sub={`de ${allConcepts.length}`} />
        <Stat label="Mundos superados" value={`${state.bossCleared.length}`} sub={`de ${WORLDS.length}`} />
      </section>

      {/* Progreso por mundo */}
      <section>
        <h2 className="text-sm text-chalk-mute mb-3">Progreso por mundo</h2>
        <div className="panel p-4 space-y-2">
          {WORLDS.map(w => {
            const p = worldProgress(state, w.id)
            const cleared = state.bossCleared.includes(w.id)
            return (
              <button
                key={w.id}
                onClick={() => onOpenWorld(w.id)}
                className="w-full flex items-center gap-3 group text-left"
              >
                <span className="font-mono text-[11px] text-chalk-faint tnum w-5 shrink-0">{String(w.index).padStart(2, '0')}</span>
                <span className="text-xs w-32 sm:w-44 shrink-0 truncate group-hover:text-leaf transition-colors">{w.title}</span>
                <Bar pct={p.pct} tone={cleared ? 'leaf' : p.pct > 0 ? 'sky' : 'amber'} height="h-1.5" />
                <span className="text-[11px] text-chalk-faint tnum w-10 text-right shrink-0">{Math.round(p.pct)}%</span>
              </button>
            )
          })}
        </div>
      </section>

      {/* Puntos flojos */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm text-chalk-mute">Conceptos que fallas más de lo que aciertas</h2>
          {weak.length > 0 && <Button variant="ghost" onClick={onReinforce} className="!py-1 !px-3 text-xs">Sesión de refuerzo</Button>}
        </div>
        <div className="panel p-4">
          {weak.length === 0 ? (
            <p className="text-sm text-chalk-mute">
              {overall.done === 0
                ? 'Todavía no hay datos. Resuelve algunos retos y aquí aparecerá lo que se te resiste.'
                : 'Nada por debajo del 60 % de aciertos ahora mismo. Sigue avanzando por el mapa.'}
            </p>
          ) : (
            <ul className="space-y-2.5">
              {weak.map(k => {
                const s = state.concepts[k]
                const acc = s ? s.correct / s.attempts : 0
                const world = WORLDS.find(w => w.concepts.includes(k))
                return (
                  <li key={k} className="flex items-center gap-3">
                    <MasteryDot level={masteryOf(state, k)} />
                    <span className="text-sm flex-1">{CONCEPT_LABEL[k] ?? k}</span>
                    {world && <Chip className="hidden sm:inline-flex">{world.title}</Chip>}
                    <span className="text-[11px] text-chalk-faint tnum w-16 text-right">{Math.round(acc * 100)} % · {s?.attempts}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>

      {/* Actividad + examen */}
      <section className="grid gap-4 lg:grid-cols-2">
        <div>
          <h2 className="text-sm text-chalk-mute mb-3">Últimos retos</h2>
          <div className="panel divide-y divide-line-soft">
            {recent.length === 0 && <p className="px-4 py-6 text-sm text-chalk-mute">Sin actividad todavía.</p>}
            {recent.map((l, i) => {
              const c = CHALLENGES.find(x => x.id === l.challengeId)
              return (
                <div key={`${l.challengeId}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                  <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${l.correct ? 'bg-leaf' : 'bg-rust'}`} />
                  <span className="text-xs flex-1 truncate">{c?.prompt.slice(0, 60) ?? l.challengeId}…</span>
                  <span className="text-[11px] text-chalk-faint shrink-0">{WORLD_BY_ID[l.worldId]?.title}</span>
                </div>
              )
            })}
          </div>
        </div>

        <div>
          <h2 className="text-sm text-chalk-mute mb-3">Examen final</h2>
          <div className="panel p-5">
            <div className="font-display text-lg mb-1">Spring Boot Expert Exam</div>
            {state.exam ? (
              <>
                <p className="text-sm text-chalk-mute mb-3">
                  Último resultado: {state.exam.score} de {state.exam.total} ·{' '}
                  {Math.round((state.exam.score / Math.max(1, state.exam.total)) * 100)} %
                </p>
                <Button variant="ghost" onClick={onExam}>Ver el reporte o repetirlo</Button>
              </>
            ) : (
              <>
                <p className="text-sm text-chalk-mute mb-3">
                  {examReady
                    ? 'Los quince mundos están superados. Treinta retos de todo el curso, sin pistas.'
                    : `Se abre al superar los quince mundos. Llevas ${state.bossCleared.length}.`}
                </p>
                <Button onClick={onExam} disabled={!examReady}>Presentar examen</Button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
