import { Button } from './ui/Button'
import { Icon } from './ui/Icon'
import { Skeleton } from './ui/Feedback'

/**
 * Estado de carga del contenido diferido. Cada variante reserva la forma de lo
 * que va a llegar, para que la pantalla no dé un salto cuando aparece.
 */
export function LoadingBlock({ label = 'Cargando retos', variant = 'challenge' }: {
  label?: string
  variant?: 'challenge' | 'world' | 'list'
}) {
  return (
    <div role="status" aria-live="polite" className="panel p-6">
      <span className="sr-only">{label}</span>
      {variant === 'challenge' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
          <div className="space-y-3">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-4/5" />
            <Skeleton className="h-4 w-3/5" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-32 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
            <Skeleton className="h-12 w-full rounded-md" />
          </div>
        </div>
      )}
      {variant === 'world' && (
        <div className="space-y-4">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-8 w-2/3" />
          <Skeleton className="h-4 w-1/2" />
          <Skeleton className="mt-6 h-24 w-full rounded-md" />
        </div>
      )}
      {variant === 'list' && (
        <div className="space-y-2">
          {Array.from({ length: 5 }, (_, i) => <Skeleton key={i} className="h-14 w-full rounded-md" />)}
        </div>
      )}
      <p aria-hidden="true" className="mt-6 flex items-center gap-2 font-mono text-micro text-fg-tertiary">
        <Icon name="loader" size={14} className="motion-safe:animate-spin" />
        {label}…
      </p>
    </div>
  )
}

/** Fallo al descargar contenido. Se dice qué pasó, que el progreso está a salvo y cómo seguir. */
export function LoadError({ onRetry, error }: { onRetry: () => void; error?: Error | null }) {
  return (
    <div role="alert" className="panel overflow-hidden border-danger/40">
      <div className="flex items-center gap-2 border-b border-edge-soft bg-surface-sunken px-4 py-2 font-mono text-micro text-danger">
        <Icon name="x-circle" size={14} />
        FETCH FAILED
      </div>
      <div className="p-5">
        <h2 className="mb-1 text-h3">No se pudo cargar el contenido</h2>
        <p className="mb-4 text-body text-fg-secondary">
          Suele ser un corte de red momentáneo. Tu progreso está intacto.
        </p>
        {error?.message && (
          <pre className="mb-4 overflow-x-auto rounded-md border border-edge bg-surface-sunken p-3 font-mono text-caption text-fg-secondary">
            {error.message}
          </pre>
        )}
        <Button icon="refresh" onClick={onRetry}>Reintentar</Button>
      </div>
    </div>
  )
}
