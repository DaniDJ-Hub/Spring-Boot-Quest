import { useRef } from 'react'
import type { Challenge, GameState } from '../../types'
import { useGameState } from '../../engine/game-context'
import { levelProgress } from '../../engine/core'
import { masteryDelta } from '../../engine/selectors'
import type { MasteryChange } from '../../engine/selectors'

/** Congela el estado al entrar: el resumen compara contra él, sin recalcular reglas. */
export function useRoundSnapshot(): GameState {
  const { state } = useGameState()
  const snapshot = useRef(state)
  return snapshot.current
}

export interface RoundChanges {
  changes: MasteryChange[]
  xp: number
  newAchievements: string[]
  levelUp: number | null
}

/** Qué se movió durante la ronda: XP, dominio, logros y nivel. */
export function useRoundChanges({ before, answered }: { before: GameState; answered: Challenge[] }): RoundChanges {
  const { state } = useGameState()
  const concepts = answered.flatMap(c => c.concepts)
  const known = new Set(before.achievements)
  const level = levelProgress(state.xp).level
  return {
    changes: masteryDelta(before, state, concepts).filter(c => c.direction !== 'same'),
    xp: state.xp - before.xp,
    newAchievements: state.achievements.filter(a => !known.has(a)),
    levelUp: level > levelProgress(before.xp).level ? level : null,
  }
}
