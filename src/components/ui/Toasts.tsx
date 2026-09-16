import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { toast as toastVariants } from '../../animations'
import { ACHIEVEMENTS } from '../../data'
import { cx } from './cx'
import { Icon } from './Icon'
import { achievementIcon, RARITY_META, rarityOf } from './meta'

interface ToastItem { id: number; title: string; detail: string; icon: string }

/** Tiempo visible de un aviso. Se pausa mientras el puntero o el foco están encima. */
const VISIBLE_MS = 6000
const MAX_VISIBLE = 3

function AchievementToast({ item, dismiss }: { item: ToastItem; dismiss: (id: number) => void }) {
  const [paused, setPaused] = useState(false)
  const remaining = useRef(VISIBLE_MS)
  const startedAt = useRef(0)

  // Cuenta atrás que respeta la pausa: al reanudar sigue desde donde quedó.
  useEffect(() => {
    if (paused) return
    startedAt.current = Date.now()
    const t = setTimeout(() => dismiss(item.id), remaining.current)
    return () => {
      clearTimeout(t)
      remaining.current -= Date.now() - startedAt.current
    }
  }, [paused, dismiss, item.id])

  // Los avisos traen título y no id; el id se recupera del catálogo para la rareza.
  const achievement = ACHIEVEMENTS.find(a => a.title === item.title)
  const rarity = rarityOf(achievement?.id ?? '')
  const r = RARITY_META[rarity]

  return (
    <m.div
      variants={toastVariants}
      initial="hidden"
      animate="show"
      exit="exit"
      role="group"
      aria-label={`Logro desbloqueado: ${item.title}. ${item.detail}`}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="float pointer-events-auto relative flex w-80 max-w-full items-start gap-3 overflow-hidden py-3 pl-4 pr-2"
    >
      <span aria-hidden="true" className={cx('absolute inset-y-0 left-0 w-1', r.bg)} />
      <span className={cx('mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-md border border-edge-strong', r.text)}>
        <Icon name={achievementIcon(achievement?.id ?? '')} size={20} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="flex items-center gap-2 font-mono text-micro text-fg-tertiary">
          Logro <span className={r.text}>{r.label}</span>
        </p>
        <p className="font-display text-body text-fg">{item.title}</p>
        <p className="text-caption text-fg-secondary">{item.detail}</p>
      </div>
      <button
        type="button"
        onClick={() => dismiss(item.id)}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-md text-fg-tertiary hover:bg-surface-raised hover:text-fg"
      >
        <Icon name="x" size={16} />
        <span className="sr-only">Descartar aviso</span>
      </button>
    </m.div>
  )
}

/**
 * Pila de avisos de logro. Muestra como mucho tres; los demás esperan turno.
 * Se cierran solos y se anuncian en una región viva.
 */
export function Toasts({ items, dismiss }: { items: ToastItem[]; dismiss: (id: number) => void }) {
  const visible = items.slice(0, MAX_VISIBLE)
  return (
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed inset-x-4 bottom-20 z-50 flex flex-col items-end gap-2 md:inset-x-auto md:bottom-6 md:right-6"
    >
      <AnimatePresence initial={false}>
        {visible.map(t => <AchievementToast key={t.id} item={t} dismiss={dismiss} />)}
      </AnimatePresence>
    </div>
  )
}
