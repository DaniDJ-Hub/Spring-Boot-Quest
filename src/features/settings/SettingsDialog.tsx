import { useId, useState } from 'react'
import { useGameActions, useGameState } from '../../engine/game-context'
import { Button, Dialog, Icon } from '../../components/ui'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import { Backup } from '../achievements/Backup'

/**
 * Ajustes de la partida: respaldo y borrado. Antes vivían al final de la
 * pantalla de logros, que no es donde nadie los busca.
 */
export function SettingsDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useGameState()
  const { reset } = useGameActions()
  const titleId = useId()
  const [confirming, setConfirming] = useState(false)

  return (
    <>
      <Dialog open={open} onClose={onClose} labelledBy={titleId} size="lg">
        <div className="mb-6 flex items-start gap-3">
          <Icon name="sliders" size={20} className="mt-1 text-fg-secondary" />
          <div>
            <h2 id={titleId} className="text-h3">Ajustes</h2>
            <p className="text-caption text-fg-secondary">
              {state.xp} XP · {state.bossCleared.length} mundos superados · {state.achievements.length} logros
            </p>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={onClose} icon="x" aria-label="Cerrar ajustes">Cerrar</Button>
        </div>

        <Backup />

        <section className="mt-4 rounded-md border border-danger/30 bg-surface-raised p-5">
          <h3 className="mb-1 text-body font-semibold">Empezar de cero</h3>
          <p className="mb-4 text-caption leading-relaxed text-fg-secondary">
            Borra el progreso guardado en este navegador: XP, dominio, logros, proyectos y el examen.
            No se puede deshacer.
          </p>
          <Button variant="danger" icon="trash" onClick={() => setConfirming(true)}>Borrar progreso</Button>
        </section>
      </Dialog>

      <ConfirmDialog
        open={confirming}
        title="¿Borrar todo el progreso?"
        body="Se pierden el XP, el dominio por concepto, las boss superadas, los logros, los checklists de proyecto y el examen. No se puede deshacer."
        confirmLabel="Sí, borrar todo"
        onConfirm={() => { setConfirming(false); onClose(); reset() }}
        onCancel={() => setConfirming(false)}
      />
    </>
  )
}
