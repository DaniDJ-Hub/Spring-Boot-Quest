import type { World } from '../../types'
import { DependencyEdge, worldCode } from '../../components/ui'

const NODE_W = 96
const NODE_H = 34
const GAP = 16
const TOP_Y = 8
const BOTTOM_Y = 86

/**
 * El momento estrella: la dependencia resuelta recorre la arista hasta los
 * mundos que colgaban de ella. Las coordenadas son fijas dentro del viewBox,
 * así que no hay que medir nada; los nombres van debajo, en texto normal.
 */
export function UnlockReveal({ world, unlocked }: { world: World; unlocked: World[] }) {
  const cols = Math.max(1, unlocked.length)
  const width = Math.max(cols * NODE_W + (cols - 1) * GAP, NODE_W * 2)
  const centerX = width / 2
  const childX = (i: number) => (width - (cols * NODE_W + (cols - 1) * GAP)) / 2 + i * (NODE_W + GAP) + NODE_W / 2

  return (
    <div>
      <svg viewBox={`0 0 ${width} ${BOTTOM_Y + NODE_H + 8}`} className="w-full" role="img"
        aria-label={`Mundo ${world.index} superado. Desbloquea ${unlocked.map(w => w.title).join(', ') || 'nada'}.`}>
        {unlocked.map((w, i) => (
          <DependencyEdge
            key={w.id}
            from={{ x: centerX, y: TOP_Y + NODE_H }}
            to={{ x: childX(i), y: BOTTOM_Y }}
            midY={(TOP_Y + NODE_H + BOTTOM_Y) / 2}
            active
            resolving
          />
        ))}

        <g>
          <rect x={centerX - NODE_W / 2} y={TOP_Y} width={NODE_W} height={NODE_H} rx="6"
            className="fill-accent-dim stroke-accent" strokeWidth="1.5" />
          <text x={centerX} y={TOP_Y + 22} textAnchor="middle" className="fill-accent font-mono" fontSize={13}>
            {worldCode(world)} ✓
          </text>
        </g>

        {unlocked.map((w, i) => (
          <g key={w.id}>
            <rect x={childX(i) - NODE_W / 2} y={BOTTOM_Y} width={NODE_W} height={NODE_H} rx="6"
              className="fill-surface-raised stroke-edge-strong" strokeWidth="1.5" />
            <text x={childX(i)} y={BOTTOM_Y + 22} textAnchor="middle" className="fill-fg font-mono" fontSize={13}>
              {worldCode(w)}
            </text>
          </g>
        ))}
      </svg>

      <ul className="mt-3 space-y-1">
        {unlocked.map(w => (
          <li key={w.id} className="flex items-baseline gap-2 text-caption">
            <span className="font-mono text-micro text-fg-tertiary tnum">{worldCode(w)}</span>
            <span className="text-fg">{w.title}</span>
            <span className="truncate text-fg-tertiary">{w.tagline}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
