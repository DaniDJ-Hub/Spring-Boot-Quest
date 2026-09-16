import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import type { ReactNode } from 'react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MASTERY_ORDER } from '../../engine/core'
import { Button } from './Button'
import { MasteryMeter } from './Mastery'
import { Toasts } from './Toasts'
import { Bar } from './Progress'

let root: Root | null = null
let el: HTMLDivElement

async function montar(node: ReactNode) {
  el = document.createElement('div')
  document.body.appendChild(el)
  root = createRoot(el)
  await act(async () => root!.render(node))
  return el
}

afterEach(async () => {
  if (root) await act(async () => root!.unmount())
  root = null
  el?.remove()
  vi.useRealTimers()
})

describe('medidor de dominio', () => {
  it('cada nivel se distingue sin color: segmentos llenos y etiqueta', async () => {
    const etiquetas = new Set<string>()
    for (const [i, level] of MASTERY_ORDER.entries()) {
      const dom = await montar(<MasteryMeter level={level} />)
      const img = dom.querySelector('[role="img"]')!
      const label = img.getAttribute('aria-label')!
      expect(label).toContain(`(${i} de 4)`)
      etiquetas.add(label)
      await act(async () => root!.unmount())
      root = null
    }
    expect(etiquetas.size).toBe(MASTERY_ORDER.length)
  })

  it('una bajada se anuncia con texto, no solo con color', async () => {
    const dom = await montar(<MasteryMeter level="progress" previous="expert" showLabel />)
    expect(dom.querySelector('[role="img"]')!.getAttribute('aria-label')).toContain('bajó desde Experto')
    expect(dom.textContent).toContain('Bajó a En progreso')
  })
})

describe('botón', () => {
  it('en carga queda ocupado y no admite otra pulsación', async () => {
    const onClick = vi.fn()
    const dom = await montar(<Button loading onClick={onClick}>Guardar</Button>)
    const b = dom.querySelector('button')!
    expect(b.getAttribute('aria-busy')).toBe('true')
    expect(b.disabled).toBe(true)
  })

  it('deshabilitado no depende de la opacidad', async () => {
    const dom = await montar(<Button disabled>Comprobar</Button>)
    expect(dom.querySelector('button')!.className).not.toMatch(/opacity-/)
  })
})

describe('barra de progreso', () => {
  it('expone el valor al lector y acota fuera de rango', async () => {
    const dom = await montar(<Bar pct={140} label="Retos resueltos" />)
    const bar = dom.querySelector('[role="progressbar"]')!
    expect(bar.getAttribute('aria-valuenow')).toBe('100')
  })

  it('sin etiqueta es decorativa', async () => {
    const dom = await montar(<Bar pct={40} />)
    expect(dom.querySelector('[role="progressbar"]')).toBeNull()
  })
})

describe('avisos de logro', () => {
  const aviso = (id: number) => ({ id, title: 'Primer acierto', detail: 'Resolviste tu primer reto.', icon: '◆' })

  it('se cierran solos pasado un tiempo', async () => {
    vi.useFakeTimers()
    const dismiss = vi.fn()
    await montar(<Toasts items={[aviso(1)]} dismiss={dismiss} />)
    await act(async () => { vi.advanceTimersByTime(6100) })
    expect(dismiss).toHaveBeenCalledWith(1)
  })

  it('no muestran más de tres a la vez', async () => {
    const dom = await montar(<Toasts items={[1, 2, 3, 4, 5].map(aviso)} dismiss={() => {}} />)
    expect(dom.querySelectorAll('[aria-label^="Logro desbloqueado"]').length).toBe(3)
  })

  it('llevan la rareza como texto', async () => {
    const dom = await montar(<Toasts items={[aviso(1)]} dismiss={() => {}} />)
    expect(dom.textContent).toContain('SNAPSHOT')
  })
})
