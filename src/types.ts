export type MasteryLevel = 'none' | 'basic' | 'progress' | 'mastered' | 'expert'

export type Difficulty = 1 | 2 | 3 | 4 | 5

/** Tipos de reto. Ninguno es "solo opción múltiple": cada uno evalúa una habilidad distinta. */
export type ChallengeKind =
  | 'quiz'      // conceptual, con explicación
  | 'codefix'   // código con error, elegir la corrección correcta
  | 'debug'     // stack trace / log real, encontrar la causa
  | 'arch'      // elegir la arquitectura o el diseño adecuado
  | 'decision'  // situación profesional con consecuencias
  | 'order'     // ordenar pasos de un flujo
  | 'fill'      // escribir la anotación / palabra clave que falta

export interface Option {
  id: string
  text: string
  /** Para retos de decisión: qué pasa si eliges esto. */
  consequence?: string
  /** Código como opción (codefix). */
  code?: string
}

export interface BaseChallenge {
  id: string
  worldId: string
  concepts: string[]
  difficulty: Difficulty
  xp: number
  prompt: string
  /** Explicación que aparece SIEMPRE al responder, no solo al fallar. */
  explain: string
  /** Ejemplo profesional adicional que se muestra tras fallar. */
  deeper?: string
  hint?: string
}

export interface ChoiceChallenge extends BaseChallenge {
  kind: 'quiz' | 'codefix' | 'debug' | 'arch' | 'decision'
  /** Código o log que acompaña al enunciado. */
  code?: string
  lang?: 'java' | 'xml' | 'properties' | 'sql' | 'log' | 'json'
  options: Option[]
  answer: string
}

export interface OrderChallenge extends BaseChallenge {
  kind: 'order'
  /** Los pasos en el orden CORRECTO. Se barajan al presentar. */
  steps: string[]
}

export interface FillChallenge extends BaseChallenge {
  kind: 'fill'
  code: string
  lang?: 'java' | 'properties' | 'log'
  /** Respuestas aceptadas, normalizadas (minúsculas, sin @, sin espacios). */
  accept: string[]
  placeholder?: string
}

export type Challenge = ChoiceChallenge | OrderChallenge | FillChallenge

export interface World {
  id: string
  index: number
  title: string
  tagline: string
  /** Ids de mundos que deben estar completados para desbloquear este. */
  requires: string[]
  concepts: string[]
  /** Rama del árbol de dependencias: define la sangría del mapa. */
  depth: number
  /** Evidencia: dónde se concentra el tema en la transcripción del curso. */
  courseRange: string
  boss: {
    title: string
    brief: string
    /** Cuántos retos entran en la boss battle. */
    size: number
    /** % mínimo para superarla. */
    passRate: number
  }
}

export interface ProjectBrief {
  id: string
  title: string
  unlockedBy: string      // worldId
  goal: string
  requirements: string[]
  acceptance: string[]
  stretch?: string[]
}

export interface Achievement {
  id: string
  title: string
  detail: string
  icon: string
}

export interface ConceptStat {
  attempts: number
  correct: number
  streak: number
  lastSeen: number
}

export interface AttemptLog {
  challengeId: string
  worldId: string
  correct: boolean
  at: number
}

export interface GameState {
  version: number
  xp: number
  solved: Record<string, number>        // challengeId -> veces resuelto correctamente
  failed: Record<string, number>
  concepts: Record<string, ConceptStat>
  bossCleared: string[]                 // worldIds
  achievements: string[]
  projects: Record<string, string[]>    // projectId -> requisitos marcados
  log: AttemptLog[]
  streak: { count: number; lastDay: string }
  exam: null | { score: number; total: number; at: number; byWorld: Record<string, [number, number]> }
  createdAt: number
}
