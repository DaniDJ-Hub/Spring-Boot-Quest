import type { Challenge, GameState, MasteryLevel, World } from '../types'
import { CHALLENGES, challengesOf } from '../data'
import { WORLDS } from '../data/worlds'

export const STORAGE_KEY = 'sbq:v1'
export const STATE_VERSION = 1

export function emptyState(): GameState {
  return {
    version: STATE_VERSION,
    xp: 0,
    solved: {},
    failed: {},
    concepts: {},
    bossCleared: [],
    achievements: [],
    projects: {},
    log: [],
    streak: { count: 0, lastDay: '' },
    exam: null,
    createdAt: Date.now(),
  }
}

export function loadState(): GameState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw) as GameState
    if (parsed.version !== STATE_VERSION) return emptyState()
    return { ...emptyState(), ...parsed }
  } catch {
    return emptyState()
  }
}

export function saveState(s: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // Sin almacenamiento disponible: la partida sigue en memoria durante la sesión.
  }
}

/* ---------------------------------- XP ---------------------------------- */

/** Curva suave: cada nivel cuesta un poco más que el anterior. */
export function xpForLevel(level: number): number {
  if (level <= 1) return 0
  return Math.round(60 * (level - 1) + 8 * (level - 1) * (level - 1))
}

export function levelFromXp(xp: number): number {
  let l = 1
  while (l < 40 && xp >= xpForLevel(l + 1)) l++
  return l
}

const TITLES: [number, string][] = [
  [1, 'Spring Apprentice'],
  [5, 'Junior Developer'],
  [10, 'Spring Developer'],
  [15, 'API Builder'],
  [20, 'Backend Engineer'],
  [26, 'Senior Backend'],
  [32, 'Spring Boot Expert'],
]

export function titleFor(level: number): string {
  let t = TITLES[0][1]
  for (const [lv, name] of TITLES) if (level >= lv) t = name
  return t
}

export function nextTitle(level: number): { level: number; name: string } | null {
  for (const [lv, name] of TITLES) if (lv > level) return { level: lv, name }
  return null
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp)
  const floor = xpForLevel(level)
  const ceil = xpForLevel(level + 1)
  const span = Math.max(1, ceil - floor)
  return { level, floor, ceil, pct: Math.min(100, ((xp - floor) / span) * 100) }
}

/* -------------------------------- Dominio ------------------------------- */

/**
 * El dominio no se gana contestando una vez: exige aciertos sostenidos.
 * Un fallo rompe la racha, así que un concepto puede bajar de nivel.
 */
export function masteryOf(state: GameState, concept: string): MasteryLevel {
  const s = state.concepts[concept]
  if (!s || s.attempts === 0) return 'none'
  const acc = s.correct / s.attempts
  if (s.attempts >= 5 && acc >= 0.9 && s.streak >= 4) return 'expert'
  if (s.attempts >= 3 && acc >= 0.75 && s.streak >= 2) return 'mastered'
  if (acc >= 0.5) return 'progress'
  return 'basic'
}

export const MASTERY_META: Record<MasteryLevel, { label: string; dot: string; text: string }> = {
  none:     { label: 'No dominado', dot: 'bg-rust',        text: 'text-rust' },
  basic:    { label: 'Básico',      dot: 'bg-amber',       text: 'text-amber' },
  progress: { label: 'En progreso', dot: 'bg-amber',       text: 'text-amber' },
  mastered: { label: 'Dominado',    dot: 'bg-leaf',        text: 'text-leaf' },
  expert:   { label: 'Experto',     dot: 'bg-sky',         text: 'text-sky' },
}

export function conceptAccuracy(state: GameState, concept: string): number | null {
  const s = state.concepts[concept]
  if (!s || s.attempts === 0) return null
  return s.correct / s.attempts
}

/** Conceptos flojos: los que fallas más de lo que aciertas, con evidencia suficiente. */
export function weakConcepts(state: GameState, limit = 8): string[] {
  return Object.entries(state.concepts)
    .filter(([, s]) => s.attempts >= 2 && s.correct / s.attempts < 0.6)
    .sort((a, b) => a[1].correct / a[1].attempts - b[1].correct / b[1].attempts)
    .slice(0, limit)
    .map(([c]) => c)
}

