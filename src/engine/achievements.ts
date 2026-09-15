import type { GameState } from '../types'
import { CHALLENGE_META, PROJECTS } from '../data'
import { WORLDS } from '../data/worlds'
import { masteryOf } from './core'

const DI_CONCEPTS = WORLDS.find(w => w.id === 'w04')!.concepts
const JPA_CONCEPTS = WORLDS.find(w => w.id === 'w10')!.concepts
const SEC_CONCEPTS = WORLDS.find(w => w.id === 'w12')!.concepts

/**
 * Función pura: recibe un estado y devuelve la lista completa de logros que le
 * corresponden. No emite toasts ni muta refs, así que puede ejecutarse dos veces
 * sin efectos observables, que es justo lo que hace React en modo estricto.
 */
export function achievementsFor(s: GameState, extra: string[] = []): string[] {
  const got = new Set(s.achievements)
  const add = (id: string, cond: boolean) => { if (cond) got.add(id) }

  const solvedCount = Object.values(s.solved).filter(v => v > 0).length
  const kindCount = (kinds: string[]) =>
    CHALLENGE_META.filter(c => kinds.includes(c.kind) && (s.solved[c.id] ?? 0) > 0).length
  const allGreen = (concepts: string[]) =>
    concepts.every(c => ['mastered', 'expert'].includes(masteryOf(s, c)))

  add('first-blood', solvedCount >= 1)
  add('grinder', solvedCount >= 100)
  add('streak-3', s.streak.count >= 3)
  add('streak-7', s.streak.count >= 7)
  add('debugger', kindCount(['debug']) >= 10)
  add('architect', kindCount(['decision', 'arch']) >= 10)
  add('di-master', allGreen(DI_CONCEPTS))
  add('jpa-master', allGreen(JPA_CONCEPTS))
  add('sec-master', allGreen(SEC_CONCEPTS))
  add('w01', s.bossCleared.includes('w01'))
  add('half', s.bossCleared.length >= 8)
  add('all-worlds', s.bossCleared.length >= WORLDS.length)
  add('no-hints', s.noHintRun >= 20)
  add('exam', s.exam !== null)
  add('exam-90', s.exam !== null && s.exam.score / Math.max(1, s.exam.total) >= 0.9)
  add('builder', PROJECTS.some(p => (s.projects[p.id]?.length ?? 0) >= p.requirements.length))
  // Recuperación: un concepto que estuvo en rojo y ahora está en verde.
  add('comeback', s.everRed.some(k => ['mastered', 'expert'].includes(masteryOf(s, k))))
  for (const id of extra) add(id, true)

  return [...got]
}
