import { describe, expect, it } from 'vitest'
import config from '../../tailwind.config.js'
import * as A from './motion'

const tw = config.theme.extend.transitionDuration as Record<string, string>

describe('sistema de animación centralizado (M-2)', () => {
  it('las duraciones coinciden con los tokens de Tailwind', () => {
    for (const k of ['instant', 'quick', 'smooth'] as const) {
      expect(A.DURATION[k] * 1000).toBe(parseFloat(tw[k]))
    }
  })

  it('no hay animaciones largas: nada por encima de 300 ms', () => {
    for (const d of Object.values(A.DURATION)) expect(d).toBeLessThanOrEqual(0.3)
  })

  it('todas las variantes usan la escala, sin duraciones sueltas', () => {
    const permitidas = new Set<number>(Object.values(A.DURATION))
    const revisar = (v: unknown) => {
      if (typeof v !== 'object' || v === null) return
      const o = v as Record<string, unknown>
      const t = o.transition as Record<string, unknown> | undefined
      if (t && typeof t.duration === 'number') expect(permitidas.has(t.duration)).toBe(true)
      for (const val of Object.values(o)) revisar(val)
    }
    for (const [nombre, variante] of Object.entries(A)) {
      if (nombre === 'DURATION' || nombre === 'EASE' || nombre === 'T' || nombre === 'SPRING' || nombre === 'TAP') continue
      revisar(variante)
    }
  })

  it('cada variante define entrada y estado visible', () => {
    for (const nombre of ['page', 'challenge', 'toast', 'dialogPanel', 'dialogBackdrop', 'listItem', 'reveal'] as const) {
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
    const conMuelle = ['toast', 'dialogPanel'] as const
    for (const nombre of conMuelle) {
      const show = A[nombre].show as { transition?: { type?: string } }
      expect(show.transition?.type, nombre).toBe('spring')
    }
    const sinMuelle = ['page', 'challenge', 'listItem', 'reveal'] as const
    for (const nombre of sinMuelle) {
      const show = A[nombre].show as { transition?: { type?: string } }
      expect(show.transition?.type, nombre).not.toBe('spring')
    }
  })

  it('el escalonado es discreto', () => {
    const show = A.staggered.show as { transition?: { staggerChildren?: number } }
    expect(show.transition?.staggerChildren).toBeLessThanOrEqual(0.05)
  })
})
