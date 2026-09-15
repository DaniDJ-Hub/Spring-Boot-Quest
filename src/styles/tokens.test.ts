import { describe, expect, it } from 'vitest'
import config from '../../tailwind.config.js'
import { modes, palette } from './palette.js'
import { MASTERY_META } from '../engine/core'
import type { MasteryLevel } from '../types'

/* El contraste se calcula sobre la fuente de verdad (palette.js). El config
 * sirve esos mismos valores como variables CSS, así que ya no contiene hex. */

type Grupo = Record<string, string>
const P = palette as unknown as Record<string, Grupo>
const ext = (config as unknown as { theme: { extend: Record<string, unknown> } }).theme.extend
const BOSS = modes.boss as unknown as Record<string, Grupo>

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

const MODOS = {
  base: { surface: P.surface, edge: P.edge, focus: P.focus.DEFAULT },
  boss: { surface: BOSS.surface, edge: BOSS.edge, focus: BOSS.focus.DEFAULT },
}

const TEXTOS: [string, string][] = [
  ['fg', P.fg.DEFAULT], ['fg-secondary', P.fg.secondary], ['fg-tertiary', P.fg.tertiary],
  ['accent', P.accent.DEFAULT], ['accent-bright', P.accent.bright], ['warning', P.warning.DEFAULT],
  ['danger', P.danger.DEFAULT], ['info', P.info.DEFAULT], ['locked', P.locked.DEFAULT], ['boss', P.boss.DEFAULT],
  ...Object.entries(P.mastery).map(([k, v]): [string, string] => [`mastery-${k}`, v]),
  ...Object.entries(P.rarity).map(([k, v]): [string, string] => [`rarity-${k}`, v]),
]

describe('contraste de la paleta (C-1, A-6, A-7)', () => {
  for (const [modo, { surface }] of Object.entries(MODOS)) {
    for (const [nombre, hex] of TEXTOS) {
      it(`${nombre} cumple AA sobre todas las superficies (${modo})`, () => {
        for (const [sup, fondo] of Object.entries(surface)) {
          expect(contraste(hex, fondo), `${nombre} sobre surface-${sup}`).toBeGreaterThanOrEqual(4.5)
        }
      })
    }
  }

  for (const [modo, { surface, edge, focus }] of Object.entries(MODOS)) {
    it(`el borde de control y el foco cumplen 3:1 (${modo})`, () => {
      for (const fondo of Object.values(surface)) {
        expect(contraste(edge.strong, fondo)).toBeGreaterThanOrEqual(3)
        expect(contraste(focus, fondo)).toBeGreaterThanOrEqual(3)
      }
    })
  }

  it('el texto inverso es legible sobre los rellenos de color', () => {
    for (const relleno of [P.accent.DEFAULT, P.accent.bright, P.boss.DEFAULT, P.warning.DEFAULT, P.danger.DEFAULT]) {
      expect(contraste(P.fg.inverse, relleno)).toBeGreaterThanOrEqual(4.5)
    }
  })

  it('los tonos semánticos son legibles sobre su propio fondo atenuado', () => {
    for (const g of ['accent', 'warning', 'danger', 'info', 'boss']) {
      expect(contraste(P[g].DEFAULT, P[g].dim), g).toBeGreaterThanOrEqual(4.5)
    }
  })
})

describe('jerarquía de la rampa de texto', () => {
  it('los tres pasos son distinguibles entre sí', () => {
    expect(contraste(P.fg.DEFAULT, P.fg.secondary)).toBeGreaterThan(1.3)
    expect(contraste(P.fg.secondary, P.fg.tertiary)).toBeGreaterThan(1.3)
  })

  it('van de más a menos contraste', () => {
    const c = (k: string) => contraste(P.fg[k], P.surface.DEFAULT)
    expect(c('DEFAULT')).toBeGreaterThan(c('secondary'))
    expect(c('secondary')).toBeGreaterThan(c('tertiary'))
  })
})

describe('escala de dominio (M-1)', () => {
  it('cada nivel tiene un color propio', () => {
    const valores = Object.values(P.mastery)
    expect(new Set(valores).size).toBe(valores.length)
  })

  it('cada nivel del motor apunta a un token existente', () => {
    const tokens = (ext.colors as Record<string, Grupo>).mastery
    for (const nivel of Object.keys(MASTERY_META) as MasteryLevel[]) {
      expect(tokens[nivel], nivel).toBeDefined()
      expect(MASTERY_META[nivel].dot).toBe(`bg-mastery-${nivel}`)
      expect(MASTERY_META[nivel].text).toBe(`text-mastery-${nivel}`)
    }
  })
})

describe('tokens servidos como variables', () => {
  it('cada color del config es una variable con canal de opacidad', () => {
    const colors = ext.colors as Record<string, Grupo>
    for (const [grupo, valores] of Object.entries(colors)) {
      for (const [k, v] of Object.entries(valores)) {
        expect(v, `${grupo}.${k}`).toMatch(/^rgb\(var\(--c-[a-z-]+\) \/ <alpha-value>\)$/)
      }
    }
  })

  it('el config no tiene colores que no existan en la paleta', () => {
    const colors = ext.colors as Record<string, Grupo>
    expect(Object.keys(colors).sort()).toEqual(Object.keys(P).sort())
  })

  it('los modos solo redefinen tokens que existen', () => {
    for (const [grupo, valores] of Object.entries(BOSS)) {
      for (const k of Object.keys(valores)) expect(P[grupo]?.[k], `${grupo}.${k}`).toBeDefined()
    }
  })

  it('los nombres caben en lo que check-tokens reconoce (dos segmentos)', () => {
    for (const [grupo, valores] of Object.entries(P)) {
      for (const k of Object.keys(valores)) {
        const token = k === 'DEFAULT' ? grupo : `${grupo}-${k}`
        expect(token.split('-').length, token).toBeLessThanOrEqual(2)
      }
    }
  })
})

describe('escala tipográfica y de radio', () => {
  it('la escala tipográfica tiene los pasos previstos y ninguno más', () => {
    expect(Object.keys(ext.fontSize as object).sort())
      .toEqual(['body', 'caption', 'code', 'display', 'h1', 'h2', 'h3', 'lead', 'micro'])
  })

  it('los tamaños crecen de forma estricta', () => {
    const orden = ['micro', 'caption', 'body', 'lead', 'h3', 'h2', 'h1', 'display']
    const px = (k: string) => parseFloat((ext.fontSize as Record<string, [string, unknown]>)[k][0]) * 16
    for (let i = 1; i < orden.length; i++) {
      expect(px(orden[i])).toBeGreaterThan(px(orden[i - 1]))
    }
  })

  it('el código no queda por debajo de 14 px', () => {
    const [size] = (ext.fontSize as Record<string, [string, unknown]>).code
    expect(parseFloat(size) * 16).toBeGreaterThanOrEqual(14)
  })

  it('los radios crecen con el tamaño del elemento', () => {
    const r = ext.borderRadius as Record<string, string>
    expect(parseFloat(r.sm)).toBeLessThan(parseFloat(r.md))
    expect(parseFloat(r.md)).toBeLessThan(parseFloat(r.lg))
  })
})
