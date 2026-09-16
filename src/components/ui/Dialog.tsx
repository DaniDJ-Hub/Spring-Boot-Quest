import { useEffect, useRef } from 'react'
import type { ReactNode, RefObject } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { dialogBackdrop, dialogPanel } from '../../animations'
import { cx } from './cx'

const FOCUSABLE = 'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'

/**
 * Diálogo modal base: atrapa el foco, se cierra con Escape, bloquea el scroll
 * del fondo y devuelve el foco a donde estaba. En móvil sube como hoja inferior.
 * Lo usan la confirmación, el level-up y los ajustes.
 */
export function Dialog({ open, onClose, labelledBy, describedBy, initialFocus, children, size = 'md', mode, className }: {
  open: boolean
  onClose: () => void
  labelledBy: string
  describedBy?: string
  /** Elemento que recibe el foco al abrir; por defecto, el primero enfocable. */
  initialFocus?: RefObject<HTMLElement>
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
  /** `boss` redefine superficies y foco dentro del diálogo. */
  mode?: 'boss'
  className?: string
}) {
  const panel = useRef<HTMLDivElement>(null)
  const previous = useRef<HTMLElement | null>(null)
  // La referencia más reciente de onClose, sin reenganchar el efecto en cada render.
  const closeRef = useRef(onClose)
  closeRef.current = onClose

  useEffect(() => {
    if (!open) return
    previous.current = document.activeElement as HTMLElement | null
    const first = initialFocus?.current ?? panel.current?.querySelector<HTMLElement>(FOCUSABLE)
    first?.focus()

    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); closeRef.current(); return }
      if (e.key !== 'Tab' || !panel.current) return
      const focusables = panel.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      if (!focusables.length) return
      const firstEl = focusables[0]
      const lastEl = focusables[focusables.length - 1]
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus() }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus() }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = overflow
      previous.current?.focus()
    }
  }, [open, initialFocus])

  return (
    <AnimatePresence>
      {open && (
        <m.div
          variants={dialogBackdrop}
          initial="hidden"
          animate="show"
          exit="exit"
          className="fixed inset-0 z-50 flex items-end justify-center bg-surface-sunken/80 sm:items-center sm:p-4"
          onMouseDown={e => { if (e.target === e.currentTarget) closeRef.current() }}
        >
          <m.div
            ref={panel}
            variants={dialogPanel}
            initial="hidden"
            animate="show"
            exit="exit"
            role="dialog"
            aria-modal="true"
            aria-labelledby={labelledBy}
            aria-describedby={describedBy}
            data-mode={mode}
            className={cx(
              // overscroll-contain: al llegar al final del diálogo, el scroll no se escapa a la página.
              'float max-h-[90vh] w-full overflow-y-auto overscroll-contain rounded-b-none p-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] sm:rounded-b-lg sm:pb-6',
              size === 'sm' ? 'sm:max-w-sm' : size === 'lg' ? 'sm:max-w-2xl' : 'sm:max-w-md',
              className,
            )}
          >
            {children}
          </m.div>
        </m.div>
      )}
    </AnimatePresence>
  )
}
