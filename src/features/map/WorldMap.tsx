import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { WORLDS, WORLD_BY_ID } from '../../data/worlds'
import type { World } from '../../types'
import { useGameState } from '../../engine/game-context'
import { bossGate, worldDependents, worldMastery, worldRequirements, worldStatus } from '../../engine/selectors'
import { Link } from '../../app/router'
import {
  Badge, Bar, buttonClass, cx, DependencyEdge, GraphNode, Icon, WORLD_STATUS_META, worldCode,
} from '../../components/ui'
import { layout } from './layout'

interface Port { x: number; top: number; bottom: number }

/**
 * Mapa: el grafo real de dependencias entre los quince mundos.
 *
 * Las capas se calculan desde `requires` (layout.ts) y las posiciones se miden
 * del DOM, así que el árbol cuadra aunque cambie el ancho o el tamaño de letra.
 * En móvil no hay lienzo: cada mundo se lee como una ficha con sus requisitos
 * y lo que desbloquea.
 */
export function WorldMap() {
  const { state } = useGameState()
  const rows = useMemo(() => layout(WORLDS), [])
  const canvas = useRef<HTMLDivElement>(null)
  const nodes = useRef<Record<string, HTMLDivElement | null>>({})
  const [ports, setPorts] = useState<Record<string, Port>>({})
  const [height, setHeight] = useState(0)
  const [selectedId, setSelectedId] = useState<string>(() => WORLDS[0].id)

  const measure = useCallback(() => {
    const box = canvas.current
    if (!box) return
    const base = box.getBoundingClientRect()
    const next: Record<string, Port> = {}
    for (const [id, el] of Object.entries(nodes.current)) {
      if (!el) continue
      const r = el.getBoundingClientRect()
      next[id] = { x: r.left - base.left + r.width / 2, top: r.top - base.top, bottom: r.bottom - base.top }
    }
    setPorts(next)
    setHeight(box.scrollHeight)
  }, [])

  useLayoutEffect(() => {
    measure()
    const box = canvas.current
    if (!box || typeof ResizeObserver === 'undefined') return
    const ro = new ResizeObserver(measure)
    ro.observe(box)
    for (const el of Object.values(nodes.current)) if (el) ro.observe(el)
    return () => ro.disconnect()
  }, [measure])

  const selected = WORLD_BY_ID[selectedId] ?? WORLDS[0]
  const ready = Object.keys(ports).length === WORLDS.length

  return (
    <div className="mx-auto max-w-6xl">
      <header className="mb-6">
        <h1 className="text-h2">Árbol de dependencias</h1>
        <p className="mt-1 max-w-2xl text-body text-fg-secondary">
          Cada mundo se apoya en los anteriores. Superar una boss battle resuelve esa dependencia y abre
          los mundos que cuelgan de ella.
        </p>
      </header>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-6">
        {/* Lienzo del grafo: desde tablet hacia arriba */}
        <div ref={canvas} className="relative hidden md:block">
          {ready && (
            <svg className="pointer-events-none absolute inset-0" width="100%" height={height} aria-hidden="true">
              {WORLDS.flatMap(w =>
                w.requires.map(req => {
                  const from = ports[req]
                  const to = ports[w.id]
                  if (!from || !to) return null
                  return (
                    <DependencyEdge
                      key={`${w.id}-${req}`}
                      from={{ x: from.x, y: from.bottom }}
                      to={{ x: to.x, y: to.top }}
                      midY={(from.bottom + to.top) / 2}
                      active={state.bossCleared.includes(req)}
                    />
                  )
                }),
              )}
            </svg>
          )}

          <ol className="relative space-y-6">
            {rows.map((row, layer) => (
              <li key={layer}>
                <ol className="flex flex-wrap justify-center gap-4">
                  {row.map(w => {
                    const g = bossGate(state, w)
                    return (
                      <li key={w.id} className="w-40 shrink-0">
                        <div ref={el => { nodes.current[w.id] = el }}>
                          <GraphNode
                            world={w}
                            status={worldStatus(state, w)}
                            done={g.done}
                            total={g.total}
                            selected={selectedId === w.id}
                            onSelect={() => setSelectedId(w.id)}
                          />
                        </div>
                      </li>
                    )
                  })}
                </ol>
              </li>
            ))}
          </ol>
        </div>

        {/* Móvil: lista de dependencias, sin lienzo */}
        <ol className="space-y-3 md:hidden">
          {WORLDS.map(w => <MobileRow key={w.id} world={w} />)}
        </ol>

        {/* Detalle del mundo seleccionado */}
        <aside className="mt-6 hidden md:block lg:sticky lg:top-6 lg:mt-0 lg:self-start">
          <WorldDetail world={selected} />
        </aside>
      </div>
    </div>
  )
}

