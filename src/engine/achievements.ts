import type { GameState } from '../types'
import { CHALLENGE_META, PROJECTS } from '../data'
import { WORLDS } from '../data/worlds'
import { isGreen, masteryOf } from './core'

const DI_CONCEPTS = WORLDS.find(w => w.id === 'w04')!.concepts
const JPA_CONCEPTS = WORLDS.find(w => w.id === 'w10')!.concepts
const SEC_CONCEPTS = WORLDS.find(w => w.id === 'w12')!.concepts

const solvedCount = (s: GameState) => Object.values(s.solved).filter(v => v > 0).length
const kindCount = (s: GameState, kinds: string[]) =>
  CHALLENGE_META.filter(c => kinds.includes(c.kind) && (s.solved[c.id] ?? 0) > 0).length
const greenCount = (s: GameState, concepts: string[]) => concepts.filter(c => isGreen(masteryOf(s, c))).length
const flag = (cond: boolean) => (cond ? 1 : 0)

/** Un logro medible: cuánto llevas y cuánto hace falta. Se obtiene con `current >= goal`. */
export interface AchievementMetric {
  current: (s: GameState) => number
  goal: number
}

/**
 * Reglas de los logros como métricas. La misma tabla decide si un logro se
 * obtiene y alimenta la barra de avance de la interfaz, así que las dos cosas
 * no pueden desincronizarse. El orden es el de concesión.
 * `perfect-boss` no está: depende de un suceso (una boss sin fallos), no del estado.
 */
export const ACHIEVEMENT_METRICS: Record<string, AchievementMetric> = {
  'first-blood': { current: solvedCount, goal: 1 },
  grinder: { current: solvedCount, goal: 100 },
  'streak-3': { current: s => s.streak.count, goal: 3 },
  'streak-7': { current: s => s.streak.count, goal: 7 },
  debugger: { current: s => kindCount(s, ['debug']), goal: 10 },
  architect: { current: s => kindCount(s, ['decision', 'arch']), goal: 10 },
  'di-master': { current: s => greenCount(s, DI_CONCEPTS), goal: DI_CONCEPTS.length },
  'jpa-master': { current: s => greenCount(s, JPA_CONCEPTS), goal: JPA_CONCEPTS.length },
  'sec-master': { current: s => greenCount(s, SEC_CONCEPTS), goal: SEC_CONCEPTS.length },
  w01: { current: s => flag(s.bossCleared.includes('w01')), goal: 1 },
  half: { current: s => s.bossCleared.length, goal: 8 },
  'all-worlds': { current: s => s.bossCleared.length, goal: WORLDS.length },
  'no-hints': { current: s => s.noHintRun, goal: 20 },
  exam: { current: s => flag(s.exam !== null), goal: 1 },
  'exam-90': { current: s => (s.exam ? s.exam.score / Math.max(1, s.exam.total) : 0), goal: 0.9 },
  // El proyecto más avanzado, medido sobre sus requisitos.
  builder: {
    current: s => Math.max(0, ...PROJECTS.map(p => Math.min(1, (s.projects[p.id]?.length ?? 0) / p.requirements.length))),
    goal: 1,
  },
  // Recuperación: un concepto que estuvo en rojo y ahora está en verde.
  comeback: { current: s => flag(s.everRed.some(k => isGreen(masteryOf(s, k)))), goal: 1 },
}

/**
 * Función pura: recibe un estado y devuelve la lista completa de logros que le
 * corresponden. No emite toasts ni muta refs, así que puede ejecutarse dos veces
 * sin efectos observables, que es justo lo que hace React en modo estricto.
 */
export function achievementsFor(s: GameState, extra: string[] = []): string[] {
  const got = new Set(s.achievements)
  for (const [id, m] of Object.entries(ACHIEVEMENT_METRICS)) if (m.current(s) >= m.goal) got.add(id)
  for (const id of extra) got.add(id)
  return [...got]
}
