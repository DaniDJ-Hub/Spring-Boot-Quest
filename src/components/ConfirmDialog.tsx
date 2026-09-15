import { useId, useRef } from 'react'
import { Button } from './ui/Button'
import { Dialog } from './ui/Dialog'

/**
 * Confirmación de acciones destructivas. Sustituye a confirm(), que no se
 * puede estilar ni probar. El foco arranca en cancelar: la opción segura es la
 * que queda bajo la mano.
 */
export function ConfirmDialog({
  open, title, body, confirmLabel, onConfirm, onCancel, tone = 'danger',
}: {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
  tone?: 'danger' | 'primary'
}) {
  const cancelBtn = useRef<HTMLButtonElement>(null)
  const titleId = useId()
  const bodyId = useId()

  return (
    <Dialog open={open} onClose={onCancel} labelledBy={titleId} describedBy={bodyId} initialFocus={cancelBtn}>
      <h2 id={titleId} className="mb-2 text-h3">{title}</h2>
      <p id={bodyId} className="mb-6 text-body leading-relaxed text-fg-secondary">{body}</p>
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <Button ref={cancelBtn} variant="secondary" onClick={onCancel}>Cancelar</Button>
        <Button variant={tone} onClick={onConfirm}>{confirmLabel}</Button>
      </div>
    </Dialog>
  )
}
