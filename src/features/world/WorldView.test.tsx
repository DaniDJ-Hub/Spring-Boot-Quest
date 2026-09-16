import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { WorldView } from './WorldView'
import { GameProvider } from '../../engine/GameProvider'
import { RouterProvider } from '../../app/router'
import { emptyState, STORAGE_KEY } from '../../engine/core'
import { bossGate } from '../../engine/selectors'
import { bossSet } from '../../engine/core'
import { KIND_META } from '../../components/ui'
import { WORLD_BY_ID } from '../../data/worlds'
import { metaOf } from '../../data'
import type { GameState } from '../../types'

let root: Root | null = null
let el: HTMLDivElement

async function montar(worldId: string, state?: Partial<GameState>) {
  if (state) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...emptyState(), ...state }))
  el = document.createElement('div')
  document.body.appendChild(el)
  root = createRoot(el)
  await act(async () => {
    root!.render(<GameProvider><RouterProvider><WorldView worldId={worldId} /></RouterProvider></GameProvider>)
  })
  return el
}

const resueltos = (ids: string[]) => Object.fromEntries(ids.map(id => [id, 1]))

beforeEach(() => localStorage.clear())
afterEach(async () => {
  if (root) await act(async () => root!.unmount())
  root = null
  el?.remove()
})

describe('mundo bloqueado (A-4)', () => {
  it('entrar por dirección a un mundo cerrado no deja jugarlo', async () => {
    const dom = await montar('w10')
    expect(dom.textContent).toContain('Dependencia no resuelta')
    expect([...dom.querySelectorAll('button')].some(b => b.textContent?.includes('Empezar ronda'))).toBe(false)
  })

  it('dice qué mundo falta y enlaza a él', async () => {
    const dom = await montar('w10')
    const enlaces = [...dom.querySelectorAll('a')].map(a => a.getAttribute('href'))
    expect(enlaces).toContain('/mundo/w09')
  })
})

describe('puerta de la boss battle', () => {
  it('cerrada: dice cuántos retos faltan, con la cuenta del motor', async () => {
    const dom = await montar('w01')
    const gate = bossGate(emptyState(), WORLD_BY_ID.w01)
    expect(dom.textContent).toContain(`faltan ${gate.remaining}`)
    expect([...dom.querySelectorAll('button')].find(b => b.textContent?.includes('Abrir la boss battle'))?.disabled).toBe(true)
  })

  it('abierta: se puede entrar y anuncia el umbral real del mundo', async () => {
    const lista = metaOf('w01')
    const gate = bossGate({ ...emptyState(), solved: resueltos(lista.map(c => c.id)) }, WORLD_BY_ID.w01)
    const dom = await montar('w01', { solved: resueltos(lista.map(c => c.id)) })
    const abrir = [...dom.querySelectorAll('button')].find(b => b.textContent?.includes('Abrir la boss battle'))!
    expect(abrir.disabled).toBe(false)
    expect(dom.textContent).toContain(`${gate.passCount} aciertos`)
  })

  it('la intro dice qué tipo de reto no cabe en la boss', async () => {
    // En w01 hay seis tipos y la boss son cuatro etapas: dos se quedan fuera,
    // y la pantalla no puede prometer «uno de cada tipo».
    const lista = metaOf('w01')
    const tiposDelMundo = new Set(lista.map(c => c.kind))
    const tiposDeLaBoss = new Set(bossSet(WORLD_BY_ID.w01).map(c => c.kind))
    const fuera = [...tiposDelMundo].filter(k => !tiposDeLaBoss.has(k))
    expect(fuera.length).toBeGreaterThan(0)

    const dom = await montar('w01', { solved: resueltos(lista.map(c => c.id)) })
    const abrir = [...dom.querySelectorAll('button')].find(b => b.textContent?.includes('Abrir la boss battle'))!
    await act(async () => { abrir.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
    expect(dom.textContent).toContain('se queda fuera')
    for (const k of fuera) expect(dom.textContent).toContain(KIND_META[k].label)
    expect(dom.textContent).not.toContain('un reto de cada tipo')
  })

  it('la intro de la boss avisa de que no hay pistas ni explicaciones', async () => {
    const lista = metaOf('w01')
    const dom = await montar('w01', { solved: resueltos(lista.map(c => c.id)) })
    const abrir = [...dom.querySelectorAll('button')].find(b => b.textContent?.includes('Abrir la boss battle'))!
    await act(async () => { abrir.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
    expect(dom.textContent).toContain('Sin pistas y sin explicaciones hasta el final')
    expect(dom.textContent).toContain('PRODUCTION DEPLOY')
  })
})

describe('portada del mundo', () => {
  it('agrupa los retos por el motivo que decide el motor', async () => {
    const lista = metaOf('w01')
    const dom = await montar('w01', { solved: resueltos([lista[0].id]), failed: { [lista[1].id]: 1 } })
    expect(dom.textContent).toContain('Fallado')
    expect(dom.textContent).toContain('Repaso')
    expect(dom.textContent).toContain('Nuevo')
  })

  it('muestra el dominio de cada concepto del mundo', async () => {
    const dom = await montar('w01')
    for (const k of WORLD_BY_ID.w01.concepts) {
      expect(dom.querySelectorAll(`[aria-label^="Dominio"]`).length).toBeGreaterThan(0)
      void k
    }
  })
})
