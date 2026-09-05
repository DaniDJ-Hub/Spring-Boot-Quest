import { useEffect, useMemo, useState } from 'react'
import type { Challenge, ChoiceChallenge, FillChallenge, OrderChallenge } from '../types'
import { Bar, Button, Chip, CodeBlock } from './ui'
import { CONCEPT_LABEL } from '../data/worlds'

const KIND_LABEL: Record<Challenge['kind'], string> = {
  quiz: 'Concepto',
  codefix: 'Corrige el código',
  debug: 'Debugging',
  arch: 'Arquitectura',
  decision: 'Decisión profesional',
  order: 'Ordena el flujo',
  fill: 'Completa el código',
}

const KIND_TONE: Record<Challenge['kind'], 'leaf' | 'amber' | 'sky' | 'rust' | 'neutral'> = {
  quiz: 'neutral', codefix: 'amber', debug: 'rust', arch: 'sky',
  decision: 'sky', order: 'neutral', fill: 'amber',
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[@\s]/g, '').replace(/;$/, '')
}

function shuffled<T>(arr: T[], seed: string): T[] {
  const a = arr.map((v, i) => ({ v, k: (seed.charCodeAt(i % seed.length) * (i + 7)) % 97 }))
  a.sort((x, y) => x.k - y.k)
  return a.map(x => x.v)
}

interface Props {
  challenge: Challenge
  /** Modo examen o boss: sin pista y sin explicación hasta el final. */
  strict?: boolean
  index?: number
  total?: number
  onResolved: (correct: boolean, usedHint: boolean) => void
  onNext: () => void
  nextLabel?: string
}

