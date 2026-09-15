import { beforeEach, describe, expect, it } from 'vitest'
import { CHALLENGE_META, loadAll, loadWorld, loadWorlds, isLoaded, peek, resetCache } from './index'
import { WORLDS } from './worlds'

beforeEach(() => resetCache())

describe('carga diferida de contenido (A-3)', () => {
  it('no hay nada en memoria antes de pedirlo', () => {
    expect(isLoaded('w01')).toBe(false)
    expect(peek('w01')).toBeUndefined()
  })

  it('cargar un mundo no arrastra los demás', async () => {
    await loadWorld('w01')
    expect(isLoaded('w01')).toBe(true)
    expect(isLoaded('w15')).toBe(false)
  })

  it('dos peticiones simultáneas comparten una sola descarga', async () => {
    const [a, b] = await Promise.all([loadWorld('w03'), loadWorld('w03')])
    expect(a).toBe(b)
  })

  it('la segunda petición sale de caché', async () => {
    const a = await loadWorld('w02')
    const b = await loadWorld('w02')
    expect(a).toBe(b)
  })

  it('un mundo inexistente falla de forma explícita', async () => {
    await expect(loadWorld('w99')).rejects.toThrow(/desconocido/i)
  })

  it('loadWorlds deduplica', async () => {
    const list = await loadWorlds(['w01', 'w01', 'w02'])
    const ids = list.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })
})

describe('coherencia entre índice y contenido', () => {
  it('el índice generado coincide exactamente con los retos reales', async () => {
    const all = await loadAll()
    expect(all.length).toBe(CHALLENGE_META.length)

    const porId = new Map(all.map(c => [c.id, c]))
    for (const m of CHALLENGE_META) {
      const c = porId.get(m.id)
      expect(c, `falta el reto ${m.id}`).toBeDefined()
      expect(c!.worldId).toBe(m.worldId)
      expect(c!.kind).toBe(m.kind)
      expect(c!.difficulty).toBe(m.difficulty)
      expect(c!.xp).toBe(m.xp)
      expect(c!.concepts).toEqual(m.concepts)
    }
  })

  it('cada fichero de mundo contiene solo retos de ese mundo', async () => {
    for (const w of WORLDS) {
      const list = await loadWorld(w.id)
      expect(list.length).toBeGreaterThan(0)
      for (const c of list) expect(c.worldId).toBe(w.id)
    }
  })
})

describe('validez de cada reto', () => {
  it('todos tienen enunciado y explicación', async () => {
    for (const c of await loadAll()) {
      expect(c.prompt.length, c.id).toBeGreaterThan(10)
      expect(c.explain.length, c.id).toBeGreaterThan(10)
    }
  })

  it('la respuesta correcta existe entre las opciones', async () => {
    for (const c of await loadAll()) {
      if (c.kind === 'order' || c.kind === 'fill') continue
      const ids = c.options.map(o => o.id)
      expect(new Set(ids).size, c.id).toBe(ids.length)
      expect(ids, c.id).toContain(c.answer)
      expect(c.options.length, c.id).toBeGreaterThanOrEqual(3)
    }
  })

  it('los retos de ordenar tienen pasos suficientes y sin repetir', async () => {
    for (const c of await loadAll()) {
      if (c.kind !== 'order') continue
      expect(c.steps.length, c.id).toBeGreaterThanOrEqual(4)
      expect(new Set(c.steps).size, c.id).toBe(c.steps.length)
    }
  })

  it('los retos de completar tienen hueco y respuesta aceptada', async () => {
    for (const c of await loadAll()) {
      if (c.kind !== 'fill') continue
      expect(c.code, c.id).toMatch(/_{3,}/)
      expect(c.accept.length, c.id).toBeGreaterThan(0)
    }
  })

  it('los retos de decisión explican la consecuencia de cada opción', async () => {
    for (const c of await loadAll()) {
      if (c.kind !== 'decision') continue
      for (const o of c.options) expect(o.consequence, `${c.id}/${o.id}`).toBeTruthy()
    }
  })
})
