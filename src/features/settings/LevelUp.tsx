import { useEffect, useId, useRef, useState } from 'react'
import { useGameState } from '../../engine/game-context'
import { levelProgress, nextTitle, titleFor } from '../../engine/core'
import { playCue } from '../../app/sound'
import { Button, Dialog, Icon, LevelBadge } from '../../components/ui'

/**
 * Aviso de subida de nivel. Espera a que termine la ronda para no interrumpir
 * la lectura de la explicación: mientras el shell está en modo inmersivo el
 * aviso queda pendiente y aparece al salir.
 */
export function LevelUp({ immersive }: { immersive: boolean }) {
  const { state } = useGameState()
  const level = levelProgress(state.xp).level
  const previous = useRef(level)
  const [pending, setPending] = useState<number | null>(null)
  const [open, setOpen] = useState(false)
  const titleId = useId()

  useEffect(() => {
    if (level > previous.current) setPending(level)
    previous.current = level
  }, [level])

  useEffect(() => {
    if (pending !== null && !immersive) {
      setOpen(true)
      playCue('levelup')
      setPending(null)
    }
  }, [pending, immersive])

  const next = nextTitle(level)

  return (
    <Dialog open={open} onClose={() => setOpen(false)} labelledBy={titleId} size="sm">
      <p className="flex items-center gap-2 font-mono text-micro uppercase tracking-wide text-accent">
        <Icon name="bolt" size={14} />
        Level up
      </p>
      <h2 id={titleId} className="mt-1 font-display text-h2">
        Nivel {level}
      </h2>
      <p className="mt-1 text-body text-fg-secondary">
        Ahora eres <span className="text-accent">{titleFor(level)}</span>.
      </p>
      <div className="mt-5">
        <LevelBadge xp={state.xp} size="lg" />
      </div>
      {next && (
        <p className="mt-4 font-mono text-micro text-fg-tertiary">
          Siguiente título: {next.name}, en el nivel {next.level}.
        </p>
      )}
      <div className="mt-6 flex justify-end">
        <Button onClick={() => setOpen(false)}>Seguir</Button>
      </div>
    </Dialog>
  )
}
