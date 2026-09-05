import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ReactNode } from 'react'
import type { Challenge, GameState } from '../types'
import { ACHIEVEMENTS, CHALLENGES, PROJECTS } from '../data'
import { WORLDS } from '../data/worlds'
import {
  bumpStreak, emptyState, loadState, masteryOf, saveState, todayKey,
} from './core'

interface Ctx {
  state: GameState
  answer: (c: Challenge, correct: boolean, usedHint: boolean) => void
  clearBoss: (worldId: string, perfect: boolean) => void
  toggleProjectItem: (projectId: string, item: string) => void
  saveExam: (score: number, total: number, byWorld: Record<string, [number, number]>) => void
  reset: () => void
  toasts: { id: number; title: string; detail: string; icon: string }[]
  dismissToast: (id: number) => void
}

const GameContext = createContext<Ctx | null>(null)

const CONCEPTS_OF = {
  di: WORLDS.find(w => w.id === 'w04')!.concepts,
  jpaRel: WORLDS.find(w => w.id === 'w10')!.concepts,
  sec: WORLDS.find(w => w.id === 'w12')!.concepts,
}

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>(() => emptyState())
  const [toasts, setToasts] = useState<Ctx['toasts']>([])
  const hydrated = useRef(false)
  const noHintRun = useRef(0)
  const wasRed = useRef<Set<string>>(new Set())

  useEffect(() => {
    setState(loadState())
    hydrated.current = true
  }, [])

  useEffect(() => {
    if (hydrated.current) saveState(state)
  }, [state])

  const push = useCallback((ids: string[]) => {
    const found = ids
      .map(id => ACHIEVEMENTS.find(a => a.id === id))
      .filter((a): a is (typeof ACHIEVEMENTS)[number] => Boolean(a))
    if (!found.length) return
    setToasts(t => [
      ...t,
      ...found.map(a => ({ id: Date.now() + Math.random(), title: a.title, detail: a.detail, icon: a.icon })),
    ])
  }, [])

  /** Revisa qué logros se desbloquean con el estado nuevo. */
  const evaluate = useCallback((s: GameState, extra: string[] = []): GameState => {
    const got = new Set(s.achievements)
    const add = (id: string, cond: boolean) => { if (cond && !got.has(id)) got.add(id) }

    const solvedCount = Object.values(s.solved).filter(v => v > 0).length
    const kindCount = (kinds: string[]) =>
      CHALLENGES.filter(c => kinds.includes(c.kind) && (s.solved[c.id] ?? 0) > 0).length
    const allGreen = (concepts: string[]) =>
      concepts.every(c => ['mastered', 'expert'].includes(masteryOf(s, c)))

    add('first-blood', solvedCount >= 1)
    add('grinder', solvedCount >= 100)
    add('streak-3', s.streak.count >= 3)
    add('streak-7', s.streak.count >= 7)
    add('debugger', kindCount(['debug']) >= 10)
    add('architect', kindCount(['decision', 'arch']) >= 10)
    add('di-master', allGreen(CONCEPTS_OF.di))
    add('jpa-master', allGreen(CONCEPTS_OF.jpaRel))
    add('sec-master', allGreen(CONCEPTS_OF.sec))
    add('w01', s.bossCleared.includes('w01'))
    add('half', s.bossCleared.length >= 8)
    add('all-worlds', s.bossCleared.length >= WORLDS.length)
    add('no-hints', noHintRun.current >= 20)
    add('exam', s.exam !== null)
    add('exam-90', s.exam !== null && s.exam.score / Math.max(1, s.exam.total) >= 0.9)
    add('builder', PROJECTS.some(p => (s.projects[p.id]?.length ?? 0) >= p.requirements.length))
    for (const id of extra) add(id, true)

    const fresh = [...got].filter(id => !s.achievements.includes(id))
    if (fresh.length) push(fresh)
    return fresh.length ? { ...s, achievements: [...got] } : s
  }, [push])

  const answer = useCallback((c: Challenge, correct: boolean, usedHint: boolean) => {
    noHintRun.current = correct && !usedHint ? noHintRun.current + 1 : 0

    setState(prev => {
      const concepts = { ...prev.concepts }
      const comeback: string[] = []
      for (const k of c.concepts) {
        const before = masteryOf(prev, k)
        if (before === 'none' || before === 'basic') wasRed.current.add(k)
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
        xp: prev.xp + (correct ? (usedHint ? Math.round(c.xp * 0.6) : c.xp) : 0),
        solved: correct ? { ...prev.solved, [c.id]: (prev.solved[c.id] ?? 0) + 1 } : prev.solved,
        failed: correct ? prev.failed : { ...prev.failed, [c.id]: (prev.failed[c.id] ?? 0) + 1 },
        streak: bumpStreak(prev.streak),
        log: [{ challengeId: c.id, worldId: c.worldId, correct, at: Date.now() }, ...prev.log].slice(0, 200),
      }

      for (const k of c.concepts) {
        if (wasRed.current.has(k) && ['mastered', 'expert'].includes(masteryOf(draft, k))) {
          comeback.push('comeback')
          wasRed.current.delete(k)
        }
      }
      return evaluate(draft, comeback)
    })
  }, [evaluate])

  const clearBoss = useCallback((worldId: string, perfect: boolean) => {
    setState(prev => {
      const world = WORLDS.find(w => w.id === worldId)
      const bonus = world ? 40 + world.index * 10 : 40
      const draft: GameState = {
        ...prev,
        xp: prev.xp + (prev.bossCleared.includes(worldId) ? 0 : bonus),
        bossCleared: prev.bossCleared.includes(worldId) ? prev.bossCleared : [...prev.bossCleared, worldId],
        streak: bumpStreak(prev.streak),
      }
      return evaluate(draft, perfect ? ['perfect-boss'] : [])
    })
  }, [evaluate])

  const toggleProjectItem = useCallback((projectId: string, item: string) => {
    setState(prev => {
      const cur = prev.projects[projectId] ?? []
      const next = cur.includes(item) ? cur.filter(i => i !== item) : [...cur, item]
      return evaluate({ ...prev, projects: { ...prev.projects, [projectId]: next } })
    })
  }, [evaluate])

  const saveExam = useCallback((score: number, total: number, byWorld: Record<string, [number, number]>) => {
    setState(prev => evaluate({
      ...prev,
      exam: { score, total, at: Date.now(), byWorld },
      xp: prev.xp + score * 12,
      streak: bumpStreak(prev.streak),
    }))
  }, [evaluate])

  const reset = useCallback(() => {
    noHintRun.current = 0
    wasRed.current = new Set()
    const fresh = emptyState()
    fresh.streak = { count: 1, lastDay: todayKey() }
    setState(fresh)
  }, [])

  const dismissToast = useCallback((id: number) => {
    setToasts(t => t.filter(x => x.id !== id))
  }, [])

  const value = useMemo<Ctx>(
    () => ({ state, answer, clearBoss, toggleProjectItem, saveExam, reset, toasts, dismissToast }),
    [state, answer, clearBoss, toggleProjectItem, saveExam, reset, toasts, dismissToast],
  )

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>
}

export function useGame(): Ctx {
  const ctx = useContext(GameContext)
  if (!ctx) throw new Error('useGame debe usarse dentro de GameProvider')
  return ctx
}
