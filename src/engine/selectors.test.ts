import { describe, expect, it } from 'vitest'
import type { GameState } from '../types'
import { metaOf, PROJECTS } from '../data'
import { WORLD_BY_ID, WORLDS } from '../data/worlds'
import {
  bossAvailable, emptyState, masteryOf, nextInWorld, SELECTION_REASONS, todayKey, weakConcepts, yesterdayKey,
} from './core'
import { achievementsFor } from './achievements'
import {
  achievementProgress, bossGate, bossPassed, conceptProgress, currentStreak, examAvailability, masteryDelta,
  minCorrectToPass, nextBossToOpen, projectStatus, roundPreview, selectionReasons, skillReport, weakCount,
  worldDependents, worldRequirements, worldStatus,
} from './selectors'

const resueltos = (ids: string[]): Record<string, number> => Object.fromEntries(ids.map(id => [id, 1]))
const concepto = (attempts: number, correct: number, streak: number) => ({ attempts, correct, streak, lastSeen: 1 })

describe('estado de un mundo', () => {
  it('recorre bloqueado → disponible → en curso → boss abierta → superado', () => {
    const w = WORLD_BY_ID.w02
    const lista = metaOf('w02')
    expect(worldStatus(emptyState(), w)).toBe('locked')
    const abierto: GameState = { ...emptyState(), bossCleared: ['w01'] }
    expect(worldStatus(abierto, w)).toBe('available')
    expect(worldStatus({ ...abierto, solved: resueltos([lista[0].id]) }, w)).toBe('in-progress')
    const casi = { ...abierto, solved: resueltos(lista.map(c => c.id)) }
    expect(worldStatus(casi, w)).toBe('boss-open')
    expect(worldStatus({ ...casi, bossCleared: ['w01', 'w02'] }, w)).toBe('cleared')
  })

  it('superado con todos los conceptos en verde es «dominado»', () => {
    const w = WORLD_BY_ID.w01
    const s: GameState = {
      ...emptyState(),
      bossCleared: ['w01'],
      concepts: Object.fromEntries(w.concepts.map(k => [k, concepto(6, 6, 6)])),
    }
    expect(worldStatus(s, w)).toBe('mastered')
  })

  it('los dependientes son exactamente los mundos que lo requieren', () => {
    for (const w of WORLDS) {
      for (const d of worldDependents(w.id)) expect(d.requires).toContain(w.id)
    }
    expect(worldDependents('w01').map(w => w.id).sort()).toEqual(['w02', 'w04'])
  })

  it('los requisitos informan cuáles faltan', () => {
    const req = worldRequirements({ ...emptyState(), bossCleared: ['w06'] }, WORLD_BY_ID.w11)
    expect(req.map(r => [r.world.id, r.cleared])).toEqual([['w06', true], ['w09', false]])
  })
})

describe('puerta de la boss', () => {
  it('coincide exactamente con bossAvailable en el límite', () => {
    for (const w of WORLDS) {
      const lista = metaOf(w.id)
      const gate = bossGate(emptyState(), w)
      const justo: GameState = { ...emptyState(), solved: resueltos(lista.slice(0, gate.required).map(c => c.id)) }
      const debajo: GameState = { ...emptyState(), solved: resueltos(lista.slice(0, gate.required - 1).map(c => c.id)) }
      expect(bossAvailable(justo, w), w.id).toBe(true)
      expect(bossAvailable(debajo, w), w.id).toBe(false)
      expect(bossGate(debajo, w).remaining).toBe(1)
    }
  })

  it('el mínimo de aciertos aprueba y uno menos no', () => {
    for (const w of WORLDS) {
      const n = w.boss.size
      const k = minCorrectToPass(w, n)
      expect(bossPassed(w, k, n), w.id).toBe(true)
      if (k > 0) expect(bossPassed(w, k - 1, n), w.id).toBe(false)
    }
  })

  it('sin respuestas no se aprueba', () => {
    expect(bossPassed(WORLD_BY_ID.w01, 0, 0)).toBe(false)
  })

  it('la próxima boss prioriza la ya abierta', () => {
    const lista = metaOf('w01')
    const s: GameState = { ...emptyState(), solved: resueltos(lista.map(c => c.id)) }
    expect(nextBossToOpen(s)?.world.id).toBe('w01')
    expect(nextBossToOpen(s)?.gate.open).toBe(true)
  })
})

describe('dominio', () => {
  it('el siguiente nivel lleva la regla que lo concede', () => {
    const p = conceptProgress({ ...emptyState(), concepts: { ioc: concepto(4, 3, 2) } }, 'ioc')
    expect(p.level).toBe('mastered')
    expect(p.next?.level).toBe('expert')
    expect(p.next?.missingStreak).toBe(2)
    expect(p.next?.missingAttempts).toBe(1)
  })

  it('experto no tiene siguiente nivel', () => {
    expect(conceptProgress({ ...emptyState(), concepts: { ioc: concepto(10, 10, 10) } }, 'ioc').next).toBeNull()
  })

  it('detecta la bajada de nivel al romper la racha', () => {
    const antes: GameState = { ...emptyState(), concepts: { ioc: concepto(10, 10, 10) } }
    const despues: GameState = { ...emptyState(), concepts: { ioc: concepto(11, 10, 0) } }
    expect(masteryDelta(antes, despues, ['ioc'])).toEqual([
      { concept: 'ioc', from: masteryOf(antes, 'ioc'), to: masteryOf(despues, 'ioc'), direction: 'down' },
    ])
  })

  it('cuenta todos los conceptos flojos, sin el tope de la lista', () => {
    const concepts = Object.fromEntries(Array.from({ length: 15 }, (_, i) => [`c${i}`, concepto(5, 1, 0)]))
    const s: GameState = { ...emptyState(), concepts }
    expect(weakCount(s)).toBe(15)
    expect(weakConcepts(s).length).toBeLessThan(15)
  })
})

