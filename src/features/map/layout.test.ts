import { describe, expect, it } from 'vitest'
import { WORLDS } from '../../data/worlds'
import { layerOf, layout } from './layout'

describe('capas del grafo de dependencias', () => {
  const layers = layerOf(WORLDS)

  it('todo mundo queda por debajo de aquello de lo que depende', () => {
    for (const w of WORLDS) {
      for (const r of w.requires) {
        expect(layers.get(w.id)!, `${w.id} sobre ${r}`).toBeGreaterThan(layers.get(r)!)
      }
    }
  })

  it('las raíces están en la capa cero', () => {
    for (const w of WORLDS) if (!w.requires.length) expect(layers.get(w.id)).toBe(0)
  })

  it('no usa la profundidad declarada, que no sirve como capa', () => {
    // w03 depende de w02 y los dos declaran depth 1.
    expect(layers.get('w03')).toBeGreaterThan(layers.get('w02')!)
  })

  it('la disposición contiene los quince mundos, sin repetir', () => {
    const rows = layout(WORLDS)
    const ids = rows.flat().map(w => w.id)
    expect(new Set(ids).size).toBe(WORLDS.length)
    expect(ids.length).toBe(WORLDS.length)
  })

  it('es estable: dos llamadas dan el mismo orden', () => {
    expect(layout(WORLDS).map(r => r.map(w => w.id))).toEqual(layout(WORLDS).map(r => r.map(w => w.id)))
  })

  it('un ciclo o un requisito inexistente no rompen el cálculo', () => {
    const rotos = [
      { ...WORLDS[0], id: 'a', requires: ['b'] },
      { ...WORLDS[0], id: 'b', requires: ['a'] },
      { ...WORLDS[0], id: 'c', requires: ['zz'] },
    ]
    expect(() => layout(rotos)).not.toThrow()
    expect(layerOf(rotos).size).toBe(3)
  })
})
