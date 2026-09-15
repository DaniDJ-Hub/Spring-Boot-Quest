/**
 * Selectores de solo lectura para la interfaz.
 *
 * La UI no escribe umbrales ni duplica reglas: pregunta aquí. Cada selector se
 * apoya en las funciones y constantes de core.ts, así que si una regla cambia
 * en el motor, la pantalla cambia sola. Todo es puro: recibe estado, no lo muta.
 */
import type { ChallengeMeta, GameState, MasteryLevel, ProjectBrief, World } from '../types'
import { CHALLENGE_META, metaOf } from '../data'
import { WORLDS, WORLD_BY_ID } from '../data/worlds'
import {
  ADAPTIVE_WEAK_LIMIT, BOSS_UNLOCK_RATIO, bossAvailable, bossBonus, bossRequired, HINT_XP_FACTOR, isGreen,
  MASTERY_ORDER, MASTERY_RULES, masteryOf, SELECTION_REASONS, selectionScore, todayKey, WEAK_ACCURACY,
  WEAK_MIN_ATTEMPTS, weakConcepts, worldProgress, worldUnlocked, yesterdayKey,
} from './core'
import type { MasteryRule, SelectionReason } from './core'
import { ACHIEVEMENT_METRICS } from './achievements'

export type { SelectionReason } from './core'

/* ------------------------------- Mundos -------------------------------- */

export type WorldStatus = 'locked' | 'available' | 'in-progress' | 'boss-open' | 'cleared' | 'mastered'

export function worldStatus(state: GameState, world: World): WorldStatus {
  if (!worldUnlocked(state, world)) return 'locked'
  if (state.bossCleared.includes(world.id)) {
    return world.concepts.every(k => isGreen(masteryOf(state, k))) ? 'mastered' : 'cleared'
  }
  if (bossAvailable(state, world)) return 'boss-open'
  return worldProgress(state, world.id).done > 0 ? 'in-progress' : 'available'
}

/** Mundos que declaran a este como requisito. */
export function worldDependents(worldId: string): World[] {
  return WORLDS.filter(w => w.requires.includes(worldId))
}

/** Requisitos de un mundo con su estado: qué falta para abrirlo. */
export function worldRequirements(state: GameState, world: World): { world: World; cleared: boolean }[] {
  return world.requires
    .map(id => WORLD_BY_ID[id])
    .filter((w): w is World => Boolean(w))
    .map(w => ({ world: w, cleared: state.bossCleared.includes(w.id) }))
}

/** Dominio agregado de un mundo: cuántos conceptos hay en cada nivel. */
export function worldMastery(state: GameState, world: World): Record<MasteryLevel, number> & { green: number; total: number } {
  const out = { none: 0, basic: 0, progress: 0, mastered: 0, expert: 0, green: 0, total: world.concepts.length }
  for (const k of world.concepts) {
    const level = masteryOf(state, k)
    out[level]++
    if (isGreen(level)) out.green++
  }
  return out
}

/* ---------------------------- Boss battles ----------------------------- */

export interface BossGate {
  done: number
  total: number
  /** Retos resueltos que abren la boss. */
  required: number
  remaining: number
  /** Fracción del mundo que abre la boss (para colocar la marca en la barra). */
  ratio: number
  open: boolean
  cleared: boolean
  size: number
  passRate: number
  /** Aciertos mínimos para superarla con su tamaño actual. */
  passCount: number
  bonusXp: number
}

export function bossGate(state: GameState, world: World): BossGate {
  const p = worldProgress(state, world.id)
  const required = bossRequired(p.total)
  return {
    done: p.done,
    total: p.total,
    required,
    remaining: Math.max(0, required - p.done),
    ratio: BOSS_UNLOCK_RATIO,
    open: bossAvailable(state, world),
    cleared: state.bossCleared.includes(world.id),
    size: world.boss.size,
    passRate: world.boss.passRate,
    passCount: minCorrectToPass(world, world.boss.size),
    bonusXp: bossBonus(world),
  }
}

/** Criterio de aprobación de una boss battle con `total` retos respondidos. */
export function bossPassed(world: World, correct: number, total: number): boolean {
  return total > 0 && correct / total >= world.boss.passRate
}

/** El menor número de aciertos que aprueba, con el mismo criterio que bossPassed. */
export function minCorrectToPass(world: World, total: number): number {
  for (let k = 0; k <= total; k++) if (bossPassed(world, k, total)) return k
  return total
}

