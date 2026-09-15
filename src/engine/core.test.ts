import { beforeEach, describe, expect, it } from 'vitest'
import {
  bossAvailable, bossSet, bumpStreak, createSaver, emptyState, examSet, levelFromXp,
  loadState, LOG_LIMIT, masteryOf, nextInWorld, overallProgress, reinforcementSet,
  RESCUE_KEY, saveState, STATE_VERSION, STORAGE_KEY, titleFor, weakConcepts,
  worldProgress, worldUnlocked, xpForLevel,
} from './core'
import { WORLD_BY_ID, WORLDS } from '../data/worlds'
import { CHALLENGE_META, metaOf } from '../data'
import type { GameState } from '../types'

const conAciertos = (concepto: string, attempts: number, correct: number, streak = correct): GameState => ({
  ...emptyState(),
  concepts: { [concepto]: { attempts, correct, streak, lastSeen: Date.now() } },
})

beforeEach(() => localStorage.clear())

describe('curva de XP y títulos', () => {
  it('el nivel 1 no cuesta nada', () => expect(xpForLevel(1)).toBe(0))

  it('cada nivel cuesta más que el anterior', () => {
    for (let l = 2; l < 30; l++) {
      expect(xpForLevel(l + 1) - xpForLevel(l)).toBeGreaterThan(xpForLevel(l) - xpForLevel(l - 1))
    }
  })

  it('levelFromXp es la inversa exacta de xpForLevel', () => {
    for (let l = 1; l <= 30; l++) {
      expect(levelFromXp(xpForLevel(l))).toBe(l)
      expect(levelFromXp(xpForLevel(l + 1) - 1)).toBe(l)
    }
  })

  it('los títulos avanzan sin retroceder', () => {
    const vistos = new Set<string>()
    let anterior = ''
    for (let l = 1; l <= 40; l++) {
      const t = titleFor(l)
      if (t !== anterior) { expect(vistos.has(t)).toBe(false); vistos.add(t); anterior = t }
    }
    expect(titleFor(1)).toBe('Spring Apprentice')
    expect(titleFor(40)).toBe('Spring Boot Expert')
  })
})

describe('dominio de conceptos', () => {
  it('sin intentos es "no dominado"', () => {
    expect(masteryOf(emptyState(), 'ioc')).toBe('none')
  })

  it('fallar más que acertar deja el concepto en básico', () => {
    expect(masteryOf(conAciertos('ioc', 4, 1), 'ioc')).toBe('basic')
  })

  it('no se llega a dominado con un solo acierto', () => {
    expect(masteryOf(conAciertos('ioc', 1, 1), 'ioc')).not.toBe('mastered')
  })

  it('dominado exige varios intentos, buen ratio y racha', () => {
    expect(masteryOf(conAciertos('ioc', 4, 3, 2), 'ioc')).toBe('mastered')
  })

  it('experto exige más evidencia que dominado', () => {
    expect(masteryOf(conAciertos('ioc', 10, 10, 10), 'ioc')).toBe('expert')
    expect(masteryOf(conAciertos('ioc', 4, 4, 4), 'ioc')).not.toBe('expert')
  })

  it('romper la racha hace bajar de nivel', () => {
    const alto = conAciertos('ioc', 10, 10, 10)
    expect(masteryOf(alto, 'ioc')).toBe('expert')
    const traFallo: GameState = { ...alto, concepts: { ioc: { attempts: 11, correct: 10, streak: 0, lastSeen: 1 } } }
    expect(masteryOf(traFallo, 'ioc')).toBe('progress')
  })
})

describe('detección de puntos flojos', () => {
  it('un solo intento no basta como evidencia', () => {
    expect(weakConcepts(conAciertos('ioc', 1, 0))).toEqual([])
  })

  it('marca lo que está por debajo del 60 %', () => {
    expect(weakConcepts(conAciertos('ioc', 5, 2))).toContain('ioc')
  })

  it('no marca lo que va bien', () => {
    expect(weakConcepts(conAciertos('ioc', 5, 4))).not.toContain('ioc')
  })

  it('ordena de peor a mejor', () => {
    const s: GameState = { ...emptyState(), concepts: {
      malo: { attempts: 10, correct: 1, streak: 0, lastSeen: 1 },
      regular: { attempts: 10, correct: 5, streak: 0, lastSeen: 1 },
    } }
    expect(weakConcepts(s)).toEqual(['malo', 'regular'])
  })
})

