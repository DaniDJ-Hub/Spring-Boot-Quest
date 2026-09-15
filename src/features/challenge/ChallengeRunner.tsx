import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { challenge as challengeVariants, listItem, reveal, TAP } from '../../animations'
import type { Challenge, ChoiceChallenge, FillChallenge, OrderChallenge } from '../../types'
import { Bar, Button, Chip, CodeBlock } from '../../components/ui'
import { CONCEPT_LABEL } from '../../data/worlds'

const KIND_LABEL: Record<Challenge['kind'], string> = {
  quiz: 'Concepto',
  codefix: 'Corrige el código',
  debug: 'Debugging',
  arch: 'Arquitectura',
  decision: 'Decisión profesional',
  order: 'Ordena el flujo',
  fill: 'Completa el código',
}

const KIND_TONE: Record<Challenge['kind'], 'accent' | 'warning' | 'info' | 'danger' | 'neutral'> = {
  quiz: 'neutral', codefix: 'warning', debug: 'danger', arch: 'info',
  decision: 'info', order: 'neutral', fill: 'warning',
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

  const promptId = useId()
  const feedbackRef = useRef<HTMLDivElement>(null)
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    setPicked(null); setOrder([]); setText(''); setDone(false); setCorrect(false); setHint(false)
  }, [c.id])

  // Al comprobar, el foco pasa al veredicto: quien navega con teclado o lector
  // se entera del resultado sin tener que buscarlo.
  useEffect(() => {
    if (done) feedbackRef.current?.focus()
  }, [done])

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

  /** Navegación con flechas dentro del grupo de opciones, como un radio nativo. */
  function onRadioKey(e: React.KeyboardEvent, i: number) {
    if (done) return
    const keys = ['ArrowDown', 'ArrowRight', 'ArrowUp', 'ArrowLeft', 'Home', 'End']
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const last = options.length - 1
    const next =
      e.key === 'Home' ? 0
        : e.key === 'End' ? last
          : e.key === 'ArrowDown' || e.key === 'ArrowRight' ? (i + 1 > last ? 0 : i + 1)
            : (i - 1 < 0 ? last : i - 1)
    setPicked(options[next].id)
    optionRefs.current[next]?.focus()
  }

  const choice = c as ChoiceChallenge
  const answerOption = c.kind !== 'order' && c.kind !== 'fill'
    ? options.find(o => o.id === choice.answer)
    : undefined
  const activeTab = picked ?? options[0]?.id

  return (
    <AnimatePresence mode="wait" initial={false}>
      {/* La clave es el id del reto: al cambiar, Motion saca el anterior y mete
          el siguiente. Es lo que convierte un salto brusco en un avance. */}
      <m.div
        key={c.id}
        variants={challengeVariants}
        initial="hidden"
        animate="show"
        exit="exit"
      >
      {/* Cabecera */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <Chip tone={KIND_TONE[c.kind]}>{KIND_LABEL[c.kind]}</Chip>
        <span className="text-micro text-fg-tertiary tnum">
          <span aria-hidden="true">Dificultad {'▮'.repeat(c.difficulty)}<span className="opacity-25">{'▮'.repeat(5 - c.difficulty)}</span></span>
          <span className="sr-only">Dificultad {c.difficulty} de 5</span>
        </span>
        <span className="text-micro text-fg-tertiary tnum">+{c.xp} XP</span>
        {index !== undefined && total !== undefined && (
          <span className="ml-auto text-micro text-fg-tertiary tnum">{index + 1} / {total}</span>
        )}
      </div>
      {index !== undefined && total !== undefined && (
        <div className="mb-4">
          <Bar pct={(index / total) * 100} tone="info" height="h-1" label={`Reto ${index + 1} de ${total}`} />
        </div>
      )}

      <p id={promptId} className="text-body leading-relaxed mb-4">{c.prompt}</p>

      {c.kind !== 'fill' && 'code' in c && c.code && (
        <div className="mb-4"><CodeBlock code={c.code} lang={(c as ChoiceChallenge).lang ?? 'java'} /></div>
      )}

      {/* --- Opciones --- */}
      {c.kind !== 'order' && c.kind !== 'fill' && (
        <div role="radiogroup" aria-labelledby={promptId} className="space-y-2">
          {options.map((o, i) => {
            const isPicked = picked === o.id
            const isAnswer = o.id === choice.answer
            const tone = !done
              ? isPicked ? 'border-accent bg-accent/10' : 'border-edge-strong hover:border-fg-tertiary'
              : isAnswer ? 'border-accent bg-accent/10'
                : isPicked ? 'border-danger bg-danger/10' : 'border-edge opacity-60'
            // Marca explícita: el estado no puede depender solo del color.
            const mark = !done ? (isPicked ? '●' : '○') : isAnswer ? '✓' : isPicked ? '✕' : '○'
            const markTone = !done ? (isPicked ? 'text-accent' : 'text-fg-tertiary')
              : isAnswer ? 'text-accent' : isPicked ? 'text-danger' : 'text-fg-tertiary'
            return (
              <m.button
                key={o.id}
                ref={el => { optionRefs.current[i] = el }}
                whileTap={done ? undefined : TAP}
                role="radio"
                aria-checked={isPicked}
                aria-disabled={done}
                tabIndex={o.id === activeTab ? 0 : -1}
                onKeyDown={e => onRadioKey(e, i)}
                onClick={() => { if (!done) setPicked(o.id) }}
                className={`w-full text-left rounded-md border p-3 transition-colors ${tone}`}
              >
                <div className="flex gap-2.5">
                  <span aria-hidden="true" className={`shrink-0 leading-relaxed ${markTone}`}>{mark}</span>
                  <div className="min-w-0">
                    <div className="text-body leading-relaxed">{o.text}</div>
                    {o.code && <div className="mt-2"><CodeBlock code={o.code} lang="java" label="propuesta" /></div>}
                    {done && o.consequence && (
                      <div className={`mt-2 text-caption leading-relaxed ${isAnswer ? 'text-accent' : 'text-fg-secondary'}`}>
                        {o.consequence}
                      </div>
                    )}
                  </div>
                </div>
                {done && (
                  <span className="sr-only">
                    {isAnswer ? 'Respuesta correcta.' : isPicked ? 'Tu respuesta, incorrecta.' : 'Opción descartada.'}
                  </span>
                )}
              </m.button>
            )
          })}
        </div>
      )}

      {/* --- Ordenar --- */}
      {c.kind === 'order' && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 id={`${promptId}-pool`} className="text-caption text-fg-secondary mb-2 font-sans font-normal">Pasos disponibles</h3>
            <ul aria-labelledby={`${promptId}-pool`} className="space-y-2">
              <AnimatePresence initial={false} mode="popLayout">
              {pool.filter(s => !order.includes(s)).map(s => (
                <m.li key={s} variants={listItem} initial="hidden" animate="show" exit="exit">
                  <button
                    disabled={done}
                    onClick={() => setOrder(o => [...o, s])}
                    aria-label={`Añadir al final de tu orden: ${s}`}
                    className="w-full text-left rounded-md border border-edge-strong p-2.5 text-body hover:border-fg-tertiary transition-colors"
                  >{s}</button>
                </m.li>
              ))}
              </AnimatePresence>
              {pool.every(s => order.includes(s)) && (
                <li className="text-caption text-fg-tertiary py-2">Todos los pasos colocados.</li>
              )}
            </ul>
          </div>
          <div>
            <h3 id={`${promptId}-order`} className="text-caption text-fg-secondary mb-2 font-sans font-normal">Tu orden</h3>
            <ol aria-labelledby={`${promptId}-order`} className="space-y-2">
              <AnimatePresence initial={false} mode="popLayout">
              {order.map((s, i) => {
                const ok = done && s === (c as OrderChallenge).steps[i]
                return (
                  <m.li key={s} variants={listItem} initial="hidden" animate="show" exit="exit">
                    <button
                      disabled={done}
                      onClick={() => setOrder(o => o.filter(x => x !== s))}
                      aria-label={`Posición ${i + 1}: ${s}. Quitar de tu orden.`}
                      className={`w-full text-left rounded-md border p-2.5 text-body flex gap-2 ${done ? (ok ? 'border-accent bg-accent/10' : 'border-danger bg-danger/10') : 'border-accent/50 bg-accent/5'}`}
                    >
                      <span aria-hidden="true" className="tnum text-fg-tertiary">{i + 1}</span>
                      <span>{s}</span>
                      {done && <span className="sr-only">{ok ? 'Posición correcta.' : 'Posición incorrecta.'}</span>}
                    </button>
                  </m.li>
                )
              })}
              </AnimatePresence>
              {!order.length && <li className="text-caption text-fg-tertiary py-2">Toca los pasos en el orden correcto.</li>}
            </ol>
            {done && !correct && (
              <div className="mt-3 rounded-md border border-edge-strong p-3">
                <h3 className="text-caption text-fg-secondary mb-1.5 font-sans font-normal">Orden correcto</h3>
                <ol className="text-body space-y-1">
                  {(c as OrderChallenge).steps.map((s, i) => (
                    <li key={s} className="flex gap-2"><span className="tnum text-accent">{i + 1}</span><span>{s}</span></li>
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
            <label htmlFor={`${promptId}-fill`} className="sr-only">
              Escribe lo que falta en el código
            </label>
            <input
              id={`${promptId}-fill`}
              value={text}
              disabled={done}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && ready && !done) submit() }}
              placeholder={(c as FillChallenge).placeholder ?? 'Escribe aquí'}
              spellCheck={false}
              autoComplete="off"
              autoCapitalize="off"
              className={`w-full rounded-md border bg-surface-sunken px-3 py-2.5 font-mono text-body outline-none transition-colors
                ${done ? (correct ? 'border-accent text-accent' : 'border-danger text-danger') : 'border-edge-strong focus:border-accent'}`}
            />
            {done && !correct && (
              <div className="mt-2 text-body">
                <span className="text-fg-secondary">Respuesta aceptada: </span>
                <span className="font-mono text-accent">{(c as FillChallenge).accept[0]}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* --- Pista --- */}
      {!done && !strict && c.hint && (
        <div className="mt-4">
          {hint
            ? <div className="rounded-md border border-warning/40 bg-warning/5 p-3 text-body text-warning">{c.hint}</div>
            : <button onClick={() => setHint(true)} className="text-caption text-fg-secondary hover:text-warning transition-colors">
                Ver pista (reduce el XP de este reto)
              </button>}
        </div>
      )}

      {/* --- Acciones --- */}
      <div className="mt-5 flex items-center gap-3">
        {!done
          ? <Button onClick={submit} disabled={!ready}>Comprobar</Button>
          : <Button onClick={onNext}>{nextLabel}</Button>}
        {!done && !ready && <span className="text-caption text-fg-secondary">Elige una respuesta para continuar.</span>}
      </div>

      {/* --- Feedback --- */}
      {done && !strict && (
        <m.div
          ref={feedbackRef}
          tabIndex={-1}
          role="status"
          aria-live="polite"
          variants={reveal}
          initial="hidden"
          animate="show"
          className={`mt-5 rounded-md border p-4 ${correct ? 'border-accent/50 bg-accent/5' : 'border-danger/50 bg-danger/5'}`}
        >
          <div className={`text-body font-semibold mb-2 ${correct ? 'text-accent' : 'text-danger'}`}>
            <span aria-hidden="true">{correct ? '✓ ' : '✕ '}</span>
            {correct ? 'Correcto' : 'Incorrecto'}
          </div>
          {!correct && answerOption && (
            <p className="text-body mb-2 text-fg">
              <span className="text-fg-secondary">La respuesta era: </span>{answerOption.text}
            </p>
          )}
          <p className="text-body leading-relaxed text-fg">{c.explain}</p>
          {!correct && c.deeper && (
            <p className="text-body leading-relaxed text-fg-secondary mt-3 pt-3 border-t border-edge">{c.deeper}</p>
          )}
          <div className="mt-3 flex flex-wrap gap-1.5">
            {c.concepts.map(k => (
              <Chip key={k}>{CONCEPT_LABEL[k] ?? k}</Chip>
            ))}
          </div>
        </m.div>
      )}
      {done && strict && (
        <div ref={feedbackRef} tabIndex={-1} role="status" aria-live="polite" className="mt-4 text-body text-fg-secondary">
          Respuesta registrada. El detalle se muestra al terminar.
        </div>
      )}
      </m.div>
    </AnimatePresence>
  )
}
