import { createContext, useContext } from 'react'
import type { Challenge, GameState } from '../types'

/** Lo que cambia en cada respuesta. */
export interface StateCtx {
  state: GameState
  /** True cuando se encontró una partida guardada que no se pudo migrar. */
  rescued: boolean
}

/** Referencias estables: quien solo despacha acciones no se re-renderiza. */
export interface ActionsCtx {
  answer: (c: Challenge, correct: boolean, usedHint: boolean) => void
  clearBoss: (worldId: string, perfect: boolean) => void
  toggleProjectItem: (projectId: string, item: string) => void
  saveExam: (score: number, total: number, byWorld: Record<string, [number, number]>) => void
  reset: () => void
  /** Sustituye la partida entera por una importada de un respaldo. */
  replaceState: (s: GameState) => void
}

export interface Toast { id: number; title: string; detail: string; icon: string }

export interface ToastsCtx {
  toasts: Toast[]
  dismissToast: (id: number) => void
}

// Tres contextos en vez de uno: un logro nuevo ya no re-renderiza el mapa,
// y un componente que solo llama a `answer` no se re-renderiza al cambiar el XP.
export const StateContext = createContext<StateCtx | null>(null)
export const ActionsContext = createContext<ActionsCtx | null>(null)
export const ToastsContext = createContext<ToastsCtx | null>(null)

function use<T>(ctx: React.Context<T | null>, nombre: string): T {
  const v = useContext(ctx)
  if (!v) throw new Error(`${nombre} debe usarse dentro de GameProvider`)
  return v
}

export const useGameState = () => use(StateContext, 'useGameState')
export const useGameActions = () => use(ActionsContext, 'useGameActions')
export const useToasts = () => use(ToastsContext, 'useToasts')

/** Comodidad para componentes que necesitan ambas mitades. */
export function useGame() {
  return { ...useGameState(), ...useGameActions() }
}
