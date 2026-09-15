import { describe, expect, it } from 'vitest'
import config from '../../tailwind.config.js'
import * as A from './motion'

const ext = (config as unknown as { theme: { extend: Record<string, unknown> } }).theme.extend
const tw = ext.transitionDuration as Record<string, string>
const NO_VARIANTES = new Set(['DURATION', 'EASE_OUT', 'EASE_IN_OUT', 'T', 'SPRING', 'TAP'])

describe('lenguaje de movimiento (M-2)', () => {
  it('las duraciones coinciden con los tokens de Tailwind', () => {
    for (const k of ['fast', 'base', 'slow', 'unlock'] as const) {
      expect(A.DURATION[k] * 1000, k).toBe(parseFloat(tw[k]))
    }
  })

  it('la escala es 150 / 250 / 400 ms', () => {
    expect([A.DURATION.fast, A.DURATION.base, A.DURATION.slow]).toEqual([0.15, 0.25, 0.4])
  })

  it('solo el desbloqueo supera los 400 ms, y nunca los 600', () => {
    for (const [k, d] of Object.entries(A.DURATION)) {
      if (k === 'unlock') expect(d).toBeLessThanOrEqual(0.6)
      else expect(d, k).toBeLessThanOrEqual(0.4)
    }
  })

  it('todas las variantes usan la escala, sin duraciones sueltas', () => {
    const permitidas = new Set<number>([...Object.values(A.DURATION), A.DURATION.unlock / 2])
    const revisar = (v: unknown) => {
      if (typeof v === 'function') { revisar(v('x')); revisar(v('y')); return }
      if (typeof v !== 'object' || v === null) return
      const o = v as Record<string, unknown>
      const t = o.transition as Record<string, unknown> | undefined
      if (t && typeof t.duration === 'number') expect(permitidas.has(t.duration)).toBe(true)
      for (const val of Object.values(o)) revisar(val)
    }
    for (const [nombre, variante] of Object.entries(A)) {
      if (NO_VARIANTES.has(nombre)) continue
      revisar(variante)
    }
  })

  it('solo se animan transform y opacity', () => {
    const permitidas = new Set(['opacity', 'x', 'y', 'scale', 'scaleX', 'scaleY', 'transition'])
    const revisarEstado = (estado: unknown) => {
      const e = typeof estado === 'function' ? { ...estado('x'), ...estado('y') } : estado
      if (typeof e !== 'object' || e === null) return
      for (const k of Object.keys(e)) expect(permitidas.has(k), k).toBe(true)
    }
    for (const [nombre, variante] of Object.entries(A)) {
      if (NO_VARIANTES.has(nombre)) continue
      for (const estado of Object.values(variante as Record<string, unknown>)) revisarEstado(estado)
    }
  })

  it('cada variante define entrada y estado visible', () => {
    for (const nombre of ['page', 'challenge', 'reveal', 'verdict', 'toast', 'dialogPanel', 'dialogBackdrop', 'listItem', 'masteryDown', 'pipelineStage', 'edgeGrow'] as const) {
      expect(A[nombre].hidden, nombre).toBeDefined()
      expect(A[nombre].show, nombre).toBeDefined()
    }
  })

  it('lo que puede desmontarse define también su salida', () => {
    for (const nombre of ['page', 'challenge', 'toast', 'dialogPanel', 'dialogBackdrop', 'listItem'] as const) {
      expect(A[nombre].exit, nombre).toBeDefined()
    }
  })

  it('el muelle se reserva para lo que interrumpe', () => {
    for (const nombre of ['toast', 'dialogPanel'] as const) {
      const show = A[nombre].show as { transition?: { type?: string } }
      expect(show.transition?.type, nombre).toBe('spring')
    }
    for (const nombre of ['page', 'challenge', 'listItem', 'reveal', 'verdict', 'masteryDown', 'pipelineStage'] as const) {
      const show = A[nombre].show as { transition?: { type?: string } }
      expect(show.transition?.type, nombre).not.toBe('spring')
    }
  })

  it('la bajada de dominio no sacude: sin desplazamiento lateral ni escala', () => {
    const show = A.masteryDown.show as Record<string, unknown>
    expect(show.x).toBeUndefined()
    expect(show.scale).toBeUndefined()
  })

  it('el escalonado es discreto', () => {
    const show = A.staggered.show as { transition?: { staggerChildren?: number } }
    expect(show.transition?.staggerChildren).toBeLessThanOrEqual(0.08)
  })
})
