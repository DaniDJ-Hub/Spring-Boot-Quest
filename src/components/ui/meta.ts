import type { ChallengeKind } from '../../types'
import type { ProjectStatus, SelectionReason, WorldStatus } from '../../engine/selectors'
import type { IconName } from './Icon'

/**
 * Metadatos de presentación: etiquetas, iconos y tonos. No contienen reglas
 * del juego, solo cómo se ve y cómo se llama cada cosa, en un único sitio.
 * Antes el tipo de reto tenía dos juegos de etiquetas distintos.
 */

export type Tone = 'neutral' | 'accent' | 'warning' | 'danger' | 'info' | 'boss' | 'locked'

export const KIND_META: Record<ChallengeKind, { label: string; icon: IconName }> = {
  quiz: { label: 'Conceptual', icon: 'lightbulb' },
  codefix: { label: 'Corregir código', icon: 'wrench' },
  debug: { label: 'Debugging', icon: 'bug' },
  arch: { label: 'Arquitectura', icon: 'layers' },
  decision: { label: 'Decisión profesional', icon: 'fork' },
  order: { label: 'Ordenar flujo', icon: 'list-ordered' },
  fill: { label: 'Completar código', icon: 'cursor-text' },
}

export const REASON_META: Record<SelectionReason, { label: string; icon: IconName; tone: Tone; hint: string }> = {
  failed: { label: 'Fallado', icon: 'rotate-ccw', tone: 'warning', hint: 'Lo fallaste y aún no lo resuelves.' },
  weak: { label: 'Concepto flojo', icon: 'trending-down', tone: 'info', hint: 'Toca un concepto donde aciertas poco.' },
  new: { label: 'Nuevo', icon: 'sparkle', tone: 'accent', hint: 'Todavía no lo has intentado.' },
  review: { label: 'Repaso', icon: 'repeat', tone: 'neutral', hint: 'Ya lo resolviste; sirve para afianzar.' },
}

export const WORLD_STATUS_META: Record<WorldStatus, { label: string; icon: IconName; tone: Tone }> = {
  locked: { label: 'Bloqueado', icon: 'lock', tone: 'locked' },
  available: { label: 'Disponible', icon: 'play', tone: 'neutral' },
  'in-progress': { label: 'En curso', icon: 'git-commit', tone: 'info' },
  'boss-open': { label: 'Deploy listo', icon: 'rocket', tone: 'boss' },
  cleared: { label: 'Resuelto', icon: 'check-circle', tone: 'accent' },
  mastered: { label: 'Dominado', icon: 'shield-check', tone: 'accent' },
}

export const PROJECT_STATUS_META: Record<ProjectStatus, { label: string; icon: IconName; tone: Tone }> = {
  locked: { label: 'Bloqueado', icon: 'lock', tone: 'locked' },
  'not-started': { label: 'No iniciado', icon: 'dot', tone: 'neutral' },
  'in-progress': { label: 'En curso', icon: 'git-commit', tone: 'info' },
  done: { label: 'Completado', icon: 'check-circle', tone: 'accent' },
}

/* ------------------------------- Rarezas ------------------------------- */

export type Rarity = 'snapshot' | 'rc' | 'release' | 'lts'

/** Las clases van escritas enteras para que Tailwind las encuentre al compilar. */
export const RARITY_META: Record<Rarity, { label: string; text: string; border: string; bg: string }> = {
  snapshot: { label: 'SNAPSHOT', text: 'text-rarity-snapshot', border: 'border-rarity-snapshot', bg: 'bg-rarity-snapshot' },
  rc: { label: 'RC', text: 'text-rarity-rc', border: 'border-rarity-rc', bg: 'bg-rarity-rc' },
  release: { label: 'RELEASE', text: 'text-rarity-release', border: 'border-rarity-release', bg: 'bg-rarity-release' },
  lts: { label: 'LTS', text: 'text-rarity-lts', border: 'border-rarity-lts', bg: 'bg-rarity-lts' },
}

/** Rareza de cada logro. Los datos no la traen: se decide aquí, en la interfaz. */
export const ACHIEVEMENT_RARITY: Record<string, Rarity> = {
  'first-blood': 'snapshot',
  'streak-3': 'snapshot',
  w01: 'snapshot',
  'streak-7': 'rc',
  debugger: 'rc',
  architect: 'rc',
  'no-hints': 'rc',
  comeback: 'rc',
  builder: 'rc',
  'perfect-boss': 'release',
  'di-master': 'release',
  'jpa-master': 'release',
  'sec-master': 'release',
  half: 'release',
  exam: 'release',
  grinder: 'release',
  'all-worlds': 'lts',
  'exam-90': 'lts',
}

/** Icono propio de cada logro, en lugar del glifo que traen los datos. */
export const ACHIEVEMENT_ICON: Record<string, IconName> = {
  'first-blood': 'target',
  w01: 'rocket',
  'streak-3': 'flame',
  'streak-7': 'flame',
  'perfect-boss': 'shield-check',
  debugger: 'bug',
  architect: 'layers',
  'di-master': 'box',
  'jpa-master': 'database',
  'sec-master': 'shield',
  'no-hints': 'eye-off',
  comeback: 'refresh',
  half: 'flag',
  'all-worlds': 'map',
  exam: 'file-check',
  'exam-90': 'trophy',
  grinder: 'hash',
  builder: 'hammer',
}

export const rarityOf = (achievementId: string): Rarity => ACHIEVEMENT_RARITY[achievementId] ?? 'snapshot'
export const achievementIcon = (achievementId: string): IconName => ACHIEVEMENT_ICON[achievementId] ?? 'medal'

/** Código de dos cifras de un mundo: 01…15. */
export const worldCode = (world: { index: number }) => String(world.index).padStart(2, '0')
