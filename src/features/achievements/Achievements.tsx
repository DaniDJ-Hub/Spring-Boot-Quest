import { useState } from 'react'
import { ACHIEVEMENTS } from '../../data'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Backup } from './Backup'
import { Button } from '../../components/ui'
import { useGameActions, useGameState } from '../../engine/game-context'

export function Achievements() {
  const { state } = useGameState()
  const { reset } = useGameActions()
  const got = new Set(state.achievements)
  const [confirmando, setConfirmando] = useState(false)

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-h2 mb-1">Logros</h1>
        <p className="text-body text-fg-secondary">
          {got.size} de {ACHIEVEMENTS.length} desbloqueados.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2">
        {ACHIEVEMENTS.map(a => {
          const has = got.has(a.id)
          return (
            <div key={a.id} className={`panel p-4 flex gap-3 ${has ? 'border-warning/40' : 'opacity-45'}`}>
              <span className={`text-h3 leading-none mt-0.5 ${has ? 'text-warning' : 'text-fg-tertiary'}`}>{a.icon}</span>
              <div>
                <div className={`text-body font-semibold ${has ? 'text-warning' : ''}`}>{a.title}</div>
                <div className="text-caption text-fg-secondary mt-0.5">{a.detail}</div>
              </div>
            </div>
          )
        })}
      </div>

      <Backup />

      <section className="panel p-5 border-danger/30">
        <h2 className="text-body mb-1">Empezar de cero</h2>
        <p className="text-caption text-fg-secondary mb-3">
          Borra el progreso guardado en este navegador: XP, dominio, logros, proyectos y el examen.
          No se puede deshacer.
        </p>
        <Button variant="danger" onClick={() => setConfirmando(true)}>Borrar progreso</Button>
      </section>

      <ConfirmDialog
        open={confirmando}
        title="¿Borrar todo el progreso?"
        body="Se pierden el XP, el dominio por concepto, las boss superadas, los logros, los checklists de proyecto y el examen. No se puede deshacer."
        confirmLabel="Sí, borrar todo"
        onConfirm={() => { setConfirmando(false); reset() }}
        onCancel={() => setConfirmando(false)}
      />
    </div>
  )
}