describe('progresión y desbloqueo', () => {
  it('el mundo 1 está abierto desde el inicio', () => {
    expect(worldUnlocked(emptyState(), WORLD_BY_ID.w01)).toBe(true)
  })

  it('un mundo con prerequisitos empieza cerrado', () => {
    expect(worldUnlocked(emptyState(), WORLD_BY_ID.w10)).toBe(false)
  })

  it('se abre al superar sus prerequisitos', () => {
    const s: GameState = { ...emptyState(), bossCleared: WORLD_BY_ID.w10.requires }
    expect(worldUnlocked(s, WORLD_BY_ID.w10)).toBe(true)
  })

  it('la boss battle exige el 70 % del mundo', () => {
    const list = metaOf('w01')
    const justoDebajo = Math.ceil(list.length * 0.7) - 1
    const parcial: GameState = { ...emptyState(), solved: Object.fromEntries(list.slice(0, justoDebajo).map(c => [c.id, 1])) }
    expect(bossAvailable(parcial, WORLD_BY_ID.w01)).toBe(false)
    const suficiente: GameState = { ...emptyState(), solved: Object.fromEntries(list.slice(0, justoDebajo + 1).map(c => [c.id, 1])) }
    expect(bossAvailable(suficiente, WORLD_BY_ID.w01)).toBe(true)
  })

  it('el progreso cuenta solo los resueltos', () => {
    const s: GameState = { ...emptyState(), solved: { 'w01-q1': 1 }, failed: { 'w01-q2': 3 } }
    expect(worldProgress(s, 'w01').done).toBe(1)
    expect(overallProgress(s).done).toBe(1)
  })
})

describe('selección adaptativa', () => {
  it('pone primero lo fallado y aún sin resolver', () => {
    const fallado = metaOf('w01')[3]
    const s: GameState = { ...emptyState(), failed: { [fallado.id]: 2 } }
    expect(nextInWorld(s, 'w01')[0].id).toBe(fallado.id)
  })

  it('deja lo ya resuelto para el final', () => {
    const list = metaOf('w01')
    const s: GameState = { ...emptyState(), solved: { [list[0].id]: 1 } }
    const orden = nextInWorld(s, 'w01')
    expect(orden[orden.length - 1].id).toBe(list[0].id)
  })

  it('entre retos nuevos, va de menor a mayor dificultad', () => {
    const orden = nextInWorld(emptyState(), 'w01')
    for (let i = 1; i < orden.length; i++) {
      expect(orden[i].difficulty).toBeGreaterThanOrEqual(orden[i - 1].difficulty)
    }
  })

  it('el refuerzo está vacío si no hay conceptos flojos', () => {
    expect(reinforcementSet(emptyState())).toEqual([])
  })

  // `ioc` vive en el mundo 4, que exige haber superado el 1.
  const flojoEnIoc = (bossCleared: string[]): GameState => ({
    ...emptyState(),
    bossCleared,
    concepts: { ioc: { attempts: 6, correct: 1, streak: 0, lastSeen: 1 } },
  })

  it('no ofrece refuerzo de un mundo todavía bloqueado', () => {
    expect(reinforcementSet(flojoEnIoc([]))).toEqual([])
  })

  it('una vez desbloqueado el mundo, sí lo ofrece', () => {
    const s = flojoEnIoc(['w01'])
    const set = reinforcementSet(s)
    expect(set.length).toBeGreaterThan(0)
    for (const c of set) expect(worldUnlocked(s, WORLD_BY_ID[c.worldId])).toBe(true)
  })

  it('el refuerzo apunta a los conceptos que fallas', () => {
    for (const c of reinforcementSet(flojoEnIoc(['w01']))) expect(c.concepts).toContain('ioc')
  })
})

describe('boss battles y examen', () => {
  it('cada mundo tiene retos suficientes para su boss', () => {
    for (const w of WORLDS) expect(bossSet(w).length).toBe(w.boss.size)
  })

  it('la boss mezcla tipos distintos', () => {
    for (const w of WORLDS) {
      const tipos = new Set(bossSet(w).map(c => c.kind))
      expect(tipos.size).toBeGreaterThanOrEqual(3)
    }
  })

  it('la boss no repite retos', () => {
    for (const w of WORLDS) {
      const ids = bossSet(w).map(c => c.id)
      expect(new Set(ids).size).toBe(ids.length)
    }
  })

  it('el examen cubre los quince mundos', () => {
    const set = examSet(2, 1)
    expect(new Set(set.map(c => c.worldId)).size).toBe(WORLDS.length)
    expect(set.length).toBe(WORLDS.length * 2)
  })

  it('semillas distintas producen órdenes distintos (A-5)', () => {
    const a = examSet(2, 1).map(c => c.id).join()
    const b = examSet(2, 999999).map(c => c.id).join()
    expect(a).not.toBe(b)
  })

  it('la misma semilla es reproducible', () => {
    expect(examSet(2, 42).map(c => c.id)).toEqual(examSet(2, 42).map(c => c.id))
  })
})