function WorldDetail({ world }: { world: World }) {
  const { state } = useGameState()
  const status = worldStatus(state, world)
  const meta = WORLD_STATUS_META[status]
  const gate = bossGate(state, world)
  const reqs = worldRequirements(state, world)
  const deps = worldDependents(world.id)
  const mastery = worldMastery(state, world)

  return (
    <div className="panel p-4">
      <div className="mb-2 flex items-center gap-2">
        <span className="font-mono text-micro text-fg-tertiary tnum">{worldCode(world)}</span>
        <Badge tone={meta.tone} icon={meta.icon} className="ml-auto">{meta.label}</Badge>
      </div>
      <h2 className="text-h3">{world.title}</h2>
      <p className="mt-1 text-caption text-fg-secondary">{world.tagline}</p>

      {status !== 'locked' && (
        <div className="mt-4">
          <Bar
            pct={gate.total ? (gate.done / gate.total) * 100 : 0}
            tone={gate.cleared ? 'accent' : gate.open ? 'boss' : 'info'}
            marker={gate.cleared ? undefined : gate.ratio * 100}
            markerLabel={`La boss se abre con ${gate.required} retos`}
            label={`${world.title}: ${gate.done} de ${gate.total} retos resueltos`}
          />
          <p className="mt-2 flex justify-between font-mono text-micro text-fg-tertiary tnum">
            <span>{gate.done}/{gate.total} retos</span>
            <span>{mastery.green}/{mastery.total} conceptos</span>
          </p>
        </div>
      )}

      <dl className="mt-4 space-y-3 text-caption">
        <div>
          <dt className="text-caption text-fg-secondary">Requiere</dt>
          <dd className="mt-1 flex flex-wrap gap-2">
            {reqs.length === 0 && <span className="text-fg-secondary">Nada: es el punto de partida.</span>}
            {reqs.map(r => (
              <Link key={r.world.id} to={{ name: 'mundo', worldId: r.world.id }} className="inline-flex items-center gap-1 text-fg-secondary hover:text-accent">
                <Icon name={r.cleared ? 'check' : 'lock'} size={13} className={r.cleared ? 'text-accent' : 'text-locked'} />
                {worldCode(r.world)} {r.world.title}
              </Link>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-fg-secondary">Desbloquea</dt>
          <dd className="mt-1 flex flex-wrap gap-2">
            {deps.length === 0 && <span className="text-fg-secondary">Nada: es el final de su rama.</span>}
            {deps.map(d => (
              <Link key={d.id} to={{ name: 'mundo', worldId: d.id }} className="text-fg-secondary hover:text-accent">
                {worldCode(d)} {d.title}
              </Link>
            ))}
          </dd>
        </div>
        <div>
          <dt className="text-caption text-fg-secondary">Boss battle</dt>
          <dd className="mt-1 text-fg-secondary">
            <span className={gate.open || gate.cleared ? 'text-boss' : ''}>{world.boss.title}</span> ·{' '}
            {gate.size} retos, umbral {Math.round(gate.passRate * 100)} %
            {!gate.open && !gate.cleared && <>, se abre con {gate.required} resueltos</>}
          </dd>
        </div>
      </dl>

      <Link to={{ name: 'mundo', worldId: world.id }} className={cx(buttonClass({ variant: 'secondary', block: true }), 'mt-4')}>
        Abrir mundo
        <Icon name="arrow-right" size={18} className="ml-2" />
      </Link>
    </div>
  )
}

function MobileRow({ world }: { world: World }) {
  const { state } = useGameState()
  const status = worldStatus(state, world)
  const meta = WORLD_STATUS_META[status]
  const gate = bossGate(state, world)
  const reqs = worldRequirements(state, world)
  const deps = worldDependents(world.id)

  return (
    <li>
      <Link
        to={{ name: 'mundo', worldId: world.id }}
        className={cx(
          'block rounded-md border bg-surface-raised p-3 transition-colors duration-fast',
          status === 'locked' ? 'border-dashed border-edge-strong' : 'border-edge',
        )}
      >
        <span className="flex items-center gap-2">
          <span className="font-mono text-micro text-fg-tertiary tnum">{worldCode(world)}</span>
          <span className="font-display text-body text-fg">{world.title}</span>
          <Badge tone={meta.tone} icon={meta.icon} className="ml-auto">{meta.label}</Badge>
        </span>
        {status !== 'locked' && (
          <span className="mt-2 flex items-center gap-2">
            <Bar pct={gate.total ? (gate.done / gate.total) * 100 : 0} height="h-1" tone={gate.cleared ? 'accent' : 'info'} />
            <span className="shrink-0 font-mono text-micro text-fg-tertiary tnum">{gate.done}/{gate.total}</span>
          </span>
        )}
        <span className="mt-2 block font-mono text-micro text-fg-tertiary">
          {reqs.length > 0 && (
            <>Requiere: {reqs.map(r => `${worldCode(r.world)}${r.cleared ? ' ✓' : ' ✕'}`).join(' · ')}</>
          )}
          {reqs.length > 0 && deps.length > 0 && ' — '}
          {deps.length > 0 && <>Desbloquea: {deps.map(d => worldCode(d)).join(' · ')}</>}
        </span>
      </Link>
    </li>
  )
}
