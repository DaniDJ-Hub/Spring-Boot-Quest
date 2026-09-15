import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { Dashboard } from './Dashboard'
import { GameProvider } from '../../engine/GameProvider'
import { RouterProvider } from '../../app/router'
import { emptyState, STORAGE_KEY } from '../../engine/core'

let root: Root | null = null
let el: HTMLDivElement

async function montar() {
  el = document.createElement('div')
  document.body.appendChild(el)
  root = createRoot(el)
  await act(async () => {
    root!.render(<GameProvider><RouterProvider><Dashboard /></RouterProvider></GameProvider>)
  })
  return el
}

beforeEach(() => localStorage.clear())
afterEach(async () => {
  if (root) await act(async () => root!.unmount())
  root = null
  el?.remove()
})

describe('primera visita (M-7)', () => {
  it('sin actividad muestra la bienvenida, no un panel de ceros', async () => {
    const dom = await montar()
    expect(dom.textContent).toContain('Primera vez por aquí')
    expect(dom.textContent).not.toContain('XP acumulado')
  })

  it('ofrece un punto de entrada claro al primer mundo', async () => {
    const dom = await montar()
    const enlace = [...dom.querySelectorAll('a')].find(a => a.textContent?.startsWith('Empezar por'))
    expect(enlace).toBeDefined()
    expect(enlace!.getAttribute('href')).toBe('/mundo/w01')
  })

  it('avisa de dónde se guarda el progreso', async () => {
    const dom = await montar()
    expect(dom.textContent).toContain('se guarda en este navegador')
  })

  it('con progreso guardado muestra el panel normal', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...emptyState(), xp: 120, solved: { 'w01-q1': 1 },
      log: [{ challengeId: 'w01-q1', worldId: 'w01', correct: true, at: Date.now() }],
    }))
    const dom = await montar()
    expect(dom.textContent).toContain('XP acumulado')
    expect(dom.textContent).not.toContain('Primera vez por aquí')
  })

  it('el panel enlaza cada mundo por su dirección', async () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...emptyState(), xp: 10, solved: { 'w01-q1': 1 } }))
    const dom = await montar()
    const hrefs = [...dom.querySelectorAll('a')].map(a => a.getAttribute('href'))
    expect(hrefs).toContain('/mundo/w05')
    expect(hrefs).toContain('/mundo/w15')
  })
})
