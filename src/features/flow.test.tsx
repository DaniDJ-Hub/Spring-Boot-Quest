import { act } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { GameProvider } from '../engine/GameProvider'
import { useGameActions, useGameState } from '../engine/game-context'
import { loadWorld, metaOf, PROJECTS } from '../data'
import { WORLD_BY_ID } from '../data/worlds'
import { masteryOf } from '../engine/core'
import { bossGate, examAvailability, projectStatus, weakCount, worldStatus } from '../engine/selectors'
import type { Challenge } from '../types'

let acciones: ReturnType<typeof useGameActions>
let estado: ReturnType<typeof useGameState>
let root: Root
let container: HTMLDivElement

function Sonda() {
  estado = useGameState()
  acciones = useGameActions()
  return null
}

let retos: Challenge[]

beforeEach(async () => {
  localStorage.clear()
  retos = await loadWorld('w01')
  container = document.createElement('div')
  document.body.appendChild(container)
  root = createRoot(container)
  await act(async () => root.render(<GameProvider><Sonda /></GameProvider>))
})

afterEach(async () => {
  await act(async () => root.unmount())
  container.remove()
})

const responder = async (c: Challenge, ok: boolean) => {
  await act(async () => acciones.answer(c, ok, false))
}

/**
 * El recorrido completo del jugador, contado con las mismas preguntas que hace
 * la interfaz: si esto pasa, las pantallas cuentan la verdad.
 */
describe('flujo completo: primera visita → dominio → boss → desbloqueo', () => {
  it('recorre todos los estados en orden', async () => {
    const w01 = WORLD_BY_ID.w01
    const w02 = WORLD_BY_ID.w02
    const w04 = WORLD_BY_ID.w04

    // 1. Primera visita: el primer mundo está disponible y los siguientes, cerrados.
    expect(worldStatus(estado.state, w01)).toBe('available')
    expect(worldStatus(estado.state, w02)).toBe('locked')
    expect(examAvailability(estado.state).available).toBe(false)

    // 2. Practicar: el dominio de un concepto sube con aciertos sostenidos.
    const concepto = retos[0].concepts[0]
    const delMismoConcepto = retos.filter(c => c.concepts.includes(concepto))
    expect(masteryOf(estado.state, concepto)).toBe('none')
    for (const c of delMismoConcepto) await responder(c, true)
    await responder(delMismoConcepto[0], true)
    await responder(delMismoConcepto[0], true)
    expect(['mastered', 'expert']).toContain(masteryOf(estado.state, concepto))
    expect(worldStatus(estado.state, w01)).toBe('in-progress')

    // 3. Un fallo rompe la racha y el dominio baja.
    const antes = masteryOf(estado.state, concepto)
    await responder(delMismoConcepto[0], false)
    const despues = masteryOf(estado.state, concepto)
    expect(despues).not.toBe(antes)

    // 4. Al resolver lo suficiente, la boss se abre.
    const lista = metaOf('w01')
    const porId = new Map(retos.map(c => [c.id, c]))
    for (const m of lista) {
      if ((estado.state.solved[m.id] ?? 0) === 0) await responder(porId.get(m.id)!, true)
      if (bossGate(estado.state, w01).open) break
    }
    const gate = bossGate(estado.state, w01)
    expect(gate.open).toBe(true)
    expect(gate.done).toBeGreaterThanOrEqual(gate.required)
    expect(worldStatus(estado.state, w01)).toBe('boss-open')

    // 5. Superarla marca el mundo y abre los que dependían de él.
    await act(async () => acciones.clearBoss('w01', false))
    expect(worldStatus(estado.state, w01)).toBe('cleared')
    expect(worldStatus(estado.state, w02)).toBe('available')
    expect(worldStatus(estado.state, w04)).toBe('available')

    // 6. El examen sigue cerrado: falta el resto de mundos.
    const exam = examAvailability(estado.state)
    expect(exam.available).toBe(false)
    expect(exam.cleared).toBe(1)
  })

  it('fallar un concepto lo manda a la sesión de refuerzo', async () => {
    const c = retos[0]
    expect(weakCount(estado.state)).toBe(0)
    await responder(c, false)
    await responder(c, false)
    expect(weakCount(estado.state)).toBeGreaterThan(0)
  })

  it('el checklist de un proyecto se guarda y sobrevive a recargar', async () => {
    const p = PROJECTS[0]
    const item = p.requirements[0]
    await act(async () => acciones.clearBoss(p.unlockedBy, false))
    await act(async () => acciones.toggleProjectItem(p.id, item))
    expect(projectStatus(estado.state, p).status).toBe('in-progress')

    // Se fuerza el guardado y se vuelve a montar, como al recargar la pestaña.
    await act(async () => { await new Promise(r => setTimeout(r, 500)) })
    await act(async () => root.unmount())
    const otro = document.createElement('div')
    document.body.appendChild(otro)
    const root2 = createRoot(otro)
    await act(async () => root2.render(<GameProvider><Sonda /></GameProvider>))
    expect(estado.state.projects[p.id]).toContain(item)
    expect(projectStatus(estado.state, p).status).toBe('in-progress')
    await act(async () => root2.unmount())
    otro.remove()
    root = createRoot(container)
  })
})
