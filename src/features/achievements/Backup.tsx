import { useRef, useState } from 'react'
import { useGameActions, useGameState } from '../../engine/game-context'
import { exportState, importState } from '../../engine/core'
import { Button } from '../../components/ui'
import { ConfirmDialog } from '../../components/ConfirmDialog'
import type { GameState } from '../../types'

/**
 * Copia de seguridad del progreso. Sin esto, cambiar de navegador o limpiar los
 * datos del sitio significaba empezar de cero, y no hay cuenta que lo recupere.
 */
export function Backup() {
  const { state } = useGameState()
  const { replaceState } = useGameActions()
  const input = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [pendiente, setPendiente] = useState<GameState | null>(null)

  function descargar() {
    const blob = new Blob([exportState(state)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `spring-boot-quest-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function elegir(file: File) {
    setError(null)
    const resultado = importState(await file.text())
    if (!resultado.ok) { setError(resultado.reason); return }
    // Nunca se sustituye el progreso sin confirmar: es destructivo.
    setPendiente(resultado.state)
  }

  return (
    <section className="panel p-5">
      <h2 className="text-body mb-1">Copia de seguridad</h2>
      <p className="text-caption text-fg-secondary mb-4 leading-relaxed">
        El progreso vive solo en este navegador. Descarga un fichero para llevártelo a otro equipo o
        para no perderlo si limpias los datos del sitio.
      </p>

      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" onClick={descargar}>Descargar progreso</Button>
        <Button variant="secondary" onClick={() => input.current?.click()}>Restaurar desde un fichero</Button>
      </div>

      <input
        ref={input}
        type="file"
        accept="application/json,.json"
        className="sr-only"
        aria-label="Elegir un fichero de respaldo"
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) void elegir(f)
          e.target.value = ''
        }}
      />

      {error && (
        <p role="alert" className="mt-3 text-caption text-danger">{error}</p>
      )}

      <ConfirmDialog
        open={pendiente !== null}
        title="¿Restaurar este respaldo?"
        body={
          pendiente
            ? `El respaldo tiene ${pendiente.xp} XP y ${pendiente.bossCleared.length} mundos superados. Sustituirá por completo tu progreso actual.`
            : ''
        }
        confirmLabel="Restaurar"
        onConfirm={() => { if (pendiente) replaceState(pendiente); setPendiente(null) }}
        onCancel={() => setPendiente(null)}
      />
    </section>
  )
}
