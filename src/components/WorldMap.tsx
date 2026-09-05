import { useEffect, useState } from 'react'
import { WORLDS } from '../data/worlds'
import { useGame } from '../engine/useGame'
import { bossAvailable, worldProgress, worldUnlocked } from '../engine/core'
import { Bar, Chip } from './ui'

export function WorldMap({ onOpen }: { onOpen: (worldId: string) => void }) {
  const { state } = useGame()
  const [narrow, setNarrow] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)')
    const apply = () => setNarrow(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  const step = narrow ? 11 : 22
  const rowH = narrow ? 82 : 90
  const x0 = 14
  const gutter = x0 + step * 5 + (narrow ? 16 : 26)
  const height = WORLDS.length * rowH

  const pos = (i: number) => ({ x: x0 + WORLDS[i].depth * step, y: i * rowH + rowH / 2 })

  return (
    <section>
      <header className="mb-5">
        <h2 className="text-xl mb-1">Árbol de dependencias</h2>
        <p className="text-sm text-chalk-mute max-w-2xl">
          Cada mundo se apoya en los anteriores, igual que en el curso. Un mundo se abre cuando superas
          la boss battle de todos los que cuelgan encima de él.
        </p>
      </header>

      <div className="relative" style={{ height }}>
        <svg
          className="absolute inset-0 pointer-events-none"
          width="100%"
          height={height}
          aria-hidden="true"
        >
          {WORLDS.map((w, i) =>
            w.requires.map(req => {
              const j = WORLDS.findIndex(x => x.id === req)
              if (j < 0) return null
              const a = pos(j)
              const b = pos(i)
              const done = state.bossCleared.includes(req)
              return (
                <path
                  key={`${w.id}-${req}`}
                  d={`M ${a.x} ${a.y + 12} L ${a.x} ${b.y - 14} Q ${a.x} ${b.y} ${a.x + 14} ${b.y} L ${b.x - 7} ${b.y}`}
                  fill="none"
                  stroke={done ? '#3D6B27' : '#2E3757'}
                  strokeWidth={1.5}
                />
              )
            }),
          )}
          {WORLDS.map((w, i) => {
            const p = pos(i)
            const cleared = state.bossCleared.includes(w.id)
            const open = worldUnlocked(state, w)
            return (
              <circle
                key={w.id}
                cx={p.x} cy={p.y} r={cleared ? 6 : 5}
                fill={cleared ? '#5FA83C' : open ? '#1E2540' : '#151A2D'}
                stroke={cleared ? '#7BC653' : open ? '#4C8DD9' : '#2E3757'}
                strokeWidth={2}
              />
            )
          })}
        </svg>

        <ol className="relative">
          {WORLDS.map(w => {
            const open = worldUnlocked(state, w)
            const cleared = state.bossCleared.includes(w.id)
            const p = worldProgress(state, w.id)
            const bossReady = bossAvailable(state, w) && !cleared
            return (
              <li key={w.id} style={{ height: rowH, paddingLeft: gutter }} className="flex items-center">
                <button
                  onClick={() => open && onOpen(w.id)}
                  disabled={!open}
                  className={`group w-full text-left rounded-lg border px-3 py-2.5 transition-colors
                    ${open ? 'border-line hover:border-leaf/60 bg-ink-panel/50' : 'border-line-soft opacity-45 cursor-not-allowed'}
                    ${cleared ? 'border-leaf/40' : ''}`}
                >
                  <div className="flex items-baseline gap-2">
                    <span className="font-mono text-[11px] text-chalk-faint tnum">{String(w.index).padStart(2, '0')}</span>
                    <span className={`font-display text-[15px] ${cleared ? 'text-leaf' : ''}`}>{w.title}</span>
                    {cleared && <span className="text-leaf text-xs">✓</span>}
                    {bossReady && <Chip tone="amber" className="ml-auto">Boss lista</Chip>}
                    {!open && <span className="ml-auto text-[11px] text-chalk-faint">Bloqueado</span>}
                  </div>
                  <p className="text-xs text-chalk-mute mt-0.5 line-clamp-1">{w.tagline}</p>
                  {open && (
                    <div className="mt-2 flex items-center gap-2">
                      <Bar pct={p.pct} tone={cleared ? 'leaf' : 'sky'} height="h-1" />
                      <span className="text-[11px] text-chalk-faint tnum shrink-0">{p.done}/{p.total}</span>
                    </div>
                  )}
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </section>
  )
}
