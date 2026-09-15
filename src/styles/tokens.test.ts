import { describe, expect, it } from 'vitest'
import config from '../../tailwind.config.js'
import { MASTERY_META } from '../engine/core'
import type { MasteryLevel } from '../types'

const colors = config.theme.extend.colors as Record<string, Record<string, string> | string>

function luminancia(hex: string) {
  const n = hex.replace('#', '')
  const [r, g, b] = [0, 2, 4].map(i => {
    const c = parseInt(n.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}
function contraste(a: string, b: string) {
  const [x, y] = [luminancia(a), luminancia(b)]
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05)
}

const FONDOS = {
  surface: '#151A2D',
  raised: '#1E2540',
  sunken: '#0F1322',
}

describe('contraste de la paleta (C-1, A-6, A-7)', () => {
  const texto = ['DEFAULT', 'secondary', 'tertiary'] as const
  for (const k of texto) {
    for (const [nombre, fondo] of Object.entries(FONDOS)) {
      it(`fg-${k} cumple AA sobre ${nombre}`, () => {
        const c = contraste((colors.fg as Record<string, string>)[k], fondo)
        expect(c).toBeGreaterThanOrEqual(4.5)
      })
    }
  }

  for (const semantico of ['accent', 'warning', 'danger', 'info'] as const) {
    for (const [nombre, fondo] of Object.entries(FONDOS)) {
      it(`${semantico} cumple AA sobre ${nombre}`, () => {
        const c = contraste((colors[semantico] as Record<string, string>).DEFAULT, fondo)
        expect(c).toBeGreaterThanOrEqual(4.5)
      })
    }
  }

  it('el borde de control cumple el mínimo de elementos de interfaz', () => {
    for (const fondo of Object.values(FONDOS)) {
      expect(contraste((colors.edge as Record<string, string>).strong, fondo)).toBeGreaterThanOrEqual(3)
    }
  })
})

describe('jerarquía de la rampa de texto', () => {
  it('los tres pasos son distinguibles entre sí', () => {
    const fg = colors.fg as Record<string, string>
    expect(contraste(fg.DEFAULT, fg.secondary)).toBeGreaterThan(1.3)
    expect(contraste(fg.secondary, fg.tertiary)).toBeGreaterThan(1.3)
  })

  it('van de más a menos contraste', () => {
    const fg = colors.fg as Record<string, string>
    const c = (k: string) => contraste(fg[k], FONDOS.surface)
    expect(c('DEFAULT')).toBeGreaterThan(c('secondary'))
    expect(c('secondary')).toBeGreaterThan(c('tertiary'))
  })
})

describe('escala de dominio (M-1)', () => {
  const mastery = colors.mastery as Record<string, string>

  it('cada nivel tiene un color propio', () => {
    const valores = Object.values(mastery)
    expect(new Set(valores).size).toBe(valores.length)
  })

  it('todos los niveles son legibles sobre un panel', () => {
    for (const [nivel, hex] of Object.entries(mastery)) {
      expect(contraste(hex, FONDOS.raised), nivel).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('cada nivel del motor apunta a un token existente', () => {
    for (const nivel of Object.keys(MASTERY_META) as MasteryLevel[]) {
      expect(mastery[nivel], nivel).toBeDefined()
      expect(MASTERY_META[nivel].dot).toBe(`bg-mastery-${nivel}`)
      expect(MASTERY_META[nivel].text).toBe(`text-mastery-${nivel}`)
    }
  })
})

describe('escala tipográfica y de radio', () => {
  it('la escala tipográfica tiene los pasos previstos y ninguno más', () => {
    expect(Object.keys(config.theme.extend.fontSize).sort())
      .toEqual(['body', 'caption', 'code', 'h1', 'h2', 'h3', 'lead', 'micro'])
  })

  it('los tamaños crecen de forma estricta', () => {
    const orden = ['micro', 'caption', 'body', 'lead', 'h3', 'h2', 'h1']
    const px = (k: string) => parseFloat((config.theme.extend.fontSize as Record<string, [string, unknown]>)[k][0]) * 16
    for (let i = 1; i < orden.length; i++) {
      expect(px(orden[i])).toBeGreaterThan(px(orden[i - 1]))
    }
  })

  it('los radios crecen con el tamaño del elemento', () => {
    const r = config.theme.extend.borderRadius as Record<string, string>
    expect(parseFloat(r.sm)).toBeLessThan(parseFloat(r.md))
    expect(parseFloat(r.md)).toBeLessThan(parseFloat(r.lg))
  })
})
