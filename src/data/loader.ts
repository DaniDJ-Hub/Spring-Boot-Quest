import type { Challenge } from '../types'

/**
 * Carga diferida del contenido de los retos, un módulo por mundo.
 * Vite analiza estas rutas estáticamente y genera un chunk por mundo, así que
 * abrir el panel no descarga los retos del mundo 15.
 */
const MODULES: Record<string, () => Promise<{ default: Challenge[] }>> = {
  w01: () => import('./challenges/w01'),
  w02: () => import('./challenges/w02'),
  w03: () => import('./challenges/w03'),
  w04: () => import('./challenges/w04'),
  w05: () => import('./challenges/w05'),
  w06: () => import('./challenges/w06'),
  w07: () => import('./challenges/w07'),
  w08: () => import('./challenges/w08'),
  w09: () => import('./challenges/w09'),
  w10: () => import('./challenges/w10'),
  w11: () => import('./challenges/w11'),
  w12: () => import('./challenges/w12'),
  w13: () => import('./challenges/w13'),
  w14: () => import('./challenges/w14'),
  w15: () => import('./challenges/w15'),
}

const cache = new Map<string, Challenge[]>()
const inflight = new Map<string, Promise<Challenge[]>>()

export function isLoaded(worldId: string): boolean {
  return cache.has(worldId)
}

/** Devuelve los retos de un mundo, descargándolos la primera vez. */
export function loadWorld(worldId: string): Promise<Challenge[]> {
  const hit = cache.get(worldId)
  if (hit) return Promise.resolve(hit)

  const pending = inflight.get(worldId)
  if (pending) return pending

  const loader = MODULES[worldId]
  if (!loader) return Promise.reject(new Error(`Mundo desconocido: ${worldId}`))

  const p = loader()
    .then(m => {
      cache.set(worldId, m.default)
      inflight.delete(worldId)
      return m.default
    })
    .catch(err => {
      inflight.delete(worldId)
      throw err
    })

  inflight.set(worldId, p)
  return p
}

export async function loadWorlds(worldIds: string[]): Promise<Challenge[]> {
  const lists = await Promise.all([...new Set(worldIds)].map(loadWorld))
  return lists.flat()
}

export function loadAll(): Promise<Challenge[]> {
  return loadWorlds(Object.keys(MODULES))
}

/** Solo válido si el mundo ya está en caché; si no, devuelve undefined. */
export function peek(worldId: string): Challenge[] | undefined {
  return cache.get(worldId)
}

/** Para pruebas: vacía la caché entre casos. */
export function resetCache() {
  cache.clear()
  inflight.clear()
}
