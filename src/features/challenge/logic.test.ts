import { describe, expect, it } from 'vitest'
import { loadAll } from '../../data'
import type { Challenge, FillChallenge, OrderChallenge } from '../../types'
import { blankCount, emptyAnswer, evaluate, initialOrder, isReady, normalize } from './evaluate'
import { patchDiff } from './diff'
import { classify, toBlocks } from './log'

describe('evaluación', () => {
  it('normaliza igual que antes del rediseño', () => {
    expect(normalize('  @Qualifier("notificadorSms"); ')).toBe('qualifier("notificadorsms")')
  })

  it('cada reto de completar acepta su primera respuesta', async () => {
    const fills = (await loadAll()).filter((c): c is FillChallenge => c.kind === 'fill')
    for (const c of fills) {
      const values = blankCount(c) === 1 ? [c.accept[0]] : c.accept[0].split(/\s+/)
      expect(evaluate(c, { kind: 'fill', values }), c.id).toBe(true)
    }
  })

  it('varios huecos se leen juntos, en cualquier orden aceptado', async () => {
    const c = (await loadAll()).find(x => x.id === 'w08-f1') as FillChallenge
    expect(blankCount(c)).toBe(2)
    expect(evaluate(c, { kind: 'fill', values: ['@Aspect', '@Component'] })).toBe(true)
    expect(evaluate(c, { kind: 'fill', values: ['@Component', '@Aspect'] })).toBe(true)
    expect(evaluate(c, { kind: 'fill', values: ['@Aspect', '@Service'] })).toBe(false)
  })

  it('un reto de ordenar nunca arranca resuelto', async () => {
    const orders = (await loadAll()).filter((c): c is OrderChallenge => c.kind === 'order')
    for (const c of orders) {
      const inicial = initialOrder(c)
      expect([...inicial].sort()).toEqual([...c.steps].sort())
      expect(evaluate(c, { kind: 'order', steps: inicial }), c.id).toBe(false)
      expect(evaluate(c, { kind: 'order', steps: c.steps }), c.id).toBe(true)
    }
  })

  it('una respuesta vacía nunca está lista salvo en ordenar', async () => {
    const all: Challenge[] = await loadAll()
    for (const c of all) expect(isReady(c, emptyAnswer(c)), c.id).toBe(c.kind === 'order')
  })
})

describe('diff de parches', () => {
  const original = [
    '// CalculadoraIva.java',
    'public class CalculadoraIva {',
    '    public double aplicar(double monto) { return monto * 1.16; }',
    '}',
    '',
    '@Service',
    'public class FacturaService {',
    '    @Autowired',
    '    private CalculadoraIva calculadora;',
    '}',
  ].join('\n')

  it('un añadido sobre una línea elidida no marca la clase como cambiada', () => {
    const d = patchDiff(original, '@Component\npublic class CalculadoraIva { ... }')
    expect(d.rows.map(r => r.sign)).toEqual(['+', ' '])
    expect(d.touched).toEqual([1])
  })

  it('una línea parecida se muestra como modificación', () => {
    const d = patchDiff(original, '@Autowired\nprivate static CalculadoraIva calculadora;')
    expect(d.rows.map(r => r.sign)).toEqual([' ', '-', '+'])
    expect(d.touched).toEqual([8])
  })

  it('respeta el orden: una línea idéntica fuera de sitio es un añadido', () => {
    const d = patchDiff(original, '@Autowired\npublic class CalculadoraIva { ... }')
    expect(d.rows[0].sign).toBe('+')
    expect(d.rows[1].sign).toBe(' ')
  })

  it('una eliminación expresada como fragmento no inventa cambios', () => {
    // «Quitar @Id»: el parche solo trae la línea que queda. No hay forma honesta
    // de deducir el borrado, así que no se marca nada y la UI muestra el fragmento.
    const d = patchDiff('@Entity\npublic class Cliente {\n\n    @Id\n    private Long id;\n}', 'private Long id;')
    expect(d.rows.every(r => r.sign === ' ')).toBe(true)
  })

  it('todos los parches del contenido cubren cada una de sus líneas', async () => {
    const codefix = (await loadAll()).filter(c => c.kind === 'codefix')
    let conCambios = 0
    let total = 0
    for (const c of codefix) {
      if (c.kind === 'order' || c.kind === 'fill') continue
      for (const o of c.options) {
        if (!o.code || !c.code) continue
        const d = patchDiff(c.code, o.code)
        expect(d.rows.filter(r => r.sign !== '-').length, `${c.id}/${o.id}`).toBe(o.code.split('\n').length)
        total++
        if (d.rows.some(r => r.sign !== ' ')) conCambios++
      }
    }
    // La gran mayoría de parches se leen como diff; los demás caen al fragmento.
    expect(conCambios / total).toBeGreaterThan(0.8)
  })
})

describe('lectura de logs', () => {
  it('reconoce lo que traen los logs reales', () => {
    expect(classify('Caused by: java.net.ConnectException: Connection refused')).toBe('cause')
    expect(classify('\tat com.mysql.cj.jdbc.ConnectionImpl.<init>(ConnectionImpl.java:...)')).toBe('frame')
    expect(classify('APPLICATION FAILED TO START')).toBe('error')
    expect(classify('POST /api/clientes')).toBe('request')
    expect(classify('// Respuesta actual: 500 Internal Server Error')).toBe('note')
    expect(classify('***************************')).toBe('rule')
  })

  it('agrupa los marcos de pila consecutivos', () => {
    const blocks = toBlocks('Error\n\tat a()\n\tat b()\nfin')
    expect(blocks.map(b => b.type)).toEqual(['line', 'frames', 'line'])
  })
})
