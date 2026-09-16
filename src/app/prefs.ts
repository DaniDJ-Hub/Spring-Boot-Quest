import { useSyncExternalStore } from 'react'

/**
 * Preferencias de interfaz. Van en su propia clave y no en la partida: no son
 * progreso, así que ni se exportan con el respaldo ni se pierden al borrarlo.
 */
export interface UiPrefs {
  sound: boolean
  /** Mundos cuyo desbloqueo ya se ha visto anunciado. */
  seenUnlocks: string[]
}

export const PREFS_KEY = 'sbq:ui'
const DEFAULTS: UiPrefs = { sound: false, seenUnlocks: [] }

function read(): UiPrefs {
  try {
    const raw = localStorage.getItem(PREFS_KEY)
    if (!raw) return DEFAULTS
    const parsed = JSON.parse(raw) as Partial<UiPrefs>
    return {
      sound: typeof parsed.sound === 'boolean' ? parsed.sound : DEFAULTS.sound,
      seenUnlocks: Array.isArray(parsed.seenUnlocks) ? parsed.seenUnlocks.filter(x => typeof x === 'string') : [],
    }
  } catch {
    // Sin almacenamiento o con datos ilegibles: valores por defecto, sin romper nada.
    return DEFAULTS
  }
}

let current: UiPrefs = typeof window === 'undefined' ? DEFAULTS : read()
const listeners = new Set<() => void>()

export function getPrefs(): UiPrefs {
  return current
}

export function setPrefs(patch: Partial<UiPrefs>) {
  current = { ...current, ...patch }
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(current))
  } catch {
    // La preferencia sigue viva en memoria durante la sesión.
  }
  for (const l of listeners) l()
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function usePrefs(): UiPrefs {
  return useSyncExternalStore(subscribe, getPrefs, () => DEFAULTS)
}
