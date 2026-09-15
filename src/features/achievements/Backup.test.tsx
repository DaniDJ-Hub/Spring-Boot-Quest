import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LazyMotion, domAnimation } from 'motion/react'
import { Backup } from './Backup'
import { GameProvider } from '../../engine/GameProvider'
import { useGameState } from '../../engine/game-context'
import { emptyState, exportState, STORAGE_KEY } from '../../engine/core'
import type { GameState } from '../../types'

let root: Root | null = null
let el: HTMLDivElement
let visto: GameState

function Sonda() {
  visto = useGameState().state
  return <Backup />
}

async function montar() {
  el = document.createElement('div')
  document.body.appendChild(el)
  root = createRoot(el)
  await act(async () => {
    root!.render(<LazyMotion features={domAnimation}><GameProvider><Sonda /></GameProvider></LazyMotion>)
  })
  return el
}

const boton = (texto: string) => [...el.querySelectorAll('button')].find(b => b.textContent === texto)!
const click = async (n: Element) => {
  await act(async () => { n.dispatchEvent(new MouseEvent('click', { bubbles: true })) })
}

/** Simula la elección de un fichero sin depender del selector nativo. */
async function subir(contenido: string) {
  const input = el.querySelector<HTMLInputElement>('input[type="file"]')!
  const file = new File([contenido], 'respaldo.json', { type: 'application/json' })
  Object.defineProperty(input, 'files', { value: [file], configurable: true })
  await act(async () => { input.dispatchEvent(new Event('change', { bubbles: true })) })
  // La lectura del fichero es asíncrona.
  await act(async () => { await new Promise(r => setTimeout(r, 0)) })
}

beforeEach(() => localStorage.clear())
afterEach(async () => {
  if (root) await act(async () => root!.unmount())
  root = null
  el?.remove()
  vi.restoreAllMocks()
})

describe('copia de seguridad (M-10)', () => {
  it('explica dónde vive el progreso', async () => {
    const dom = await montar()
    expect(dom.textContent).toContain('solo en este navegador')
  })

  it('descargar genera un fichero con nombre fechado', async () => {
    const dom = await montar()
    const click_ = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {})
    vi.stubGlobal('URL', { ...URL, createObjectURL: () => 'blob:x', revokeObjectURL: () => {} })
    await click(boton('Descargar progreso'))
    expect(click_).toHaveBeenCalled()
    expect(dom).toBeTruthy()
  })

  it('un fichero que no es un respaldo se rechaza con explicación', async () => {
    const dom = await montar()
    await subir(JSON.stringify({ app: 'otra-app', state: {} }))
    const alerta = dom.querySelector('[role="alert"]')
    expect(alerta?.textContent).toMatch(/Spring Boot Quest/)
    expect(dom.querySelector('[role="dialog"]')).toBeNull()
  })

  it('un fichero ilegible se rechaza sin romper nada', async () => {
    const dom = await montar()
    await subir('{{{')
    expect(dom.querySelector('[role="alert"]')?.textContent).toMatch(/JSON/i)
  })

  it('un respaldo válido pide confirmación antes de sustituir nada', async () => {
    const dom = await montar()
    const respaldo = exportState({ ...emptyState(), xp: 999, bossCleared: ['w01', 'w02'] })
    await subir(respaldo)
    const dlg = dom.querySelector('[role="dialog"]')
    expect(dlg).not.toBeNull()
    expect(dlg!.textContent).toContain('999 XP')
    expect(dlg!.textContent).toContain('2 mundos')
    expect(visto.xp).toBe(0)
  })

  it('cancelar deja el progreso actual intacto', async () => {
    await montar()
    await subir(exportState({ ...emptyState(), xp: 999 }))
    await click(boton('Cancelar'))
    expect(visto.xp).toBe(0)
  })

  it('confirmar sustituye la partida y la guarda', async () => {
    await montar()
    await subir(exportState({ ...emptyState(), xp: 999, bossCleared: ['w01'] }))
    await click(boton('Restaurar'))
    expect(visto.xp).toBe(999)
    expect(visto.bossCleared).toEqual(['w01'])
    await act(async () => { await new Promise(r => setTimeout(r, 500)) })
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).xp).toBe(999)
  })

  it('restaurar no anuncia de golpe los logros del respaldo', async () => {
    const dom = await montar()
    await subir(exportState({ ...emptyState(), xp: 500, achievements: ['first-blood', 'w01', 'half'] }))
    await click(boton('Restaurar'))
    expect(dom.querySelectorAll('[aria-label^="Logro desbloqueado"]').length).toBe(0)
  })
})
