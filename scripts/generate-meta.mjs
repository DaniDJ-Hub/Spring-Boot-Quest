/**
 * Regenera src/data/challenge-meta.generated.ts a partir de src/data/challenges/.
 * Se ejecuta en `prebuild`, así que el índice nunca puede quedar desfasado.
 */
import { writeFileSync, readdirSync, mkdirSync, rmSync } from 'node:fs'
import { build } from 'esbuild'
import { pathToFileURL } from 'node:url'

const dir = 'src/data/challenges'
const worlds = readdirSync(dir).filter(f => f.endsWith('.ts')).map(f => f.replace('.ts', '')).sort()

const entry = '.meta-tmp/entry.ts'
mkdirSync('.meta-tmp', { recursive: true })
writeFileSync(entry, worlds.map((w, i) => `import w${i} from '../${dir}/${w}'`).join('\n') +
  `\nexport const ALL = [${worlds.map((_, i) => `w${i}`).join(', ')}].flat()\n`)

await build({ entryPoints: [entry], bundle: true, format: 'esm', outfile: '.meta-tmp/all.mjs', logLevel: 'error' })
const { ALL } = await import(pathToFileURL(process.cwd() + '/.meta-tmp/all.mjs').href)

const q = s => "'" + String(s).replace(/\\/g, '\\\\').replace(/'/g, "\\'") + "'"
const rows = ALL.map(c =>
  `  { id: ${q(c.id)}, worldId: ${q(c.worldId)}, kind: ${q(c.kind)}, difficulty: ${c.difficulty}, xp: ${c.xp}, concepts: [${c.concepts.map(q).join(', ')}] }`)

writeFileSync('src/data/challenge-meta.generated.ts',
`import type { ChallengeMeta } from '../types'

/* GENERADO por scripts/generate-meta.mjs — no editar a mano.
 * Contiene solo los campos que el motor necesita de forma sincrónica: progreso,
 * dominio, logros y selección adaptativa. El contenido completo de cada reto
 * (enunciado, opciones, explicación) vive en src/data/challenges/ y se carga
 * bajo demanda, lo que mantiene el arranque ligero. */
export const CHALLENGE_META: ChallengeMeta[] = [
${rows.join(',\n')},
]
`)

rmSync('.meta-tmp', { recursive: true, force: true })
console.log(`Índice regenerado: ${ALL.length} retos en ${worlds.length} mundos`)
