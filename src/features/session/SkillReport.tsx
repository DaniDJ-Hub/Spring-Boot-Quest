import { useState } from 'react'
import type { Challenge } from '../../types'
import { CONCEPT_LABEL } from '../../data/worlds'
import { useGameState } from '../../engine/game-context'
import { conceptProgress, skillReport, SKILL_REPORT_RULES, weakCount } from '../../engine/selectors'
import type { WorldBand } from '../../engine/selectors'
import { useRouter } from '../../app/router-context'
import { Link } from '../../app/router'
import { ChallengeRunner } from '../challenge/ChallengeRunner'
import type { Answer } from '../challenge/evaluate'
import { Badge, Bar, Button, cx, EmptyState, Icon, MasteryMeter, worldCode } from '../../components/ui'

/** El tono de la barra general sale de los mismos cortes que el veredicto. */
function overallTone(ratio: number): 'accent' | 'warning' | 'danger' {
  const [, bueno, aceptable] = SKILL_REPORT_RULES.verdicts
  if (ratio >= bueno.min) return 'accent'
  if (ratio >= aceptable.min) return 'warning'
  return 'danger'
}

const BAND: Record<WorldBand, { tone: 'accent' | 'warning' | 'danger'; label: string }> = {
  strong: { tone: 'accent', label: 'Aprobado sin comentarios' },
  ok: { tone: 'warning', label: 'Aprobado con observaciones' },
  weak: { tone: 'danger', label: 'Cambios solicitados' },
}

/**
 * Skill Report: el examen leído como una revisión de código. Los cortes (qué
 * es fuerte, qué hay que repasar y el veredicto) los decide el motor.
 */
