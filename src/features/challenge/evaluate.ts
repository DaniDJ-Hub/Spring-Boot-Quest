import type { Challenge, ChoiceChallenge, FillChallenge, OrderChallenge } from '../../types'

/** Lo que el jugador responde, según la forma del reto. */
export type Answer =
  | { kind: 'choice'; optionId: string | null }
  | { kind: 'order'; steps: string[] }
  | { kind: 'fill'; values: string[] }

export const isChoice = (c: Challenge): c is ChoiceChallenge => c.kind !== 'order' && c.kind !== 'fill'

/** Normaliza lo escrito: minúsculas, sin arrobas ni espacios, sin punto y coma final. */
export function normalize(s: string) {
  return s.toLowerCase().replace(/[@\s]/g, '').replace(/;$/, '')
}

/** Huecos del código de un reto de completar: tramos de tres o más guiones bajos. */
export const BLANK = /_{3,}/g

export function blankCount(c: FillChallenge): number {
  return (c.code.match(BLANK) ?? []).length || 1
}

/**
 * Barajado determinista por id: el mismo reto presenta siempre el mismo orden,
 * así una recarga no cambia las opciones de sitio a mitad de respuesta.
 */
export function shuffled<T>(arr: T[], seed: string): T[] {
  const a = arr.map((v, i) => ({ v, k: (seed.charCodeAt(i % seed.length) * (i + 7)) % 97 }))
  a.sort((x, y) => x.k - y.k)
  return a.map(x => x.v)
}

/** Orden inicial de un reto de ordenar. Nunca arranca ya resuelto. */
export function initialOrder(c: OrderChallenge): string[] {
  const s = shuffled(c.steps, c.id)
  const same = s.every((x, i) => x === c.steps[i])
  return same ? [...s.slice(1), s[0]] : s
}

export function emptyAnswer(c: Challenge): Answer {
  if (c.kind === 'order') return { kind: 'order', steps: initialOrder(c) }
  if (c.kind === 'fill') return { kind: 'fill', values: Array.from({ length: blankCount(c) }, () => '') }
  return { kind: 'choice', optionId: null }
}

export function isReady(c: Challenge, a: Answer): boolean {
  if (a.kind === 'choice') return a.optionId !== null
  if (a.kind === 'fill') return a.values.every(v => v.trim().length > 0)
  return c.kind === 'order' && a.steps.length === c.steps.length
}

/** Corrección de una respuesta. Misma regla que antes del rediseño para cada tipo. */
export function evaluate(c: Challenge, a: Answer): boolean {
  if (c.kind === 'order') return a.kind === 'order' && a.steps.every((s, i) => s === c.steps[i])
  if (c.kind === 'fill') {
    if (a.kind !== 'fill') return false
    // Varios huecos se leen juntos: «@Aspect» + «@Component» equivale a «aspect component».
    const written = normalize(a.values.join(' '))
    return c.accept.some(x => normalize(x) === written)
  }
  return a.kind === 'choice' && a.optionId === c.answer
}
