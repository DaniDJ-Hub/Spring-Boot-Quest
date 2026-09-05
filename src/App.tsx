import { useState } from 'react'
import { Dashboard } from './components/Dashboard'
import { WorldMap } from './components/WorldMap'
import { WorldView } from './components/WorldView'
import { Reinforce, Exam } from './components/Session'
import { Achievements, Projects } from './components/Extras'
import { Toasts } from './components/ui'
import { useGame } from './engine/useGame'
import { levelProgress, titleFor } from './engine/core'

type View = 'panel' | 'mapa' | 'proyectos' | 'logros' | 'mundo' | 'refuerzo' | 'examen'

const TABS: { id: View; label: string; icon: string }[] = [
  { id: 'panel', label: 'Panel', icon: '◫' },
  { id: 'mapa', label: 'Mapa', icon: '⌗' },
  { id: 'proyectos', label: 'Proyectos', icon: '⌸' },
  { id: 'logros', label: 'Logros', icon: '★' },
]

export default function App() {
  const { state, toasts, dismissToast } = useGame()
  const [view, setView] = useState<View>('panel')
  const [worldId, setWorldId] = useState<string | null>(null)
  const lp = levelProgress(state.xp)

  function openWorld(id: string) {
    setWorldId(id)
    setView('mundo')
  }

  const body = (() => {
    switch (view) {
      case 'mapa': return <WorldMap onOpen={openWorld} />
      case 'mundo': return worldId
        ? <WorldView worldId={worldId} onBack={() => setView('mapa')} />
        : <WorldMap onOpen={openWorld} />
      case 'proyectos': return <Projects />
      case 'logros': return <Achievements />
      case 'refuerzo': return <Reinforce onBack={() => setView('panel')} />
      case 'examen': return <Exam onBack={() => setView('panel')} />
      default: return (
        <Dashboard
          onOpenWorld={openWorld}
          onReinforce={() => setView('refuerzo')}
          onExam={() => setView('examen')}
        />
      )
    }
  })()

  return (
    <div className="min-h-screen md:flex">
      {/* Rail lateral en escritorio */}
      <aside className="hidden md:flex md:flex-col w-56 shrink-0 border-r border-line px-4 py-6 sticky top-0 h-screen">
        <div className="mb-8">
          <div className="font-display text-lg leading-tight">
            Spring Boot<br /><span className="text-leaf">Quest</span>
          </div>
          <p className="text-[11px] text-chalk-faint mt-1.5 leading-snug">
            15 mundos construidos sobre el temario del curso
          </p>
        </div>

        <nav className="space-y-1 flex-1">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setView(t.id)}
              className={`w-full flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors
                ${view === t.id || (t.id === 'mapa' && view === 'mundo')
                  ? 'bg-leaf/10 text-leaf'
                  : 'text-chalk-mute hover:text-chalk hover:bg-ink-panel/60'}`}
            >
              <span className="w-4 text-center opacity-70">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </nav>

        <div className="border-t border-line pt-4">
          <div className="text-[11px] text-chalk-faint">Nivel {lp.level}</div>
          <div className="text-sm text-leaf font-display leading-tight">{titleFor(lp.level)}</div>
          <div className="mt-2 h-1 rounded-full bg-line-soft overflow-hidden">
            <div className="h-full bg-leaf rounded-full transition-[width] duration-500" style={{ width: `${lp.pct}%` }} />
          </div>
          <div className="text-[11px] text-chalk-faint mt-1.5 tnum">{state.xp} XP · racha {state.streak.count}</div>
        </div>
      </aside>

      {/* Cabecera móvil */}
      <header className="md:hidden sticky top-0 z-30 bg-ink/95 backdrop-blur border-b border-line px-4 py-3 flex items-center justify-between">
        <div className="font-display text-[15px]">Spring Boot <span className="text-leaf">Quest</span></div>
        <div className="text-right">
          <div className="text-[11px] text-chalk-faint tnum leading-none">Nv {lp.level} · {state.xp} XP</div>
          <div className="mt-1.5 h-1 w-24 rounded-full bg-line-soft overflow-hidden">
            <div className="h-full bg-leaf rounded-full" style={{ width: `${lp.pct}%` }} />
          </div>
        </div>
      </header>

      <main className="flex-1 min-w-0 px-4 md:px-8 py-6 md:py-10 pb-24 md:pb-10">
        {body}
      </main>

      {/* Barra inferior en móvil */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 bg-ink/95 backdrop-blur border-t border-line grid grid-cols-4">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setView(t.id)}
            className={`py-2.5 flex flex-col items-center gap-0.5 text-[11px] transition-colors
              ${view === t.id || (t.id === 'mapa' && view === 'mundo') ? 'text-leaf' : 'text-chalk-faint'}`}
          >
            <span className="text-base leading-none">{t.icon}</span>
            {t.label}
          </button>
        ))}
      </nav>

      <Toasts items={toasts} dismiss={dismissToast} />
    </div>
  )
}
