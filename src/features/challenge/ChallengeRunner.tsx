import { useEffect, useId, useMemo, useRef, useState } from 'react'
import type { KeyboardEvent, ReactNode } from 'react'
import { AnimatePresence, m } from 'motion/react'
import type { Challenge, ChoiceChallenge, FillChallenge, OrderChallenge } from '../../types'
import { challenge as challengeVariants } from '../../animations'
import { challengeXp } from '../../engine/core'
import { hintCostPct } from '../../engine/selectors'
import type { SelectionReason } from '../../engine/selectors'
import { Button, CodeBlock, cx, DifficultyPips, Icon, KindBadge, ReasonBadge } from '../../components/ui'
import type { Answer } from './evaluate'
import { emptyAnswer, evaluate, isChoice, isReady, shuffled } from './evaluate'
import { OptionList } from './parts/OptionList'
import { LogViewer } from './parts/LogViewer'
import { PatchView } from './parts/PatchView'
import { FillCode } from './parts/FillCode'
import { SortableSteps } from './parts/SortableSteps'
import { Console } from './parts/Console'
import { patchDiff } from './diff'

export interface ChallengeRunnerProps {
  challenge: Challenge
  /** Boss y examen: sin pistas y sin corrección hasta el final. */
  strict?: boolean
  index?: number
  total?: number
  /** Motivo por el que el motor colocó este reto aquí. */
  reason?: SelectionReason
  onResolved: (correct: boolean, usedHint: boolean) => void
  /** Respuesta concreta, para poder revisarla al final de una boss o un examen. */
  onAnswer?: (answer: Answer, correct: boolean) => void
  onNext: () => void
  nextLabel?: string
  /** Bloque extra en la consola: cambios de dominio de la sesión. */
  feedbackExtra?: ReactNode
  /** Modo revisión: muestra una respuesta ya dada, con explicación y sin acciones. */
  review?: Answer
}

const PREFIX: Record<Challenge['kind'], string> = {
  quiz: 'Opción', codefix: 'Parche', debug: 'Hipótesis', arch: 'Propuesta',
  decision: 'Opción', order: 'Paso', fill: 'Hueco',
}

const INTERACTION_TITLE: Partial<Record<Challenge['kind'], string>> = {
  codefix: 'Parches propuestos',
  debug: 'Diagnóstico',
  arch: 'Propuestas de diseño',
  decision: 'Qué haces',
  order: 'Ordena el flujo',
}

export function ChallengeRunner(props: ChallengeRunnerProps) {
  // La clave es el id: al cambiar de reto, Motion saca el anterior y entra el
  // siguiente, y el cuerpo se remonta con su estado limpio.
  return (
    <AnimatePresence mode="wait" initial={false}>
      <m.div key={props.challenge.id} variants={challengeVariants} initial="hidden" animate="show" exit="exit">
        <RunnerBody {...props} />
      </m.div>
    </AnimatePresence>
  )
}

type Tab = 'reto' | 'codigo' | 'consola'

