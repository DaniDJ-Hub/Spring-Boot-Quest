/**
 * Clasificación de líneas de un log para su lectura. Solo reconoce lo que el
 * contenido trae de verdad —excepciones, «Caused by», marcos de pila,
 * peticiones HTTP, comentarios—: no inventa niveles INFO/WARN/ERROR que los
 * logs del curso no tienen.
 */
export type LogKind = 'error' | 'cause' | 'frame' | 'request' | 'note' | 'heading' | 'rule' | 'text'

export interface LogLine { kind: LogKind; text: string; index: number }
export type LogBlock = { type: 'line'; line: LogLine } | { type: 'frames'; lines: LogLine[] }

export function classify(text: string): LogKind {
  const t = text.trim()
  if (!t) return 'text'
  if (/^\*{3,}$/.test(t)) return 'rule'
  if (/^Caused by:/.test(t)) return 'cause'
  if (/^at\s/.test(t)) return 'frame'
  if (t.startsWith('//')) return 'note'
  if (/^(GET|POST|PUT|PATCH|DELETE)\s/.test(t) || /^[A-Z][\w-]+:\s/.test(t) && /^(Content-Type|Authorization|Origin|Accept)/.test(t)) return 'request'
  if (/^(Description|Action):$/.test(t)) return 'heading'
  if (/(Exception|Error)\b|FAILED|failed to|refused|blocked by|exceeds/i.test(t)) return 'error'
  return 'text'
}

/** Agrupa marcos de pila consecutivos para poder plegarlos. */
export function toBlocks(code: string): LogBlock[] {
  const blocks: LogBlock[] = []
  code.split('\n').forEach((text, index) => {
    const line: LogLine = { kind: classify(text), text, index }
    const last = blocks[blocks.length - 1]
    if (line.kind === 'frame') {
      if (last?.type === 'frames') last.lines.push(line)
      else blocks.push({ type: 'frames', lines: [line] })
    } else {
      blocks.push({ type: 'line', line })
    }
  })
  return blocks
}
