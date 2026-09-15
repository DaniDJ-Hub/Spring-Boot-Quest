import type { ChallengeMeta, GameState, MasteryLevel, World } from '../types'
import { CHALLENGE_META, metaOf } from '../data'
import { WORLDS } from '../data/worlds'

export const STORAGE_KEY = 'sbq:v1'
/** Clave donde se aparta una partida que no se pudo migrar, en vez de borrarla. */
export const RESCUE_KEY = 'sbq:rescue'
export const STATE_VERSION = 2

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
    everRed: [],
    noHintRun: 0,
    createdAt: Date.now(),
  }
}

/**
 * Migraciones acumulativas. Cada entrada recibe el estado en la versión N
 * y devuelve la versión N+1. Nunca se descarta progreso en silencio.
 */
const MIGRATIONS: Record<number, (s: Record<string, unknown>) => Record<string, unknown>> = {
  1: prev => ({ ...prev, everRed: [], noHintRun: 0, version: 2 }),
}

export type LoadResult = { state: GameState; rescued: boolean }

export function loadState(): LoadResult {
  let raw: string | null = null
  try {
    raw = localStorage.getItem(STORAGE_KEY)
  } catch {
    return { state: emptyState(), rescued: false }
  }
  if (!raw) return { state: emptyState(), rescued: false }

  let parsed: Record<string, unknown>
  try {
    parsed = JSON.parse(raw) as Record<string, unknown>
  } catch {
    return { state: rescue(raw), rescued: true }
  }

  const migrated = migrate(parsed)
  if (!migrated) return { state: rescue(raw), rescued: true }
  return { state: { ...emptyState(), ...migrated, version: STATE_VERSION }, rescued: false }
}

/**
 * Aplica las migraciones necesarias para llegar a la versión actual.
 * Devuelve null si no hay camino: versión futura o migración inexistente.
 */
function migrate(input: Record<string, unknown>): GameState | null {
  let parsed = input
  let v = typeof parsed.version === 'number' ? parsed.version : 0
  if (v > STATE_VERSION) return null
  while (v < STATE_VERSION) {
    const step = MIGRATIONS[v]
    if (!step) return null
    parsed = step(parsed)
    v = typeof parsed.version === 'number' ? parsed.version : v + 1
  }
  return parsed as unknown as GameState
}

/** Guarda la partida ilegible bajo otra clave para poder recuperarla después. */
function rescue(raw: string): GameState {
  try {
    localStorage.setItem(`${RESCUE_KEY}:${Date.now()}`, raw)
  } catch {
    // Si no se puede escribir, al menos no sobrescribimos nada.
  }
  return emptyState()
}

export function saveState(s: GameState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(s))
  } catch {
    // Sin almacenamiento disponible: la partida sigue en memoria durante la sesión.
  }
}

/* ------------------------------ Portabilidad ----------------------------- */

/** Cabecera del fichero exportado: identifica el formato sin depender del nombre. */
export const EXPORT_MARK = 'spring-boot-quest'

export interface ExportFile {
  app: string
  version: number
  exportedAt: string
  state: GameState
}

export function exportState(s: GameState): string {
  const file: ExportFile = {
    app: EXPORT_MARK,
    version: s.version,
    exportedAt: new Date().toISOString(),
    state: s,
  }
  return JSON.stringify(file, null, 2)
}

export type ImportResult =
  | { ok: true; state: GameState }
  | { ok: false; reason: string }

/**
 * Lee un fichero exportado. Valida antes de aceptar: un JSON cualquiera no
 * debería poder sustituir el progreso de alguien. Reutiliza las mismas
 * migraciones que la carga normal, así que un respaldo antiguo sigue sirviendo.
 */
export function importState(text: string): ImportResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, reason: 'El fichero no es JSON válido.' }
  }
  if (typeof parsed !== 'object' || parsed === null) {
    return { ok: false, reason: 'El fichero no tiene el formato esperado.' }
  }
  const file = parsed as Partial<ExportFile>
  if (file.app !== EXPORT_MARK) {
    return { ok: false, reason: 'Este fichero no es un respaldo de Spring Boot Quest.' }
  }
  if (typeof file.state !== 'object' || file.state === null) {
    return { ok: false, reason: 'El respaldo no contiene ninguna partida.' }
  }

  const migrated = migrate(file.state as unknown as Record<string, unknown>)
  if (!migrated) {
    return { ok: false, reason: `El respaldo es de una versión que esta no sabe leer.` }
  }
  if (typeof migrated.xp !== 'number' || !Array.isArray(migrated.bossCleared)) {
    return { ok: false, reason: 'El respaldo está incompleto o dañado.' }
  }
  return { ok: true, state: { ...emptyState(), ...migrated, version: STATE_VERSION } }
}

