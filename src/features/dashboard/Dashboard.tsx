import type { ReactNode } from 'react'
import { WORLDS, WORLD_BY_ID } from '../../data/worlds'
import { META_BY_ID } from '../../data'
import { useGameState } from '../../engine/game-context'
import { levelProgress, MASTERY_META, MASTERY_ORDER, nextTitle, overallProgress, titleFor } from '../../engine/core'
import {
  bossGate, examAvailability, globalMastery, lastActiveWorld, nextBossToOpen, reinforceRule, weakCount, worldStatus,
} from '../../engine/selectors'
import { Link } from '../../app/router'
import { useRouter } from '../../app/router-context'
import { Onboarding } from './Onboarding'
import { Badge, Bar, Button, cx, Icon, KIND_META, WorldCard, worldCode } from '../../components/ui'
import type { IconName } from '../../components/ui'
import { Counter } from '../../components/Counter'

function Module({ title, icon, children, action }: { title: string; icon: IconName; children: ReactNode; action?: ReactNode }) {
  return (
    <section className="panel flex flex-col p-4">
      <h2 className="mb-3 flex items-center gap-2 font-mono text-micro uppercase tracking-wide text-fg-tertiary">
        <Icon name={icon} size={14} />
        {title}
      </h2>
      <div className="flex-1">{children}</div>
      {action && <div className="mt-4">{action}</div>}
    </section>
  )
}

