import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'
import { TOKEN_CLASS, tokenize } from './highlight'

export function HighlightedLine({ line }: { line: string }) {
  return <>{tokenize(line).map((t, j) => <span key={j} className={TOKEN_CLASS[t.k]}>{t.t}</span>)}</>
}

/** Marca de una línea: añadida, quitada, señalada o con error. */
export type LineMark = 'add' | 'del' | 'mark' | 'error'

const MARK: Record<LineMark, { row: string; sign: string; signClass: string; sr: string }> = {
  add: { row: 'bg-accent-dim', sign: '+', signClass: 'text-accent', sr: 'Línea añadida: ' },
  del: { row: 'bg-danger-dim', sign: '−', signClass: 'text-danger', sr: 'Línea quitada: ' },
  mark: { row: 'bg-surface-overlay', sign: '›', signClass: 'text-fg-secondary', sr: 'Línea señalada: ' },
  error: { row: 'bg-danger-dim', sign: '!', signClass: 'text-danger', sr: 'Línea con error: ' },
}

/**
 * Bloque de código con gutter de líneas, al estilo de un editor. `marks`
 * resalta líneas (diff o señal) y `renderLine` permite sustituir el contenido
 * de una línea, por ejemplo para meter un campo de texto en un hueco.
 */
export function CodeBlock({ code, lang = 'java', label, marks, renderLine, className }: {
  code: string
  lang?: string
  /** Nombre de archivo o descripción para la pestaña. */
  label?: string
  marks?: Record<number, LineMark>
  renderLine?: (line: string, index: number) => ReactNode | undefined
  className?: string
}) {
  const lines = useMemo(() => code.split('\n'), [code])
  const isPlain = lang === 'log'

  return (
    <figure className={cx('overflow-hidden rounded-md border border-edge bg-surface-sunken', className)}>
      <figcaption className="flex items-center gap-2 border-b border-edge-soft px-3 py-2">
        <Icon name={isPlain ? 'terminal' : 'file'} size={14} className="text-fg-tertiary" />
        <span className="truncate font-mono text-micro text-fg-secondary">{label ?? lang}</span>
        {label && <span className="ml-auto font-mono text-micro uppercase text-fg-tertiary">{lang}</span>}
      </figcaption>
      {/* translate="no": el traductor del navegador no debe tocar el código;
          traducir «String» o una anotación rompería el reto. */}
      <pre translate="no" className="overflow-x-auto py-3 font-mono text-code">
        {lines.map((l, i) => {
          const mark = marks?.[i] ? MARK[marks[i]] : null
          const custom = renderLine?.(l, i)
          return (
            <div key={i} className={cx('flex min-w-max pr-4', mark?.row)}>
              <span aria-hidden="true" className="w-10 shrink-0 select-none pr-3 text-right text-fg-tertiary tnum">{i + 1}</span>
              <span aria-hidden="true" className={cx('w-4 shrink-0 select-none', mark?.signClass)}>{mark?.sign ?? ''}</span>
              <code className={cx('whitespace-pre', isPlain && 'text-fg-secondary')}>
                {mark && <span className="sr-only">{mark.sr}</span>}
                {custom !== undefined ? custom : isPlain ? (l || ' ') : <HighlightedLine line={l} />}
              </code>
            </div>
          )
        })}
      </pre>
    </figure>
  )
}