/** El mundo cuya boss está más cerca: primero las ya abiertas, luego la que menos retos pide. */
export function nextBossToOpen(state: GameState): { world: World; gate: BossGate } | null {
  const candidates = WORLDS
    .filter(w => worldUnlocked(state, w) && !state.bossCleared.includes(w.id))
    .map(w => ({ world: w, gate: bossGate(state, w) }))
    .sort((a, b) => Number(b.gate.open) - Number(a.gate.open) || a.gate.remaining - b.gate.remaining || a.world.index - b.world.index)
  return candidates[0] ?? null
}

/* ------------------------------- Dominio ------------------------------- */

export interface ConceptProgress {
  level: MasteryLevel
  attempts: number
  correct: number
  streak: number
  accuracy: number | null
  /** Siguiente nivel y lo que exige; null si ya es experto. */
  next: { level: MasteryLevel; rule: MasteryRule; missingAttempts: number; missingStreak: number } | null
}

export function conceptProgress(state: GameState, concept: string): ConceptProgress {
  const s = state.concepts[concept] ?? { attempts: 0, correct: 0, streak: 0, lastSeen: 0 }
  const level = masteryOf(state, concept)
  const nextLevel = MASTERY_ORDER[MASTERY_ORDER.indexOf(level) + 1]
  // «Básico» no tiene regla propia: se alcanza con el primer intento.
  const target = nextLevel === 'basic' ? 'progress' : nextLevel
  const rule = target && target in MASTERY_RULES ? MASTERY_RULES[target as keyof typeof MASTERY_RULES] : null
  return {
    level,
    attempts: s.attempts,
    correct: s.correct,
    streak: s.streak,
    accuracy: s.attempts ? s.correct / s.attempts : null,
    next: rule && target
      ? {
          level: target,
          rule,
          missingAttempts: Math.max(0, rule.minAttempts - s.attempts),
          missingStreak: Math.max(0, rule.minStreak - s.streak),
        }
      : null,
  }
}

export interface MasteryChange {
  concept: string
  from: MasteryLevel
  to: MasteryLevel
  direction: 'up' | 'down' | 'same'
}

/** Compara el dominio de unos conceptos entre dos estados: lo que subió y lo que bajó. */
export function masteryDelta(before: GameState, after: GameState, concepts: string[]): MasteryChange[] {
  return [...new Set(concepts)].map(concept => {
    const from = masteryOf(before, concept)
    const to = masteryOf(after, concept)
    const d = MASTERY_ORDER.indexOf(to) - MASTERY_ORDER.indexOf(from)
    return { concept, from, to, direction: d > 0 ? 'up' : d < 0 ? 'down' : 'same' }
  })
}

/** Distribución de los conceptos de todo el temario por nivel. */
export function globalMastery(state: GameState): Record<MasteryLevel, number> & { green: number; total: number } {
  const all = WORLDS.flatMap(w => w.concepts)
  const out = { none: 0, basic: 0, progress: 0, mastered: 0, expert: 0, green: 0, total: all.length }
  for (const k of all) {
    const level = masteryOf(state, k)
    out[level]++
    if (isGreen(level)) out.green++
  }
  return out
}

/* ------------------------- Selección adaptativa ------------------------ */

/** Por qué aparece cada reto donde aparece en la práctica de su mundo. */
export function selectionReasons(state: GameState, metas: ChallengeMeta[]): Record<string, SelectionReason> {
  const weak = new Set(weakConcepts(state, ADAPTIVE_WEAK_LIMIT))
  return Object.fromEntries(metas.map(m => [m.id, SELECTION_REASONS[selectionScore(state, m, weak)]]))
}

export function selectionReason(state: GameState, meta: ChallengeMeta): SelectionReason {
  return selectionReasons(state, [meta])[meta.id]
}

/** Conceptos por debajo del umbral de refuerzo, sin límite. */
export function weakCount(state: GameState): number {
  return weakConcepts(state, Number.POSITIVE_INFINITY).length
}

/** Umbrales del refuerzo, para explicarlos en pantalla. */
export const reinforceRule = { accuracy: WEAK_ACCURACY, minAttempts: WEAK_MIN_ATTEMPTS } as const

/** Porcentaje de XP que cuesta pedir una pista. */
export function hintCostPct(): number {
  return Math.round((1 - HINT_XP_FACTOR) * 100)
}

/* ------------------------------- Rachas -------------------------------- */

/** La racha que sigue viva hoy: si el último día de práctica no es hoy ni ayer, ya se rompió. */
export function currentStreak(state: GameState): number {
  const { count, lastDay } = state.streak
  return lastDay === todayKey() || lastDay === yesterdayKey() ? count : 0
}

