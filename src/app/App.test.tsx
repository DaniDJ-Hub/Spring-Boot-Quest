import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import App from './App'
import { RouterProvider } from './router'
import { GameProvider } from '../engine/GameProvider'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { emptyState, STORAGE_KEY } from '../engine/core'
import { WORLDS } from '../data/worlds'
import { CHALLENGE_META } from '../data'
import type { GameState } from '../types'

let root: Root | null = null
let el: HTMLDivElement
let errores: unknown[][] = []

/** Partida avanzada: abre el panel con datos, el examen y el reporte. */
function partidaCompleta(): Partial<GameState> {
  return {
    xp: 4200,
    solved: Object.fromEntries(CHALLENGE_META.map(c => [c.id, 1])),
    failed: { 'w04-d1': 2 },
    bossCleared: WORLDS.map(w => w.id),
    concepts: { ioc: { attempts: 6, correct: 6, streak: 6, lastSeen: 1 }, autowired: { attempts: 5, correct: 1, streak: 0, lastSeen: 1 } },
    projects: { p1: ['Proyecto con spring-boot-starter-web y nada más'] },
    achievements: ['first-blood', 'w01'],
    log: [{ challengeId: 'w04-d1', worldId: 'w04', correct: false, at: Date.now() }],
    exam: { score: 24, total: 30, at: Date.now(), byWorld: { w01: [2, 2], w02: [1, 2], w03: [0, 2] } },
  }
}

async function montar(ruta: string, estado?: Partial<GameState>) {
  window.history.replaceState({}, '', ruta)
  if (estado) localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...emptyState(), ...estado }))
  el = document.createElement('div')
  document.body.appendChild(el)
  root = createRoot(el)
  await act(async () => {
    root!.render(
      <ErrorBoundary>
        <LazyMotion features={domAnimation}>
          <MotionConfig reducedMotion="user">
            <GameProvider><RouterProvider><App /></RouterProvider></GameProvider>
          </MotionConfig>
        </LazyMotion>
      </ErrorBoundary>,
    )
  })
  await act(async () => { await new Promise(r => setTimeout(r, 20)) })
  return el
}

beforeEach(() => {
  localStorage.clear()
  errores = []
  vi.spyOn(console, 'error').mockImplementation((...args: unknown[]) => { errores.push(args) })
})

afterEach(async () => {
  if (root) await act(async () => root!.unmount())
  root = null
  el?.remove()
  vi.restoreAllMocks()
})

const RUTAS = ['/', '/mapa', '/mundo/w01', '/mundo/w10', '/proyectos', '/logros', '/refuerzo', '/examen']

describe('la aplicación monta sin errores en consola', () => {
  for (const ruta of RUTAS) {
    it(`primera visita en ${ruta}`, async () => {
      const dom = await montar(ruta)
      expect(errores, JSON.stringify(errores[0])).toEqual([])
      expect(dom.textContent!.length).toBeGreaterThan(50)
    })
  }

  for (const ruta of RUTAS) {
    it(`partida avanzada en ${ruta}`, async () => {
      const dom = await montar(ruta, partidaCompleta())
      expect(errores, JSON.stringify(errores[0])).toEqual([])
      expect(dom.textContent!.length).toBeGreaterThan(50)
    })
  }

  it('una ruta desconocida cae en el panel, no en un error', async () => {
    const dom = await montar('/no-existe')
    expect(errores).toEqual([])
    expect(dom.textContent).toContain('Primera vez por aquí')
  })
})

describe('shell', () => {
  it('tiene salto al contenido, navegación y región principal enfocable', async () => {
    const dom = await montar('/')
    expect(dom.querySelector('a[href="#contenido"]')).not.toBeNull()
    // Dos barras (escritorio y móvil) con nombres distintos: no se confunden entre sí.
    expect(dom.querySelector('nav[aria-label="Navegación principal"]')).not.toBeNull()
    expect(dom.querySelector('nav[aria-label="Navegación inferior"]')).not.toBeNull()
    expect(dom.querySelector('main#contenido')?.getAttribute('tabindex')).toBe('-1')
  })

  it('los iconos de navegación son SVG, no glifos de texto', async () => {
    const dom = await montar('/')
    const nav = dom.querySelector('nav[aria-label="Navegación principal"]')!
    expect(nav.querySelectorAll('svg').length).toBeGreaterThanOrEqual(4)
  })
})
