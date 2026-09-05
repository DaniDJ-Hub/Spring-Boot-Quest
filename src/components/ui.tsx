import { useMemo } from 'react'
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
  ann: 'text-leaf-bright',
  kw: 'text-sky',
  str: 'text-amber',
  cmt: 'text-chalk-faint italic',
  num: 'text-amber',
  txt: 'text-chalk',
}

export function CodeBlock({ code, lang = 'java', label }: { code: string; lang?: string; label?: string }) {
  const lines = useMemo(() => code.split('\n'), [code])
  const isLog = lang === 'log'
  return (
    <div className="rounded-md border border-line bg-ink-deep overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-line-soft bg-ink-panel/50">
        <span className="h-2 w-2 rounded-full bg-rust/60" />
        <span className="h-2 w-2 rounded-full bg-amber/60" />
        <span className="h-2 w-2 rounded-full bg-leaf/60" />
        <span className="ml-1 font-mono text-[11px] text-chalk-faint">{label ?? lang}</span>
      </div>
      <pre className="overflow-x-auto p-3 text-[12.5px] leading-relaxed font-mono">
        {lines.map((l, i) => (
          <div key={i} className="flex">
            <span className="select-none w-7 shrink-0 text-right pr-3 text-chalk-faint/60 tnum">{i + 1}</span>
            <code className={isLog ? 'text-chalk-mute whitespace-pre' : 'whitespace-pre'}>
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

export function Bar({ pct, tone = 'leaf', height = 'h-1.5' }: { pct: number; tone?: 'leaf' | 'amber' | 'sky' | 'rust'; height?: string }) {
  const bg = { leaf: 'bg-leaf', amber: 'bg-amber', sky: 'bg-sky', rust: 'bg-rust' }[tone]
  return (
    <div className={`w-full ${height} rounded-full bg-line-soft overflow-hidden`} role="presentation">
      <div className={`${bg} h-full rounded-full transition-[width] duration-500`} style={{ width: `${Math.max(0, Math.min(100, pct))}%` }} />
    </div>
  )
}

export function MasteryDot({ level, withLabel = false }: { level: MasteryLevel; withLabel?: boolean }) {
  const m = MASTERY_META[level]
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`h-2 w-2 rounded-full ${m.dot} ${level === 'none' ? 'opacity-40' : ''}`} />
      {withLabel && <span className={`text-xs ${m.text}`}>{m.label}</span>}
    </span>
  )
}

export function Chip({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: 'neutral' | 'leaf' | 'amber' | 'sky' | 'rust'; className?: string }) {
  const tones = {
    neutral: 'border-line text-chalk-mute',
    leaf: 'border-leaf/40 text-leaf bg-leaf/10',
    amber: 'border-amber/40 text-amber bg-amber/10',
    sky: 'border-sky/40 text-sky bg-sky/10',
    rust: 'border-rust/40 text-rust bg-rust/10',
  }
  return <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-[11px] ${tones[tone]} ${className}`}>{children}</span>
}

export function Button({
  children, onClick, variant = 'primary', disabled, className = '', type = 'button',
}: {
  children: ReactNode; onClick?: () => void
  variant?: 'primary' | 'ghost' | 'quiet' | 'danger'; disabled?: boolean; className?: string
  type?: 'button' | 'submit'
}) {
  const styles = {
    primary: 'bg-leaf text-ink-deep hover:bg-leaf-bright font-semibold',
    ghost: 'border border-line text-chalk hover:border-leaf/60 hover:text-leaf',
    quiet: 'text-chalk-mute hover:text-chalk',
    danger: 'border border-rust/50 text-rust hover:bg-rust/10',
  }[variant]
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md px-4 py-2 text-sm transition-colors disabled:opacity-40 disabled:pointer-events-none ${styles} ${className}`}
    >
      {children}
    </button>
  )
}

export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="panel p-8 text-center">
      <h3 className="text-lg mb-1">{title}</h3>
      <p className="text-sm text-chalk-mute max-w-md mx-auto mb-4">{body}</p>
      {action}
    </div>
  )
}

/* ------------------------------- Toasts ------------------------------- */

export function Toasts({ items, dismiss }: { items: { id: number; title: string; detail: string; icon: string }[]; dismiss: (id: number) => void }) {
  if (!items.length) return null
  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col gap-2 max-w-[calc(100vw-2rem)]">
      {items.map(t => (
        <button
          key={t.id}
          onClick={() => dismiss(t.id)}
          className="animate-pop text-left w-72 panel bg-ink-panel px-4 py-3 border-amber/40 shadow-lg"
        >
          <div className="flex items-start gap-3">
            <span className="text-amber text-lg leading-none mt-0.5">{t.icon}</span>
            <div>
              <div className="text-sm font-semibold text-amber">{t.title}</div>
              <div className="text-xs text-chalk-mute mt-0.5">{t.detail}</div>
            </div>
          </div>
        </button>
      ))}
    </div>
  )
}
