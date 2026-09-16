import { useState } from 'react'
import type { ProjectBrief } from '../../types'
import { PROJECTS } from '../../data'
import { WORLD_BY_ID } from '../../data/worlds'
import { useGameActions, useGameState } from '../../engine/game-context'
import { projectStatus } from '../../engine/selectors'
import { Link } from '../../app/router'
import { Badge, Bar, cx, Icon, PROJECT_STATUS_META, worldCode } from '../../components/ui'

const code = (p: ProjectBrief) => `PRJ-${p.id.replace(/\D/g, '').padStart(2, '0')}`

/**
 * Los proyectos no se juegan: se construyen en el IDE. Se presentan como
 * tickets con requisitos y criterios de aceptación, y el checklist se guarda.
 */
export function Projects() {
  const { state } = useGameState()
  const [openId, setOpenId] = useState(PROJECTS[0].id)
  const selected = PROJECTS.find(p => p.id === openId) ?? PROJECTS[0]

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-h2">Proyectos</h1>
        <p className="mt-1 max-w-2xl text-body leading-relaxed text-fg-secondary">
          Siete briefs para construir en tu IDE. Cada uno se abre al superar la boss battle de su mundo.
          Marca lo que vayas cumpliendo: el checklist se guarda en este navegador, el código lo escribes tú.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        {/* Lista de tickets */}
        <ul className="space-y-2 lg:sticky lg:top-6" role="tablist" aria-label="Proyectos">
          {PROJECTS.map(p => {
            const st = projectStatus(state, p)
            const meta = PROJECT_STATUS_META[st.status]
            const active = p.id === selected.id
            return (
              <li key={p.id}>
                <button
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setOpenId(p.id)}
                  className={cx(
                    'w-full rounded-md border p-3 text-left transition-colors duration-fast',
                    active ? 'border-accent bg-surface-overlay' : 'border-edge bg-surface-raised hover:border-edge-strong',
                    st.status === 'locked' && !active && 'border-dashed',
                  )}
                >
                  <span className="flex items-center gap-2">
                    <span className="font-mono text-micro text-fg-tertiary">{code(p)}</span>
                    <Icon name={meta.icon} size={14} className={cx('ml-auto', st.status === 'done' ? 'text-accent' : 'text-fg-tertiary')} />
                  </span>
                  <span className="mt-1 block truncate text-body text-fg">{p.title}</span>
                  <span className="mt-1 block font-mono text-micro text-fg-tertiary tnum">
                    {st.status === 'locked' ? meta.label : `${st.checked}/${st.total}`}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        <ProjectDetail project={selected} />
      </div>
    </div>
  )
}

function ProjectDetail({ project: p }: { project: ProjectBrief }) {
  const { state } = useGameState()
  const { toggleProjectItem } = useGameActions()
  const st = projectStatus(state, p)
  const meta = PROJECT_STATUS_META[st.status]
  const world = WORLD_BY_ID[p.unlockedBy]
  const marked = new Set(state.projects[p.id] ?? [])

  return (
    <article className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 border-b border-edge-soft bg-surface-sunken px-4 py-2">
        <span className="font-mono text-micro text-fg-tertiary">{code(p)}</span>
        <Badge tone={meta.tone} icon={meta.icon}>{meta.label}</Badge>
        {st.status !== 'locked' && (
          <span className="ml-auto font-mono text-micro text-fg-tertiary tnum">{st.checked} / {st.total}</span>
        )}
      </div>

      <div className="p-5">
        <h2 className="text-h3">{p.title}</h2>
        <p className="mt-1 text-body leading-relaxed text-fg-secondary">{p.goal}</p>

        <p className="mt-3 flex flex-wrap items-center gap-2 text-caption text-fg-tertiary">
          <Icon name={st.status === 'locked' ? 'lock' : 'check-circle'} size={14} className={st.status === 'locked' ? 'text-locked' : 'text-accent'} />
          {st.status === 'locked' ? 'Se abre al superar' : 'Abierto desde'}
          <Link to={{ name: 'mundo', worldId: p.unlockedBy }} className="text-fg-secondary hover:text-accent">
            {worldCode(world)} {world?.title}
          </Link>
        </p>

        {st.status === 'locked' ? (
          <div className="mt-5 rounded-md border border-dashed border-edge-strong p-4">
            <h3 className="mb-2 font-mono text-micro uppercase tracking-wide text-fg-tertiary">Lo que pedirá</h3>
            <ul className="space-y-1 text-caption leading-relaxed text-fg-secondary">
              {p.requirements.slice(0, 3).map(r => <li key={r}>· {r}</li>)}
              <li className="text-fg-tertiary">…y {p.requirements.length - 3 + p.acceptance.length} puntos más al abrirlo.</li>
            </ul>
          </div>
        ) : (
          <>
            <div className="mt-5">
              <Bar pct={(st.checked / st.total) * 100} tone={st.status === 'done' ? 'accent' : 'info'} label={`Avance de ${p.title}`} />
            </div>

            <div className="mt-5 grid gap-6 md:grid-cols-2">
              <CheckList
                title="Requisitos"
                icon="list-ordered"
                items={p.requirements}
                marked={marked}
                onToggle={item => toggleProjectItem(p.id, item)}
              />
              <CheckList
                title="Criterios de aceptación"
                icon="check-circle"
                items={p.acceptance}
                marked={marked}
                onToggle={item => toggleProjectItem(p.id, item)}
              />
            </div>

            {p.stretch && (
              <div className="mt-6 border-t border-edge pt-4">
                <h3 className="mb-2 font-mono text-micro uppercase tracking-wide text-fg-tertiary">Si quieres ir más lejos</h3>
                <ul className="space-y-1 text-caption leading-relaxed text-fg-secondary">
                  {p.stretch.map(s => <li key={s}>· {s}</li>)}
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </article>
  )
}

function CheckList({ title, icon, items, marked, onToggle }: {
  title: string
  icon: 'list-ordered' | 'check-circle'
  items: string[]
  marked: Set<string>
  onToggle: (item: string) => void
}) {
  return (
    <section>
      <h3 className="mb-2 flex items-center gap-2 font-mono text-micro uppercase tracking-wide text-fg-tertiary">
        <Icon name={icon} size={14} />
        {title}
      </h3>
      <ul className="space-y-1">
        {items.map(item => {
          const done = marked.has(item)
          return (
            <li key={item}>
              {/* Casilla propia: la nativa mide unos 13 px, muy por debajo del
                  objetivo táctil. Conserva la semántica con role y aria-checked. */}
              <button
                type="button"
                role="checkbox"
                aria-checked={done}
                onClick={() => onToggle(item)}
                className="group flex min-h-[44px] w-full items-start gap-3 rounded-sm py-2 pr-2 text-left"
              >
                <span
                  aria-hidden="true"
                  className={cx(
                    'mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-sm border transition-colors duration-fast',
                    done ? 'border-accent bg-accent text-fg-inverse' : 'border-edge-strong group-hover:border-accent',
                  )}
                >
                  {done && <Icon name="check" size={14} />}
                </span>
                <span className={cx('text-body leading-snug', done ? 'text-fg-tertiary line-through' : 'text-fg-secondary group-hover:text-fg')}>
                  {item}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
    </section>
  )
}
