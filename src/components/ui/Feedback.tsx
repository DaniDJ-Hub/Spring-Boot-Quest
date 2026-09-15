import type { ReactNode } from 'react'
import { cx } from './cx'
import { Icon } from './Icon'
import type { IconName } from './Icon'

/**
 * Bloque de carga. Con movimiento reducido se queda quieto (`motion-safe`):
 * un pulso infinito es exactamente lo que esa preferencia pide evitar.
 */
export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cx('block rounded-sm bg-edge-soft motion-safe:animate-breathe', className)} />
}

export function EmptyState({ title, body, action, icon = 'info', className }: {
  title: string
  body: ReactNode
  action?: ReactNode
  icon?: IconName
  className?: string
}) {
  return (
    <div className={cx('panel flex flex-col items-center px-6 py-12 text-center', className)}>
      <span className="mb-4 grid h-12 w-12 place-items-center rounded-md border border-edge-strong text-fg-secondary">
        <Icon name={icon} size={22} />
      </span>
      <h2 className="mb-2 text-h3">{title}</h2>
      <div className="mx-auto mb-6 max-w-md text-body text-fg-secondary">{body}</div>
      {action}
    </div>
  )
}

/** Compatibilidad con las pantallas anteriores. */
export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return <EmptyState title={title} body={body} action={action} />
}

/** Aviso en línea: información, advertencia o error, siempre con icono y texto. */
export function Callout({ tone = 'info', title, children, className, role }: {
  tone?: 'info' | 'warning' | 'danger' | 'accent'
  title?: string
  children?: ReactNode
  className?: string
  role?: 'alert' | 'status'
}) {
  const t = {
    info: { box: 'border-info/40', text: 'text-info', icon: 'info' as const },
    warning: { box: 'border-warning/40', text: 'text-warning', icon: 'alert' as const },
    danger: { box: 'border-danger/40', text: 'text-danger', icon: 'x-circle' as const },
    accent: { box: 'border-accent/40', text: 'text-accent', icon: 'check-circle' as const },
  }[tone]
  return (
    <div role={role} className={cx('flex gap-3 rounded-md border bg-surface-raised p-4', t.box, className)}>
      <Icon name={t.icon} size={18} className={cx('mt-0.5', t.text)} />
      <div className="min-w-0">
        {title && <p className={cx('mb-1 text-body font-semibold', t.text)}>{title}</p>}
        <div className="text-caption leading-relaxed text-fg-secondary">{children}</div>
      </div>
    </div>
  )
}
