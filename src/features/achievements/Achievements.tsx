import { useState } from 'react'
import { ACHIEVEMENTS } from '../../data'
import { useGameState } from '../../engine/game-context'
import { achievementProgress } from '../../engine/selectors'
import {
  achievementIcon, Badge, Bar, cx, Icon, RARITY_META, RarityBadge, rarityOf,
} from '../../components/ui'

type Filter = 'all' | 'earned' | 'progress' | 'locked'

const FILTERS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Todos' },
  { id: 'earned', label: 'Ganados' },
  { id: 'progress', label: 'En progreso' },
  { id: 'locked', label: 'Bloqueados' },
]

/**
 * Logros: filas con su rareza, no una rejilla de tarjetas iguales. Los que
 * admiten medida muestran cuánto falta, calculado con la misma regla que los
 * concede; los de suceso dicen simplemente qué hay que hacer.
 */
export function Achievements() {
  const { state } = useGameState()
  const got = new Set(state.achievements)
  const [filter, setFilter] = useState<Filter>('all')

  const rows = ACHIEVEMENTS.map(a => {
    const earned = got.has(a.id)
    const progress = achievementProgress(state, a.id)
    const started = !earned && progress !== null && progress.current > 0
    return { a, earned, progress, group: earned ? 'earned' : started ? 'progress' : 'locked' as const }
  })
  const shown = rows.filter(r => filter === 'all' || r.group === filter)

  return (
    <div className="mx-auto max-w-4xl">
      <header className="mb-5">
        <h1 className="text-h2">Logros</h1>
        <p className="mt-1 text-body text-fg-secondary tnum">
          {got.size} de {ACHIEVEMENTS.length} desbloqueados
        </p>
        <div className="mt-3">
          <Bar pct={(got.size / ACHIEVEMENTS.length) * 100} label="Logros desbloqueados" />
        </div>
      </header>

      <div className="mb-4 flex flex-wrap gap-1 rounded-md border border-edge bg-surface-raised p-1">
        {FILTERS.map(f => {
          const n = f.id === 'all' ? rows.length : rows.filter(r => r.group === f.id).length
          return (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cx(
                'flex min-h-[36px] flex-1 items-center justify-center gap-2 rounded-sm px-3 text-caption transition-colors duration-fast',
                filter === f.id ? 'bg-surface-overlay text-fg' : 'text-fg-secondary hover:text-fg',
              )}
            >
              {f.label}
              <span className="font-mono text-micro text-fg-tertiary tnum">{n}</span>
            </button>
          )
        })}
      </div>

      <ul className="space-y-2">
        {shown.map(({ a, earned, progress }) => {
          const rarity = rarityOf(a.id)
          const r = RARITY_META[rarity]
          return (
            <li
              key={a.id}
              className={cx(
                'relative flex items-start gap-3 overflow-hidden rounded-md border bg-surface-raised p-4',
                earned ? 'border-edge-strong' : 'border-dashed border-edge',
              )}
            >
              <span aria-hidden="true" className={cx('absolute inset-y-0 left-0 w-1', earned ? r.bg : 'bg-edge')} />
              <span className={cx(
                'ml-1 grid h-10 w-10 shrink-0 place-items-center rounded-md border',
                earned ? cx('border-edge-strong', r.text) : 'border-edge text-fg-tertiary',
              )}>
                <Icon name={earned ? achievementIcon(a.id) : 'lock'} size={20} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={cx('text-body', earned ? 'font-semibold text-fg' : 'text-fg-secondary')}>{a.title}</span>
                  <RarityBadge rarity={rarity} />
                  {earned && <Badge tone="accent" icon="check" className="ml-auto">Ganado</Badge>}
                </div>
                <p className="mt-0.5 text-caption text-fg-secondary">{a.detail}</p>
                {!earned && progress && progress.goal > 1 && (
                  <div className="mt-2 flex items-center gap-3">
                    <Bar pct={progress.ratio * 100} height="h-1" tone="info" label={`Avance de ${a.title}`} />
                    <span className="shrink-0 font-mono text-micro text-fg-tertiary tnum">
                      {Math.round(progress.current * 100) / 100} / {progress.goal}
                    </span>
                  </div>
                )}
                {!earned && !progress && (
                  <p className="mt-1 font-mono text-micro text-fg-tertiary">Depende de una hazaña puntual, no de una cuenta.</p>
                )}
              </div>
            </li>
          )
        })}
      </ul>

      {shown.length === 0 && (
        <p className="panel p-6 text-center text-body text-fg-secondary">No hay logros en este grupo.</p>
      )}

      <p className="mt-6 flex items-center gap-2 text-caption text-fg-tertiary">
        <Icon name="sliders" size={14} />
        El respaldo del progreso y el borrado están en Ajustes.
      </p>
    </div>
  )
}