describe('motivo de selección', () => {
  it('ordenar por motivo reproduce el orden de práctica del motor', () => {
    const lista = metaOf('w04')
    const s: GameState = {
      ...emptyState(),
      solved: resueltos([lista[0].id]),
      failed: { [lista[1].id]: 1 },
      concepts: { qualifier: concepto(4, 1, 0) },
    }
    const motivos = selectionReasons(s, lista)
    const orden = nextInWorld(s, 'w04').map(c => SELECTION_REASONS.indexOf(motivos[c.id]))
    expect([...orden].sort((a, b) => a - b)).toEqual(orden)
    expect(motivos[lista[1].id]).toBe('failed')
    expect(motivos[lista[0].id]).toBe('review')
  })

  it('el avance de la ronda suma todos los retos del mundo', () => {
    const p = roundPreview(emptyState(), 'w01')
    expect(p.failed + p.weak + p.new + p.review).toBe(metaOf('w01').length)
    expect(p.new).toBe(metaOf('w01').length)
  })
})

describe('racha vigente', () => {
  it('sigue viva si se practicó hoy o ayer', () => {
    expect(currentStreak({ ...emptyState(), streak: { count: 5, lastDay: todayKey() } })).toBe(5)
    expect(currentStreak({ ...emptyState(), streak: { count: 5, lastDay: yesterdayKey() } })).toBe(5)
  })

  it('se da por rota si pasó más de un día', () => {
    expect(currentStreak({ ...emptyState(), streak: { count: 5, lastDay: '2020-01-01' } })).toBe(0)
  })
})

describe('examen', () => {
  it('se abre solo con los quince mundos superados', () => {
    expect(examAvailability(emptyState()).available).toBe(false)
    expect(examAvailability({ ...emptyState(), bossCleared: WORLDS.map(w => w.id) }).available).toBe(true)
  })

  it('el reporte clasifica por los mismos cortes que antes', () => {
    const s: GameState = {
      ...emptyState(),
      exam: { score: 24, total: 30, at: 1, byWorld: { w01: [2, 2], w02: [3, 4], w03: [0, 2] } },
    }
    const r = skillReport(s)!
    expect(r.verdict).toBe('Backend Engineer')
    expect(r.strengths.map(w => w.id)).toEqual(['w01'])
    expect(r.toReview.map(w => w.id)).toEqual(['w03'])
    expect(r.worlds.find(x => x.world.id === 'w02')?.band).toBe('ok')
  })

  it('sin examen no hay reporte', () => {
    expect(skillReport(emptyState())).toBeNull()
  })
})

describe('proyectos', () => {
  const p = PROJECTS[0]

  it('bloqueado hasta superar su mundo', () => {
    expect(projectStatus(emptyState(), p).status).toBe('locked')
  })

  it('completado exige requisitos y criterios', () => {
    const base: GameState = { ...emptyState(), bossCleared: [p.unlockedBy] }
    expect(projectStatus(base, p).status).toBe('not-started')
    expect(projectStatus({ ...base, projects: { [p.id]: p.requirements } }, p).status).toBe('in-progress')
    expect(projectStatus({ ...base, projects: { [p.id]: [...p.requirements, ...p.acceptance] } }, p).status).toBe('done')
  })

  it('ignora marcas que ya no existen en el brief', () => {
    const s: GameState = { ...emptyState(), bossCleared: [p.unlockedBy], projects: { [p.id]: ['requisito borrado'] } }
    expect(projectStatus(s, p).checked).toBe(0)
  })
})

describe('avance de logros', () => {
  it('llegar a la meta coincide con obtener el logro', () => {
    const estados: GameState[] = [
      emptyState(),
      { ...emptyState(), solved: resueltos(metaOf('w01').map(c => c.id)), bossCleared: ['w01'], noHintRun: 25 },
      { ...emptyState(), streak: { count: 7, lastDay: todayKey() }, exam: { score: 28, total: 30, at: 1, byWorld: {} } },
    ]
    for (const s of estados) {
      const got = new Set(achievementsFor(s))
      for (const id of ['first-blood', 'w01', 'no-hints', 'streak-7', 'exam', 'exam-90', 'grinder']) {
        expect(achievementProgress(s, id)!.ratio >= 1, id).toBe(got.has(id))
      }
    }
  })

  it('los logros de suceso no tienen avance', () => {
    expect(achievementProgress(emptyState(), 'perfect-boss')).toBeNull()
  })
})
