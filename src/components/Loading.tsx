import { Button } from './ui'

/** Estado de carga del contenido de un mundo. Reserva altura para que la
 *  interfaz no dé un salto cuando llegan los retos. */
export function LoadingBlock({ label = 'Cargando retos' }: { label?: string }) {
  return (
    <div role="status" aria-live="polite" className="panel p-5 min-h-[280px] flex flex-col gap-3">
      <span className="sr-only">{label}</span>
      <div aria-hidden="true" className="h-3 w-24 rounded bg-edge animate-pulse" />
      <div aria-hidden="true" className="h-4 w-full rounded bg-edge animate-pulse" />
      <div aria-hidden="true" className="h-4 w-4/5 rounded bg-edge animate-pulse" />
      <div aria-hidden="true" className="mt-3 h-10 w-full rounded bg-edge-soft animate-pulse" />
      <div aria-hidden="true" className="h-10 w-full rounded bg-edge-soft animate-pulse" />
      <div aria-hidden="true" className="h-10 w-full rounded bg-edge-soft animate-pulse" />
    </div>
  )
}

export function LoadError({ onRetry }: { onRetry: () => void }) {
  return (
    <div role="alert" className="panel p-5 border-danger/50">
      <h2 className="text-body font-semibold text-danger mb-1">No se pudo cargar el contenido</h2>
      <p className="text-body text-fg-secondary mb-4">
        Suele ser un corte de red momentáneo. Tu progreso está intacto.
      </p>
      <Button onClick={onRetry}>Reintentar</Button>
    </div>
  )
}
