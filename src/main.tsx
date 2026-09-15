import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { LazyMotion, MotionConfig, domAnimation } from 'motion/react'
import App from './app/App'
import { RouterProvider } from './app/router'
import { ErrorBoundary } from './components/ErrorBoundary'
import { GameProvider } from './engine/GameProvider'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      {/* domAnimation en vez de domMax: la proyección de layout, que es lo que
          habilita `layout` y `layoutId`, cuesta 12.4 kB comprimidos y aquí solo
          se habría usado en una transición. `strict` obliga a usar `m` en vez de
          `motion`, que es lo que impide volver a meter el paquete entero sin
          darse cuenta. reducedMotion="user" hace que Motion respete la
          preferencia del sistema sin comprobarla en cada variante: el bloque de
          CSS no puede, porque Motion anima con JavaScript. */}
      <LazyMotion features={domAnimation} strict>
        <MotionConfig reducedMotion="user">
          <GameProvider>
            <RouterProvider>
              <App />
            </RouterProvider>
          </GameProvider>
        </MotionConfig>
      </LazyMotion>
    </ErrorBoundary>
  </StrictMode>,
)
