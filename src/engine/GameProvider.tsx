import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Challenge, GameState } from '../types'
import { ActionsContext, StateContext, ToastsContext } from './game-context'
import type { ActionsCtx, StateCtx, Toast, ToastsCtx } from './game-context'
import { ACHIEVEMENTS } from '../data'
import { WORLDS } from '../data/worlds'
import { bumpStreak, createSaver, emptyState, loadState, LOG_LIMIT, masteryOf, todayKey } from './core'
import { achievementsFor } from './achievements'

export function GameProvider({ children }: { children: ReactNode }) {
  // localStorage se lee en el inicializador, que es síncrono: el primer fotograma
  // ya muestra el progreso real en vez de un panel en cero.
  const [session, setSession] = useState(() =>
    typeof window === 'undefined' ? { state: emptyState(), rescued: false } : loadState(),
  )
  const { state, rescued } = session
  const [toasts, setToasts] = useState<Toast[]>([])
  const saver = useRef(createSaver())
  const seen = useRef<Set<string> | null>(null)

  const setState = useCallback((fn: (prev: GameState) => GameState) => {
    setSession(s => ({ ...s, state: fn(s.state) }))
  }, [])

  // Guardado con retardo: una ráfaga de respuestas produce una sola escritura.
  useEffect(() => {
    if (typeof window === 'undefined') return
    const s = saver.current
    s.schedule(state)
    const onLeave = () => s.flush()
    window.addEventListener('pagehide', onLeave)
    return () => {
      window.removeEventListener('pagehide', onLeave)
      s.flush()
    }
  }, [state])

  // Los toasts se emiten aquí, comparando con lo ya visto. Al hidratar solo se
  // registra lo que había, sin anunciar logros viejos.
  useEffect(() => {
    if (seen.current === null) {
      seen.current = new Set(state.achievements)
      return
    }
    const fresh = state.achievements.filter(id => !seen.current!.has(id))
    if (!fresh.length) return
    for (const id of fresh) seen.current.add(id)
    const found = fresh
      .map(id => ACHIEVEMENTS.find(a => a.id === id))
      .filter((a): a is (typeof ACHIEVEMENTS)[number] => Boolean(a))
    if (found.length) {
      setToasts(t => [
        ...t,
        ...found.map(a => ({ id: Date.now() + Math.random(), title: a.title, detail: a.detail, icon: a.icon })),
      ])
    }
  }, [state.achievements])

  const answer = useCallback((c: Challenge, correct: boolean, usedHint: boolean) => {
    setState(prev => {
      const concepts = { ...prev.concepts }
      const everRed = new Set(prev.everRed)

      for (const k of c.concepts) {
        const before = masteryOf(prev, k)
        if (before === 'none' || before === 'basic') everRed.add(k)
        const s = concepts[k] ?? { attempts: 0, correct: 0, streak: 0, lastSeen: 0 }
        concepts[k] = {
          attempts: s.attempts + 1,
          correct: s.correct + (correct ? 1 : 0),
          streak: correct ? s.streak + 1 : 0,
          lastSeen: Date.now(),
        }
      }

      const draft: GameState = {
        ...prev,
        concepts,
        everRed: [...everRed],
        noHintRun: correct && !usedHint ? prev.noHintRun + 1 : 0,
        xp: prev.xp + (correct ? (usedHint ? Math.round(c.xp * 0.6) : c.xp) : 0),
        solved: correct ? { ...prev.solved, [c.id]: (prev.solved[c.id] ?? 0) + 1 } : prev.solved,
        failed: correct ? prev.failed : { ...prev.failed, [c.id]: (prev.failed[c.id] ?? 0) + 1 },
        streak: bumpStreak(prev.streak),
        log: [{ challengeId: c.id, worldId: c.worldId, correct, at: Date.now() }, ...prev.log].slice(0, LOG_LIMIT),
      }
      return { ...draft, achievements: achievementsFor(draft) }
    })
  }, [setState])

  const clearBoss = useCallback((worldId: string, perfect: boolean) => {
    setState(prev => {
      const world = WORLDS.find(w => w.id === worldId)
      const already = prev.bossCleared.includes(worldId)
      const bonus = world ? 40 + world.index * 10 : 40
      const draft: GameState = {
        ...prev,
        xp: prev.xp + (already ? 0 : bonus),
        bossCleared: already ? prev.bossCleared : [...prev.bossCleared, worldId],
        streak: bumpStreak(prev.streak),
      }
      return { ...draft, achievements: achievementsFor(draft, perfect ? ['perfect-boss'] : []) }
    })
  }, [setState])

  const toggleProjectItem = useCallback((projectId: string, item: string) => {
    setState(prev => {
      const cur = prev.projects[projectId] ?? []
      const next = cur.includes(item) ? cur.filter(i => i !== item) : [...cur, item]
      const draft: GameState = { ...prev, projects: { ...prev.projects, [projectId]: next } }
      return { ...draft, achievements: achievementsFor(draft) }
    })
  }, [setState])

  const saveExam = useCallback((score: number, total: number, byWorld: Record<string, [number, number]>) => {
    setState(prev => {
      const draft: GameState = {
        ...prev,
        exam: { score, total, at: Date.now(), byWorld },
        xp: prev.xp + score * 12,
        streak: bumpStreak(prev.streak),
      }
      return { ...draft, achievements: achievementsFor(draft) }
    })
  }, [setState])

  const reset = useCallback(() => {
    const fresh = emptyState()
    fresh.streak = { count: 1, lastDay: todayKey() }
    seen.current = new Set()
    setSession({ state: fresh, rescued: false })
  }, [])

  const replaceState = useCallback((next: GameState) => {
    // Los logros importados ya se consideran vistos: no tiene sentido anunciar
    // de golpe todo lo que la persona consiguió en su otro navegador.
    seen.current = new Set(next.achievements)
    setSession({ state: next, rescued: false })
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const stateValue = useMemo<StateCtx>(() => ({ state, rescued }), [state, rescued])
  const actionsValue = useMemo<ActionsCtx>(
    () => ({ answer, clearBoss, toggleProjectItem, saveExam, reset, replaceState }),
    [answer, clearBoss, toggleProjectItem, saveExam, reset, replaceState],
  )
  const toastsValue = useMemo<ToastsCtx>(() => ({ toasts, dismissToast }), [toasts, dismissToast])

  return (
    <StateContext.Provider value={stateValue}>
      <ActionsContext.Provider value={actionsValue}>
        <ToastsContext.Provider value={toastsValue}>{children}</ToastsContext.Provider>
      </ActionsContext.Provider>
    </StateContext.Provider>
  )
}