function RunnerBody({
  challenge: c, strict = false, index, total, reason, onResolved, onAnswer, onNext, nextLabel = 'Siguiente', feedbackExtra, review,
}: ChallengeRunnerProps) {
  const [answer, setAnswer] = useState<Answer>(() => review ?? emptyAnswer(c))
  const [done, setDone] = useState(Boolean(review))
  const [correct, setCorrect] = useState(() => (review ? evaluate(c, review) : false))
  const [hint, setHint] = useState(false)
  const [tab, setTab] = useState<Tab>('reto')

  const promptId = useId()
  const heading = useRef<HTMLHeadingElement>(null)
  const consoleRef = useRef<HTMLDivElement>(null)

  const options = useMemo(() => (isChoice(c) ? shuffled(c.options, c.id) : []), [c])
  const choice = c as ChoiceChallenge
  const ready = isReady(c, answer)
  const phase = !done ? 'answering' : strict && !review ? 'recorded' : 'revealed'

  // Al entrar un reto nuevo, el foco va a su enunciado: quien navega con
  // teclado no se queda en el botón de la pantalla anterior.
  useEffect(() => {
    if (review) return
    heading.current?.focus({ preventScroll: true })
  }, [review])

  // Al resolver, el foco pasa al veredicto y en móvil se abre la consola.
  useEffect(() => {
    if (done && !review) consoleRef.current?.focus()
  }, [done, review])

  function submit() {
    if (done || !ready) return
    const ok = evaluate(c, answer)
    setCorrect(ok)
    setDone(true)
    setTab('consola')
    onResolved(ok, hint)
    onAnswer?.(answer, ok)
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (review) return
    const target = e.target as HTMLElement
    const typing = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault()
      if (done) onNext(); else submit()
      return
    }
    if (!typing && !done && isChoice(c) && /^[1-9]$/.test(e.key)) {
      const o = options[Number(e.key) - 1]
      if (o) { e.preventDefault(); setAnswer({ kind: 'choice', optionId: o.id }) }
    }
  }

  /* ------------------------------- Zonas -------------------------------- */

  const picked = answer.kind === 'choice' ? answer.optionId : null
  const pickedOption = options.find(o => o.id === picked)
  const answerOption = options.find(o => o.id === choice.answer)

  // Código del reto: el log tiene visor propio; en «corregir código» se señalan
  // las líneas que toca el parche elegido.
  const touched = useMemo(() => {
    if (c.kind !== 'codefix' || !pickedOption?.code || !choice.code) return {}
    const marks: Record<number, 'mark'> = {}
    for (const l of patchDiff(choice.code, pickedOption.code).touched) marks[l] = 'mark'
    return marks
  }, [c.kind, pickedOption, choice.code])

  const codePane = c.kind === 'fill' ? null
    : c.kind === 'debug' && choice.lang === 'log' ? <LogViewer code={choice.code ?? ''} label="salida" />
      : isChoice(c) && choice.code
        ? <CodeBlock
            code={choice.code}
            lang={choice.lang ?? 'java'}
            label={c.kind === 'codefix' ? 'Código con el fallo' : c.kind === 'debug' ? 'Síntoma' : 'Código'}
            marks={touched}
          />
        : null

  const interaction = c.kind === 'order' ? (
    <SortableSteps
      steps={answer.kind === 'order' ? answer.steps : []}
      correct={(c as OrderChallenge).steps}
      onChange={steps => setAnswer({ kind: 'order', steps })}
      phase={phase}
      labelledBy={promptId}
    />
  ) : c.kind === 'fill' ? (
    <FillCode
      challenge={c as FillChallenge}
      values={answer.kind === 'fill' ? answer.values : []}
      onChange={values => setAnswer({ kind: 'fill', values })}
      onSubmit={submit}
      phase={phase}
      correct={correct}
      describedBy={promptId}
    />
  ) : (
    <OptionList
      options={options}
      picked={picked}
      answerId={choice.answer}
      phase={phase}
      onPick={id => setAnswer({ kind: 'choice', optionId: id })}
      labelledBy={promptId}
      layout={c.kind === 'arch' ? 'grid' : 'list'}
      prefix={PREFIX[c.kind]}
      renderBody={(o, st) => (
        <>
          <span className="block text-body leading-relaxed text-fg">{o.text}</span>
          {c.kind === 'codefix' && o.code && choice.code && <PatchView original={choice.code} patch={o.code} />}
          {c.kind === 'decision' && st.revealed && o.consequence && (
            <span className={cx('mt-2 block text-caption leading-relaxed', st.isAnswer ? 'text-accent' : 'text-fg-secondary')}>
              → {o.consequence}
            </span>
          )}
        </>
      )}
    />
  )

  const helper = !ready
    ? c.kind === 'fill' ? 'Escribe lo que falta para comprobar.' : 'Elige una opción para comprobar.'
    : null

  const tabs: { id: Tab; label: string }[] = [
    { id: 'reto', label: 'Reto' },
    ...(codePane ? [{ id: 'codigo' as const, label: c.kind === 'debug' ? 'Log' : 'Código' }] : []),
    { id: 'consola', label: 'Consola' },
  ]
  const pane = (id: Tab) => cx(tab === id ? 'block' : 'hidden', 'lg:block')

  return (
    <div onKeyDown={onKeyDown}>
      {/* Pestañas solo en móvil: el reto ocupa la pantalla y no obliga a hacer scroll. */}
      <div className="mb-3 flex gap-1 rounded-md border border-edge bg-surface-raised p-1 lg:hidden">
        {tabs.map(t => (
          <button
            key={t.id}
            type="button"
            aria-pressed={tab === t.id}
            onClick={() => setTab(t.id)}
            className={cx(
              'min-h-[36px] flex-1 rounded-sm text-caption transition-colors duration-fast',
              tab === t.id ? 'bg-surface-overlay text-fg' : 'text-fg-secondary hover:text-fg',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)] xl:grid-cols-[minmax(0,4fr)_minmax(0,7fr)_minmax(0,4fr)]">
        {/* Instrucciones */}
        <section className={cx(pane('reto'), 'lg:row-span-3 xl:row-span-2')}>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <KindBadge kind={c.kind} />
            {reason && <ReasonBadge reason={reason} />}
            {index !== undefined && total !== undefined && (
              <span className="ml-auto font-mono text-micro text-fg-tertiary tnum">{index + 1} / {total}</span>
            )}
          </div>
          <h2 ref={heading} id={promptId} tabIndex={-1} className="font-sans text-lead font-normal leading-relaxed text-fg outline-none">
            {c.kind === 'decision' && <span className="mb-1 block font-mono text-micro uppercase tracking-wide text-fg-tertiary">Situación</span>}
            {c.prompt}
          </h2>
          <p className="mt-3 flex items-center gap-3 font-mono text-micro text-fg-tertiary">
            <DifficultyPips value={c.difficulty} />
            <span className="tnum">+{c.xp} XP</span>
            <span>{c.id}</span>
          </p>

          {!done && !strict && c.hint && (
            <div className="mt-4">
              {hint ? (
                <p className="rounded-md border border-warning/40 bg-warning-dim p-3 text-body text-warning">
                  <Icon name="lightbulb" size={16} className="mr-2 inline" />
                  {c.hint}
                </p>
              ) : (
                <button
                  type="button"
                  onClick={() => setHint(true)}
                  className="inline-flex min-h-[36px] items-center gap-2 text-caption text-fg-secondary hover:text-warning"
                >
                  <Icon name="lightbulb" size={16} />
                  Ver pista
                  <span className="font-mono text-micro">−{hintCostPct()} % XP</span>
                </button>
              )}
            </div>
          )}
        </section>

        {/* Interacción, con el código encima cuando lo hay */}
        <div className="min-w-0 lg:col-start-2 xl:row-span-2 xl:row-start-1">
          {codePane && <div className={cx(pane('codigo'), 'mb-4')}>{codePane}</div>}
          <div className={pane('reto')}>
            {INTERACTION_TITLE[c.kind] && (
              <h3 className="mb-2 font-mono text-micro uppercase tracking-wide text-fg-tertiary">{INTERACTION_TITLE[c.kind]}</h3>
            )}
            {interaction}
          </div>
        </div>

        {/* Consola */}
        <section className={cx(pane('consola'), 'min-w-0 lg:col-start-2 lg:row-start-2 xl:col-start-3 xl:row-start-1')}>
          <Console
            ref={consoleRef}
            challenge={c}
            phase={phase === 'answering' ? 'waiting' : phase === 'recorded' ? 'recorded' : 'revealed'}
            correct={correct}
            xp={review ? undefined : challengeXp(c.xp, correct, hint)}
            usedHint={hint}
            answerText={isChoice(c) && answerOption ? answerOption.text : undefined}
            consequence={c.kind === 'decision' ? { picked: pickedOption?.consequence, correct: answerOption?.consequence } : undefined}
            extra={feedbackExtra}
            shortcut={
              <span className="text-caption text-fg-tertiary">
                Atajos: <span className="kbd">1</span>…<span className="kbd">4</span> elegir · <span className="kbd">Ctrl</span>+<span className="kbd">Enter</span> comprobar
              </span>
            }
          />
        </section>

        {/* Acciones: barra fija en móvil, junto a la consola en escritorio */}
        {!review && (
          <div className="sticky bottom-0 z-10 -mx-4 flex flex-wrap items-center gap-3 border-t border-edge bg-surface/95 px-4 py-3 backdrop-blur lg:static lg:col-start-2 lg:row-start-3 lg:mx-0 lg:border-0 lg:bg-transparent lg:p-0 lg:backdrop-blur-none xl:col-start-3 xl:row-start-2">
            {!done
              ? <Button onClick={submit} disabled={!ready}>Comprobar</Button>
              : <Button onClick={onNext} iconRight="arrow-right">{nextLabel}</Button>}
            {helper && !done && <span className="text-caption text-fg-secondary">{helper}</span>}
          </div>
        )}
      </div>
    </div>
  )
}
