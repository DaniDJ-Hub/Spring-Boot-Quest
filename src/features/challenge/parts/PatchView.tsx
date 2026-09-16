import { useMemo } from 'react'
import { cx, HighlightedLine } from '../../../components/ui'
import { patchDiff } from '../diff'

const SIGN_CLASS = {
  ' ': '',
  '+': 'bg-accent-dim',
  '-': 'bg-danger-dim',
} as const

const SIGN_TEXT = { ' ': 'text-fg-tertiary', '+': 'text-accent', '-': 'text-danger' } as const
const SIGN_SR = { ' ': '', '+': 'Añade: ', '-': 'Quita: ' } as const

/**
 * Parche propuesto como diff unificado contra el código original. Si el
 * fragmento no permite deducir cambios (una eliminación, por ejemplo), se
 * muestra el fragmento sin signos: mejor eso que un diff inventado.
 */
export function PatchView({ original, patch }: { original: string; patch: string }) {
  const diff = useMemo(() => patchDiff(original, patch), [original, patch])
  const hasChanges = diff.rows.some(r => r.sign !== ' ')

  return (
    <pre className="mt-2 overflow-x-auto rounded-sm border border-edge bg-surface-sunken py-2 font-mono text-code">
      {!hasChanges && <span className="block px-3 pb-1 font-sans text-micro text-fg-tertiary">Fragmento propuesto</span>}
      {diff.rows.map((r, i) => (
        <div key={i} className={cx('flex min-w-max pr-3', SIGN_CLASS[r.sign])}>
          <span aria-hidden="true" className={cx('w-6 shrink-0 select-none text-center', SIGN_TEXT[r.sign])}>{hasChanges ? r.sign : ''}</span>
          <code className="whitespace-pre">
            {SIGN_SR[r.sign] && <span className="sr-only">{SIGN_SR[r.sign]}</span>}
            <HighlightedLine line={r.text} />
          </code>
        </div>
      ))}
    </pre>
  )
}