/* ------------------------------- Examen -------------------------------- */

export function examAvailability(state: GameState): { available: boolean; cleared: number; total: number; taken: boolean } {
  const cleared = WORLDS.filter(w => state.bossCleared.includes(w.id)).length
  return { available: cleared === WORLDS.length, cleared, total: WORLDS.length, taken: state.exam !== null }
}

/** Cortes del Skill Report. Antes vivían escritos en la pantalla. */
export const SKILL_REPORT_RULES = {
  strong: 0.8,
  weak: 0.6,
  verdicts: [
    { min: 0.9, label: 'Spring Boot Expert' },
    { min: 0.75, label: 'Backend Engineer' },
    { min: 0.55, label: 'Spring Developer' },
  ],
  fallback: 'En formación',
} as const

export type WorldBand = 'strong' | 'ok' | 'weak'

export interface SkillReport {
  score: number
  total: number
  ratio: number
  at: number
  verdict: string
  worlds: { world: World; ok: number; n: number; ratio: number; band: WorldBand }[]
  strengths: World[]
  toReview: World[]
  green: string[]
  unpracticed: string[]
}

export function skillReport(state: GameState): SkillReport | null {
  const exam = state.exam
  if (!exam) return null
  const ratio = exam.score / Math.max(1, exam.total)
  const verdict = SKILL_REPORT_RULES.verdicts.find(v => ratio >= v.min)?.label ?? SKILL_REPORT_RULES.fallback
  const worlds = WORLDS
    .filter(w => exam.byWorld[w.id])
    .map(w => {
      const [ok, n] = exam.byWorld[w.id]
      const r = ok / Math.max(1, n)
      const band: WorldBand = r >= SKILL_REPORT_RULES.strong ? 'strong' : r < SKILL_REPORT_RULES.weak ? 'weak' : 'ok'
      return { world: w, ok, n, ratio: r, band }
    })
  const all = WORLDS.flatMap(w => w.concepts)
  return {
    score: exam.score,
    total: exam.total,
    ratio,
    at: exam.at,
    verdict,
    worlds,
    strengths: worlds.filter(x => x.band === 'strong').map(x => x.world),
    toReview: [...worlds].filter(x => x.band === 'weak').sort((a, b) => a.ratio - b.ratio).map(x => x.world),
    green: all.filter(k => isGreen(masteryOf(state, k))),
    unpracticed: all.filter(k => masteryOf(state, k) === 'none'),
  }
}

/* ------------------------------ Proyectos ------------------------------ */

export type ProjectStatus = 'locked' | 'not-started' | 'in-progress' | 'done'

export function projectStatus(state: GameState, p: ProjectBrief): { status: ProjectStatus; checked: number; total: number } {
  const items = [...p.requirements, ...p.acceptance]
  const marked = new Set(state.projects[p.id] ?? [])
  const checked = items.filter(i => marked.has(i)).length
  const total = items.length
  if (!state.bossCleared.includes(p.unlockedBy)) return { status: 'locked', checked, total }
  const status: ProjectStatus = checked === 0 ? 'not-started' : checked >= total ? 'done' : 'in-progress'
  return { status, checked, total }
}

/* ------------------------------- Logros -------------------------------- */

/** Avance de un logro medible; null para los que dependen de un suceso. */
export function achievementProgress(state: GameState, id: string): { current: number; goal: number; ratio: number } | null {
  const m = ACHIEVEMENT_METRICS[id]
  if (!m) return null
  const current = m.current(state)
  return { current, goal: m.goal, ratio: Math.max(0, Math.min(1, current / m.goal)) }
}

/* ------------------------------ Actividad ------------------------------ */

/** El último mundo jugado que sigue abierto y sin superar: candidato a «continuar». */
export function lastActiveWorld(state: GameState): World | null {
  for (const entry of state.log) {
    const w = WORLD_BY_ID[entry.worldId]
    if (w && worldUnlocked(state, w) && !state.bossCleared.includes(w.id)) return w
  }
  return null
}

/** Total de retos del temario, sin descargar contenido. */
export const CHALLENGE_TOTAL = CHALLENGE_META.length

/** Cuántos retos de un mundo hay por motivo, para anticipar cómo será la ronda. */
export function roundPreview(state: GameState, worldId: string): Record<SelectionReason, number> {
  const out: Record<SelectionReason, number> = { failed: 0, weak: 0, new: 0, review: 0 }
  for (const reason of Object.values(selectionReasons(state, metaOf(worldId)))) out[reason]++
  return out
}