describe('rachas por día', () => {
  const hoy = new Date().toISOString().slice(0, 10)
  const ayer = new Date(Date.now() - 86400000).toISOString().slice(0, 10)

  it('el primer día empieza en 1', () => {
    expect(bumpStreak({ count: 0, lastDay: '' })).toEqual({ count: 1, lastDay: hoy })
  })

  it('responder dos veces el mismo día no suma', () => {
    const s = { count: 3, lastDay: hoy }
    expect(bumpStreak(s)).toBe(s)
  })

  it('un día seguido suma', () => {
    expect(bumpStreak({ count: 3, lastDay: ayer }).count).toBe(4)
  })

  it('saltarse un día reinicia', () => {
    expect(bumpStreak({ count: 9, lastDay: '2020-01-01' }).count).toBe(1)
  })
})

describe('persistencia y migración (C-5)', () => {
  it('sin partida guardada arranca en cero', () => {
    const { state, rescued } = loadState()
    expect(state.xp).toBe(0)
    expect(rescued).toBe(false)
  })

  it('conserva todo el progreso al migrar de v1 a v2', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      version: 1, xp: 480, solved: { 'w01-q1': 1 }, failed: {},
      concepts: { ioc: { attempts: 4, correct: 4, streak: 4, lastSeen: 1 } },
      bossCleared: ['w01', 'w02'], achievements: ['first-blood'], projects: { p1: ['x'] },
      log: [], streak: { count: 5, lastDay: '2026-01-01' }, exam: null, createdAt: 1,
    }))
    const { state, rescued } = loadState()
    expect(rescued).toBe(false)
    expect(state.xp).toBe(480)
    expect(state.bossCleared).toEqual(['w01', 'w02'])
    expect(state.projects.p1).toEqual(['x'])
    expect(state.version).toBe(STATE_VERSION)
    expect(state.everRed).toEqual([])
    expect(state.noHintRun).toBe(0)
  })

  it('una partida de versión futura se aparta en vez de borrarse', () => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 999, xp: 12345 }))
    const { rescued } = loadState()
    expect(rescued).toBe(true)
    const apartada = Object.keys(localStorage).find(k => k.startsWith(RESCUE_KEY))
    expect(apartada).toBeDefined()
    expect(localStorage.getItem(apartada!)).toContain('12345')
  })

  it('un JSON corrupto se aparta en vez de borrarse', () => {
    localStorage.setItem(STORAGE_KEY, '{esto no es json')
    expect(loadState().rescued).toBe(true)
    expect(Object.keys(localStorage).some(k => k.startsWith(RESCUE_KEY))).toBe(true)
  })

  it('ida y vuelta sin pérdidas', () => {
    const s: GameState = { ...emptyState(), xp: 200, bossCleared: ['w01'] }
    saveState(s)
    expect(loadState().state).toEqual(s)
  })
})

describe('guardado con retardo (M-5)', () => {
  it('agrupa una ráfaga en una sola escritura', async () => {
    const saver = createSaver(20)
    for (let i = 1; i <= 5; i++) saver.schedule({ ...emptyState(), xp: i })
    expect(localStorage.getItem(STORAGE_KEY)).toBeNull()
    await new Promise(r => setTimeout(r, 40))
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).xp).toBe(5)
  })

  it('flush fuerza la escritura pendiente', () => {
    const saver = createSaver(10_000)
    saver.schedule({ ...emptyState(), xp: 77 })
    saver.flush()
    expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!).xp).toBe(77)
  })

  it('el registro de actividad tiene tope', () => {
    expect(LOG_LIMIT).toBeLessThanOrEqual(50)
  })
})

describe('integridad del contenido', () => {
  it('no hay identificadores repetidos', () => {
    const ids = CHALLENGE_META.map(c => c.id)
    expect(new Set(ids).size).toBe(ids.length)
  })

  it('todo reto pertenece a un mundo existente', () => {
    for (const c of CHALLENGE_META) expect(WORLD_BY_ID[c.worldId]).toBeDefined()
  })

  it('todo concepto declarado en un mundo tiene al menos un reto', () => {
    const cubiertos = new Set(CHALLENGE_META.flatMap(c => c.concepts))
    const sinCubrir = WORLDS.flatMap(w => w.concepts).filter(k => !cubiertos.has(k))
    expect(sinCubrir).toEqual([])
  })
})
