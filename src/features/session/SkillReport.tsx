import { CONCEPT_LABEL, WORLDS, WORLD_BY_ID } from '../../data/worlds'
import { useGameState } from '../../engine/game-context'
import { masteryOf } from '../../engine/core'
import { Bar, Button, Chip, Empty } from '../../components/ui'

export function SkillReport({ onBack, onRetake }: { onBack: () => void; onRetake: () => void }) {
  const { state } = useGameState()
  const exam = state.exam
  if (!exam) {
    return <Empty title="Sin examen registrado" body="Presenta el examen final para generar el reporte." action={<Button onClick={onBack}>Volver</Button>} />
  }

  const pct = (exam.score / Math.max(1, exam.total)) * 100
  const level = pct >= 90 ? 'Spring Boot Expert' : pct >= 75 ? 'Backend Engineer' : pct >= 55 ? 'Spring Developer' : 'En formación'
  const entries = Object.entries(exam.byWorld).sort((a, b) => (a[1][0] / a[1][1]) - (b[1][0] / b[1][1]))
  const flojos = entries.filter(([, [ok, n]]) => ok / n < 0.6)
  const fuertes = entries.filter(([, [ok, n]]) => ok / n >= 0.8)
  const allConcepts = WORLDS.flatMap(w => w.concepts)
  const dominados = allConcepts.filter(k => ['mastered', 'expert'].includes(masteryOf(state, k)))
  const pendientes = allConcepts.filter(k => masteryOf(state, k) === 'none')

  return (
    <div className="max-w-3xl space-y-6">
      <div className="panel p-6">
        <p className="text-micro text-fg-tertiary mb-1">Spring Boot Skill Report</p>
        <h1 className="font-display text-h1 mb-1">{level}</h1>
        <p className="text-body text-fg-secondary mb-4">
          {exam.score} de {exam.total} · {Math.round(pct)} % · {new Date(exam.at).toLocaleDateString('es-MX')}
        </p>
        <Bar pct={pct} tone={pct >= 75 ? 'accent' : pct >= 55 ? 'warning' : 'danger'} height="h-2" label="Puntuación del examen final" />
      </div>

      <section className="panel p-5">
        <h2 className="text-body text-fg-secondary mb-3">Resultado por mundo</h2>
        <div className="space-y-2">
          {WORLDS.map(w => {
            const r = exam.byWorld[w.id]
            if (!r) return null
            const [ok, n] = r
            return (
              <div key={w.id} className="flex items-center gap-3">
                <span className="text-caption w-32 sm:w-44 shrink-0 truncate">{w.title}</span>
                <Bar pct={(ok / n) * 100} tone={ok / n >= 0.8 ? 'accent' : ok / n >= 0.5 ? 'warning' : 'danger'} height="h-1.5" label={`${w.title}: ${ok} de ${n}`} />
                <span className="text-micro text-fg-tertiary tnum w-10 text-right shrink-0">{ok}/{n}</span>
              </div>
            )
          })}
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2">
        <section className="panel p-5">
          <h2 className="text-body text-accent mb-2">Fortalezas</h2>
          {fuertes.length === 0
            ? <p className="text-body text-fg-secondary">Ningún mundo por encima del 80 % todavía.</p>
            : <ul className="text-body space-y-1">{fuertes.map(([id]) => <li key={id}>{WORLD_BY_ID[id]?.title}</li>)}</ul>}
        </section>
        <section className="panel p-5">
          <h2 className="text-body text-danger mb-2">A repasar</h2>
          {flojos.length === 0
            ? <p className="text-body text-fg-secondary">Nada por debajo del 60 %.</p>
            : <ul className="text-body space-y-1">{flojos.map(([id]) => (
                <li key={id}>{WORLD_BY_ID[id]?.title} <span className="text-fg-tertiary">· {WORLD_BY_ID[id]?.courseRange}</span></li>
              ))}</ul>}
        </section>
      </div>

      <section className="panel p-5">
        <h2 className="text-body text-fg-secondary mb-3">Conceptos</h2>
        <p className="text-body mb-3">
          <span className="text-accent tnum">{dominados.length}</span> dominados ·{' '}
          <span className="text-danger tnum">{pendientes.length}</span> sin practicar todavía
        </p>
        {pendientes.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {pendientes.slice(0, 16).map(k => <Chip key={k} tone="danger">{CONCEPT_LABEL[k] ?? k}</Chip>)}
            {pendientes.length > 16 && <Chip>+{pendientes.length - 16} más</Chip>}
          </div>
        )}
      </section>

      <section className="panel p-5">
        <h2 className="text-body text-fg-secondary mb-2">Qué sigue</h2>
        <ul className="text-body space-y-2 leading-relaxed">
          {flojos.slice(0, 3).map(([id]) => (
            <li key={id}>Vuelve al mundo <span className="text-fg">{WORLD_BY_ID[id]?.title}</span> y repite su boss battle sin fallar ninguno.</li>
          ))}
          <li>
            Temas que este curso no cubre y son el siguiente paso natural: pruebas unitarias con JUnit y
            Mockito, y microservicios con Spring Cloud. El propio instructor los deja fuera y los trata en
            cursos aparte.
          </li>
        </ul>
      </section>

      <div className="flex gap-3">
        <Button onClick={onBack}>Volver al panel</Button>
        <Button variant="ghost" onClick={onRetake}>Repetir el examen</Button>
      </div>
    </div>
  )
}
