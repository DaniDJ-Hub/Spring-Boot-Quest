import { StrictMode, act } from 'react'
import { LazyMotion, domAnimation } from 'motion/react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { GameProvider } from './GameProvider'
import { useGameActions, useGameState, useToasts } from './game-context'
import { Toasts } from '../components/ui'
import { loadWorld } from '../data'
import type { Challenge } from '../types'

let acciones: ReturnType<typeof useGameActions>
let estado: ReturnType<typeof useGameState>

function Sonda() {
  estado = useGameState()
  acciones = useGameActions()
  const { toasts, dismissToast } = useToasts()
  return <Toasts items={toasts} dismiss={dismissToast} />
}

let container: HTMLDivElement
let root: Root
let retos: Challenge[]

beforeEach(async () => {
  localStorage.clear()
  retos = await loadWorld('w01')
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => {
    root.render(<StrictMode><LazyMotion features={domAnimation}><GameProvider><Sonda /></GameProvider></LazyMotion></StrictMode>)
  })
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

const toastsEnPantalla = () => container.querySelectorAll('[aria-label^="Logro desbloqueado"]').length

describe('updaters puros en modo estricto (C-3)', () => {
  it('el XP se suma una sola vez pese a la doble invocación', async () => {
    const reto = retos[0]
    await act(async () => acciones.answer(reto, true, false))
    expect(estado.state.xp).toBe(reto.xp)
  })

  it('un logro nuevo emite un solo aviso', async () => {
    await act(async () => acciones.answer(retos[0], true, false))
    expect(estado.state.achievements).toContain('first-blood')
    expect(toastsEnPantalla()).toBe(1)
  })

  it('un logro ya obtenido no se vuelve a anunciar', async () => {
    await act(async () => acciones.answer(retos[0], true, false))
    await act(async () => acciones.answer(retos[1], true, false))
    expect(toastsEnPantalla()).toBe(1)
  })

  it('los intentos por concepto se cuentan una vez', async () => {
    const reto = retos[0]
    await act(async () => acciones.answer(reto, true, false))
    for (const k of reto.concepts) {
      expect(estado.state.concepts[k].attempts, k).toBe(1)
      expect(estado.state.concepts[k].correct, k).toBe(1)
    }
  })
})

describe('reglas de puntuación', () => {
  it('fallar no suma XP pero sí cuenta el intento', async () => {
    await act(async () => acciones.answer(retos[0], false, false))
    expect(estado.state.xp).toBe(0)
    expect(estado.state.failed[retos[0].id]).toBe(1)
    expect(estado.state.concepts[retos[0].concepts[0]].attempts).toBe(1)
  })

  it('usar la pista recorta el XP al 60 %', async () => {
    const reto = retos[0]
    await act(async () => acciones.answer(reto, true, true))
    expect(estado.state.xp).toBe(Math.round(reto.xp * 0.6))
  })

  it('la racha sin pista avanza y se rompe al pedirla', async () => {
    await act(async () => acciones.answer(retos[0], true, false))
    expect(estado.state.noHintRun).toBe(1)
    await act(async () => acciones.answer(retos[1], true, true))
    expect(estado.state.noHintRun).toBe(0)
  })

  it('los conceptos vistos en rojo quedan registrados en el estado', async () => {
    await act(async () => acciones.answer(retos[0], false, false))
    expect(estado.state.everRed).toEqual(expect.arrayContaining(retos[0].concepts))
  })
})

describe('boss battles', () => {
  it('superarla otorga el bono una sola vez', async () => {
    await act(async () => acciones.clearBoss('w01', false))
    const tras = estado.state.xp
    expect(tras).toBeGreaterThan(0)
    await act(async () => acciones.clearBoss('w01', false))
    expect(estado.state.xp).toBe(tras)
    expect(estado.state.bossCleared).toEqual(['w01'])
  })

  it('sin fallos otorga el logro correspondiente', async () => {
    await act(async () => acciones.clearBoss('w01', true))
    expect(estado.state.achievements).toContain('perfect-boss')
  })
})

describe('persistencia', () => {
  it('el progreso llega a localStorage y se recupera al montar de nuevo', async () => {
    vi.useFakeTimers()
    await act(async () => acciones.answer(retos[0], true, false))
    // Se avanza el reloj lo justo para pasar el retardo del guardado (400 ms).
    // runAllTimers no sirve: el bucle de animación de Motion reprograma sin fin.
    await act(async () => { vi.advanceTimersByTime(600) })
    vi.useRealTimers()

    await act(async () => root.unmount())
    const otro = document.createElement('div')
    document.body.appendChild(otro)
    const root2 = createRoot(otro)
    await act(async () => {
      root2.render(<StrictMode><LazyMotion features={domAnimation}><GameProvider><Sonda /></GameProvider></LazyMotion></StrictMode>)
    })
    expect(estado.state.xp).toBe(retos[0].xp)
    // Al rehidratar no se re-anuncian los logros ya conseguidos.
    expect(otro.querySelectorAll('[aria-label^="Logro desbloqueado"]').length).toBe(0)
    await act(async () => root2.unmount())
    otro.remove()
    root = createRoot(container)
  })

  it('reiniciar deja el estado en cero', async () => {
    await act(async () => acciones.answer(retos[0], true, false))
    await act(async () => acciones.reset())
    expect(estado.state.xp).toBe(0)
    expect(estado.state.achievements).toEqual([])
    expect(estado.state.streak.count).toBe(1)
  })
})
