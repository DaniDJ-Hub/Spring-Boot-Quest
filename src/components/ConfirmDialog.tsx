import { useEffect, useId, useRef } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { dialogBackdrop, dialogPanel } from '../animations'
import { Button } from './ui'

/**
 * Diálogo de confirmación para acciones destructivas. Sustituye a confirm(),
 * que no se puede estilar, no se puede probar y aparece fuera de la interfaz.
 * Atrapa el foco, se cierra con Escape y devuelve el foco a donde estaba.
 */
export function ConfirmDialog({
  open, title, body, confirmLabel, onConfirm, onCancel,
}: {
  open: boolean
  title: string
  body: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}) {
  const panel = useRef<HTMLDivElement>(null)
  const cancelBtn = useRef<HTMLButtonElement>(null)
  const previous = useRef<HTMLElement | null>(null)
  const titleId = useId()
  const bodyId = useId()

  useEffect(() => {
    if (!open) return
    previous.current = document.activeElement as HTMLElement | null
    // El foco arranca en cancelar: la opción segura es la que está bajo la mano.
    cancelBtn.current?.focus()

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onCancel(); return }
      if (e.key !== 'Tab' || !panel.current) return
      const focusables = panel.current.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')
      if (!focusables.length) return
      const first = focusables[0]
      const last = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      previous.current?.focus()
    }
  }, [open, onCancel])

  return (
    <AnimatePresence>
      {open && (
        <m.div
          variants={dialogBackdrop}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-surface-sunken/80"
        >
          <m.div
            ref={panel}
            variants={dialogPanel}
            initial="hidden"
            animate="show"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            aria-describedby={bodyId}
            className="panel bg-surface-raised p-6 w-full max-w-md"
          >
            <h2 id={titleId} className="text-lead mb-2">{title}</h2>
            <p id={bodyId} className="text-body text-fg-secondary leading-relaxed mb-5">{body}</p>
            <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
              <Button ref={cancelBtn} variant="ghost" onClick={onCancel}>Cancelar</Button>
              <Button variant="danger" onClick={onConfirm}>{confirmLabel}</Button>
            </div>
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
