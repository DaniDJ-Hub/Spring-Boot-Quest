/**
 * Diff orientativo entre el código original de un reto y un parche propuesto.
 *
 * Los parches del contenido son fragmentos, no archivos completos (`{ ... }`
 * elide cuerpos), así que un diff línea a línea clásico marcaría medio archivo
 * como borrado. En su lugar:
 *  1. Se alinean las líneas iguales con una LCS ponderada por longitud (una
 *     línea larga idéntica es mejor ancla que un `}` suelto).
 *  2. Cada línea del parche sin pareja busca, entre las anclas vecinas, la
 *     línea original más parecida por identificadores. Si se parece lo
 *     bastante es una modificación (− original, + parche); si no, un añadido.
 */

export type DiffSign = ' ' | '+' | '-'
export interface DiffRow { sign: DiffSign; text: string; line?: number }
export interface PatchDiff { rows: DiffRow[]; touched: number[] }

const SIMILAR = 0.5

const norm = (s: string) => s.trim().replace(/\{\s*\.\.\.\s*\}/g, '{').replace(/\s+/g, ' ')
const idents = (s: string) => new Set(s.match(/[A-Za-z_][\w]*/g) ?? [])

function similarity(a: string, b: string): number {
  const x = idents(a)
  const y = idents(b)
  if (!x.size || !y.size) return 0
  let common = 0
  for (const t of x) if (y.has(t)) common++
  return common / (x.size + y.size - common)
}

/** Pares [índice parche, índice original] de la LCS ponderada. */
function align(patch: string[], orig: string[]): [number, number][] {
  const n = patch.length
  const m = orig.length
  const dp = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0))
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = patch[i] && patch[i] === orig[j]
        ? patch[i].length + dp[i + 1][j + 1]
        : Math.max(dp[i + 1][j], dp[i][j + 1])
    }
  }
  const pairs: [number, number][] = []
  let i = 0
  let j = 0
  while (i < n && j < m) {
    if (patch[i] && patch[i] === orig[j] && dp[i][j] === patch[i].length + dp[i + 1][j + 1]) { pairs.push([i, j]); i++; j++ }
    else if (dp[i + 1][j] >= dp[i][j + 1]) i++
    else j++
  }
  return pairs
}

export function patchDiff(original: string, patch: string): PatchDiff {
  const origLines = original.split('\n')
  const patchLines = patch.split('\n')
  const orig = origLines.map(norm)
  const pat = patchLines.map(norm)
  // Dos líneas seguidas del parche que caen lejos en el original no pueden ser
  // las dos anclas: la más corta (una anotación, un `}`) es la que se ha movido.
  const pairs = align(pat, orig).filter(([p, o], i, all) => {
    const next = all[i + 1]
    const prev = all[i - 1]
    const brokenNext = next && next[0] === p + 1 && next[1] !== o + 1 && pat[p].length <= pat[next[0]].length
    const brokenPrev = prev && prev[0] === p - 1 && prev[1] !== o - 1 && pat[p].length < pat[prev[0]].length
    return !brokenNext && !brokenPrev
  })
  const matchOf = new Map(pairs.map(([p, o]) => [p, o]))
  const usedOrig = new Set(pairs.map(([, o]) => o))

  const rows: DiffRow[] = []
  const touched = new Set<number>()

  for (let p = 0; p < patchLines.length; p++) {
    const o = matchOf.get(p)
    if (o !== undefined) { rows.push({ sign: ' ', text: patchLines[p], line: o }); continue }
    if (!pat[p]) { rows.push({ sign: ' ', text: patchLines[p] }); continue }

    // Ventana entre la ancla anterior y la siguiente.
    const before = pairs.filter(([pp]) => pp < p).map(([, oo]) => oo)
    const after = pairs.filter(([pp]) => pp > p).map(([, oo]) => oo)
    const lo = before.length ? Math.max(...before) + 1 : 0
    const hi = after.length ? Math.min(...after) - 1 : orig.length - 1

    let best = -1
    let score = 0
    for (let k = lo; k <= hi; k++) {
      // Una línea idéntica en otro sitio no es una modificación: es un añadido aquí.
      if (usedOrig.has(k) || !orig[k] || orig[k] === pat[p]) continue
      const s = similarity(pat[p], orig[k])
      if (s > score) { score = s; best = k }
    }
    if (best >= 0 && score >= SIMILAR) {
      usedOrig.add(best)
      touched.add(best)
      rows.push({ sign: '-', text: origLines[best].trim(), line: best })
      rows.push({ sign: '+', text: patchLines[p] })
    } else {
      rows.push({ sign: '+', text: patchLines[p] })
      // Un añadido se ancla visualmente a la línea original siguiente, si la hay.
      if (after.length) touched.add(Math.min(...after))
    }
  }
  return { rows, touched: [...touched].sort((a, b) => a - b) }
}
