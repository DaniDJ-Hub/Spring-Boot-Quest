import { describe, expect, it } from 'vitest'
import { emptyState, exportState, importState, EXPORT_MARK, STATE_VERSION } from './core'
import type { GameState } from '../types'

const partida = (): GameState => ({
  ...emptyState(),
  xp: 640,
  solved: { 'w01-q1': 1, 'w04-c1': 2 },
  bossCleared: ['w01', 'w02', 'w03'],
  achievements: ['first-blood', 'w01'],
  projects: { p1: ['algo'] },
  concepts: { ioc: { attempts: 5, correct: 4, streak: 3, lastSeen: 1 } },
  streak: { count: 7, lastDay: '2026-03-01' },
})

describe('exportar progreso (M-10)', () => {
  it('produce JSON legible con cabecera identificable', () => {
    const parsed = JSON.parse(exportState(partida()))
    expect(parsed.app).toBe(EXPORT_MARK)
    expect(parsed.version).toBe(STATE_VERSION)
    expect(typeof parsed.exportedAt).toBe('string')
  })

  it('la ida y vuelta no pierde nada', () => {
    const original = partida()
    const resultado = importState(exportState(original))
    expect(resultado.ok).toBe(true)
    if (resultado.ok) expect(resultado.state).toEqual(original)
  })
})

describe('importar progreso', () => {
  it('rechaza un texto que no es JSON', () => {
    const r = importState('esto no es json')
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/JSON/i)
  })

  it('rechaza un JSON de otra aplicación', () => {
    const r = importState(JSON.stringify({ app: 'otra-cosa', state: partida() }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/Spring Boot Quest/)
  })

  it('rechaza un respaldo sin partida dentro', () => {
    const r = importState(JSON.stringify({ app: EXPORT_MARK, version: 2 }))
    expect(r.ok).toBe(false)
  })

  it('rechaza un respaldo dañado', () => {
    const r = importState(JSON.stringify({ app: EXPORT_MARK, version: 2, state: { version: 2, xp: 'muchos' } }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/incompleto|dañado/i)
  })

  it('rechaza un respaldo de una versión futura', () => {
    const r = importState(JSON.stringify({ app: EXPORT_MARK, version: 99, state: { ...partida(), version: 99 } }))
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.reason).toMatch(/versión/i)
  })

  it('acepta un respaldo antiguo aplicando las mismas migraciones', () => {
    const viejo = {
      app: EXPORT_MARK,
      version: 1,
      state: {
        version: 1, xp: 300, solved: {}, failed: {}, concepts: {},
        bossCleared: ['w01'], achievements: [], projects: {}, log: [],
        streak: { count: 2, lastDay: '2026-01-01' }, exam: null, createdAt: 1,
      },
    }
    const r = importState(JSON.stringify(viejo))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.state.xp).toBe(300)
      expect(r.state.version).toBe(STATE_VERSION)
      expect(r.state.everRed).toEqual([])
    }
  })

  it('rellena los campos que falten con los valores por defecto', () => {
    const r = importState(JSON.stringify({
      app: EXPORT_MARK, version: STATE_VERSION,
      state: { version: STATE_VERSION, xp: 50, bossCleared: [] },
    }))
    expect(r.ok).toBe(true)
    if (r.ok) {
      expect(r.state.solved).toEqual({})
      expect(r.state.concepts).toEqual({})
      expect(r.state.streak).toEqual({ count: 0, lastDay: '' })
    }
  })
})
