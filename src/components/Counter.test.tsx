import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Counter } from './Counter'

let root: Root | null = null
let el: HTMLDivElement

async function montar(value: number) {
  el = document.createElement('div')
  document.body.appendChild(el)
  root = createRoot(el)
  await act(async () => root!.render(<Counter value={value} />))
  return el
}

afterEach(async () => {
  if (root) await act(async () => root!.unmount())
  root = null
  el?.remove()
  vi.unstubAllGlobals()
})

describe('contador de XP', () => {
  it('muestra el valor inicial sin animar', async () => {
    const dom = await montar(120)
    expect(dom.textContent).toBe('120')
  })

  it('el valor real siempre está disponible para un lector de pantalla', async () => {
    const dom = await montar(120)
    expect(dom.querySelector('[aria-label]')?.getAttribute('aria-label')).toBe('120')
    await act(async () => root!.render(<Counter value={260} />))
    // El aria-label salta al valor final aunque la cifra visible aún interpole:
    // nadie debería oír una cuenta atrás.
    expect(dom.querySelector('[aria-label]')?.getAttribute('aria-label')).toBe('260')
  })

  it('acaba llegando al valor nuevo', async () => {
    const dom = await montar(0)
    await act(async () => root!.render(<Counter value={45} />))
    await act(async () => { await new Promise(r => setTimeout(r, 900)) })
    expect(dom.textContent).toBe('45')
  })

  it('la cifra visible se oculta al lector para no duplicar la lectura', async () => {
    const dom = await montar(10)
    expect(dom.querySelector('[aria-hidden="true"]')).not.toBeNull()
  })
})
