import { useMemo, useState } from 'react'
import type { ChallengeMeta } from '../../types'
import { CONCEPT_LABEL, WORLD_BY_ID } from '../../data/worlds'
import { metaOf, PROJECTS } from '../../data'
import { useGameState } from '../../engine/game-context'
import { MASTERY_META, nextInWorld } from '../../engine/core'
import {
  bossGate, conceptProgress, selectionReasons, worldDependents, worldMastery, worldRequirements, worldStatus,
} from '../../engine/selectors'
import type { SelectionReason } from '../../engine/selectors'
import { Link } from '../../app/router'
import { useRouter } from '../../app/router-context'
import { PracticeRound } from '../session/PracticeRound'
import { BossBattle } from './BossBattle'
import {
  Badge, Bar, Button, ChallengeCard, ConceptStreak, cx, EmptyState, Icon, MasteryMeter, REASON_META,
  WORLD_STATUS_META, worldCode,
} from '../../components/ui'
import type { ChallengeRecord } from '../../components/ui'

type Mode = 'overview' | 'practice' | 'single' | 'boss'

const GROUP_ORDER: SelectionReason[] = ['failed', 'weak', 'new', 'review']

export function WorldView({ worldId }: { worldId: string }) {
  const { state } = useGameState()
  const { navigate } = useRouter()
  const world = WORLD_BY_ID[worldId]

  const [mode, setMode] = useState<Mode>('overview')
  // La selección se congela al empezar: si se recalculara en cada respuesta,
  // los retos cambiarían de orden bajo los pies del jugador.
  const [selection, setSelection] = useState<ChallengeMeta[]>([])

  const metas = useMemo(() => (world ? metaOf(world.id) : []), [world])
  const reasons = useMemo(() => (world ? selectionReasons(state, metas) : {}), [state, metas, world])

  if (!world) {
    return (
      <EmptyState
        title="Ese mundo no existe"
        body="La dirección apunta a un mundo que no está en el mapa."
        icon="map"
        action={<Button onClick={() => navigate({ name: 'mapa' })}>Ir al mapa</Button>}
      />
    )
  }

  const status = worldStatus(state, world)
  const gate = bossGate(state, world)
  const mastery = worldMastery(state, world)
  const requirements = worldRequirements(state, world)
  const dependents = worldDependents(world.id)
  const project = PROJECTS.find(p => p.unlockedBy === world.id)

  /* ------------------------- Mundo aún bloqueado ------------------------- */

  if (status === 'locked') {
    return (
      <div className="mx-auto max-w-2xl">
        <Button variant="ghost" size="sm" icon="arrow-left" onClick={() => navigate({ name: 'mapa' })} className="mb-4">Mapa</Button>
        <section className="panel p-6">
          <div className="mb-2 flex items-center gap-2">
            <span className="font-mono text-micro text-fg-tertiary tnum">{worldCode(world)}</span>
            <Badge tone="locked" icon="lock" className="ml-auto">Bloqueado</Badge>
          </div>
          <h1 className="text-h2">{world.title}</h1>
          <p className="mt-1 text-body text-fg-secondary">{world.tagline}</p>

          <h2 className="mb-2 mt-6 text-caption text-fg-secondary">Dependencia no resuelta</h2>
          <ul className="space-y-2">
            {requirements.map(r => (
              <li key={r.world.id}>
                <Link
                  to={{ name: 'mundo', worldId: r.world.id }}
                  className="flex items-center gap-3 rounded-md border border-edge bg-surface-sunken px-3 py-2 hover:border-accent"
                >
                  <Icon name={r.cleared ? 'check-circle' : 'rocket'} size={16} className={r.cleared ? 'text-accent' : 'text-boss'} />
                  <span className="font-mono text-micro text-fg-tertiary tnum">{worldCode(r.world)}</span>
                  <span className="min-w-0 flex-1 truncate text-body text-fg">{r.world.title}</span>
                  <span className="shrink-0 text-caption text-fg-secondary">
                    {r.cleared ? 'superado' : 'falta su boss battle'}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="mt-4 text-caption text-fg-secondary">
            Este mundo se abre cuando superes la boss battle de todos sus requisitos.
          </p>
        </section>
      </div>
    )
  }

  /* --------------------------------- Rondas -------------------------------- */

  if (mode === 'practice' || mode === 'single') {
    return (
      <PracticeRound
        title={mode === 'single' ? 'Reto suelto' : `Práctica en ${world.title}`}
        subtitle={mode === 'single' ? world.title : 'Los retos vienen ordenados por el motor adaptativo'}
        selection={selection}
        reasons={reasons}
        loadingLabel={`Cargando los retos de ${world.title}`}
        onExit={() => setMode('overview')}
        summaryTitle={mode === 'single' ? 'Reto terminado' : `Ronda de ${world.title}`}
        summaryActions={() => (
          <>
            <Button icon="play" onClick={() => { setSelection(nextInWorld(state, world.id)); setMode('practice') }}>
              Otra ronda
            </Button>
            {bossGate(state, world).open && !bossGate(state, world).cleared && (
              <Button variant="boss" icon="rocket" onClick={() => setMode('boss')}>Ir a la boss</Button>
            )}
            <Button variant="secondary" icon="arrow-left" onClick={() => setMode('overview')}>Volver al mundo</Button>
          </>
        )}
      />
    )
  }

  if (mode === 'boss') {
    return (
      <BossBattle
        world={world}
        onExit={() => setMode('overview')}
        onPractice={() => { setSelection(nextInWorld(state, world.id)); setMode('practice') }}
      />
    )
  }

  /* -------------------------------- Portada -------------------------------- */

  const meta = WORLD_STATUS_META[status]
  const groups = GROUP_ORDER
    .map(reason => ({ reason, items: metas.filter(m => reasons[m.id] === reason) }))
    .filter(g => g.items.length > 0)
  const preview = GROUP_ORDER
    .map(r => ({ r, n: metas.filter(m => reasons[m.id] === r).length }))
    .filter(x => x.n > 0)

  const recordOf = (m: ChallengeMeta): ChallengeRecord =>
    (state.solved[m.id] ?? 0) > 0 ? 'solved' : (state.failed[m.id] ?? 0) > 0 ? 'failed' : 'new'

  return (
    <div className="mx-auto max-w-6xl">
      <Button variant="ghost" size="sm" icon="arrow-left" onClick={() => navigate({ name: 'mapa' })} className="mb-4">Mapa</Button>

      <header className="mb-6">
        <div className="mb-1 flex flex-wrap items-center gap-2">
          <span className="font-mono text-micro text-fg-tertiary tnum">Mundo {worldCode(world)}</span>
          <Badge tone={meta.tone} icon={meta.icon}>{meta.label}</Badge>
          <span className="font-mono text-micro text-fg-tertiary">En el curso: {world.courseRange}</span>
        </div>
        <h1 className="text-h1">{world.title}</h1>
        <p className="mt-1 text-lead text-fg-secondary">{world.tagline}</p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] lg:items-start">
        <div className="space-y-6">
          {/* Punto focal: practicar */}
          <section className="panel p-5">
            <h2 className="font-display text-h3">Practicar</h2>
            <p className="mt-1 text-body text-fg-secondary">
              Los retos se ordenan solos: primero lo que fallaste, luego tus conceptos flojos, después lo
              nuevo por dificultad y al final el repaso.
            </p>
            <p className="mt-3 flex flex-wrap items-center gap-2 font-mono text-micro text-fg-tertiary">
              <span className="tnum">{metas.length} retos:</span>
              {preview.map(({ r, n }) => (
                <span key={r} className="inline-flex items-center gap-1">
                  <Icon name={REASON_META[r].icon} size={12} />
                  {n} {REASON_META[r].label.toLowerCase()}
                </span>
              ))}
            </p>
            <div className="mt-4">
              <Button icon="play" onClick={() => { setSelection(nextInWorld(state, world.id)); setMode('practice') }}>
                Empezar ronda
              </Button>
            </div>
          </section>

          {/* Puerta de la boss */}
          <section className={cx('panel p-5', gate.open && !gate.cleared && 'border-boss/50')} data-mode={gate.open ? 'boss' : undefined}>
            <div className="mb-2 flex items-center gap-2">
              <Icon name="rocket" size={16} className={gate.open || gate.cleared ? 'text-boss' : 'text-fg-tertiary'} />
              <h2 className={cx('font-display text-h3', gate.open || gate.cleared ? 'text-boss' : 'text-fg')}>{world.boss.title}</h2>
              {gate.cleared && <Badge tone="accent" icon="check" className="ml-auto">Superada</Badge>}
            </div>
            <p className="text-body text-fg-secondary">{world.boss.brief}</p>

            <div className="mt-4">
              <Bar
                pct={gate.total ? (gate.done / gate.total) * 100 : 0}
                tone={gate.cleared ? 'accent' : gate.open ? 'boss' : 'info'}
                marker={gate.cleared ? undefined : gate.ratio * 100}
                markerLabel={`Se abre con ${gate.required} retos resueltos`}
                label={`Retos resueltos en ${world.title}`}
                height="h-2"
              />
              <p className="mt-2 flex flex-wrap justify-between gap-2 font-mono text-micro text-fg-tertiary tnum">
                <span>{gate.done} / {gate.total} resueltos</span>
                <span>
                  {gate.open
                    ? `${gate.size} etapas · umbral ${Math.round(gate.passRate * 100)} % (${gate.passCount} aciertos)`
                    : `se abre con ${gate.required} · faltan ${gate.remaining}`}
                </span>
              </p>
            </div>

            <div className="mt-4">
              <Button
                variant={gate.open || gate.cleared ? 'boss' : 'secondary'}
                icon="rocket"
                disabled={!gate.open && !gate.cleared}
                onClick={() => setMode('boss')}
              >
                {gate.cleared ? 'Repetir la boss' : 'Abrir la boss battle'}
              </Button>
              {!gate.open && !gate.cleared && (
                <p className="mt-2 text-caption text-fg-secondary">
                  Resuelve {gate.remaining} {gate.remaining === 1 ? 'reto más' : 'retos más'} para abrirla.
                </p>
              )}
            </div>
          </section>

          {/* Retos agrupados por motivo */}
          <section>
            <h2 className="mb-3 text-caption text-fg-secondary">Retos del mundo</h2>
            <div className="space-y-5">
              {groups.map(g => (
                <div key={g.reason}>
                  <h3 className="mb-2 flex items-center gap-2 text-caption text-fg-secondary">
                    <Icon name={REASON_META[g.reason].icon} size={14} />
                    {REASON_META[g.reason].label}
                    <span className="font-mono text-micro text-fg-tertiary tnum">{g.items.length}</span>
                    <span className="hidden text-fg-tertiary sm:inline">· {REASON_META[g.reason].hint}</span>
                  </h3>
                  <ul className="space-y-2">
                    {g.items.map(m => (
                      <li key={m.id}>
                        <ChallengeCard
                          meta={m}
                          reason={g.reason}
                          record={recordOf(m)}
                          onPlay={() => { setSelection([m]); setMode('single') }}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Dominio por concepto */}
        <aside className="space-y-6 lg:sticky lg:top-6">
          <section className="panel p-4">
            <h2 className="mb-1 text-caption text-fg-secondary">Dominio por concepto</h2>
            <p className="mb-4 font-display text-h3 text-fg tnum">
              {mastery.green}<span className="text-body text-fg-tertiary"> / {mastery.total} en verde</span>
            </p>
            <ul className="space-y-3">
              {world.concepts.map(k => {
                const p = conceptProgress(state, k)
                return (
                  <li key={k}>
                    <div className="flex items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-caption text-fg" title={CONCEPT_LABEL[k] ?? k}>{CONCEPT_LABEL[k] ?? k}</span>
                      <span className="font-mono text-micro text-fg-tertiary tnum">
                        {p.attempts ? `${p.correct}/${p.attempts}` : '—'}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <MasteryMeter level={p.level} size="sm" />
                      <span className={cx('text-micro', MASTERY_META[p.level].text)}>{MASTERY_META[p.level].label}</span>
                      {p.next && p.next.rule.minStreak > 0 && (
                        <ConceptStreak
                          streak={p.streak}
                          goal={p.next.rule.minStreak}
                          nextLabel={MASTERY_META[p.next.level].label}
                          className="ml-auto"
                        />
                      )}
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>

          {(dependents.length > 0 || project) && (
            <section className="panel p-4 text-caption">
              {dependents.length > 0 && (
                <p className="text-fg-secondary">
                  <span className="text-caption text-fg-secondary">Desbloquea</span><br />
                  {dependents.map(d => (
                    <Link key={d.id} to={{ name: 'mundo', worldId: d.id }} className="mr-3 inline-block hover:text-accent">
                      {worldCode(d)} {d.title}
                    </Link>
                  ))}
                </p>
              )}
              {project && (
                <p className={cx('text-fg-secondary', dependents.length > 0 && 'mt-3 border-t border-edge pt-3')}>
                  <span className="text-caption text-fg-secondary">Proyecto asociado</span><br />
                  <Link to={{ name: 'proyectos' }} className="hover:text-accent">{project.title}</Link>
                  {!gate.cleared && <span className="text-fg-tertiary">, se abre al superar la boss</span>}
                </p>
              )}
            </section>
          )}
        </aside>
      </div>
    </div>
  )
}
