import { CONCEPT_LABEL, WORLDS } from '../../data/worlds'
import { META_BY_ID } from '../../data'
import { useGameState } from '../../engine/game-context'
import { WORLD_BY_ID as WBI } from '../../data/worlds'
import { Link } from '../../app/router'
import { useRouter } from '../../app/router-context'
import { Onboarding } from './Onboarding'
import {
  levelProgress, masteryOf, nextTitle, overallProgress, titleFor, weakConcepts, worldProgress,
} from '../../engine/core'
import { Bar, Button, Chip, MasteryDot } from '../../components/ui'
import { Counter } from '../../components/Counter'

const KIND_LABEL: Record<string, string> = {
  quiz: 'Reto conceptual', codefix: 'Corregir código', debug: 'Debugging',
  arch: 'Arquitectura', decision: 'Decisión profesional', order: 'Ordenar flujo',
  fill: 'Completar código',
}

function Stat({ label, value, sub }: { label: string; value: number; sub?: string }) {
  return (
    <div className="panel px-4 py-3">
      <div className="text-micro text-fg-tertiary mb-1">{label}</div>
      <Counter value={value} className="block font-display text-h2 tnum leading-none" />
      {sub && <div className="text-micro text-fg-secondary mt-1.5">{sub}</div>}
    </div>
  )
}

export function Dashboard() {
  const { state } = useGameState()
  const { navigate } = useRouter()
  const lp = levelProgress(state.xp)
  const overall = overallProgress(state)
  const weak = weakConcepts(state, 6)
  const nt = nextTitle(lp.level)
  const allConcepts = WORLDS.flatMap(w => w.concepts)
  const green = allConcepts.filter(k => ['mastered', 'expert'].includes(masteryOf(state, k))).length
  const recent = state.log.slice(0, 6)
  const examReady = state.bossCleared.length === WORLDS.length
  // Sin una sola respuesta registrada, un panel de ceros no orienta a nadie.
  const primeraVez = overall.done === 0 && state.xp === 0 && state.log.length === 0

  if (primeraVez) return <Onboarding />

  return (
    <div className="space-y-8">
      {/* Nivel */}
      <section className="panel p-5">
        <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
          <div>
            <div className="text-micro text-fg-tertiary mb-1">Nivel {lp.level}</div>
            <h1 className="font-display text-h2 text-accent leading-none">{titleFor(lp.level)}</h1>
          </div>
          <div className="text-right">
            <Counter value={state.xp} className="block font-display text-h2 tnum leading-none" />
            <div className="text-micro text-fg-tertiary mt-1">XP acumulado</div>
          </div>
        </div>
        <Bar pct={lp.pct} label={`Progreso hacia el nivel ${lp.level + 1}`} />
        <div className="flex justify-between mt-2 text-micro text-fg-tertiary tnum">
          <span>{lp.floor} XP</span>
          <span>{nt ? `${nt.name} en el nivel ${nt.level}` : 'Nivel máximo de títulos'}</span>
          <span>{lp.ceil} XP</span>
        </div>
      </section>

      {/* Cifras */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Stat label="Racha" value={state.streak.count} sub={state.streak.count === 1 ? 'día' : 'días seguidos'} />
        <Stat label="Retos resueltos" value={overall.done} sub={`de ${overall.total}`} />
        <Stat label="Conceptos dominados" value={green} sub={`de ${allConcepts.length}`} />
        <Stat label="Mundos superados" value={state.bossCleared.length} sub={`de ${WORLDS.length}`} />
      </section>

      {/* Progreso por mundo */}
      <section>
        <h2 className="text-body text-fg-secondary mb-3">Progreso por mundo</h2>
        <div className="panel p-4 space-y-2">
          {WORLDS.map(w => {
            const p = worldProgress(state, w.id)
            const cleared = state.bossCleared.includes(w.id)
            return (
              <Link
                key={w.id}
                to={{ name: 'mundo', worldId: w.id }}
                className="w-full flex items-center gap-3 group text-left min-h-[28px]"
              >
                <span className="font-mono text-micro text-fg-tertiary tnum w-5 shrink-0">{String(w.index).padStart(2, '0')}</span>
                <span className="text-caption w-32 sm:w-44 shrink-0 truncate group-hover:text-accent transition-colors">{w.title}</span>
                <Bar pct={p.pct} tone={cleared ? 'accent' : p.pct > 0 ? 'info' : 'warning'} height="h-1.5" label={`${w.title}: ${Math.round(p.pct)} por ciento`} />
                <span className="text-micro text-fg-tertiary tnum w-10 text-right shrink-0">{Math.round(p.pct)}%</span>
              </Link>
            )
          })}
        </div>
      </section>

      {/* Puntos flojos */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-body text-fg-secondary">Conceptos que fallas más de lo que aciertas</h2>
          {weak.length > 0 && <Button variant="secondary" onClick={() => navigate({ name: 'refuerzo' })} className="!py-1 !px-3 text-caption">Sesión de refuerzo</Button>}
        </div>
        <div className="panel p-4">
          {weak.length === 0 ? (
            <p className="text-body text-fg-secondary">
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
                    <span className="text-body flex-1">{CONCEPT_LABEL[k] ?? k}</span>
                    {world && <Chip className="hidden sm:inline-flex">{world.title}</Chip>}
                    <span className="text-micro text-fg-tertiary tnum w-16 text-right">{Math.round(acc * 100)} % · {s?.attempts}</span>
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
          <h2 className="text-body text-fg-secondary mb-3">Últimos retos</h2>
          <ul className="panel divide-y divide-edge">
            {recent.length === 0 && <li className="px-4 py-6 text-body text-fg-secondary">Sin actividad todavía.</li>}
            {recent.map((l, i) => {
              // El enunciado vive en el contenido diferido; aquí basta el tipo de
              // reto, que sale del índice sincrónico.
              const m = META_BY_ID[l.challengeId]
              return (
                <li key={`${l.challengeId}-${i}`} className="flex items-center gap-3 px-4 py-2.5">
                  <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full shrink-0 ${l.correct ? 'bg-accent' : 'bg-danger'}`} />
                  <span className="text-caption flex-1 truncate">
                    {KIND_LABEL[m?.kind ?? 'quiz']}
                    <span className="sr-only">{l.correct ? ' · acertado' : ' · fallado'}</span>
                  </span>
                  <span className="text-micro text-fg-tertiary shrink-0">{WBI[l.worldId]?.title}</span>
                </li>
              )
            })}
          </ul>
        </div>

        <div>
          <h2 className="text-body text-fg-secondary mb-3">Examen final</h2>
          <div className="panel p-5">
            <div className="font-display text-lead mb-1">Spring Boot Expert Exam</div>
            {state.exam ? (
              <>
                <p className="text-body text-fg-secondary mb-3">
                  Último resultado: {state.exam.score} de {state.exam.total} ·{' '}
                  {Math.round((state.exam.score / Math.max(1, state.exam.total)) * 100)} %
                </p>
                <Button variant="secondary" onClick={() => navigate({ name: 'examen' })}>Ver el reporte o repetirlo</Button>
              </>
            ) : (
              <>
                <p className="text-body text-fg-secondary mb-3">
                  {examReady
                    ? 'Los quince mundos están superados. Treinta retos de todo el curso, sin pistas.'
                    : `Se abre al superar los quince mundos. Llevas ${state.bossCleared.length}.`}
                </p>
                <Button onClick={() => navigate({ name: 'examen' })} disabled={!examReady}>Presentar examen</Button>
              </>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
