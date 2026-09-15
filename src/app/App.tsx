import { useEffect, useRef } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { page } from '../animations'
import { Dashboard } from '../features/dashboard/Dashboard'
import { WorldMap } from '../features/map/WorldMap'
import { WorldView } from '../features/world/WorldView'
import { Reinforce } from '../features/session/Reinforce'
import { Exam } from '../features/session/Exam'
import { Projects } from '../features/projects/Projects'
import { Achievements } from '../features/achievements/Achievements'
import { Toasts } from '../components/ui'
import { useGameState, useToasts } from '../engine/game-context'
import { levelProgress, titleFor } from '../engine/core'
import { Link } from './router'
import { useRouter } from './router-context'
import type { Route } from './routes'

const TABS: { route: Route; label: string; icon: string }[] = [
  { route: { name: 'panel' }, label: 'Panel', icon: '◫' },
  { route: { name: 'mapa' }, label: 'Mapa', icon: '⌗' },
  { route: { name: 'proyectos' }, label: 'Proyectos', icon: '⌸' },
  { route: { name: 'logros' }, label: 'Logros', icon: '★' },
]

export default function App() {
  const { state, rescued } = useGameState()
  const { toasts, dismissToast } = useToasts()
  const { route } = useRouter()
  const lp = levelProgress(state.xp)
  const main = useRef<HTMLElement>(null)
  const first = useRef(true)

  // Al cambiar de ruta el foco vuelve al contenido: sin esto, quien navega con
  // teclado seguiría en la barra lateral aunque la pantalla haya cambiado.
  useEffect(() => {
    if (first.current) { first.current = false; return }
    main.current?.focus()
  }, [route])

  const activo = (r: Route) =>
    r.name === route.name || (r.name === 'mapa' && route.name === 'mundo')

  const body = (() => {
    switch (route.name) {
      case 'mapa': return <WorldMap />
      case 'mundo': return <WorldView worldId={route.worldId} />
      case 'proyectos': return <Projects />
      case 'logros': return <Achievements />
      case 'refuerzo': return <Reinforce />
      case 'examen': return <Exam />
      default: return <Dashboard />
    }
  })()

  return (
    <div className="min-h-screen md:flex">
      <a
        href="#contenido"
        className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-body focus:font-semibold focus:text-surface-sunken"
      >
        Saltar al contenido
      </a>

      {/* Rail lateral en escritorio */}
      <aside aria-label="Navegación principal" className="hidden md:flex md:flex-col w-56 shrink-0 border-r border-edge px-4 py-6 sticky top-0 h-screen">
        <div className="mb-8">
          <p className="font-display text-lead leading-tight">
            Spring Boot<br /><span className="text-accent">Quest</span>
          </p>
          <p className="text-micro text-fg-tertiary mt-1.5 leading-snug">
            15 mundos construidos sobre el temario del curso
          </p>
        </div>

        <nav className="space-y-1 flex-1">
          {TABS.map(t => (
            <Link
              key={t.label}
              to={t.route}
              aria-current={activo(t.route) ? 'page' : undefined}
              className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-body transition-colors
                ${activo(t.route) ? 'bg-accent/10 text-accent' : 'text-fg-secondary hover:text-fg hover:bg-surface-raised/60'}`}
            >
              <span aria-hidden="true" className="w-4 text-center opacity-70">{t.icon}</span>
              {t.label}
            </Link>
          ))}
        </nav>

        <div className="border-t border-edge pt-4">
          <p className="text-micro text-fg-tertiary">Nivel {lp.level}</p>
          <p className="text-body text-accent font-display leading-tight">{titleFor(lp.level)}</p>
          <div
            role="progressbar"
            aria-label={`Progreso hacia el nivel ${lp.level + 1}`}
            aria-valuenow={Math.round(lp.pct)}
            aria-valuemin={0}
            aria-valuemax={100}
            className="mt-2 h-1 rounded-full bg-edge-soft overflow-hidden"
          >
            <div className="h-full bg-accent rounded-full transition-[width] duration-slow" style={{ width: `${lp.pct}%` }} />
          </div>
          <p className="text-micro text-fg-tertiary mt-1.5 tnum">{state.xp} XP · racha {state.streak.count}</p>
        </div>
      </aside>

      {/* Cabecera móvil */}
      <header className="md:hidden sticky top-0 z-30 bg-surface/95 backdrop-blur border-b border-edge px-4 py-3 flex items-center justify-between">
        <p className="font-display text-body">Spring Boot <span className="text-accent">Quest</span></p>
        <div className="text-right">
          <p className="text-micro text-fg-tertiary tnum leading-none">Nv {lp.level} · {state.xp} XP</p>
          <div aria-hidden="true" className="mt-1.5 h-1 w-24 rounded-full bg-edge-soft overflow-hidden">
            <div className="h-full bg-accent rounded-full" style={{ width: `${lp.pct}%` }} />
          </div>
        </div>
      </header>

      <main
        id="contenido"
        ref={main}
        tabIndex={-1}
        className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10 outline-none"
      >
        {rescued && (
          <div role="alert" className="panel border-warning/50 p-4 mb-6">
            <h2 className="text-body font-semibold text-warning mb-1">Se encontró una partida que no se pudo abrir</h2>
            <p className="text-caption text-fg-secondary leading-relaxed">
              Estaba guardada en un formato que esta versión no reconoce. No se borró: quedó apartada en
              este navegador bajo la clave <span className="font-mono">sbq:rescue</span>. Mientras tanto,
              empiezas una partida nueva.
            </p>
          </div>
        )}
        {/* La clave incluye el mundo, así que pasar de un mundo a otro también
            se lee como un cambio de pantalla y no como un repintado parcial. */}
        <AnimatePresence mode="wait" initial={false}>
          <m.div
            key={route.name === 'mundo' ? `mundo-${route.worldId}` : route.name}
            variants={page}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            {body}
          </m.div>
        </AnimatePresence>
      </main>

      {/* Barra inferior en móvil */}
      <nav aria-label="Navegación principal" className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-surface/95 backdrop-blur border-t border-edge grid grid-cols-4">
        {TABS.map(t => (
          <Link
            key={t.label}
            to={t.route}
            aria-current={activo(t.route) ? 'page' : undefined}
            className={`py-2.5 flex flex-col items-center gap-0.5 text-micro transition-colors
              ${activo(t.route) ? 'text-accent' : 'text-fg-tertiary'}`}
          >
            <span aria-hidden="true" className="text-lead leading-none">{t.icon}</span>
            {t.label}
          </Link>
        ))}
      </nav>

      <Toasts items={toasts} dismiss={dismissToast} />
    </div>
  )
}
