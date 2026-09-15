import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props { children: ReactNode }
interface State { error: Error | null }

/**
 * Evita que un fallo de render deje la pantalla en blanco. No borra el progreso:
 * ofrece recargar, y solo como último recurso permite empezar de cero.
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

  render() {
    if (!this.state.error) return this.props.children

    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div role="alert" className="panel p-6 max-w-lg">
          <h1 className="font-display text-h3 mb-2">Algo se rompió en esta pantalla</h1>
          <p className="text-body text-fg-secondary leading-relaxed mb-4">
            Tu progreso sigue guardado en este navegador y no se ha tocado. Recargar suele bastar.
            Si el fallo vuelve, copia el detalle de abajo antes de reportarlo.
          </p>
          <pre className="rounded-md border border-edge bg-surface-sunken p-3 text-caption font-mono text-fg-secondary overflow-x-auto mb-4">
            {this.state.error.message}
          </pre>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => window.location.reload()}
              className="rounded-md bg-accent text-surface-sunken font-semibold px-4 py-2 text-body hover:bg-accent-bright transition-colors"
            >
              Recargar
            </button>
            <button
              onClick={() => this.setState({ error: null })}
              className="rounded-md border border-edge-strong px-4 py-2 text-body hover:border-accent transition-colors"
            >
              Intentar continuar
            </button>
          </div>
        </div>
      </div>
    )
  }
}
