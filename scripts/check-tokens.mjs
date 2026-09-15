/**
 * Comprueba que ninguna clase de color o tamaño del código apunte a un token
 * que no existe en la configuración. Una clase mal escrita no rompe el build
 * ni las pruebas: simplemente no aplica estilo, y eso solo se ve en pantalla.
 * Esto lo convierte en un fallo detectable.
 */
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import config from '../tailwind.config.js'

const colors = config.theme.extend.colors
const sizes = Object.keys(config.theme.extend.fontSize)
const radii = Object.keys(config.theme.extend.borderRadius)

const validColors = new Set()
for (const [name, val] of Object.entries(colors)) {
  if (typeof val === 'string') { validColors.add(name); continue }
  for (const k of Object.keys(val)) validColors.add(k === 'DEFAULT' ? name : `${name}-${k}`)
}

const files = []
;(function walk(dir) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.(tsx?|css)$/.test(p) && !p.includes('.test.')) files.push(p)
  }
})('src')

const COLOR_PREFIX = 'bg|text|border|ring|divide|fill|stroke|accent|outline|caret|from|to|via'
const problems = []

for (const file of files) {
  // En CSS solo interesan las clases de @apply, no las propiedades nativas.
  const raw = readFileSync(file, 'utf8')
  const src = file.endsWith('.css')
    ? [...raw.matchAll(/@apply ([^;]+);/g)].map(m => m[1]).join(' ')
    : raw

  // Clases de color: bg-surface-raised, text-fg-tertiary/60, border-edge-strong…
  for (const m of src.matchAll(new RegExp(`\\b(${COLOR_PREFIX})-(?:offset-)?([a-z]+(?:-[a-z]+)?)(?:\\/\\d+)?\\b`, 'g'))) {
    const [, prefix, token] = m
    if (validColors.has(token)) continue
    // Utilidades de Tailwind que comparten prefijo pero no son colores.
    // Utilidades de lado y de estilo que comparten prefijo con los colores.
    if (/^(t|r|b|l|x|y|s|e)$/.test(token)) continue
    if (/^(current|transparent|inherit|white|black|none|auto|center|left|right|clip|ellipsis|nowrap|balance|pretty|top|bottom|solid|dashed|dotted|double|hidden|offset|opacity|separate|collapse|wrap|word|all|hyphens|justify|start|end|baseline|middle|super|sub|uppercase|lowercase|capitalize|normal|size-adjust|radius|width|color|style|image|position|repeat|attachment|clip-text)$/.test(token)) continue
    if (sizes.includes(token) || radii.includes(token)) continue
    if (/^(xs|sm|base|lg|xl|\dxl)$/.test(token) && prefix === 'text') {
      problems.push(`${file}: ${prefix}-${token} — tamaño fuera de la escala definida`)
      continue
    }
    if (prefix === 'text' && /^(left|right|center|justify)$/.test(token)) continue
    problems.push(`${file}: ${prefix}-${token} — token de color inexistente`)
  }

  // Valores arbitrarios de color o tamaño de fuente.
  for (const m of src.matchAll(/\b(bg|text|border)-\[(#[0-9a-fA-F]{3,8}|\d+px)\]/g)) {
    problems.push(`${file}: ${m[0]} — valor suelto, debería ser un token`)
  }
}

if (problems.length) {
  console.error(`\n${problems.length} problemas de tokens:\n`)
  for (const p of [...new Set(problems)]) console.error('  ' + p)
  process.exit(1)
}
console.log(`Tokens correctos en ${files.length} ficheros`)