export function SkillReport({ onBack, onRetake, review }: {
  onBack: () => void
  onRetake: () => void
  /** Respuestas del intento recién terminado; no se guardan en la partida. */
  review?: { challenge: Challenge; answer: Answer; correct: boolean }[]
}) {
  const { state } = useGameState()
  const { navigate } = useRouter()
  const report = skillReport(state)
  const [open, setOpen] = useState<number | null>(null)
  const weak = weakCount(state)

  if (!report) {
    return (
      <EmptyState
        title="Sin examen registrado"
        icon="file-check"
        body="Presenta el examen final para generar el reporte."
        action={<Button onClick={onBack}>Volver</Button>}
      />
    )
  }

  const pct = Math.round(report.ratio * 100)

  return (
    <div className="mx-auto max-w-4xl space-y-6 print:max-w-none">
      <section className="panel overflow-hidden">
        <div className="flex items-center gap-2 border-b border-edge-soft bg-surface-sunken px-4 py-2 font-mono text-micro text-fg-tertiary">
          <Icon name="file-check" size={14} />
          SKILL REPORT · SPRING BOOT QUEST
        </div>
        <div className="p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-caption text-fg-secondary">Veredicto</p>
              <h1 className="font-display text-h1">{report.verdict}</h1>
              <p className="mt-1 font-mono text-caption text-fg-secondary tnum">
                {report.score} de {report.total} · {new Date(report.at).toLocaleDateString('es-MX')}
              </p>
            </div>
            <p className="font-display text-display leading-none text-fg tnum">{pct} %</p>
          </div>
          <div className="mt-4">
            <Bar
              pct={pct}
              tone={overallTone(report.ratio)}
              label="Puntuación del examen final"
              height="h-2"
            />
          </div>
          <div className="mt-5 flex flex-wrap gap-3 print:hidden">
            <Button icon="printer" variant="secondary" onClick={() => window.print()}>Imprimir</Button>
            <Button icon="refresh" variant="secondary" onClick={onRetake}>Repetir el examen</Button>
            <Button icon="arrow-left" variant="ghost" onClick={onBack}>Volver al panel</Button>
          </div>
        </div>
      </section>

      <section className="panel p-5">
        <h2 className="mb-3 text-caption text-fg-secondary">Resultado por mundo</h2>
        <ul className="space-y-2">
          {report.worlds.map(w => (
            <li key={w.world.id} className="flex flex-wrap items-center gap-3">
              <span className="font-mono text-micro text-fg-tertiary tnum">{worldCode(w.world)}</span>
              <Link to={{ name: 'mundo', worldId: w.world.id }} className="w-40 shrink-0 truncate text-caption text-fg hover:text-accent">
                {w.world.title}
              </Link>
              <span className="min-w-[8rem] flex-1">
                <Bar pct={w.ratio * 100} tone={BAND[w.band].tone} height="h-1.5" label={`${w.world.title}: ${w.ok} de ${w.n}`} />
              </span>
              <span className="w-10 shrink-0 text-right font-mono text-micro text-fg-tertiary tnum">{w.ok}/{w.n}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="panel p-5">
          <h2 className="mb-2 flex items-center gap-2 text-body text-accent">
            <Icon name="check-circle" size={16} />
            {BAND.strong.label}
          </h2>
          {report.strengths.length === 0
            ? <p className="text-caption text-fg-secondary">Ningún mundo alcanzó ese nivel todavía.</p>
            : <ul className="space-y-1 text-caption text-fg">{report.strengths.map(w => <li key={w.id}>{worldCode(w)} {w.title}</li>)}</ul>}
        </section>
        <section className="panel p-5">
          <h2 className="mb-2 flex items-center gap-2 text-body text-danger">
            <Icon name="alert" size={16} />
            {BAND.weak.label}
          </h2>
          {report.toReview.length === 0
            ? <p className="text-caption text-fg-secondary">Nada por debajo del umbral.</p>
            : (
              <ul className="space-y-2 text-caption">
                {report.toReview.map(w => (
                  <li key={w.id}>
                    <Link to={{ name: 'mundo', worldId: w.id }} className="text-fg hover:text-accent">{worldCode(w)} {w.title}</Link>
                    <span className="text-fg-tertiary"> ({w.courseRange})</span>
                  </li>
                ))}
              </ul>
            )}
        </section>
      </div>

      <section className="panel p-5">
        <h2 className="mb-3 text-caption text-fg-secondary">Cobertura de conceptos</h2>
        <p className="mb-3 text-body">
          <span className="font-display text-h3 text-accent tnum">{report.green.length}</span>
          <span className="text-fg-secondary"> dominados y </span>
          <span className="font-display text-h3 text-fg-secondary tnum">{report.unpracticed.length}</span>
          <span className="text-fg-secondary"> sin practicar todavía</span>
        </p>
        {report.unpracticed.length > 0 && (
          <ul className="flex flex-wrap gap-2">
            {report.unpracticed.slice(0, 18).map(k => (
              <li key={k}>
                <Badge variant="label" tone="neutral" icon="dot">{CONCEPT_LABEL[k] ?? k}</Badge>
              </li>
            ))}
            {report.unpracticed.length > 18 && (
              <li><Badge variant="label">+{report.unpracticed.length - 18} más</Badge></li>
            )}
          </ul>
        )}
      </section>

      <section className="panel p-5">
        <h2 className="mb-3 text-caption text-fg-secondary">Qué sigue</h2>
        <ul className="space-y-3 text-body leading-relaxed">
          {weak > 0 && (
            <li className="flex flex-wrap items-center gap-2">
              <Icon name="target" size={16} className="text-info" />
              Hay {weak} {weak === 1 ? 'concepto' : 'conceptos'} por debajo del umbral.
              <Button size="sm" className="print:hidden" onClick={() => navigate({ name: 'refuerzo' })}>Sesión de refuerzo</Button>
            </li>
          )}
          {report.toReview.slice(0, 3).map(w => (
            <li key={w.id} className="flex gap-2">
              <Icon name="rocket" size={16} className="mt-1 shrink-0 text-boss" />
              <span>Vuelve a <span className="text-fg">{w.title}</span> y repite su boss battle sin fallar ninguna etapa.</span>
            </li>
          ))}
          <li className="flex gap-2 text-fg-secondary">
            <Icon name="file" size={16} className="mt-1 shrink-0 text-fg-tertiary" />
            <span>
              Temas que este curso no cubre y son el siguiente paso natural: pruebas unitarias con JUnit y
              Mockito, y microservicios con Spring Cloud. El propio instructor los deja fuera.
            </span>
          </li>
        </ul>
      </section>

      {report.unpracticed.length > 0 && (
        <section className="panel p-5 print:hidden">
          <h2 className="mb-3 text-caption text-fg-secondary">Conceptos sin practicar</h2>
          <ul className="grid gap-2 sm:grid-cols-2">
            {report.unpracticed.slice(0, 10).map(k => (
              <li key={k} className="flex items-center justify-between gap-2 rounded-md border border-edge bg-surface-sunken px-3 py-2">
                <span className="min-w-0 truncate text-caption text-fg-secondary">{CONCEPT_LABEL[k] ?? k}</span>
                <MasteryMeter level={conceptProgress(state, k).level} size="sm" />
              </li>
            ))}
          </ul>
        </section>
      )}

      {review && review.length > 0 && (
        <section className="panel p-5 print:hidden">
          <h2 className="mb-1 text-caption text-fg-secondary">Revisión de este intento</h2>
          <p className="mb-3 text-caption text-fg-secondary">
            Disponible ahora: el detalle de cada respuesta no se guarda con la partida.
          </p>
          <ol className="space-y-1">
            {review.map((g, i) => (
              <li key={g.challenge.id}>
                <button
                  type="button"
                  aria-expanded={open === i}
                  onClick={() => setOpen(open === i ? null : i)}
                  className="flex min-h-[44px] w-full items-center gap-3 rounded-md border border-edge bg-surface-raised px-3 text-left hover:border-edge-strong"
                >
                  <Icon name={g.correct ? 'check-circle' : 'x-circle'} size={16} className={g.correct ? 'text-accent' : 'text-danger'} />
                  <span className="font-mono text-micro text-fg-tertiary tnum">{g.challenge.id}</span>
                  <span className="min-w-0 flex-1 truncate text-caption text-fg-secondary">{g.challenge.prompt}</span>
                  <Icon name={open === i ? 'chevron-up' : 'chevron-down'} size={16} className="text-fg-tertiary" />
                </button>
                {open === i && (
                  <div className={cx('mt-2 rounded-md border border-edge p-3')}>
                    <ChallengeRunner challenge={g.challenge} review={g.answer} onResolved={() => {}} onNext={() => {}} />
                  </div>
                )}
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  )
}
