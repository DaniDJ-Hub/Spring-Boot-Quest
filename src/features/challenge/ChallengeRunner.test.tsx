import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChallengeRunner } from './ChallengeRunner'
import { loadAll, loadWorld } from '../../data'
import type { Challenge, ChoiceChallenge } from '../../types'

let root: Root | null = null
let el: HTMLDivElement

async function render(c: Challenge, props: Partial<Parameters<typeof ChallengeRunner>[0]> = {}) {
  el = document.createElement('div')
  document.body.appendChild(el)
  root = createRoot(el)
  await act(async () => {
    root!.render(
      <ChallengeRunner challenge={c} onResolved={props.onResolved ?? (() => {})} onNext={props.onNext ?? (() => {})} {...props} />,
    )
  })
  return el
}

const click = async (node: Element) => {
  await act(async () => { node.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
}

afterEach(async () => {
  if (root) await act(async () => root!.unmount())
  root = null
  el?.remove()
})

describe('semántica accesible del reto (C-2)', () => {
  it('las opciones forman un grupo de radio etiquetado por el enunciado', async () => {
    const [c] = await loadWorld('w01')
    const dom = await render(c)
    const grupo = dom.querySelector('[role="radiogroup"]')
    expect(grupo).not.toBeNull()
    expect(grupo!.getAttribute('aria-labelledby')).toBeTruthy()
    expect(dom.querySelectorAll('[role="radio"]').length).toBe((c as ChoiceChallenge).options.length)
  })

  it('elegir una opción marca aria-checked en esa y solo esa', async () => {
    const [c] = await loadWorld('w01')
    const dom = await render(c)
    const radios = [...dom.querySelectorAll('[role="radio"]')]
    await click(radios[1])
    expect(radios.map(r => r.getAttribute('aria-checked'))).toEqual(['false', 'true', 'false', 'false'])
  })

  it('el veredicto se anuncia en una región viva', async () => {
    const [c] = await loadWorld('w01')
    const dom = await render(c)
    await click(dom.querySelectorAll('[role="radio"]')[0])
    await click([...dom.querySelectorAll('button')].find(b => b.textContent === 'Comprobar')!)
    const status = dom.querySelector('[role="status"][aria-live="polite"]')
    expect(status).not.toBeNull()
    expect(status!.textContent).toMatch(/Correcto|Incorrecto/)
  })

  it('el resultado no depende solo del color', async () => {
    const [c] = await loadWorld('w01')
    const dom = await render(c)
    await click(dom.querySelectorAll('[role="radio"]')[0])
    await click([...dom.querySelectorAll('button')].find(b => b.textContent === 'Comprobar')!)
    const textos = [...dom.querySelectorAll('.sr-only')].map(n => n.textContent)
    expect(textos.some(t => t?.includes('Respuesta correcta'))).toBe(true)
  })
})

describe('corrección de respuestas', () => {
  it('acierta cuando se elige la opción correcta', async () => {
    const c = (await loadWorld('w01'))[0] as ChoiceChallenge
    const onResolved = vi.fn()
    const dom = await render(c, { onResolved })
    const correcta = [...dom.querySelectorAll('[role="radio"]')]
      .find(r => r.textContent?.includes(c.options.find(o => o.id === c.answer)!.text.slice(0, 30)))!
    await click(correcta)
    await click([...dom.querySelectorAll('button')].find(b => b.textContent === 'Comprobar')!)
    expect(onResolved).toHaveBeenCalledWith(true, false)
  })

  it('los retos de completar aceptan la respuesta escrita', async () => {
    const c = (await loadAll()).find(x => x.kind === 'fill')!
    const onResolved = vi.fn()
    const dom = await render(c, { onResolved })
    const input = dom.querySelector('input')!
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    await act(async () => {
      setter.call(input, c.kind === 'fill' ? c.accept[0] : '')
      input.dispatchEvent(new Event('input', { bubbles: true }))
    })
    await click([...dom.querySelectorAll('button')].find(b => b.textContent === 'Comprobar')!)
    expect(onResolved).toHaveBeenCalledWith(true, false)
  })

  it('ordenar mal se marca como incorrecto', async () => {
    const c = (await loadAll()).find(x => x.kind === 'order')!
    const onResolved = vi.fn()
    const dom = await render(c, { onResolved })
    // Se van tomando siempre del final para garantizar un orden distinto al correcto.
    for (let i = 0; i < (c.kind === 'order' ? c.steps.length : 0); i++) {
      const disponibles = [...dom.querySelectorAll('button[aria-label^="Añadir"]')]
      await click(disponibles[disponibles.length - 1])
    }
    await click([...dom.querySelectorAll('button')].find(b => b.textContent === 'Comprobar')!)
    expect(onResolved).toHaveBeenCalledWith(false, false)
  })

  it('no se puede comprobar sin responder', async () => {
    const [c] = await loadWorld('w01')
    const dom = await render(c)
    const comprobar = [...dom.querySelectorAll('button')].find(b => b.textContent === 'Comprobar')!
    expect((comprobar as HTMLButtonElement).disabled).toBe(true)
  })
})

describe('modo estricto de boss y examen', () => {
  it('no muestra la explicación al responder', async () => {
    const [c] = await loadWorld('w01')
    const dom = await render(c, { strict: true })
    await click(dom.querySelectorAll('[role="radio"]')[0])
    await click([...dom.querySelectorAll('button')].find(b => b.textContent === 'Comprobar')!)
    expect(dom.textContent).toContain('El detalle se muestra al terminar')
    expect(dom.textContent).not.toContain(c.explain)
  })

  it('no ofrece pista', async () => {
    const c = (await loadAll()).find(x => x.hint)!
    const dom = await render(c, { strict: true })
    expect(dom.textContent).not.toContain('Ver pista')
  })
})
