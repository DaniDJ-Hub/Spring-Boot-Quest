import { forwardRef, useMemo } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { toast as toastVariants } from '../animations'
import type { ReactNode } from 'react'
import type { MasteryLevel } from '../types'
import { MASTERY_META } from '../engine/core'

/* ------------------------------ Código ------------------------------ */

const KEYWORDS = new Set([
  'public', 'private', 'protected', 'class', 'interface', 'void', 'return', 'new', 'static',
  'final', 'extends', 'implements', 'import', 'package', 'if', 'else', 'for', 'while', 'try',
  'catch', 'throw', 'throws', 'this', 'super', 'null', 'true', 'false', 'enum', 'boolean',
  'int', 'long', 'double', 'String', 'List', 'Set', 'Map', 'Object', 'Override',
])

type Tok = { t: string; k: 'ann' | 'kw' | 'str' | 'cmt' | 'num' | 'txt' }

function tokenize(line: string): Tok[] {
  const out: Tok[] = []
  let i = 0
  while (i < line.length) {
    const rest = line.slice(i)
    if (rest.startsWith('//') || rest.startsWith('#')) { out.push({ t: rest, k: 'cmt' }); break }
    const ann = /^@[A-Za-z_][\w.]*/.exec(rest)
    if (ann) { out.push({ t: ann[0], k: 'ann' }); i += ann[0].length; continue }
    const str = /^"(?:[^"\\]|\\.)*"?|^'(?:[^'\\]|\\.)*'?/.exec(rest)
    if (str) { out.push({ t: str[0], k: 'str' }); i += str[0].length; continue }
    const num = /^\d[\d_.]*/.exec(rest)
    if (num) { out.push({ t: num[0], k: 'num' }); i += num[0].length; continue }
    const word = /^[A-Za-z_][\w]*/.exec(rest)
    if (word) {
      out.push({ t: word[0], k: KEYWORDS.has(word[0]) ? 'kw' : 'txt' })
      i += word[0].length
      continue
    }
    out.push({ t: rest[0], k: 'txt' })
    i += 1
  }
  return out
}

const TOK_CLASS: Record<Tok['k'], string> = {
  ann: 'text-accent-bright',
  kw: 'text-info',
  str: 'text-warning',
  cmt: 'text-fg-tertiary italic',
  num: 'text-warning',
  txt: 'text-fg',
}

export function CodeBlock({ code, lang = 'java', label }: { code: string; lang?: string; label?: string }) {
  const lines = useMemo(() => code.split('\n'), [code])
  const isLog = lang === 'log'
  return (
    <div className="rounded-md border border-edge bg-surface-sunken overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-edge-soft bg-surface-raised/50">
        <span className="h-2 w-2 rounded-full bg-danger/60" />
        <span className="h-2 w-2 rounded-full bg-warning/60" />
        <span className="h-2 w-2 rounded-full bg-accent/60" />
        <span className="ml-1 font-mono text-micro text-fg-tertiary">{label ?? lang}</span>
      </div>
      <pre className="overflow-x-auto p-3 text-code leading-relaxed font-mono">
        {lines.map((l, i) => (
          <div key={i} className="flex">
            <span className="select-none w-7 shrink-0 text-right pr-3 text-fg-tertiary/60 tnum">{i + 1}</span>
            <code className={isLog ? 'text-fg-secondary whitespace-pre' : 'whitespace-pre'}>
              {isLog ? l || ' ' : tokenize(l).map((t, j) => (
                <span key={j} className={TOK_CLASS[t.k]}>{t.t}</span>
              ))}
            </code>
          </div>
        ))}
      </pre>
    </div>
  )
}

/* ------------------------------ Progreso ------------------------------ */

export function Bar({ pct, tone = 'accent', height = 'h-1.5', label }: {
  pct: number; tone?: 'accent' | 'warning' | 'info' | 'danger'; height?: string
  /** Qué mide la barra. Sin esto se marca como decorativa para no ensuciar el lector. */
  label?: string
}) {
  const bg = { accent: 'bg-accent', warning: 'bg-warning', info: 'bg-info', danger: 'bg-danger' }[tone]
  const value = Math.round(Math.max(0, Math.min(100, pct)))
  const a11y = label
    ? { role: 'progressbar' as const, 'aria-label': label, 'aria-valuenow': value, 'aria-valuemin': 0, 'aria-valuemax': 100 }
    : { 'aria-hidden': true }
  return (
    <div className={`w-full ${height} rounded-full bg-edge-soft overflow-hidden`} {...a11y}>
      <div className={`${bg} h-full rounded-full transition-[width] duration-slow`} style={{ width: `${value}%` }} />
    </div>
  )
}

