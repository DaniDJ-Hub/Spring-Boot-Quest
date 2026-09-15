import { Fragment, useId, useMemo } from 'react'
import type { FillChallenge } from '../../../types'
import { CodeBlock, cx, HighlightedLine } from '../../../components/ui'
import { BLANK } from '../evaluate'

type Phase = 'answering' | 'recorded' | 'revealed'

/**
 * Código con los huecos convertidos en campos de texto en su sitio exacto, como
 * escribir en el editor. Monoespaciado, sin autocompletar ni corrector.
 */
export function FillCode({ challenge: c, values, onChange, onSubmit, phase, correct, describedBy }: {
  challenge: FillChallenge
  values: string[]
  onChange: (values: string[]) => void
  onSubmit: () => void
  phase: Phase
  correct: boolean
  describedBy: string
}) {
  const baseId = useId()
  const lang = c.lang ?? 'java'
  const total = values.length
  // Si hay varios huecos y el placeholder trae una palabra por hueco, se reparte.
  const placeholders = useMemo(() => {
    const parts = (c.placeholder ?? '').split(/\s+/).filter(Boolean)
    return Array.from({ length: total }, (_, i) => (parts.length === total ? parts[i] : c.placeholder) ?? '')
  }, [c.placeholder, total])

  const blankLines = useMemo(() => {
    let n = 0
    return c.code.split('\n').map(line => {
      const count = (line.match(BLANK) ?? []).length
      const start = n
      n += count
      return { count, start }
    })
  }, [c.code])

  const revealed = phase === 'revealed'
  const locked = phase !== 'answering'

  return (
    <div>
      <CodeBlock
        code={c.code}
        lang={lang}
        label="Editor"
        renderLine={(line, li) => {
          const { count, start } = blankLines[li]
          if (!count) return undefined
          const pieces = line.split(BLANK)
          return pieces.map((piece, pi) => {
            const k = start + pi
            return (
              <Fragment key={pi}>
                {lang === 'log' ? piece : <HighlightedLine line={piece} />}
                {pi < pieces.length - 1 && (
                  <>
                    <label htmlFor={`${baseId}-${k}`} className="sr-only">
                      {total > 1 ? `Hueco ${k + 1} de ${total}, línea ${li + 1}` : `Escribe lo que falta en la línea ${li + 1}`}
                    </label>
                    <input
                      id={`${baseId}-${k}`}
                      value={values[k] ?? ''}
                      readOnly={locked}
                      aria-describedby={describedBy}
                      aria-invalid={revealed && !correct ? true : undefined}
                      onChange={e => onChange(values.map((v, i) => (i === k ? e.target.value : v)))}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); onSubmit() } }}
                      placeholder={placeholders[k]}
                      spellCheck={false}
                      autoComplete="off"
                      autoCapitalize="off"
                      autoCorrect="off"
                      style={{ width: `${Math.max(placeholders[k].length, (values[k] ?? '').length, 8) + 2}ch` }}
                      className={cx(
                        'mx-0.5 inline-block rounded-sm border-b-2 bg-surface-overlay px-1 font-mono text-code text-fg outline-offset-1 placeholder:text-fg-tertiary',
                        !revealed && 'border-accent',
                        revealed && (correct ? 'border-accent text-accent' : 'border-danger text-danger'),
                        phase === 'recorded' && 'border-edge-strong text-fg-secondary',
                      )}
                    />
                  </>
                )}
              </Fragment>
            )
          })
        }}
      />
      {revealed && !correct && (
        <p className="mt-3 text-body">
          <span className="text-fg-secondary">Respuesta aceptada: </span>
          <code className="font-mono text-accent">{c.accept[0]}</code>
        </p>
      )}
    </div>
  )
}
