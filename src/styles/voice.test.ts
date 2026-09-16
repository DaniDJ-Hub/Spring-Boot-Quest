import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * Reglas de voz visual, comprobables.
 *
 * Las mayúsculas en monoespaciada son la voz de la consola: cabeceras de estado
 * tipo BUILD SUCCESS, PRODUCTION DEPLOY o SKILL REPORT. En cuanto se usan como
 * etiqueta encima de cada bloque, la interfaz empieza a parecer una plantilla.
 * Estas pruebas evitan que vuelvan a extenderse sin querer.
 */

const fuentes: string[] = []
;(function walk(dir: string) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f)
    if (statSync(p).isDirectory()) walk(p)
    else if (/\.tsx$/.test(p) && !p.includes('.test.')) fuentes.push(p)
  }
})('src')

/** Único sitio con sello en mayúsculas fuera de una barra de consola: el level up. */
const PERMITIDOS = ['LevelUp.tsx']

describe('voz visual', () => {
  it('las mayúsculas en mono no se usan como etiqueta sobre el contenido', () => {
    const infractores = fuentes.filter(f => {
      if (PERMITIDOS.some(p => f.endsWith(p))) return false
      return /uppercase tracking-wide/.test(readFileSync(f, 'utf8'))
    })
    expect(infractores).toEqual([])
  })

  it('las flechas no se pegan al texto de enlaces y botones', () => {
    const infractores = fuentes.filter(f => /[^-]→/.test(readFileSync(f, 'utf8')))
    expect(infractores).toEqual([])
  })

  it('el código y los identificadores se marcan como no traducibles', () => {
    for (const f of ['src/components/ui/CodeBlock.tsx', 'src/features/challenge/parts/LogViewer.tsx']) {
      expect(readFileSync(f, 'utf8'), f).toContain('translate="no"')
    }
  })
})
