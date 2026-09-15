import { useEffect, useState } from 'react'
import type { Challenge, ChallengeMeta } from '../types'
import { loadWorlds } from '../data'

type Status = 'loading' | 'ready' | 'error'

export interface ChallengeSet {
  status: Status
  challenges: Challenge[]
  error: Error | null
  retry: () => void
}

/**
 * Toma una selección hecha sobre metadatos y descarga el contenido completo de
 * los mundos implicados, conservando el orden que decidió el motor adaptativo.
 * La caché del loader hace que volver a entrar a un mundo ya visitado sea
 * instantáneo y no dispare otra petición.
 */
export function useChallengeSet(metas: ChallengeMeta[] | null): ChallengeSet {
  const [status, setStatus] = useState<Status>(metas === null || metas.length === 0 ? 'ready' : 'loading')
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const [error, setError] = useState<Error | null>(null)
  const [attempt, setAttempt] = useState(0)

  // Las claves de los mundos, en una cadena estable: evita recargar por una
  // nueva referencia de array que contiene exactamente lo mismo.
  const key = metas ? metas.map(m => m.id).join('|') : ''

  useEffect(() => {
    if (!metas || metas.length === 0) {
      setChallenges([])
      setStatus('ready')
      return
    }
    let cancelled = false
    setStatus('loading')
    setError(null)

    loadWorlds(metas.map(m => m.worldId))
      .then(all => {
        if (cancelled) return
        const byId = new Map(all.map(c => [c.id, c]))
        const ordered = metas
          .map(m => byId.get(m.id))
          .filter((c): c is Challenge => Boolean(c))
        setChallenges(ordered)
        setStatus('ready')
      })
      .catch((e: unknown) => {
        if (cancelled) return
        setError(e instanceof Error ? e : new Error('No se pudo cargar el contenido'))
        setStatus('error')
      })

    return () => { cancelled = true }
    // `key` resume la selección; `attempt` fuerza el reintento manual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, attempt])

  return { status, challenges, error, retry: () => setAttempt(a => a + 1) }
}
