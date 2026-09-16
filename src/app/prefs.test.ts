import { beforeEach, describe, expect, it } from 'vitest'
import { getPrefs, PREFS_KEY, setPrefs } from './prefs'
import { emptyState, exportState, importState, STORAGE_KEY } from '../engine/core'

beforeEach(() => {
  localStorage.clear()
  setPrefs({ sound: false, seenUnlocks: [] })
})

describe('preferencias de interfaz', () => {
  it('el sonido viene apagado', () => {
    expect(getPrefs().sound).toBe(false)
  })

  it('se guardan en su propia clave, no en la partida', () => {
    setPrefs({ sound: true })
    expect(JSON.parse(localStorage.getItem(PREFS_KEY)!).sound).toBe(true)
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
  })

  it('no viajan en el respaldo del progreso', () => {
    setPrefs({ sound: true })
    const respaldo = exportState({ ...emptyState(), xp: 10 })
    expect(respaldo).not.toContain('sound')
    const vuelta = importState(respaldo)
    expect(vuelta.ok).toBe(true)
    // Restaurar una partida no toca la configuración de la interfaz.
    expect(getPrefs().sound).toBe(true)
  })

  it('un valor ilegible no rompe nada', () => {
    localStorage.setItem(PREFS_KEY, '{{{')
    expect(() => getPrefs()).not.toThrow()
  })
})
