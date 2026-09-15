import { act, useState } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ConfirmDialog } from './ConfirmDialog'

let root: Root | null = null
let el: HTMLDivElement

function Host({ onConfirm }: { onConfirm: () => void }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button id="disparador" onClick={() => setOpen(true)}>Borrar progreso</button>
      <ConfirmDialog
        open={open}
        title="¿Borrar todo el progreso?"
        body="No se puede deshacer."
        confirmLabel="Sí, borrar todo"
        onConfirm={() => { setOpen(false); onConfirm() }}
        onCancel={() => setOpen(false)}
      />
    </>
  )
}

async function montar(onConfirm = () => {}) {
  el = document.createElement('div')
  document.body.appendChild(el)
  root = createRoot(el)
  await act(async () => root!.render(<Host onConfirm={onConfirm} />))
  return el
}

const click = async (n: Element | null) => {
  await act(async () => { n?.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
}
const tecla = async (key: string) => {
  await act(async () => { document.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true })) })
}
const botonPor = (texto: string) => [...el.querySelectorAll('button')].find(b => b.textContent === texto) ?? null

afterEach(async () => {
  if (root) await act(async () => root!.unmount())
  root = null
  el?.remove()
})

describe('confirmación de acciones destructivas (M-9)', () => {
  it('no aparece hasta que se pide', async () => {
    await montar()
    expect(el.querySelector('[role="dialog"]')).toBeNull()
  })

  it('se anuncia como diálogo modal con título y descripción', async () => {
    await montar()
    await click(el.querySelector('#disparador'))
    const dlg = el.querySelector('[role="dialog"]')!
    expect(dlg.getAttribute('aria-modal')).toBe('true')
    expect(dlg.getAttribute('aria-labelledby')).toBeTruthy()
    expect(dlg.getAttribute('aria-describedby')).toBeTruthy()
  })

  it('el foco arranca en la opción segura', async () => {
    await montar()
    await click(el.querySelector('#disparador'))
    expect(document.activeElement?.textContent).toBe('Cancelar')
  })

  it('Escape cancela sin ejecutar nada', async () => {
    const onConfirm = vi.fn()
    await montar(onConfirm)
    await click(el.querySelector('#disparador'))
    await tecla('Escape')
    expect(el.querySelector('[role="dialog"]')).toBeNull()
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('cancelar no ejecuta la acción', async () => {
    const onConfirm = vi.fn()
    await montar(onConfirm)
    await click(el.querySelector('#disparador'))
    await click(botonPor('Cancelar'))
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('confirmar sí la ejecuta, una sola vez', async () => {
    const onConfirm = vi.fn()
    await montar(onConfirm)
    await click(el.querySelector('#disparador'))
    await click(botonPor('Sí, borrar todo'))
    expect(onConfirm).toHaveBeenCalledTimes(1)
    expect(el.querySelector('[role="dialog"]')).toBeNull()
  })

  it('devuelve el foco a donde estaba al cerrarse', async () => {
    await montar()
    const disparador = el.querySelector<HTMLButtonElement>('#disparador')!
    disparador.focus()
    await click(disparador)
    await tecla('Escape')
    expect(document.activeElement).toBe(disparador)
  })

  it('el foco no se escapa del diálogo con Tab', async () => {
    await montar()
    await click(el.querySelector('#disparador'))
    const dlg = el.querySelector('[role="dialog"]')!
    const focusables = [...dlg.querySelectorAll('button')]
    focusables[focusables.length - 1].focus()
    await act(async () => {
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab', bubbles: true }))
    })
    expect(dlg.contains(document.activeElement)).toBe(true)
  })
})