export function ChallengeRunner({ challenge: c, strict = false, index, total, onResolved, onNext, nextLabel = 'Siguiente' }: Props) {
  const [picked, setPicked] = useState<string | null>(null)
  const [order, setOrder] = useState<string[]>([])
  const [text, setText] = useState('')
  const [done, setDone] = useState(false)
  const [correct, setCorrect] = useState(false)
  const [hint, setHint] = useState(false)

  useEffect(() => {
    setPicked(null); setOrder([]); setText(''); setDone(false); setCorrect(false); setHint(false)
  }, [c.id])

  const options = useMemo(
    () => (c.kind === 'order' ? [] : shuffled((c as ChoiceChallenge).options ?? [], c.id)),
    [c],
  )
  const pool = useMemo(
    () => (c.kind === 'order' ? shuffled((c as OrderChallenge).steps, c.id) : []),
    [c],
  )

  const ready =
    c.kind === 'order' ? order.length === (c as OrderChallenge).steps.length
      : c.kind === 'fill' ? text.trim().length > 0
        : picked !== null

  function submit() {
    let ok = false
    if (c.kind === 'order') {
      ok = order.every((s, i) => s === (c as OrderChallenge).steps[i])
    } else if (c.kind === 'fill') {
      ok = (c as FillChallenge).accept.some(a => normalize(a) === normalize(text))
    } else {
      ok = picked === (c as ChoiceChallenge).answer
    }
    setCorrect(ok)
    setDone(true)
    onResolved(ok, hint)
  }

  const choice = c as ChoiceChallenge
  const answerOption = c.kind !== 'order' && c.kind !== 'fill'
    ? options.find(o => o.id === choice.answer)
    : undefined

  return (
    <div className="animate-slide">
      {/* Cabecera */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Chip tone={KIND_TONE[c.kind]}>{KIND_LABEL[c.kind]}</Chip>
        <span className="text-[11px] text-chalk-faint tnum">
          Dificultad {'▮'.repeat(c.difficulty)}<span className="opacity-25">{'▮'.repeat(5 - c.difficulty)}</span>
        </span>
        <span className="text-[11px] text-chalk-faint tnum">+{c.xp} XP</span>
        {index !== undefined && total !== undefined && (
          <span className="ml-auto text-[11px] text-chalk-faint tnum">{index + 1} / {total}</span>
        )}
      </div>
      {index !== undefined && total !== undefined && (
        <div className="mb-4"><Bar pct={((index) / total) * 100} tone="sky" height="h-1" /></div>
      )}

      <p className="text-[15px] leading-relaxed mb-4">{c.prompt}</p>

      {c.kind !== 'fill' && 'code' in c && c.code && (
        <div className="mb-4"><CodeBlock code={c.code} lang={(c as ChoiceChallenge).lang ?? 'java'} /></div>
      )}

      {/* --- Opciones --- */}
      {c.kind !== 'order' && c.kind !== 'fill' && (
        <div className="space-y-2">
          {options.map(o => {
            const isPicked = picked === o.id
            const isAnswer = o.id === choice.answer
            const tone = !done
              ? isPicked ? 'border-leaf bg-leaf/10' : 'border-line hover:border-chalk-faint'
              : isAnswer ? 'border-leaf bg-leaf/10'
                : isPicked ? 'border-rust bg-rust/10' : 'border-line opacity-50'
            return (
              <button
                key={o.id}
                disabled={done}
                onClick={() => setPicked(o.id)}
                className={`w-full text-left rounded-md border p-3 transition-colors ${tone}`}
              >
                <div className="text-sm leading-relaxed">{o.text}</div>
                {o.code && <div className="mt-2"><CodeBlock code={o.code} lang="java" label="propuesta" /></div>}
                {done && o.consequence && (
                  <div className={`mt-2 text-xs leading-relaxed ${isAnswer ? 'text-leaf' : 'text-chalk-mute'}`}>
                    {o.consequence}
                  </div>
                )}
              </button>
            )
          })}
        </div>
      )}

      {/* --- Ordenar --- */}
      {c.kind === 'order' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <div className="text-xs text-chalk-mute mb-2">Pasos disponibles</div>
            <div className="space-y-2">
              {pool.filter(s => !order.includes(s)).map(s => (
                <button
                  key={s}
                  disabled={done}
                  onClick={() => setOrder(o => [...o, s])}
                  className="w-full text-left rounded-md border border-line p-2.5 text-sm hover:border-chalk-faint transition-colors"
                >{s}</button>
              ))}
              {pool.every(s => order.includes(s)) && (
                <div className="text-xs text-chalk-faint py-2">Todos los pasos colocados.</div>
              )}
            </div>
          </div>
          <div>
            <div className="text-xs text-chalk-mute mb-2">Tu orden</div>
            <div className="space-y-2">
              {order.map((s, i) => {
                const ok = done && s === (c as OrderChallenge).steps[i]
                return (
                  <button
                    key={s}
                    disabled={done}
                    onClick={() => setOrder(o => o.filter(x => x !== s))}
                    className={`w-full text-left rounded-md border p-2.5 text-sm flex gap-2 ${done ? (ok ? 'border-leaf bg-leaf/10' : 'border-rust bg-rust/10') : 'border-leaf/40 bg-leaf/5'}`}
                  >
                    <span className="tnum text-chalk-faint">{i + 1}</span>
                    <span>{s}</span>
                  </button>
                )
              })}
              {!order.length && <div className="text-xs text-chalk-faint py-2">Toca los pasos en el orden correcto.</div>}
            </div>
            {done && !correct && (
              <div className="mt-3 rounded-md border border-line p-3">
                <div className="text-xs text-chalk-mute mb-1.5">Orden correcto</div>
                <ol className="text-sm space-y-1">
                  {(c as OrderChallenge).steps.map((s, i) => (
                    <li key={s} className="flex gap-2"><span className="tnum text-leaf">{i + 1}</span><span>{s}</span></li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Completar --- */}
      {c.kind === 'fill' && (
        <div>
          <CodeBlock code={(c as FillChallenge).code} lang={(c as FillChallenge).lang ?? 'java'} />
          <div className="mt-3">
            <input
              value={text}
              disabled={done}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && ready && !done) submit() }}
              placeholder={(c as FillChallenge).placeholder ?? 'Escribe aquí'}
              spellCheck={false}
              autoComplete="off"
              className={`w-full rounded-md border bg-ink-deep px-3 py-2.5 font-mono text-sm outline-none transition-colors
                ${done ? (correct ? 'border-leaf text-leaf' : 'border-rust text-rust') : 'border-line focus:border-leaf'}`}
            />
            {done && !correct && (
              <div className="mt-2 text-sm">
                <span className="text-chalk-mute">Respuesta aceptada: </span>
                <span className="font-mono text-leaf">{(c as FillChallenge).accept[0]}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Pista --- */}
      {!done && !strict && c.hint && (
        <div className="mt-4">
          {hint
            ? <div className="rounded-md border border-amber/30 bg-amber/5 p-3 text-sm text-amber">{c.hint}</div>
            : <button onClick={() => setHint(true)} className="text-xs text-chalk-faint hover:text-amber transition-colors">
                Ver pista (reduce el XP de este reto)
              </button>}
        </div>
      )}

      {/* --- Acciones --- */}
      <div className="mt-5 flex items-center gap-3">
        {!done
          ? <Button onClick={submit} disabled={!ready}>Comprobar</Button>
          : <Button onClick={onNext}>{nextLabel}</Button>}
        {!done && !ready && <span className="text-xs text-chalk-faint">Elige una respuesta para continuar.</span>}
      </div>

      {/* --- Feedback --- */}
      {done && !strict && (
        <div className={`mt-5 rounded-md border p-4 animate-slide ${correct ? 'border-leaf/40 bg-leaf/5' : 'border-rust/40 bg-rust/5'}`}>
          <div className={`text-sm font-semibold mb-2 ${correct ? 'text-leaf' : 'text-rust'}`}>
            {correct ? 'Correcto' : 'Incorrecto'}
          </div>
          {!correct && answerOption && (
            <p className="text-sm mb-2 text-chalk">
              <span className="text-chalk-mute">La respuesta era: </span>{answerOption.text}
            </p>
          )}
          <p className="text-sm leading-relaxed text-chalk">{c.explain}</p>
          {!correct && c.deeper && (
            <p className="text-sm leading-relaxed text-chalk-mute mt-3 pt-3 border-t border-line-soft">{c.deeper}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.concepts.map(k => (
              <Chip key={k}>{CONCEPT_LABEL[k] ?? k}</Chip>
            ))}
          </div>
        </div>
      )}
      {done && strict && (
        <div className="mt-4 text-sm text-chalk-mute">Respuesta registrada. El detalle se muestra al terminar.</div>
      )}
    </div>
  )
}
