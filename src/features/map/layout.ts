import type { World } from '../../types'

/**
 * Disposición del grafo de dependencias.
 *
 * La capa de cada mundo es el camino más largo desde una raíz, calculado sobre
 * `requires`. No se usa el campo `depth` de los datos: describe la sangría del
 * mapa anterior y no garantiza que un mundo quede por debajo de aquello de lo
 * que depende (w03 depende de w02 y ambos declaran profundidad 1).
 */
export function layerOf(worlds: World[]): Map<string, number> {
  const byId = new Map(worlds.map(w => [w.id, w]))
  const layers = new Map<string, number>()

  const visit = (id: string, seen: Set<string>): number => {
    const cached = layers.get(id)
    if (cached !== undefined) return cached
    const w = byId.get(id)
    // Un requisito inexistente o un ciclo no pueden colgar el render.
    if (!w || seen.has(id)) return 0
    seen.add(id)
    const layer = w.requires.length ? Math.max(...w.requires.map(r => visit(r, seen) + 1)) : 0
    seen.delete(id)
    layers.set(id, layer)
    return layer
  }

  for (const w of worlds) visit(w.id, new Set())
  return layers
}

/**
 * Mundos agrupados por capa y ordenados dentro de cada una por el baricentro
 * de sus requisitos: los hijos quedan cerca de sus padres y se cruzan menos
 * aristas. Con empate manda el índice del mundo, así el orden es estable.
 */
export function layout(worlds: World[]): World[][] {
  const layers = layerOf(worlds)
  const rows: World[][] = []
  for (const w of worlds) {
    const l = layers.get(w.id) ?? 0
    ;(rows[l] ??= []).push(w)
  }

  const position = new Map<string, number>()
  rows.forEach(row => {
    row.sort((a, b) => a.index - b.index)
    const center = (w: World) => {
      const ps = w.requires.map(r => position.get(r)).filter((n): n is number => n !== undefined)
      return ps.length ? ps.reduce((s, n) => s + n, 0) / ps.length : w.index
    }
    row.sort((a, b) => center(a) - center(b) || a.index - b.index)
    row.forEach((w, i) => position.set(w.id, i))
  })
  return rows.map(row => row ?? [])
}
