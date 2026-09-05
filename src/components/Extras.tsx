import { ACHIEVEMENTS, PROJECTS } from '../data'
import { WORLD_BY_ID } from '../data/worlds'
import { useGame } from '../engine/useGame'
import { Bar, Chip } from './ui'

/* ------------------------------- Proyectos ------------------------------- */

export function Projects() {
  const { state, toggleProjectItem } = useGame()

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl mb-1">Proyectos</h1>
        <p className="text-sm text-chalk-mute max-w-2xl leading-relaxed">
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
              <h2 className="font-display text-lg">{p.title}</h2>
              {unlocked
                ? <Chip tone="leaf">Disponible</Chip>
                : <Chip>Se abre al superar {world?.title}</Chip>}
            </div>
            <p className="text-sm text-chalk-mute mb-4">{p.goal}</p>

            {unlocked && (
              <>
                <Bar pct={pct} tone={pct === 100 ? 'leaf' : 'sky'} />
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div>
                    <div className="text-xs text-chalk-mute mb-2">Requisitos</div>
                    <ul className="space-y-1.5">
                      {p.requirements.map(r => (
                        <li key={r}>
                          <label className="flex gap-2.5 items-start cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={checked.includes(r)}
                              onChange={() => toggleProjectItem(p.id, r)}
                              className="mt-0.5 accent-leaf shrink-0"
                            />
                            <span className={`text-sm leading-snug ${checked.includes(r) ? 'text-chalk-faint line-through' : 'group-hover:text-chalk'}`}>{r}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <div className="text-xs text-chalk-mute mb-2">Criterios de aceptación</div>
                    <ul className="space-y-1.5">
                      {p.acceptance.map(a => (
                        <li key={a}>
                          <label className="flex gap-2.5 items-start cursor-pointer group">
                            <input
                              type="checkbox"
                              checked={checked.includes(a)}
                              onChange={() => toggleProjectItem(p.id, a)}
                              className="mt-0.5 accent-leaf shrink-0"
                            />
                            <span className={`text-sm leading-snug ${checked.includes(a) ? 'text-chalk-faint line-through' : 'group-hover:text-chalk'}`}>{a}</span>
                          </label>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                {p.stretch && (
                  <div className="mt-4 pt-4 border-t border-line-soft">
                    <div className="text-xs text-chalk-mute mb-1.5">Si quieres ir más lejos</div>
                    <ul className="text-sm text-chalk-mute space-y-1">
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

/* -------------------------------- Logros -------------------------------- */

export function Achievements() {
  const { state, reset } = useGame()
  const got = new Set(state.achievements)

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-2xl mb-1">Logros</h1>
        <p className="text-sm text-chalk-mute">
          {got.size} de {ACHIEVEMENTS.length} desbloqueados.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {ACHIEVEMENTS.map(a => {
          const has = got.has(a.id)
          return (
            <div key={a.id} className={`panel p-4 flex gap-3 ${has ? 'border-amber/40' : 'opacity-45'}`}>
              <span className={`text-xl leading-none mt-0.5 ${has ? 'text-amber' : 'text-chalk-faint'}`}>{a.icon}</span>
              <div>
                <div className={`text-sm font-semibold ${has ? 'text-amber' : ''}`}>{a.title}</div>
                <div className="text-xs text-chalk-mute mt-0.5">{a.detail}</div>
              </div>
            </div>
          )
        })}
      </div>

      <section className="panel p-5 border-rust/30">
        <h2 className="text-sm mb-1">Empezar de cero</h2>
        <p className="text-xs text-chalk-mute mb-3">
          Borra el progreso guardado en este navegador: XP, dominio, logros, proyectos y el examen.
          No se puede deshacer.
        </p>
        <button
          onClick={() => { if (confirm('¿Borrar todo el progreso? No se puede deshacer.')) reset() }}
          className="rounded-md border border-rust/50 text-rust hover:bg-rust/10 px-4 py-2 text-sm transition-colors"
        >
          Borrar progreso
        </button>
      </section>
    </div>
  )
}