export function Dashboard() {
  const { state } = useGameState()
  const { navigate } = useRouter()
  const lp = levelProgress(state.xp)
  const overall = overallProgress(state)
  const mastery = globalMastery(state)
  const weak = weakCount(state)
  const nt = nextTitle(lp.level)
  const exam = examAvailability(state)
  const nextBoss = nextBossToOpen(state)
  const last = lastActiveWorld(state)

  // Sin una sola respuesta registrada, un panel de ceros no orienta a nadie.
  if (overall.done === 0 && state.xp === 0 && state.log.length === 0) return <Onboarding />

  // Punto focal: una sola acción, la que toca ahora.
  const focus = nextBoss?.gate.open ? nextBoss.world : last ?? nextBoss?.world ?? WORLDS[0]
  const focusStatus = worldStatus(state, focus)
  const focusGate = bossGate(state, focus)

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      {/* Siguiente acción */}
      <section>
        <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="font-mono text-micro uppercase tracking-wide text-fg-tertiary">Siguiente acción</p>
            <h1 className="font-display text-h2">
              {focusGate.open ? 'Tienes un deploy listo' : last ? 'Continúa donde lo dejaste' : 'Sigue por aquí'}
            </h1>
          </div>
          <div className="text-right">
            <Counter value={state.xp} className="block font-display text-display leading-none text-fg tnum" />
            <p className="font-mono text-micro text-fg-tertiary">XP acumulado</p>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
          <WorldCard world={focus} status={focusStatus} gate={focusGate} headline />

          <div className="panel flex flex-col justify-between gap-4 p-4">
            <div>
              <p className="font-mono text-micro uppercase tracking-wide text-fg-tertiary">Nivel {lp.level}</p>
              <p className="font-display text-h3 text-accent">{titleFor(lp.level)}</p>
              <div className="mt-3">
                <Bar pct={lp.pct} label={`Progreso hacia el nivel ${lp.level + 1}`} />
                <p className="mt-2 flex justify-between gap-2 font-mono text-micro text-fg-tertiary tnum">
                  <span>{lp.floor} XP</span>
                  <span className="truncate">{nt ? `${nt.name} · nivel ${nt.level}` : 'Todos los títulos'}</span>
                  <span>{lp.ceil} XP</span>
                </p>
              </div>
            </div>
            <dl className="grid grid-cols-3 gap-3 border-t border-edge pt-3 text-center">
              {[
                ['Retos', `${overall.done}/${overall.total}`],
                ['Conceptos', `${mastery.green}/${mastery.total}`],
                ['Mundos', `${state.bossCleared.length}/${WORLDS.length}`],
              ].map(([k, v]) => (
                <div key={k}>
                  <dt className="font-mono text-micro text-fg-tertiary">{k}</dt>
                  <dd className="font-display text-body text-fg tnum">{v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </div>
      </section>

      {/* Refuerzo · dominio · examen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Module
          title="Sesión de refuerzo"
          icon="target"
          action={
            weak > 0
              ? <Button size="sm" icon="play" onClick={() => navigate({ name: 'refuerzo' })}>Reforzar ahora</Button>
              : <p className="text-caption text-fg-tertiary">Nada que reforzar ahora mismo.</p>
          }
        >
          {weak > 0 ? (
            <>
              <p className="font-display text-h2 text-warning tnum">{weak}</p>
              <p className="text-caption text-fg-secondary">
                {weak === 1 ? 'concepto por debajo' : 'conceptos por debajo'} del {Math.round(reinforceRule.accuracy * 100)} % de aciertos,
                con al menos {reinforceRule.minAttempts} intentos.
              </p>
            </>
          ) : (
            <p className="text-caption text-fg-secondary">
              Ningún concepto baja del {Math.round(reinforceRule.accuracy * 100)} % de aciertos. El refuerzo se abre solo cuando lo hay.
            </p>
          )}
        </Module>

        <Module title="Dominio global" icon="layers">
          <p className="mb-3 font-display text-h2 text-fg tnum">
            {mastery.green}<span className="text-body text-fg-tertiary"> / {mastery.total}</span>
          </p>
          <div className="flex h-2 w-full overflow-hidden rounded-full bg-edge-soft">
            {MASTERY_ORDER.map(level => (
              mastery[level] > 0 && (
                <span
                  key={level}
                  className={cx('h-full', MASTERY_META[level].dot)}
                  style={{ width: `${(mastery[level] / mastery.total) * 100}%` }}
                />
              )
            ))}
          </div>
          <ul className="mt-3 grid grid-cols-2 gap-x-3 gap-y-1">
            {MASTERY_ORDER.map(level => (
              <li key={level} className="flex items-center gap-2 font-mono text-micro text-fg-tertiary">
                <span className={cx('h-2 w-2 rounded-sm', MASTERY_META[level].dot)} />
                <span className="truncate">{MASTERY_META[level].label}</span>
                <span className="ml-auto tnum">{mastery[level]}</span>
              </li>
            ))}
          </ul>
        </Module>

        <Module
          title="Hacia el examen final"
          icon="file-check"
          action={
            exam.available || exam.taken
              ? <Button size="sm" icon="file-check" onClick={() => navigate({ name: 'examen' })}>
                  {exam.taken ? 'Ver el Skill Report' : 'Presentar examen'}
                </Button>
              : nextBoss && (
                  <Link to={{ name: 'mundo', worldId: nextBoss.world.id }} className="text-caption text-fg-secondary hover:text-accent">
                    Próxima boss: {nextBoss.world.title} →
                  </Link>
                )
          }
        >
          <p className="font-display text-h2 text-fg tnum">
            {exam.cleared}<span className="text-body text-fg-tertiary"> / {exam.total}</span>
          </p>
          <p className="mb-3 text-caption text-fg-secondary">boss battles superadas</p>
          <Bar pct={(exam.cleared / exam.total) * 100} tone={exam.available ? 'accent' : 'info'} label="Boss battles superadas" />
          {state.exam && (
            <p className="mt-3 font-mono text-micro text-fg-secondary tnum">
              Último examen: {state.exam.score}/{state.exam.total}
            </p>
          )}
        </Module>
      </div>

      {/* Los quince mundos de un vistazo */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-mono text-micro uppercase tracking-wide text-fg-tertiary">
          <Icon name="graph" size={14} />
          Los quince mundos
        </h2>
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-5">
          {WORLDS.map(w => {
            const st = worldStatus(state, w)
            const g = bossGate(state, w)
            const tone = st === 'locked' ? 'border-dashed border-edge text-fg-tertiary'
              : st === 'boss-open' ? 'border-boss/60 text-boss'
                : st === 'cleared' || st === 'mastered' ? 'border-accent/50 text-accent'
                  : 'border-edge-strong text-fg-secondary'
            return (
              <li key={w.id}>
                <Link
                  to={{ name: 'mundo', worldId: w.id }}
                  aria-label={`Mundo ${w.index}: ${w.title}. ${g.done} de ${g.total} retos resueltos.`}
                  className={cx('block rounded-md border bg-surface-raised p-2 transition-colors duration-fast hover:bg-surface-overlay', tone)}
                >
                  <span className="flex items-center justify-between font-mono text-micro tnum">
                    {worldCode(w)}
                    {(st === 'cleared' || st === 'mastered') && <Icon name="check" size={12} />}
                    {st === 'boss-open' && <Icon name="rocket" size={12} />}
                    {st === 'locked' && <Icon name="lock" size={12} />}
                  </span>
                  <span className="mt-1 block truncate text-caption text-fg">{w.title}</span>
                  <span className="mt-1 block">
                    <Bar pct={g.total ? (g.done / g.total) * 100 : 0} height="h-1" tone={st === 'locked' ? 'neutral' : 'accent'} />
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      {/* Actividad */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-mono text-micro uppercase tracking-wide text-fg-tertiary">
          <Icon name="terminal" size={14} />
          Actividad reciente
        </h2>
        <div className="panel divide-y divide-edge-soft overflow-hidden">
          {state.log.length === 0 && <p className="px-4 py-6 text-body text-fg-secondary">Sin actividad todavía.</p>}
          {state.log.slice(0, 8).map((l, i) => {
            const meta = META_BY_ID[l.challengeId]
            return (
              <p key={`${l.challengeId}-${i}`} className="flex items-center gap-3 px-4 py-2 font-mono text-micro">
                <Icon name={l.correct ? 'check' : 'x'} size={14} className={l.correct ? 'text-accent' : 'text-danger'} />
                <span className="sr-only">{l.correct ? 'Acertado' : 'Fallado'}:</span>
                <span className="text-fg-tertiary tnum">{l.challengeId}</span>
                <span className="truncate text-fg-secondary">{meta ? KIND_META[meta.kind].label : 'Reto'}</span>
                <span className="ml-auto shrink-0 truncate text-fg-tertiary">{WORLD_BY_ID[l.worldId]?.title}</span>
              </p>
            )
          })}
        </div>
      </section>

      {state.bossCleared.length > 0 && (
        <p className="flex flex-wrap items-center gap-2 text-caption text-fg-tertiary">
          <Badge variant="label" icon="ticket">Proyectos</Badge>
          Cada boss superada abre un brief para construir en tu IDE.
          <Link to={{ name: 'proyectos' }} className="text-fg-secondary underline hover:text-accent">Ver proyectos</Link>
        </p>
      )}
    </div>
  )
}
