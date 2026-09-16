import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { World } from '../../types'
import { CONCEPT_LABEL } from '../../data/worlds'
import { metaOf } from '../../data'
import { useGameActions, useGameState } from '../../engine/game-context'
import { bossSet, masteryOf } from '../../engine/core'
import { bossGate, bossPassed, worldDependents } from '../../engine/selectors'
import { playCue } from '../../app/sound'
import { useChallengeSet } from '../../hooks/useChallengeSet'
import { ChallengeRunner } from '../challenge/ChallengeRunner'
import { Pipeline } from '../challenge/Pipeline'
import type { Stage } from '../challenge/Pipeline'
import type { Answer } from '../challenge/evaluate'
import { LoadError, LoadingBlock } from '../../components/Loading'
import { Badge, Bar, Button, cx, Icon, KIND_META, MasteryMeter } from '../../components/ui'
import type { IconName } from '../../components/ui'
import { RoundShell } from '../session/round'
import { UnlockReveal } from './UnlockReveal'

type Phase = 'intro' | 'running' | 'result'

/**
 * Boss battle como un despliegue a producción: sin red, sin pistas y sin
 * veredicto hasta el final, que llega como el resultado de un pipeline.
 */
export function BossBattle({ world, onExit, onPractice }: { world: World; onExit: () => void; onPractice: () => void }) {
  const { state } = useGameState()
  const { answer, clearBoss } = useGameActions()
  const [phase, setPhase] = useState<Phase>('intro')
  const [cursor, setCursor] = useState(0)
  const [given, setGiven] = useState<{ answer: Answer; correct: boolean }[]>([])
  const [reviewing, setReviewing] = useState<number | null>(null)
  const [xpBefore, setXpBefore] = useState(0)

  const selection = useMemo(() => bossSet(world), [world])
  const set = useChallengeSet(phase === 'intro' ? null : selection)
  const queue = set.challenges
  const gate = bossGate(state, world)
  const kinds = useMemo(() => [...new Set(selection.map(c => c.kind))], [selection])
  // La boss coge un reto por tipo, pero luego recorta al tamaño del mundo: si
  // hay más tipos que etapas, alguno se queda fuera y hay que decirlo.
  const worldKinds = useMemo(() => [...new Set(metaOf(world.id).map(c => c.kind))], [world])
  const missingKinds = useMemo(() => worldKinds.filter(k => !kinds.includes(k)), [worldKinds, kinds])

  const correctCount = given.filter(g => g.correct).length
  const passed = bossPassed(world, correctCount, given.length)

  function start() {
    setXpBefore(state.xp)
    setGiven([])
    setCursor(0)
    setReviewing(null)
    setPhase('running')
  }

  function finish() {
    if (cursor + 1 < queue.length) { setCursor(cursor + 1); return }
    const ok = given.filter(g => g.correct).length
    const win = bossPassed(world, ok, given.length)
    if (win) clearBoss(world.id, ok === given.length)
    playCue(win ? 'unlock' : 'wrong')
    setPhase('result')
  }

  /* --------------------------------- Intro -------------------------------- */

  if (phase === 'intro') {
    const dependents = worldDependents(world.id)
    return (
      <div className="mx-auto max-w-3xl" data-mode="boss">
        <Button variant="ghost" size="sm" icon="arrow-left" onClick={onExit} className="mb-4">Volver al mundo</Button>
        <section className="panel overflow-hidden">
          <div className="flex items-center gap-2 border-b border-edge-soft bg-surface-sunken px-4 py-2 font-mono text-micro text-boss">
            <Icon name="rocket" size={14} />
            PRODUCTION DEPLOY · {world.id.toUpperCase()}
          </div>
          <div className="p-6">
            <h1 className="font-display text-h2 text-boss">{world.boss.title}</h1>
            <p className="mt-2 text-body leading-relaxed text-fg-secondary">{world.boss.brief}</p>

            <ul className="mt-6 space-y-3">
              <Rule icon="layers">
                {gate.size} etapas con el reto más difícil de cada tipo que cabe:{' '}
                {kinds.map(k => KIND_META[k].label).join(' · ')}.
                {missingKinds.length > 0 && (
                  <>
                    {' '}El mundo tiene {worldKinds.length} tipos y la boss son {gate.size} etapas, así que
                    se queda fuera {missingKinds.map(k => KIND_META[k].label).join(' y ')}.
                  </>
                )}
              </Rule>
              <Rule icon="eye-off">Sin pistas y sin explicaciones hasta el final.</Rule>
              <Rule icon="target">
                Se supera con {Math.round(gate.passRate * 100)} % de aciertos: {gate.passCount} de {gate.size}.
              </Rule>
              <Rule icon="git-commit">Tus respuestas cuentan para el dominio, aciertes o falles.</Rule>
              <Rule icon="rocket">
                Superarla suma {gate.bonusXp} XP y desbloquea{' '}
                {dependents.length > 0 ? dependents.map(w => w.title).join(' y ') : 'el final de esta rama'}.
              </Rule>
            </ul>

            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="boss" icon="play" onClick={start}>Iniciar deploy</Button>
              <Button variant="secondary" onClick={onPractice}>Practicar antes</Button>
            </div>
            {gate.cleared && (
              <p className="mt-4 font-mono text-micro text-fg-tertiary">
                Ya la superaste: repetirla no quita nada y sirve para afinar el dominio.
              </p>
            )}
          </div>
        </section>
      </div>
    )
  }

  /* -------------------------------- Ronda --------------------------------- */

  if (phase === 'running') {
    const stages: Stage[] = selection.map((c, i) => ({
      id: c.id,
      label: KIND_META[c.kind].label,
      state: i < given.length ? 'recorded' : i === cursor ? 'running' : 'queued',
    }))

    return (
      <RoundShell
        title={world.boss.title}
        subtitle={`Deploy en curso · ${world.title}`}
        tone="boss"
        onExit={onExit}
        exitLabel="Cancelar deploy"
        confirmExit={{
          title: '¿Cancelar el deploy?',
          body: 'La boss battle no se dará por superada. Las respuestas que ya diste siguen contando para tu dominio, y puedes reintentarla cuando quieras.',
          confirmLabel: 'Cancelar deploy',
        }}
        progress={<Pipeline stages={stages} label="Etapas del deploy" />}
      >
        {set.status === 'loading' && <LoadingBlock label={`Preparando el deploy de ${world.title}`} />}
        {set.status === 'error' && <LoadError onRetry={set.retry} error={set.error} />}
        {set.status === 'ready' && queue[cursor] && (
          <ChallengeRunner
            challenge={queue[cursor]}
            strict
            index={cursor}
            total={queue.length}
            onResolved={ok => answer(queue[cursor], ok, false)}
            onAnswer={(a, ok) => setGiven(g => [...g, { answer: a, correct: ok }])}
            onNext={finish}
            nextLabel={cursor + 1 === queue.length ? 'Ver resultado' : 'Siguiente etapa'}
          />
        )}
      </RoundShell>
    )
  }

  /* ------------------------------- Resultado ------------------------------ */

  const stages: Stage[] = queue.map((c, i) => ({
    id: c.id,
    label: KIND_META[c.kind].label,
    state: given[i]?.correct ? 'passed' : 'failed',
  }))
  const failedConcepts = [...new Set(queue.filter((_, i) => !given[i]?.correct).flatMap(c => c.concepts))]
  // Solo se anuncian como abiertos los que ya tienen todos sus requisitos resueltos.
  const unlocked = passed ? worldDependents(world.id).filter(w => w.requires.every(r => state.bossCleared.includes(r))) : []

  return (
    <div className="mx-auto max-w-4xl space-y-6" data-mode="boss">
      <section className="panel overflow-hidden">
        <div className={cx('flex items-center gap-2 border-b border-edge-soft bg-surface-sunken px-4 py-2 font-mono text-micro', passed ? 'text-accent' : 'text-danger')}>
          <Icon name={passed ? 'check-circle' : 'x-circle'} size={14} />
          {passed ? 'DEPLOY SUCCESS' : 'DEPLOY FAILED'}
        </div>
        <div className="p-6">
          <h1 className="font-display text-h2">{passed ? 'Boss superada' : 'No alcanzó el umbral'}</h1>
          <p className="mt-1 font-mono text-caption text-fg-secondary tnum">
            {correctCount} de {given.length} · {Math.round((correctCount / Math.max(1, given.length)) * 100)} % ·
            umbral {Math.round(gate.passRate * 100)} % ({gate.passCount} aciertos)
          </p>
          <div className="mt-4">
            <Bar
              pct={(correctCount / Math.max(1, given.length)) * 100}
              tone={passed ? 'accent' : 'danger'}
              marker={gate.passRate * 100}
              markerLabel={`Umbral: ${gate.passCount} aciertos`}
              label="Resultado de la boss battle"
              height="h-2"
            />
          </div>
          {passed && state.xp > xpBefore && (
            <p className="mt-3 font-mono text-caption text-accent tnum">+{state.xp - xpBefore} XP en esta boss</p>
          )}
        </div>
      </section>

      <section className="panel p-4">
        <h2 className="mb-3 font-mono text-micro uppercase tracking-wide text-fg-tertiary">Etapas</h2>
        <Pipeline
          stages={stages}
          label="Resultado por etapa"
          animateResult
          onSelect={i => setReviewing(i === reviewing ? null : i)}
          selected={reviewing ?? undefined}
        />
        {reviewing !== null && queue[reviewing] ? (
          <div className="mt-4 border-t border-edge pt-4">
            <ChallengeRunner
              challenge={queue[reviewing]}
              review={given[reviewing]?.answer}
              onResolved={() => {}}
              onNext={() => {}}
            />
          </div>
        ) : (
          <p className="mt-3 text-caption text-fg-secondary">
            Toca una etapa para revisar el reto, tu respuesta y la explicación.
          </p>
        )}
      </section>

      {passed ? (
        <section className="panel p-6">
          <h2 className="mb-1 flex items-center gap-2 font-display text-h3 text-accent">
            <Icon name="git-commit" size={18} />
            Dependencia resuelta
          </h2>
          <p className="mb-4 text-body text-fg-secondary">
            {unlocked.length > 0
              ? 'Los mundos que dependían de este quedan abiertos.'
              : 'Este mundo cierra su rama: no había nada esperándolo.'}
          </p>
          <UnlockReveal world={world} unlocked={unlocked} />
        </section>
      ) : (
        <section className="panel p-6">
          <h2 className="mb-1 font-display text-h3">Plan de recuperación</h2>
          <p className="mb-4 text-body text-fg-secondary">
            La boss se puede repetir las veces que quieras. Esto es lo que falló en esta corrida.
          </p>
          {failedConcepts.length > 0 && (
            <ul className="mb-5 grid gap-2 sm:grid-cols-2">
              {failedConcepts.map(k => (
                <li key={k} className="flex items-center justify-between gap-2 rounded-md border border-edge bg-surface-sunken px-3 py-2">
                  <span className="min-w-0 truncate text-caption text-fg">{CONCEPT_LABEL[k] ?? k}</span>
                  <MasteryMeter level={masteryOf(state, k)} size="sm" />
                </li>
              ))}
            </ul>
          )}
          <div className="flex flex-wrap gap-3">
            <Button icon="play" onClick={onPractice}>Practicar el mundo</Button>
            <Button variant="secondary" icon="rocket" onClick={start}>Reintentar deploy</Button>
          </div>
        </section>
      )}

      <div className="flex flex-wrap gap-3">
        <Button variant={passed ? 'primary' : 'secondary'} icon="arrow-left" onClick={onExit}>Volver al mundo</Button>
        {passed && <Button variant="secondary" icon="rocket" onClick={start}>Repetir la boss</Button>}
      </div>

      {passed && (
        <p className="flex flex-wrap items-center gap-2 text-caption text-fg-tertiary">
          <Badge tone="accent" icon="check">Superada</Badge>
          El mundo queda marcado en el mapa, y su proyecto asociado, si lo tiene, ya está disponible.
        </p>
      )}
    </div>
  )
}

function Rule({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <li className="flex gap-3 text-body text-fg-secondary">
      <Icon name={icon} size={18} className="mt-0.5 shrink-0 text-boss" />
      <span>{children}</span>
    </li>
  )
}
