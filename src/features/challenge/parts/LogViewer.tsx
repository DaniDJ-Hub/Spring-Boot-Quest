import { useMemo, useState } from 'react'
import { cx, Icon } from '../../../components/ui'
import { toBlocks } from '../log'
import type { LogKind, LogLine } from '../log'

const LINE_CLASS: Record<LogKind, string> = {
  error: 'text-danger',
  cause: 'text-warning',
  frame: 'text-fg-tertiary',
  request: 'text-info',
  note: 'text-fg-tertiary italic',
  heading: 'text-fg font-bold',
  rule: 'text-fg-tertiary',
  text: 'text-fg-secondary',
}

function Row({ line }: { line: LogLine }) {
  return (
    <div className={cx('flex min-w-max pr-4', line.kind === 'error' && 'bg-danger-dim')}>
      <span aria-hidden="true" className="w-10 shrink-0 select-none pr-3 text-right text-fg-tertiary tnum">{line.index + 1}</span>
      <code className={cx('whitespace-pre', LINE_CLASS[line.kind])}>{line.text || ' '}</code>
    </div>
  )
}

/**
 * Visor de logs: numeración, excepciones y «Caused by» resaltados, y marcos de
 * pila plegables cuando hay más de uno seguido. Lo que no se reconoce se
 * muestra tal cual: el log manda.
 */
export function LogViewer({ code, label = 'consola' }: { code: string; label?: string }) {
  const blocks = useMemo(() => toBlocks(code), [code])
  const [open, setOpen] = useState<Record<number, boolean>>({})

  return (
    <figure className="overflow-hidden rounded-md border border-edge bg-surface-sunken">
      <figcaption className="flex items-center gap-2 border-b border-edge-soft px-3 py-2">
        <Icon name="terminal" size={14} className="text-fg-tertiary" />
        <span className="font-mono text-micro text-fg-secondary">{label}</span>
        <span className="ml-auto font-mono text-micro uppercase text-fg-tertiary">log</span>
      </figcaption>
      <pre translate="no" className="overflow-x-auto py-3 font-mono text-code">
        {blocks.map((b, i) => {
          if (b.type === 'line') return <Row key={i} line={b.line} />
          if (b.lines.length < 2) return <Row key={i} line={b.lines[0]} />
          const expanded = open[i] ?? false
          return (
            <div key={i}>
              <button
                type="button"
                aria-expanded={expanded}
                onClick={() => setOpen(s => ({ ...s, [i]: !expanded }))}
                className="flex min-h-[32px] w-full items-center gap-2 pl-10 text-left font-sans text-caption text-fg-tertiary hover:text-fg"
              >
                <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={14} />
                {expanded ? 'Plegar' : 'Mostrar'} {b.lines.length} marcos de pila
              </button>
              {expanded && b.lines.map(l => <Row key={l.index} line={l} />)}
            </div>
          )
        })}
      </pre>
    </figure>
  )
}
