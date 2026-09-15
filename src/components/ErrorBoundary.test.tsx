import { act } from 'react'
import { createRoot } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ErrorBoundary } from './ErrorBoundary'

const Boom = ({ explota }: { explota: boolean }) => {
  if (explota) throw new Error('fallo simulado en un reto')
  return <p>contenido normal</p>
}

let limpiar: (() => void) | null = null
afterEach(() => { limpiar?.(); limpiar = null })

async function montar(explota: boolean) {
  const el = document.createElement('div')
  document.body.appendChild(el)
  const root = createRoot(el)
  const spy = vi.spyOn(console, 'error').mockImplementation(() => {})
  await act(async () => root.render(<ErrorBoundary><Boom explota={explota} /></ErrorBoundary>))
  spy.mockRestore()
  limpiar = () => { act(() => root.unmount()); el.remove() }
  return el
}

describe('error boundary (C-4)', () => {
  it('no interfiere cuando no hay error', async () => {
    const el = await montar(false)
    expect(el.textContent).toContain('contenido normal')
  })

  it('captura el fallo en vez de dejar la pantalla en blanco', async () => {
    const el = await montar(true)
    expect(el.textContent).toContain('Algo se rompió')
    expect(el.textContent!.length).toBeGreaterThan(100)
  })

  it('muestra el mensaje del error para poder reportarlo', async () => {
    const el = await montar(true)
    expect(el.textContent).toContain('fallo simulado en un reto')
  })

  it('deja claro que el progreso no se tocó', async () => {
    const el = await montar(true)
    expect(el.textContent).toContain('sigue guardado')
  })

  it('el aviso es anunciable por un lector de pantalla', async () => {
    const el = await montar(true)
    expect(el.querySelector('[role="alert"]')).not.toBeNull()
  })

  it('ofrece una salida', async () => {
    const el = await montar(true)
    const botones = [...el.querySelectorAll('button')].map(b => b.textContent)
    expect(botones).toContain('Recargar')
  })
})
