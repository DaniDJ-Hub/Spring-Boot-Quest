import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, m } from 'motion/react'
import { page } from '../animations'
import { Dashboard } from '../features/dashboard/Dashboard'
import { WorldMap } from '../features/map/WorldMap'
import { WorldView } from '../features/world/WorldView'
import { Reinforce } from '../features/session/Reinforce'
import { Exam } from '../features/session/Exam'
import { Projects } from '../features/projects/Projects'
import { Achievements } from '../features/achievements/Achievements'
import { SettingsDialog } from '../features/settings/SettingsDialog'
import { LevelUp } from '../features/settings/LevelUp'
import { Button, Callout, cx, Icon, LevelBadge, Toasts, XpBar } from '../components/ui'
import type { IconName } from '../components/ui'
import { ErrorBoundary } from '../components/ErrorBoundary'
import { useGameState, useToasts } from '../engine/game-context'
import { currentStreak } from '../engine/selectors'
import { Link } from './router'
import { useRouter } from './router-context'
import { ChromeContext } from './chrome'
import type { Route } from './routes'

const TABS: { route: Route; label: string; icon: IconName }[] = [
  { route: { name: 'panel' }, label: 'Panel', icon: 'panel' },
  { route: { name: 'mapa' }, label: 'Mapa', icon: 'graph' },
  { route: { name: 'proyectos' }, label: 'Proyectos', icon: 'ticket' },
  { route: { name: 'logros' }, label: 'Logros', icon: 'medal' },
]

export default function App() {
  const { state, rescued } = useGameState()
  const { toasts, dismissToast } = useToasts()
  const { route, navigate } = useRouter()
  const main = useRef<HTMLElement>(null)
  const first = useRef(true)
  const [immersive, setImmersive] = useState(false)
  const [settings, setSettings] = useState(false)
  const streak = currentStreak(state)

  // Al cambiar de ruta el foco vuelve al contenido y la vista sube: sin esto,
  // quien navega con teclado seguiría en la barra lateral y la pantalla nueva
  // aparecería a media altura.
  useEffect(() => {
    if (first.current) { first.current = false; return }
    main.current?.focus()
    document.documentElement.scrollTop = 0
  }, [route])

  const chrome = useMemo(() => ({ setImmersive }), [])
  const active = (r: Route) => r.name === route.name || (r.name === 'mapa' && route.name === 'mundo')

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
    <ChromeContext.Provider value={chrome}>
      <div className="min-h-screen md:flex">
        <a
          href="#contenido"
          className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-3 focus:rounded-md focus:bg-accent focus:px-4 focus:py-2 focus:text-body focus:font-semibold focus:text-fg-inverse"
        >
          Saltar al contenido
        </a>

        {/* Rail lateral en escritorio */}
        <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-r border-edge px-4 py-6 md:flex">
          <Link to={{ name: 'panel' }} className="mb-8 block">
            <p className="font-display text-lead leading-tight">
              Spring Boot<br /><span className="text-accent">Quest</span>
            </p>
            <p className="mt-1 font-mono text-micro leading-snug text-fg-tertiary">15 mundos, 114 retos</p>
          </Link>

          <nav aria-label="Navegación principal" className="flex-1 space-y-1">
            {TABS.map(t => (
              <Link
                key={t.label}
                to={t.route}
                aria-current={active(t.route) ? 'page' : undefined}
                className={cx(
                  'flex w-full items-center gap-3 rounded-md px-3 py-2 text-body transition-colors duration-fast',
                  active(t.route) ? 'bg-accent-dim text-accent' : 'text-fg-secondary hover:bg-surface-raised hover:text-fg',
                )}
              >
                <Icon name={t.icon} size={18} />
                {t.label}
              </Link>
            ))}
          </nav>

          <div className="space-y-3 border-t border-edge pt-4">
            <LevelBadge xp={state.xp} size="sm" />
            <XpBar xp={state.xp} />
            <div className="flex items-center justify-between font-mono text-micro text-fg-tertiary tnum">
              <span>{state.xp} XP</span>
              <span className="flex items-center gap-1">
                <Icon name="flame" size={13} className={streak > 0 ? 'text-warning' : ''} />
                {streak} {streak === 1 ? 'día' : 'días'}
              </span>
            </div>
            <Button variant="ghost" size="sm" icon="sliders" block onClick={() => setSettings(true)}>Ajustes</Button>
          </div>
        </aside>

        {/* Cabecera móvil */}
        <header className="sticky top-0 z-30 flex items-center justify-between gap-3 border-b border-edge bg-surface/95 px-4 py-3 backdrop-blur md:hidden">
          <Link to={{ name: 'panel' }} className="font-display text-body">
            Spring Boot <span className="text-accent">Quest</span>
          </Link>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="font-mono text-micro leading-none text-fg-tertiary tnum">{state.xp} XP</p>
              <div className="mt-1.5 w-24"><XpBar xp={state.xp} compact /></div>
            </div>
            <button
              type="button"
              onClick={() => setSettings(true)}
              className="grid h-11 w-11 place-items-center rounded-md text-fg-secondary hover:bg-surface-raised hover:text-fg"
            >
              <Icon name="sliders" size={18} />
              <span className="sr-only">Ajustes</span>
            </button>
          </div>
        </header>

        <main
          id="contenido"
          ref={main}
          tabIndex={-1}
          className={cx('min-w-0 flex-1 px-4 py-6 outline-none md:px-8 md:py-10', immersive ? 'pb-8' : 'pb-24 md:pb-10')}
        >
          {rescued && (
            <Callout role="alert" tone="warning" title="Se encontró una partida que no se pudo abrir" className="mb-6">
              Estaba guardada en un formato que esta versión no reconoce. No se borró: quedó apartada en
              este navegador bajo la clave <code className="font-mono">sbq:rescue</code>. Mientras tanto,
              empiezas una partida nueva.
            </Callout>
          )}

          {/* Una boundary por ruta: un fallo en una pantalla no se lleva la navegación. */}
          <ErrorBoundary scope="route" resetKey={route} onHome={() => navigate({ name: 'panel' })}>
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
          </ErrorBoundary>
        </main>

        {/* Barra inferior en móvil; se recoge mientras se responde una ronda */}
        {!immersive && (
          <nav
            aria-label="Navegación inferior"
            className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-4 border-t border-edge bg-surface/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden"
          >
            {TABS.map(t => (
              <Link
                key={t.label}
                to={t.route}
                aria-current={active(t.route) ? 'page' : undefined}
                className={cx(
                  'flex min-h-[56px] flex-col items-center justify-center gap-1 text-micro transition-colors duration-fast',
                  active(t.route) ? 'text-accent' : 'text-fg-tertiary',
                )}
              >
                <Icon name={t.icon} size={20} />
                {t.label}
              </Link>
            ))}
          </nav>
        )}

        <Toasts items={toasts} dismiss={dismissToast} />
        <SettingsDialog open={settings} onClose={() => setSettings(false)} />
        <LevelUp immersive={immersive} />
      </div>
    </ChromeContext.Provider>
  )
}
