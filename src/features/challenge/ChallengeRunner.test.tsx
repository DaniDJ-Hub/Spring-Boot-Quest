import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { ChallengeRunner } from './ChallengeRunner'
import { loadAll, loadWorld } from '../../data'
import type { Challenge, ChoiceChallenge, OrderChallenge } from '../../types'

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
const boton = (texto: string) => [...el.querySelectorAll('button')].find(b => b.textContent === texto)!
const comprobar = () => click(boton('Comprobar'))

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
    await comprobar()
    const status = dom.querySelector('[role="status"][aria-live="polite"]')
    expect(status).not.toBeNull()
    expect(status!.textContent).toMatch(/Correcto|Incorrecto/)
  })

  it('el resultado no depende solo del color', async () => {
    const [c] = await loadWorld('w01')
    const dom = await render(c)
    await click(dom.querySelectorAll('[role="radio"]')[0])
    await comprobar()
    const textos = [...dom.querySelectorAll('.sr-only')].map(n => n.textContent)
    expect(textos.some(t => t?.includes('Respuesta correcta'))).toBe(true)
    expect(dom.textContent).toMatch(/BUILD SUCCESS|BUILD FAILED/)
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
    await comprobar()
    expect(onResolved).toHaveBeenCalledWith(true, false)
  })

  it('se puede elegir con el teclado numérico', async () => {
    const c = (await loadWorld('w01'))[0] as ChoiceChallenge
    const dom = await render(c)
    const radios = [...dom.querySelectorAll('[role="radio"]')]
    await act(async () => {
      radios[0].dispatchEvent(new KeyboardEvent('keydown', { key: '2', bubbles: true }))
    })
    expect(radios[1].getAttribute('aria-checked')).toBe('true')
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
    await comprobar()
    expect(onResolved).toHaveBeenCalledWith(true, false)
  })

  it('ordenar: el orden inicial nunca es el correcto', async () => {
    const c = (await loadAll()).find(x => x.kind === 'order')!
    const onResolved = vi.fn()
    await render(c, { onResolved })
    await comprobar()
    expect(onResolved).toHaveBeenCalledWith(false, false)
  })

  it('ordenar: subiendo pasos se llega al orden correcto', async () => {
    const c = (await loadAll()).find(x => x.kind === 'order') as OrderChallenge
    const onResolved = vi.fn()
    const dom = await render(c, { onResolved })

    // El asa de cada paso anuncia su posición y su texto: de ahí sale el orden actual.
    const ordenActual = () =>
      [...dom.querySelectorAll('button[aria-label^="Paso en posición"]')]
        .map(b => /: (.*?)\. /.exec(b.getAttribute('aria-label')!)![1])

    for (let destino = 0; destino < c.steps.length; destino++) {
      const paso = c.steps[destino]
      while (ordenActual().indexOf(paso) > destino) {
        await click(boton2(dom, `Subir «${paso}»`))
      }
    }
    expect(ordenActual()).toEqual(c.steps)
    await comprobar()
    expect(onResolved).toHaveBeenCalledWith(true, false)
  })

  it('no se puede comprobar sin responder', async () => {
    const [c] = await loadWorld('w01')
    await render(c)
    expect(boton('Comprobar').disabled).toBe(true)
  })
})

function boton2(dom: HTMLElement, label: string) {
  return [...dom.querySelectorAll('button')].find(b => b.getAttribute('aria-label') === label)!
}

describe('modo estricto de boss y examen', () => {
  it('no muestra la explicación al responder', async () => {
    const [c] = await loadWorld('w01')
    const dom = await render(c, { strict: true })
    await click(dom.querySelectorAll('[role="radio"]')[0])
    await comprobar()
    expect(dom.textContent).toContain('El detalle se muestra al terminar')
    expect(dom.textContent).not.toContain(c.explain)
  })

  it('no revela cuál era la correcta: ni marca, ni texto, ni veredicto', async () => {
    const c = (await loadWorld('w01'))[0] as ChoiceChallenge
    const dom = await render(c, { strict: true })
    await click(dom.querySelectorAll('[role="radio"]')[0])
    await comprobar()
    const textos = [...dom.querySelectorAll('.sr-only')].map(n => n.textContent ?? '')
    expect(textos.some(t => t.includes('Respuesta correcta'))).toBe(false)
    expect(textos.some(t => t.includes('incorrecta'))).toBe(false)
    expect(dom.textContent).not.toMatch(/BUILD SUCCESS|BUILD FAILED/)
    expect(dom.textContent).not.toContain('La respuesta era')
  })

  it('en decisión no revela las consecuencias hasta el final', async () => {
    const c = (await loadAll()).find(x => x.kind === 'decision') as ChoiceChallenge
    const dom = await render(c, { strict: true })
    await click(dom.querySelectorAll('[role="radio"]')[0])
    await comprobar()
    for (const o of c.options) {
      if (o.consequence) expect(dom.textContent).not.toContain(o.consequence)
    }
  })

  it('no ofrece pista', async () => {
    const c = (await loadAll()).find(x => x.hint)!
    const dom = await render(c, { strict: true })
    expect(dom.textContent).not.toContain('Ver pista')
  })
})

describe('modo revisión', () => {
  it('muestra la respuesta dada con su explicación y sin acciones', async () => {
    const c = (await loadWorld('w01'))[0] as ChoiceChallenge
    const fallo = c.options.find(o => o.id !== c.answer)!
    const dom = await render(c, { review: { kind: 'choice', optionId: fallo.id } })
    expect(dom.textContent).toContain(c.explain)
    expect(dom.textContent).toContain('BUILD FAILED')
    expect([...dom.querySelectorAll('button')].some(b => b.textContent === 'Comprobar')).toBe(false)
  })
})
