import { Component, useState } from 'react'
import type { ErrorInfo, ReactNode } from 'react'
import { Button } from './ui/Button'
import { Icon } from './ui/Icon'
import { cx } from './ui/cx'

interface Props {
  children: ReactNode
  /** `app` ocupa la pantalla completa; `route` se queda dentro del shell y conserva la navegación. */
  scope?: 'app' | 'route'
  /** Al cambiar (por ejemplo, la ruta), el error se descarta y se vuelve a intentar. */
  resetKey?: unknown
  /** Salida alternativa a recargar, para el ámbito de ruta. */
  onHome?: () => void
}
interface State { error: Error | null }

/**
 * Evita que un fallo de render deje la pantalla en blanco. No borra el progreso:
 * ofrece recargar o seguir, y deja copiar el detalle para reportarlo.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // En producción esto iría a un servicio de registro de errores.
    console.error('Fallo de render:', error, info.componentStack)
  }

  componentDidUpdate(prev: Props) {
    if (this.state.error && prev.resetKey !== this.props.resetKey) this.setState({ error: null })
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <ErrorScreen
        error={this.state.error}
        scope={this.props.scope ?? 'app'}
        onRetry={() => this.setState({ error: null })}
        onHome={this.props.onHome}
      />
    )
  }
}

/** Pantalla de error con voz de consola. No depende de Motion ni del router: puede fallar cualquiera de los dos. */
export function ErrorScreen({ error, scope, onRetry, onHome }: {
  error: Error
  scope: 'app' | 'route'
  onRetry: () => void
  onHome?: () => void
}) {
  const [copied, setCopied] = useState(false)
  const detail = `${error.name}: ${error.message}`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(`${detail}\n${error.stack ?? ''}`)
      setCopied(true)
    } catch {
      setCopied(false)
    }
  }

  return (
    <div className={cx('flex justify-center', scope === 'app' ? 'min-h-screen items-center p-6' : 'py-6')}>
      <div role="alert" className="panel w-full max-w-xl overflow-hidden border-danger/40">
        <div className="flex items-center gap-2 border-b border-edge-soft bg-surface-sunken px-4 py-2 font-mono text-micro text-danger">
          <Icon name="x-circle" size={14} />
          RUNTIME ERROR
        </div>
        <div className="p-6">
          <h1 className="mb-2 text-h3">Algo se rompió en esta pantalla</h1>
          <p className="mb-4 text-body leading-relaxed text-fg-secondary">
            Tu progreso sigue guardado en este navegador y no se ha tocado. Recargar suele bastar.
            Si el fallo vuelve, copia el detalle antes de reportarlo.
          </p>
          <pre className="mb-6 overflow-x-auto rounded-md border border-edge bg-surface-sunken p-3 font-mono text-caption text-fg-secondary">
            {error.message}
          </pre>
          <div className="flex flex-wrap gap-3">
            <Button icon="refresh" onClick={() => window.location.reload()}>Recargar</Button>
            <Button variant="secondary" onClick={onRetry}>Intentar continuar</Button>
            {onHome && <Button variant="ghost" onClick={onHome}>Volver al panel</Button>}
            <Button variant="ghost" icon={copied ? 'check' : 'copy'} onClick={() => void copy()}>
              {copied ? 'Detalle copiado' : 'Copiar detalle'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