export function MasteryDot({ level, withLabel = false }: { level: MasteryLevel; withLabel?: boolean }) {
  const m = MASTERY_META[level]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span aria-hidden="true" className={`h-2 w-2 rounded-full ${m.dot} ${level === 'none' ? 'opacity-40' : ''}`} />
      {/* El color no puede ser el único portador del estado. */}
      {withLabel
        ? <span className={`text-caption ${m.text}`}>{m.label}</span>
        : <span className="sr-only">{m.label}</span>}
    </span>
  )
}

export function Chip({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'accent' | 'warning' | 'info' | 'danger'; className?: string }) {
  const tones = {
    neutral: 'border-edge text-fg-secondary',
    accent: 'border-accent/40 text-accent bg-accent/10',
    warning: 'border-warning/40 text-warning bg-warning/10',
    info: 'border-info/40 text-info bg-info/10',
    danger: 'border-danger/40 text-danger bg-danger/10',
  }
  return <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-micro ${tones[tone]} ${className}`}>{children}</span>
}

interface ButtonProps {
  children: ReactNode
  onClick?: () => void
  variant?: 'primary' | 'ghost' | 'quiet' | 'danger'
  disabled?: boolean
  className?: string
  type?: 'button' | 'submit'
}

/** Altura mínima de 44 px: el objetivo táctil recomendado en móvil. */
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { children, onClick, variant = 'primary', disabled, className = '', type = 'button' }, ref,
) {
  const styles = {
    primary: 'bg-accent text-surface-sunken hover:bg-accent-bright font-semibold active:scale-[.98]',
    ghost: 'border border-edge-strong text-fg hover:border-accent hover:text-accent active:scale-[.98]',
    quiet: 'text-fg-secondary hover:text-fg',
    danger: 'border border-danger/70 text-danger hover:bg-danger/10 active:scale-[.98]',
  }[variant]
  return (
    <button
      ref={ref}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center justify-center min-h-[44px] rounded-md px-4 py-2 text-body
        transition-all duration-fast ease-out disabled:opacity-40 disabled:pointer-events-none ${styles} ${className}`}
    >
      {children}
    </button>
  )
})

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="panel p-8 text-center">
      <h3 className="text-lead mb-1">{title}</h3>
      <p className="text-body text-fg-secondary max-w-md mx-auto mb-4">{body}</p>
      {action}
    </div>
  )
}

/* ------------------------------- Toasts ------------------------------- */

export function Toasts({ items, dismiss }: { items: { id: number; title: string; detail: string; icon: string }[]; dismiss: (id: number) => void }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-[calc(100vw-2rem)] pointer-events-none"
    >
      {/* Es el único elemento con muelle en toda la aplicación: interrumpe, y el
          movimiento establece esa jerarquía. La salida es la razón de usar
          Motion aquí, porque CSS no puede animar un nodo que ya se desmontó. */}
      <AnimatePresence initial={false}>
        {items.map(t => (
          <m.button
            key={t.id}
            layout={false}
            variants={toastVariants}
            initial="hidden"
            animate="show"
            exit="exit"
            onClick={() => dismiss(t.id)}
            aria-label={`Logro desbloqueado: ${t.title}. ${t.detail}. Descartar.`}
            className="pointer-events-auto text-left w-72 panel bg-surface-raised px-4 py-3 border-warning/40 shadow-lg"
          >
            <div className="flex items-start gap-3">
              <span aria-hidden="true" className="text-warning text-lead leading-none mt-0.5">{t.icon}</span>
              <div>
                <div className="text-body font-semibold text-warning">{t.title}</div>
                <div className="text-caption text-fg-secondary mt-0.5">{t.detail}</div>
              </div>
            </div>
          </m.button>
        ))}
      </AnimatePresence>
    </div>
  )
}
