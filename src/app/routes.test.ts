import { describe, expect, it } from 'vitest'
import { fromPath, toPath } from './routes'
import type { Route } from './routes'
import { WORLDS } from '../data/worlds'

const TODAS: Route[] = [
  { name: 'panel' }, { name: 'mapa' }, { name: 'proyectos' },
  { name: 'logros' }, { name: 'refuerzo' }, { name: 'examen' },
  { name: 'mundo', worldId: 'w07' },
]

describe('rutas (A-1)', () => {
  it('cada ruta sobrevive a la ida y vuelta', () => {
    for (const r of TODAS) expect(fromPath(toPath(r))).toEqual(r)
  })

  it('la raíz es el panel', () => {
    expect(fromPath('/')).toEqual({ name: 'panel' })
    expect(toPath({ name: 'panel' })).toBe('/')
  })

  it('los quince mundos tienen dirección propia', () => {
    for (const w of WORLDS) {
      expect(toPath({ name: 'mundo', worldId: w.id })).toBe(`/mundo/${w.id}`)
    }
  })

  it('tolera barras sobrantes', () => {
    expect(fromPath('//mapa//')).toEqual({ name: 'mapa' })
    expect(fromPath('/mundo/w03/')).toEqual({ name: 'mundo', worldId: 'w03' })
  })

  it('una ruta desconocida cae en el panel, no en un error', () => {
    expect(fromPath('/no-existe')).toEqual({ name: 'panel' })
  })

  it('/mundo sin identificador lleva al mapa', () => {
    expect(fromPath('/mundo')).toEqual({ name: 'mapa' })
  })
})
