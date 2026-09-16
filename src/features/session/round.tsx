import { useState } from 'react'
import type { ReactNode } from 'react'
import type { Challenge, GameState } from '../../types'
import { ACHIEVEMENTS } from '../../data'
import { CONCEPT_LABEL } from '../../data/worlds'
import { useGameState } from '../../engine/game-context'
import { levelProgress } from '../../engine/core'
import { weakCount } from '../../engine/selectors'
import type { MasteryChange } from '../../engine/selectors'
import { useRoundChanges } from './round-state'
import { useImmersive } from '../../app/chrome'
import {
  achievementIcon, Badge, Bar, Button, cx, Icon, MasteryMeter, RarityBadge, rarityOf,
} from '../../components/ui'
import { ConfirmDialog } from '../../components/ConfirmDialog'

/* -------------------------------- Cabecera ------------------------------- */

/**
 * Marco de una ronda: salida, progreso y contenido. Mientras dura, el shell
 * entra en modo inmersivo y la barra de navegación inferior se recoge.
 */
export function RoundShell({ title, subtitle, tone = 'neutral', onExit, exitLabel = 'Salir', confirmExit, progress, children }: {
  title: string
  subtitle?: ReactNode
  tone?: 'neutral' | 'info' | 'boss'
  onExit: () => void
  exitLabel?: string
  /** Texto de confirmación si abandonar tiene consecuencias. */
  confirmExit?: { title: string; body: string; confirmLabel: string }
  progress?: ReactNode
  children: ReactNode
}) {
  const [asking, setAsking] = useState(false)
  useImmersive(true)

  return (
    <div className={cx('mx-auto max-w-7xl', tone === 'boss' && 'text-fg')} data-mode={tone === 'boss' ? 'boss' : undefined}>
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Button variant="ghost" size="sm" icon="arrow-left" onClick={() => (confirmExit ? setAsking(true) : onExit())}>
          {exitLabel}
        </Button>
        <div className="min-w-0">
          <h1 className={cx('truncate font-display text-lead', tone === 'boss' ? 'text-boss' : tone === 'info' ? 'text-info' : 'text-fg')}>
            {title}
          </h1>
          {subtitle && <p className="truncate text-caption text-fg-secondary">{subtitle}</p>}
        </div>
      </div>
      {progress && <div className="mb-5">{progress}</div>}
      {children}

      {confirmExit && (
        <ConfirmDialog
          open={asking}
          title={confirmExit.title}
          body={confirmExit.body}
          confirmLabel={confirmExit.confirmLabel}
          onConfirm={() => { setAsking(false); onExit() }}
          onCancel={() => setAsking(false)}
        />
      )}
    </div>
  )
}

/** Progreso de la ronda: un segmento por reto, con su resultado en práctica. */
export function RoundProgress({ total, cursor, results, blind = false }: {
  total: number
  cursor: number
  results: boolean[]
  /** Boss y examen: se ve el avance, no el acierto. */
  blind?: boolean
}) {
  const done = results.length
  return (
    <div>
      <div role="progressbar" aria-label={`Reto ${Math.min(cursor + 1, total)} de ${total}`} aria-valuenow={done} aria-valuemin={0} aria-valuemax={total} className="flex gap-1">
        {Array.from({ length: total }, (_, i) => {
          const answered = i < done
          const state = !answered ? (i === cursor ? 'current' : 'pending') : blind ? 'recorded' : results[i] ? 'ok' : 'ko'
          return (
            <span
              key={i}
              className={cx(
                'h-1.5 flex-1 rounded-full',
                state === 'pending' && 'bg-edge-soft',
                state === 'current' && 'bg-fg-tertiary',
                state === 'recorded' && 'bg-fg-secondary',
                state === 'ok' && 'bg-accent',
                state === 'ko' && 'bg-danger',
              )}
            />
          )
        })}
      </div>
      <p className="mt-2 font-mono text-micro text-fg-tertiary tnum">
        {Math.min(cursor + 1, total)} / {total}
      </p>
    </div>
  )
}

/* -------------------------------- Resumen -------------------------------- */

export interface RoundOutcome {
  before: GameState
  answered: Challenge[]
  results: boolean[]
}

/**
 * Resumen de la ronda: qué ganaste y qué se movió. Las bajadas se cuentan con
 * la misma claridad que las subidas, y con una salida para recuperarlas.
 */
