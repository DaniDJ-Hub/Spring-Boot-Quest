import { PROJECTS } from '../../data'
import { WORLD_BY_ID } from '../../data/worlds'
import { useGameActions, useGameState } from '../../engine/game-context'
import { Bar, Chip } from '../../components/ui'

/**
 * Casilla propia en vez de <input type="checkbox">: la nativa mide unos 13 px,
 * muy por debajo del objetivo táctil de 44 px, y no admite el estilo del resto
 * de la interfaz. Conserva la semántica con role e aria-checked.
 */
function Check({ label, done, onToggle }: { label: string; done: boolean; onToggle: () => void }) {
  return (
    <li>
      <button
        role="checkbox"
        aria-checked={done}
        onClick={onToggle}
        className="group flex w-full gap-3 items-start text-left min-h-[44px] py-1.5 pr-2 rounded-sm"
      >
        <span
          aria-hidden="true"
          className={`mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-sm border transition-colors duration-fast
            ${done ? 'bg-accent border-accent text-surface-sunken' : 'border-edge-strong group-hover:border-accent'}`}
        >
          {done ? '✓' : ''}
        </span>
        <span className={`text-body leading-snug ${done ? 'text-fg-tertiary line-through' : 'group-hover:text-fg'}`}>
          {label}
        </span>
      </button>
    </li>
  )
}

export function Projects() {
  const { state } = useGameState()
  const { toggleProjectItem } = useGameActions()

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-h2 mb-1">Proyectos</h1>
        <p className="text-body text-fg-secondary max-w-2xl leading-relaxed">
          Estos no se juegan: se construyen en tu IDE. Cada uno es un brief con requisitos y criterios de
          aceptación. Marca lo que vayas cumpliendo; el checklist es tuyo y se guarda en este navegador.
        </p>
      </header>

      {PROJECTS.map(p => {
        const unlocked = state.bossCleared.includes(p.unlockedBy)
        const checked = state.projects[p.id] ?? []
        const pct = (checked.length / (p.requirements.length + p.acceptance.length)) * 100
        const world = WORLD_BY_ID[p.unlockedBy]
        return (
          <section key={p.id} className={`panel p-5 ${unlocked ? '' : 'opacity-50'}`}>
            <div className="flex flex-wrap items-baseline gap-2 mb-1">
              <h2 className="font-display text-lead">{p.title}</h2>
              {unlocked
                ? <Chip tone="accent">Disponible</Chip>
                : <Chip>Se abre al superar {world?.title}</Chip>}
            </div>
            <p className="text-body text-fg-secondary mb-4">{p.goal}</p>

            {unlocked && (
              <>
                <Bar pct={pct} tone={pct === 100 ? 'accent' : 'info'} label={`Avance del proyecto ${p.title}`} />
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div>
                    <div className="text-caption text-fg-secondary mb-2">Requisitos</div>
                    <ul className="space-y-1.5">
                      {p.requirements.map(r => (
                        <Check key={r} label={r} done={checked.includes(r)} onToggle={() => toggleProjectItem(p.id, r)} />
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-caption text-fg-secondary mb-2">Criterios de aceptación</div>
                    <ul className="space-y-1.5">
                      {p.acceptance.map(a => (
                        <Check key={a} label={a} done={checked.includes(a)} onToggle={() => toggleProjectItem(p.id, a)} />
                      ))}
                    </ul>
                  </div>
                </div>
                {p.stretch && (
                  <div className="mt-4 pt-4 border-t border-edge-soft">
                    <div className="text-caption text-fg-secondary mb-1.5">Si quieres ir más lejos</div>
                    <ul className="text-body text-fg-secondary space-y-1">
                      {p.stretch.map(s => <li key={s}>{s}</li>)}
                    </ul>
                  </div>
                )}
              </>
            )}
          </section>
        )
      })}
    </div>
  )
}
