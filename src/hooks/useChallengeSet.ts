import { useEffect, useMemo, useState } from 'react'
import type { Challenge, ChallengeMeta } from '../types'
import { isLoaded, loadWorlds, peek } from '../data'

type Status = 'loading' | 'ready' | 'error'

export interface ChallengeSet {
  status: Status
  challenges: Challenge[]
  error: Error | null
  retry: () => void
}

const keyOf = (metas: ChallengeMeta[] | null) => (metas ? metas.map(m => m.id).join('|') : '')

/** Resuelve la selección sin descargar nada, si los mundos ya están en caché. */
function resolveCached(metas: ChallengeMeta[] | null): Challenge[] | null {
  // Sin selección no hay nada que esperar: listo y vacío.
  if (!metas || metas.length === 0) return []
  const worlds = [...new Set(metas.map(m => m.worldId))]
  if (!worlds.every(isLoaded)) return null
  const byId = new Map(worlds.flatMap(id => peek(id) ?? []).map(c => [c.id, c]))
  return metas.map(m => byId.get(m.id)).filter((c): c is Challenge => Boolean(c))
}

/**
 * Toma una selección hecha sobre metadatos y entrega el contenido completo,
 * conservando el orden que decidió el motor.
 *
 * Todo lo que devuelve va atado a la selección actual: si la selección cambia,
 * el estado vuelve a «cargando» en el mismo render, sin un fotograma con los
 * retos de la ronda anterior. Y si los mundos ya están en caché, se resuelve
 * de forma síncrona: volver a entrar no parpadea con el esqueleto.
 */
export function useChallengeSet(metas: ChallengeMeta[] | null): ChallengeSet {
  const key = keyOf(metas)
  const [attempt, setAttempt] = useState(0)
  const [loaded, setLoaded] = useState<{ key: string; challenges: Challenge[] } | null>(null)
  const [failed, setFailed] = useState<{ key: string; error: Error } | null>(null)

  // eslint-disable-next-line react-hooks/exhaustive-deps -- `key` resume la selección
  const cached = useMemo(() => resolveCached(metas), [key])

  useEffect(() => {
    if (!metas || cached) return
    let cancelled = false
    loadWorlds(metas.map(m => m.worldId))
      .then(all => {
        if (cancelled) return
        const byId = new Map(all.map(c => [c.id, c]))
        setLoaded({ key, challenges: metas.map(m => byId.get(m.id)).filter((c): c is Challenge => Boolean(c)) })
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setFailed({ key, error: e instanceof Error ? e : new Error('No se pudo cargar el contenido') })
      })
    return () => { cancelled = true }
    // `key` resume la selección; `attempt` fuerza el reintento manual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt, cached])

  if (cached) return { status: 'ready', challenges: cached, error: null, retry: () => setAttempt(a => a + 1) }
  if (failed?.key === key) return { status: 'error', challenges: [], error: failed.error, retry: () => setAttempt(a => a + 1) }
  if (loaded?.key === key) return { status: 'ready', challenges: loaded.challenges, error: null, retry: () => setAttempt(a => a + 1) }
  return { status: 'loading', challenges: [], error: null, retry: () => setAttempt(a => a + 1) }
}