/** Cuántas entradas del registro de actividad se conservan. */
export const LOG_LIMIT = 50

/**
 * Guardado con retardo: escribir en localStorage es síncrono y bloquea el hilo
 * principal, así que no conviene hacerlo en cada pulsación. Devuelve una función
 * para forzar la escritura pendiente antes de cerrar la pestaña.
 */
export function createSaver(delay = 400) {
  let timer: ReturnType<typeof setTimeout> | null = null
  let pending: GameState | null = null

  const flush = () => {
    if (timer) { clearTimeout(timer); timer = null }
    if (pending) { saveState(pending); pending = null }
  }

  return {
    schedule(s: GameState) {
      pending = s
      if (timer) clearTimeout(timer)
      timer = setTimeout(flush, delay)
    },
    flush,
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

/** Cada nivel tiene color propio: antes «básico» y «en progreso» compartían
 *  ámbar, así que dos estados distintos se veían idénticos. */
export const MASTERY_META: Record<MasteryLevel, { label: string; dot: string; text: string }> = {
  none:     { label: 'No dominado', dot: 'bg-mastery-none',     text: 'text-mastery-none' },
  basic:    { label: 'Básico',      dot: 'bg-mastery-basic',    text: 'text-mastery-basic' },
  progress: { label: 'En progreso', dot: 'bg-mastery-progress', text: 'text-mastery-progress' },
  mastered: { label: 'Dominado',    dot: 'bg-mastery-mastered', text: 'text-mastery-mastered' },
  expert:   { label: 'Experto',     dot: 'bg-mastery-expert',   text: 'text-mastery-expert' },
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
  const list = metaOf(worldId)
  const done = list.filter(c => (state.solved[c.id] ?? 0) > 0).length
  return { done, total: list.length, pct: list.length ? (done / list.length) * 100 : 0 }
}

export function overallProgress(state: GameState) {
  const total = CHALLENGE_META.length
  const done = CHALLENGE_META.filter(c => (state.solved[c.id] ?? 0) > 0).length
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
export function nextInWorld(state: GameState, worldId: string): ChallengeMeta[] {
  const weak = new Set(weakConcepts(state, 12))
  const list = metaOf(worldId)
  const score = (c: ChallengeMeta) => {
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
export function reinforcementSet(state: GameState, size = 8): ChallengeMeta[] {
  const weak = weakConcepts(state, 10)
  if (weak.length === 0) return []
  const weakSet = new Set(weak)
  const unlocked = new Set(WORLDS.filter(w => worldUnlocked(state, w)).map(w => w.id))
  const pool = CHALLENGE_META.filter(c => unlocked.has(c.worldId) && c.concepts.some(x => weakSet.has(x)))
  const notSolved = pool.filter(c => (state.solved[c.id] ?? 0) === 0)
  const rest = pool.filter(c => (state.solved[c.id] ?? 0) > 0)
  return [...shuffle(notSolved), ...shuffle(rest)].slice(0, size)
}

/** Boss battle: mezcla de tipos del mundo, priorizando dificultad alta. */
export function bossSet(world: World): ChallengeMeta[] {
  const list = metaOf(world.id)
  const byKind = new Map<string, ChallengeMeta[]>()
  for (const c of list) {
    const arr = byKind.get(c.kind) ?? []
    arr.push(c)
    byKind.set(c.kind, arr)
  }
  const picked: ChallengeMeta[] = []
  // Un reto de cada tipo disponible, el más difícil de su grupo.
  for (const [, arr] of byKind) {
    picked.push([...arr].sort((a, b) => b.difficulty - a.difficulty)[0])
  }
  const rest = list.filter(c => !picked.includes(c)).sort((a, b) => b.difficulty - a.difficulty)
  return [...picked, ...rest].slice(0, world.boss.size)
}

/** Examen final: cobertura pareja de los quince mundos. */
export function examSet(perWorld = 2, seed = Date.now()): ChallengeMeta[] {
  const out: ChallengeMeta[] = []
  for (const w of WORLDS) {
    const list = [...metaOf(w.id)].sort((a, b) => b.difficulty - a.difficulty)
    out.push(...list.slice(0, perWorld))
  }
  // La semilla se pasa desde fuera para poder rebarajar al repetir el examen.
  return shuffle(out, seed)
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