/* ------------------------------- Progresión ------------------------------ */

export function worldUnlocked(state: GameState, world: World): boolean {
  return world.requires.every(r => state.bossCleared.includes(r))
}

export function worldProgress(state: GameState, worldId: string) {
  const list = challengesOf(worldId)
  const done = list.filter(c => (state.solved[c.id] ?? 0) > 0).length
  return { done, total: list.length, pct: list.length ? (done / list.length) * 100 : 0 }
}

export function overallProgress(state: GameState) {
  const total = CHALLENGES.length
  const done = CHALLENGES.filter(c => (state.solved[c.id] ?? 0) > 0).length
  return { done, total, pct: total ? (done / total) * 100 : 0 }
}

export function bossAvailable(state: GameState, world: World): boolean {
  const p = worldProgress(state, world.id)
  return p.total > 0 && p.done >= Math.ceil(p.total * 0.7)
}

/* ----------------------------- Selección adaptativa ---------------------- */

function shuffle<T>(arr: T[], seed = Date.now()): T[] {
  const a = [...arr]
  let s = seed
  for (let i = a.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff
    const j = s % (i + 1)
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Orden de práctica dentro de un mundo:
 * 1. Retos que fallaste y aún no has resuelto.
 * 2. Retos que tocan conceptos flojos.
 * 3. Retos nuevos, de menor a mayor dificultad.
 * 4. Repaso de lo ya resuelto, al final.
 */
export function nextInWorld(state: GameState, worldId: string): Challenge[] {
  const weak = new Set(weakConcepts(state, 12))
  const list = challengesOf(worldId)
  const score = (c: Challenge) => {
    const solved = (state.solved[c.id] ?? 0) > 0
    const failed = (state.failed[c.id] ?? 0) > 0
    if (failed && !solved) return 0
    if (!solved && c.concepts.some(x => weak.has(x))) return 1
    if (!solved) return 2
    return 3
  }
  return [...list].sort((a, b) => score(a) - score(b) || a.difficulty - b.difficulty)
}

/** Sesión de refuerzo: retos que atacan directamente lo que fallas. */
export function reinforcementSet(state: GameState, size = 8): Challenge[] {
  const weak = weakConcepts(state, 10)
  if (weak.length === 0) return []
  const weakSet = new Set(weak)
  const unlocked = new Set(WORLDS.filter(w => worldUnlocked(state, w)).map(w => w.id))
  const pool = CHALLENGES.filter(c => unlocked.has(c.worldId) && c.concepts.some(x => weakSet.has(x)))
  const notSolved = pool.filter(c => (state.solved[c.id] ?? 0) === 0)
  const rest = pool.filter(c => (state.solved[c.id] ?? 0) > 0)
  return [...shuffle(notSolved), ...shuffle(rest)].slice(0, size)
}

/** Boss battle: mezcla de tipos del mundo, priorizando dificultad alta. */
export function bossSet(world: World): Challenge[] {
  const list = challengesOf(world.id)
  const byKind = new Map<string, Challenge[]>()
  for (const c of list) {
    const arr = byKind.get(c.kind) ?? []
    arr.push(c)
    byKind.set(c.kind, arr)
  }
  const picked: Challenge[] = []
  // Un reto de cada tipo disponible, el más difícil de su grupo.
  for (const [, arr] of byKind) {
    picked.push([...arr].sort((a, b) => b.difficulty - a.difficulty)[0])
  }
  const rest = list.filter(c => !picked.includes(c)).sort((a, b) => b.difficulty - a.difficulty)
  return [...picked, ...rest].slice(0, world.boss.size)
}

/** Examen final: cobertura pareja de los quince mundos. */
export function examSet(perWorld = 2): Challenge[] {
  const out: Challenge[] = []
  for (const w of WORLDS) {
    const list = [...challengesOf(w.id)].sort((a, b) => b.difficulty - a.difficulty)
    out.push(...list.slice(0, perWorld))
  }
  return shuffle(out)
}

/* -------------------------------- Rachas -------------------------------- */

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10)
}

export function bumpStreak(streak: GameState['streak']): GameState['streak'] {
  const today = todayKey()
  if (streak.lastDay === today) return streak
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10)
  return { count: streak.lastDay === yesterday ? streak.count + 1 : 1, lastDay: today }
}