export function RoundSummary({ title, before, answered, results, actions }: {
  title: string
  before: GameState
  answered: Challenge[]
  results: boolean[]
  actions: ReactNode
}) {
  const { state } = useGameState()
  const { changes, xp, newAchievements } = useRoundChanges({ before, answered })
  const ok = results.filter(Boolean).length
  const up = changes.filter(c => c.direction === 'up')
  const down = changes.filter(c => c.direction === 'down')
  const weak = weakCount(state)
  const lp = levelProgress(state.xp)

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <section className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-edge-soft bg-surface-sunken px-4 py-2 font-mono text-micro text-fg-tertiary">
          <Icon name="terminal" size={14} />
          ronda terminada
        </div>
        <div className="p-6">
          <h1 className="text-h2">{title}</h1>
          <p className="mt-1 text-body text-fg-secondary tnum">{ok} de {results.length} correctos</p>

          <div className="mt-6 flex flex-wrap items-end gap-6">
            <div>
              <p className="font-display text-display leading-none text-accent tnum">+{xp}</p>
              <p className="font-mono text-micro text-fg-tertiary">XP en esta ronda</p>
            </div>
            <div className="min-w-[12rem] flex-1">
              <Bar pct={lp.pct} label={`Progreso hacia el nivel ${lp.level + 1}`} />
              <p className="mt-2 font-mono text-micro text-fg-tertiary tnum">Nivel {lp.level} · {state.xp} XP</p>
            </div>
          </div>
        </div>
      </section>

      {(up.length > 0 || down.length > 0) && (
        <section className="grid gap-4 sm:grid-cols-2">
          <ChangeList
            title="Conceptos que subieron"
            icon="arrow-up"
            tone="accent"
            changes={up}
            empty="Ninguno esta vez."
          />
          <ChangeList
            title="Conceptos que bajaron"
            icon="arrow-down"
            tone="neutral"
            changes={down}
            empty="Ninguno: no se rompió ninguna racha."
          />
        </section>
      )}

      {newAchievements.length > 0 && (
        <section className="panel p-4">
          <h2 className="mb-3 text-caption text-fg-secondary">Logros nuevos</h2>
          <ul className="space-y-2">
            {newAchievements.map(id => {
              const a = ACHIEVEMENTS.find(x => x.id === id)
              if (!a) return null
              return (
                <li key={id} className="flex items-center gap-3">
                  <Icon name={achievementIcon(id)} size={18} className="text-fg-secondary" />
                  <span className="text-body text-fg">{a.title}</span>
                  <RarityBadge rarity={rarityOf(id)} className="ml-auto" />
                </li>
              )
            })}
          </ul>
        </section>
      )}

      {down.length > 0 && weak > 0 && (
        <p className="flex flex-wrap items-center gap-2 text-caption text-fg-secondary">
          <Badge tone="info" icon="target">Refuerzo</Badge>
          Hay {weak} {weak === 1 ? 'concepto' : 'conceptos'} por debajo del umbral. La sesión de refuerzo se arma con ellos.
        </p>
      )}

      <div className="flex flex-wrap gap-3">{actions}</div>
    </div>
  )
}

function ChangeList({ title, icon, tone, changes, empty }: {
  title: string
  icon: 'arrow-up' | 'arrow-down'
  tone: 'accent' | 'neutral'
  changes: MasteryChange[]
  empty: string
}) {
  return (
    <div className="panel p-4">
      <h2 className={cx('mb-3 flex items-center gap-2 text-caption', tone === 'accent' ? 'text-accent' : 'text-fg-secondary')}>
        <Icon name={icon} size={14} />
        {title}
      </h2>
      {changes.length === 0 ? (
        <p className="text-caption text-fg-tertiary">{empty}</p>
      ) : (
        <ul className="space-y-2">
          {changes.map(c => (
            <li key={c.concept} className="flex flex-wrap items-center gap-2">
              <span className="min-w-0 flex-1 truncate text-caption text-fg" title={CONCEPT_LABEL[c.concept] ?? c.concept}>
                {CONCEPT_LABEL[c.concept] ?? c.concept}
              </span>
              <MasteryMeter level={c.to} previous={c.direction === 'down' ? c.from : undefined} size="sm" showLabel />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
